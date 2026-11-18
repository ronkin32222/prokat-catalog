"use server";

import { localeNames } from "@/i18n/config";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@louez/db";
import { stores } from "@louez/db";
import { getCurrentStore, hasPermission } from "@/lib/store-context";
import { validateDiscordWebhook, sendTestDiscordNotification } from "@/lib/discord/client";
import { discordWebhookSchema } from "@louez/validations";
import { getSmsQuotaStatus } from "@/lib/plan-limits";
import { notifyNotificationSettingsUpdated } from "@/lib/discord/platform-notifications";
import { validateAndNormalizePhone } from "@/lib/sms/phone";
import { DEFAULT_NOTIFICATION_SETTINGS, withCustomerNotificationDefaults } from "@louez/types";
import type { NotificationSettings } from "@louez/types";
import { getLocaleFromCountry } from "@/lib/email/i18n";
import {
  checkTelegramBotToken,
  findTelegramChat,
  checkMaxBotToken,
  sendTelegramMessage,
  sendMaxMessage,
  maskToken,
} from "@/lib/notifications/messengers";

// Language name mapping for display
const LANGUAGE_NAMES = localeNames;

export type MessengerKind = "telegram" | "max";

/** Скрывает токены ботов перед отдачей настроек в UI. */
function maskMessengerTokens<T extends { messengers?: NotificationSettings["messengers"] }>(
  settings: T,
): T {
  if (!settings.messengers) return settings;
  const masked: NotificationSettings["messengers"] = {};
  for (const kind of ["telegram", "max"] as const) {
    const m = settings.messengers[kind];
    if (m) masked[kind] = { ...m, botToken: maskToken(m.botToken) };
  }
  return { ...settings, messengers: masked };
}

/**
 * События, куда подключённый мессенджер включается сразу: та же базовая
 * линейка, что у админ-уведомлений (заявка, статусы, оплата).
 */
const MESSENGER_EVENTS = [
  "reservation_new",
  "reservation_confirmed",
  "reservation_cancelled",
  "reservation_picked_up",
  "reservation_completed",
  "payment_received",
] as const;

export async function getNotificationSettings() {
  const store = await getCurrentStore();
  if (!store) return { error: "errors.unauthorized" };

  const smsQuota = await getSmsQuotaStatus(store.id);

  // Determine locale from store country
  const locale = getLocaleFromCountry(store.settings?.country);
  const languageName = LANGUAGE_NAMES[locale];

  return {
    // Admin notification settings — merge over defaults so stores saved before
    // newer event types (e.g. admin reminders) still expose every key.
    settings: maskMessengerTokens({ ...DEFAULT_NOTIFICATION_SETTINGS, ...store.notificationSettings }),
    discordWebhookUrl: store.discordWebhookUrl,
    ownerPhone: store.ownerPhone,
    smsQuota: {
      planUsed: smsQuota.planUsed,
      limit: smsQuota.planLimit,
      prepaidBalance: smsQuota.prepaidBalance,
      allowed: smsQuota.allowed,
      remaining: smsQuota.remaining,
      totalAvailable: smsQuota.totalAvailable,
    },
    // Customer notification settings
    customerSettings: withCustomerNotificationDefaults(store.customerNotificationSettings),
    storeLocale: locale,
    storeLanguageName: languageName,
  };
}

export async function updateDiscordWebhook(webhookUrl: string | null) {
  const store = await getCurrentStore();
  if (!store) return { error: "errors.unauthorized" };

  if (!hasPermission(store.role, "manage_settings")) {
    return { error: "errors.permissionDenied" };
  }

  // Allow null/empty to disconnect
  if (!webhookUrl || webhookUrl.trim() === "") {
    await db
      .update(stores)
      .set({
        discordWebhookUrl: null,
        updatedAt: new Date(),
      })
      .where(eq(stores.id, store.id));

    notifyNotificationSettingsUpdated({ id: store.id, name: store.name, slug: store.slug }).catch(
      () => {},
    );

    revalidatePath("/dashboard/settings/notifications");
    return { success: true };
  }

  // Validate format
  const validated = discordWebhookSchema.safeParse({ webhookUrl });
  if (!validated.success) {
    return { error: "errors.invalidWebhookUrl" };
  }

  // Validate webhook is actually reachable
  const isValid = await validateDiscordWebhook(webhookUrl);
  if (!isValid) {
    return { error: "errors.discordWebhookInvalid" };
  }

  await db
    .update(stores)
    .set({
      discordWebhookUrl: webhookUrl,
      updatedAt: new Date(),
    })
    .where(eq(stores.id, store.id));

  notifyNotificationSettingsUpdated({ id: store.id, name: store.name, slug: store.slug }).catch(
    () => {},
  );

  revalidatePath("/dashboard/settings/notifications");
  return { success: true };
}

export async function testDiscordWebhook() {
  const store = await getCurrentStore();
  if (!store) return { error: "errors.unauthorized" };

  if (!hasPermission(store.role, "manage_settings")) {
    return { error: "errors.permissionDenied" };
  }
  if (!store.discordWebhookUrl) return { error: "errors.noDiscordWebhook" };

  const result = await sendTestDiscordNotification(store.discordWebhookUrl, store.name);

  if (!result.success) {
    return { error: result.error || "errors.discordTestFailed" };
  }

  return { success: true };
}

export async function updateOwnerPhone(phone: string | null) {
  const store = await getCurrentStore();
  if (!store) return { error: "errors.unauthorized" };

  if (!hasPermission(store.role, "manage_settings")) {
    return { error: "errors.permissionDenied" };
  }

  // Allow null/empty to remove
  if (!phone || phone.trim() === "") {
    await db
      .update(stores)
      .set({
        ownerPhone: null,
        updatedAt: new Date(),
      })
      .where(eq(stores.id, store.id));

    notifyNotificationSettingsUpdated({ id: store.id, name: store.name, slug: store.slug }).catch(
      () => {},
    );

    revalidatePath("/dashboard/settings/notifications");
    return { success: true, phone: null };
  }

  // Validate and normalize to E.164 format
  const phoneResult = validateAndNormalizePhone(phone);
  if (!phoneResult.valid || !phoneResult.normalized) {
    return { error: "errors.invalidPhoneNumber" };
  }

  const normalizedPhone = phoneResult.normalized;

  await db
    .update(stores)
    .set({
      ownerPhone: normalizedPhone,
      updatedAt: new Date(),
    })
    .where(eq(stores.id, store.id));

  notifyNotificationSettingsUpdated({ id: store.id, name: store.name, slug: store.slug }).catch(
    () => {},
  );

  revalidatePath("/dashboard/settings/notifications");
  return { success: true, phone: normalizedPhone };
}

// ============================================================================
// Мессенджеры владельца: Telegram / MAX
// ============================================================================

/**
 * Подключение бота: проверяет токен, сохраняет chat_id и включает канал
 * для базовой линейки событий. Токен хранится только в БД, в UI не возвращается.
 */
export async function connectMessenger(kind: MessengerKind, botToken: string, chatId: string) {
  const store = await getCurrentStore();
  if (!store) return { error: "errors.unauthorized" };

  if (!hasPermission(store.role, "manage_settings")) {
    return { error: "errors.permissionDenied" };
  }

  const token = botToken.trim();
  const chat = chatId.trim();
  if (!token) return { error: "Введите токен бота" };
  if (!chat) return { error: "Введите ID чата" };

  const check = kind === "telegram" ? await checkTelegramBotToken(token) : await checkMaxBotToken(token);
  if (!check.ok) return { error: check.error };

  const current: NotificationSettings = {
    ...DEFAULT_NOTIFICATION_SETTINGS,
    ...store.notificationSettings,
  };
  const messengers = { ...current.messengers };
  messengers[kind] = { botToken: token, chatId: chat, enabled: true };
  const events = { ...current };
  for (const event of MESSENGER_EVENTS) {
    events[event] = { ...DEFAULT_NOTIFICATION_SETTINGS[event], ...events[event], [kind]: true };
  }
  events.messengers = messengers;

  await db
    .update(stores)
    .set({ notificationSettings: events, updatedAt: new Date() })
    .where(eq(stores.id, store.id));

  notifyNotificationSettingsUpdated({ id: store.id, name: store.name, slug: store.slug }).catch(
    () => {},
  );

  revalidatePath("/dashboard/settings/notifications");
  return { success: true };
}

/**
 * Telegram: chat_id последнего чата, писавшего боту (после /start владельца).
 * Токен можно передать из поля ввода (до сохранения), иначе берётся сохранённый.
 */
export async function findTelegramChatId(botToken?: string) {
  const store = await getCurrentStore();
  if (!store) return { error: "errors.unauthorized" };

  if (!hasPermission(store.role, "manage_settings")) {
    return { error: "errors.permissionDenied" };
  }

  const token = botToken?.trim() || store.notificationSettings?.messengers?.telegram?.botToken;
  if (!token) return { error: "Введите токен бота Telegram" };

  const result = await findTelegramChat(token);
  if (!result.ok) return { error: result.error };
  return { success: true, chatId: result.chat.chatId };
}

/** Тестовое сообщение в подключённый мессенджер. */
export async function sendTestMessengerMessage(kind: MessengerKind) {
  const store = await getCurrentStore();
  if (!store) return { error: "errors.unauthorized" };

  if (!hasPermission(store.role, "manage_settings")) {
    return { error: "errors.permissionDenied" };
  }

  const messenger = store.notificationSettings?.messengers?.[kind];
  if (!messenger?.enabled) return { error: kind === "telegram" ? "Telegram не подключён" : "MAX не подключён" };

  const text = `Тестовое уведомление — магазин «${store.name}» подключён успешно.`;
  const result =
    kind === "telegram"
      ? await sendTelegramMessage(messenger.botToken, messenger.chatId, text)
      : await sendMaxMessage(messenger.botToken, messenger.chatId, text);
  if (!result.ok) return { error: result.error || "Сообщение не отправлено" };
  return { success: true };
}

/** Отключение мессенджера: конфиг удаляется, события выключаются. */
export async function disconnectMessenger(kind: MessengerKind) {
  const store = await getCurrentStore();
  if (!store) return { error: "errors.unauthorized" };

  if (!hasPermission(store.role, "manage_settings")) {
    return { error: "errors.permissionDenied" };
  }

  const current: NotificationSettings = {
    ...DEFAULT_NOTIFICATION_SETTINGS,
    ...store.notificationSettings,
  };
  const messengers = { ...current.messengers };
  delete messengers[kind];
  const events = { ...current, messengers };
  for (const event of MESSENGER_EVENTS) {
    events[event] = { ...events[event], [kind]: false };
  }

  await db
    .update(stores)
    .set({ notificationSettings: events, updatedAt: new Date() })
    .where(eq(stores.id, store.id));

  notifyNotificationSettingsUpdated({ id: store.id, name: store.name, slug: store.slug }).catch(
    () => {},
  );

  revalidatePath("/dashboard/settings/notifications");
  return { success: true };
}
