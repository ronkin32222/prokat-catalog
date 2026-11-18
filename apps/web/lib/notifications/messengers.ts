/**
 * Мессенджеры владельца: Telegram Bot API и MAX.
 *
 * Чистые функции + fetch, без новых зависимостей. Токены никогда не
 * логируются и не попадают в тексты ошибок. Таймаут 8 с; ошибки отправки
 * не должны ронять создание заявки — вызывающий код ловит и глотает.
 */

const REQUEST_TIMEOUT_MS = 8_000;

// ============================================================================
// Вспомогательное
// ============================================================================

/** Маска токена для UI: видны только последние 4 символа. */
export function maskToken(token: string): string {
  const trimmed = token.trim();
  if (trimmed.length <= 4) return "••••";
  return `••••${trimmed.slice(-4)}`;
}

/** Экранирование под parse_mode=HTML в Telegram. */
export function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

async function fetchWithTimeout(url: string, init?: RequestInit): Promise<Response> {
  return fetch(url, { ...init, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
}

// ============================================================================
// Telegram
// ============================================================================

export interface TelegramChatInfo {
  chatId: string;
  firstName?: string;
  username?: string;
}

/** Разбор ответа getUpdates: последний чат, писавший боту. */
export function parseTelegramChatFromUpdates(
  body: unknown,
): TelegramChatInfo | null {
  if (!body || typeof body !== "object" || !("result" in body)) return null;
  const result = (body as { result: unknown }).result;
  if (!Array.isArray(result)) return null;
  for (let i = result.length - 1; i >= 0; i--) {
    const update = result[i];
    if (!update || typeof update !== "object" || !("message" in update)) continue;
    const chat = (update as { message?: { chat?: Record<string, unknown> } }).message?.chat;
    if (!chat || typeof chat.id !== "number") continue;
    return {
      chatId: String(chat.id),
      firstName: typeof chat.first_name === "string" ? chat.first_name : undefined,
      username: typeof chat.username === "string" ? chat.username : undefined,
    };
  }
  return null;
}

/** Проверка токена бота через getMe. */
export async function checkTelegramBotToken(
  botToken: string,
): Promise<{ ok: true; botUsername: string } | { ok: false; error: string }> {
  try {
    const res = await fetchWithTimeout(`https://api.telegram.org/bot${botToken}/getMe`);
    if (!res.ok) return { ok: false, error: `Telegram API вернул ${res.status}` };
    const data: unknown = await res.json();
    if (
      data &&
      typeof data === "object" &&
      "ok" in data &&
      (data as { ok: unknown }).ok === true &&
      "result" in data &&
      typeof (data as { result: { username?: unknown } }).result?.username === "string"
    ) {
      return { ok: true, botUsername: (data as { result: { username: string } }).result.username };
    }
    return { ok: false, error: "Некорректный ответ Telegram API" };
  } catch {
    return { ok: false, error: "Не удалось связаться с Telegram API" };
  }
}

/**
 * Chat ID владельца через getUpdates: владелец пишет боту /start, кнопка
 * «Найти чат» забирает последний чат из апдейтов бота.
 */
export async function findTelegramChat(
  botToken: string,
): Promise<{ ok: true; chat: TelegramChatInfo } | { ok: false; error: string }> {
  try {
    const res = await fetchWithTimeout(
      `https://api.telegram.org/bot${botToken}/getUpdates?limit=25&timeout=0`,
    );
    if (!res.ok) return { ok: false, error: `Telegram API вернул ${res.status}` };
    const chat = parseTelegramChatFromUpdates(await res.json());
    if (!chat) return { ok: false, error: "Не найдено сообщений боту — напишите боту /start" };
    return { ok: true, chat };
  } catch {
    return { ok: false, error: "Не удалось связаться с Telegram API" };
  }
}

/** Отправка текста в чат Telegram (parse_mode=HTML). */
export async function sendTelegramMessage(
  botToken: string,
  chatId: string,
  text: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetchWithTimeout(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
    });
    if (!res.ok) return { ok: false, error: `Telegram API вернул ${res.status}` };
    const data: unknown = await res.json();
    if (data && typeof data === "object" && "ok" in data) {
      if ((data as { ok: unknown }).ok === true) return { ok: true };
      const description = (data as { description?: unknown }).description;
      if (typeof description === "string") return { ok: false, error: description };
    }
    return { ok: false, error: "Некорректный ответ Telegram API" };
  } catch {
    return { ok: false, error: "Не удалось связаться с Telegram API" };
  }
}

// ============================================================================
// MAX
// ============================================================================

/**
 * Адаптер MAX. Формат запроса проверить по документации dev.max.ru:
 * POST /messages?chat_id=<id>, заголовок Authorization: <token>, тело {"text": "..."}.
 * Изолирован, чтобы поправка формата касалась только этого блока.
 */
const MAX_API_BASE = "https://platform-api.max.ru";

/** Проверка токена MAX через GET /me. */
export async function checkMaxBotToken(
  botToken: string,
): Promise<{ ok: true; botName: string } | { ok: false; error: string }> {
  try {
    const res = await fetchWithTimeout(`${MAX_API_BASE}/me`, {
      headers: { Authorization: botToken },
    });
    if (!res.ok) return { ok: false, error: `MAX API вернул ${res.status}` };
    const data: unknown = await res.json();
    const name =
      data && typeof data === "object"
        ? (data as { name?: unknown; username?: unknown }).name ??
          (data as { username?: unknown }).username
        : undefined;
    return { ok: true, botName: typeof name === "string" ? name : "бот MAX" };
  } catch {
    return { ok: false, error: "Не удалось связаться с MAX API" };
  }
}

/** Отправка текста в чат MAX. */
export async function sendMaxMessage(
  botToken: string,
  chatId: string,
  text: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetchWithTimeout(`${MAX_API_BASE}/messages?chat_id=${encodeURIComponent(chatId)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: botToken },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) return { ok: false, error: `MAX API вернул ${res.status}` };
    return { ok: true };
  } catch {
    return { ok: false, error: "Не удалось связаться с MAX API" };
  }
}

// ============================================================================
// Форматирование событий
// ============================================================================

export interface MessengerEventInput {
  /** Тип события, короткая русская метка: «Новая заявка», «Оплата» и т.д. */
  eventLabel: string;
  storeName: string;
  reservationNumber?: string;
  customerName?: string;
  /** Период, например «03.12 10:00 — 05.12 18:00». */
  periodLabel?: string;
  /** Сумма с валютой, например «5 000 ₽». */
  amountLabel?: string;
}

/** Короткий текст события по-русски для мессенджеров. */
export function formatMessengerMessage(input: MessengerEventInput): string {
  const lines = [`${input.eventLabel}${input.storeName ? ` — ${input.storeName}` : ""}`];
  if (input.reservationNumber) lines.push(`Заявка №${input.reservationNumber}`);
  if (input.customerName) lines.push(`Клиент: ${input.customerName}`);
  if (input.periodLabel) lines.push(`Период: ${input.periodLabel}`);
  if (input.amountLabel) lines.push(`Сумма: ${input.amountLabel}`);
  return lines.join("\n");
}

/** Метки событий мессенджеров по NotificationEventType. */
export const MESSENGER_EVENT_LABELS: Record<string, string> = {
  reservation_new: "Новая заявка",
  reservation_confirmed: "Заявка подтверждена",
  reservation_rejected: "Заявка отклонена",
  reservation_cancelled: "Заявка отменена",
  reservation_picked_up: "Оборудование выдано",
  reservation_completed: "Оборудование возвращено",
  reservation_reminder_pickup: "Напоминание: выдача сегодня",
  reservation_reminder_return: "Напоминание: возврат сегодня",
  payment_received: "Оплата получена",
  payment_failed: "Ошибка оплаты",
  payment_disputed: "Оспаривание платежа",
};
