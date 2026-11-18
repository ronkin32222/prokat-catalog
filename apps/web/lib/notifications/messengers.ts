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
    const data: unknown = await res.json().catch(() => null);
    if (!res.ok) {
      const description =
        data && typeof data === "object" ? (data as { description?: unknown }).description : null;
      return {
        ok: false,
        error:
          typeof description === "string"
            ? `Telegram: ${description}`
            : `Telegram API вернул ${res.status}`,
      };
    }
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

/** Вызов метода Telegram Bot API. Токен в тексте ошибки не попадает. */
async function callTelegram(
  botToken: string,
  method: string,
  payload: Record<string, unknown>,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetchWithTimeout(`https://api.telegram.org/bot${botToken}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data: unknown = await res.json().catch(() => null);
    if (!res.ok) {
      const description =
        data && typeof data === "object" ? (data as { description?: unknown }).description : null;
      return {
        ok: false,
        error:
          typeof description === "string"
            ? `Telegram: ${description}`
            : `Telegram API вернул ${res.status}`,
      };
    }
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

/** Отправка текста в чат Telegram (parse_mode=HTML). */
export function sendTelegramMessage(
  botToken: string,
  chatId: string,
  text: string,
): Promise<{ ok: boolean; error?: string }> {
  return callTelegram(botToken, "sendMessage", {
    chat_id: chatId.trim(),
    text,
    parse_mode: "HTML",
  });
}

/** Фото с подписью (parse_mode=HTML). Подпись до 1024 символов, см. splitPhotoCaption. */
export function sendTelegramPhoto(
  botToken: string,
  chatId: string,
  photoUrl: string,
  caption: string,
): Promise<{ ok: boolean; error?: string }> {
  return callTelegram(botToken, "sendPhoto", {
    chat_id: chatId.trim(),
    photo: photoUrl,
    caption,
    parse_mode: "HTML",
  });
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

/** Лимит подписи к фото в Telegram. */
export const TELEGRAM_CAPTION_LIMIT = 1024;

/** Относительный путь (/files/…) становится абсолютным от baseUrl; null, если не вышло. */
export function toAbsoluteUrl(url: string, baseUrl: string): string | null {
  try {
    return new URL(url, baseUrl).toString();
  } catch {
    return null;
  }
}

/** Подпись целиком, если влезает; иначе первая строка-заголовок, а весь текст уходит следом сообщением. */
export function splitPhotoCaption(text: string): { caption: string; followUp?: string } {
  if (text.length <= TELEGRAM_CAPTION_LIMIT) return { caption: text };
  return { caption: text.split("\n")[0].slice(0, TELEGRAM_CAPTION_LIMIT), followUp: text };
}

const MONTHS_SHORT = ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];
const FALLBACK_TIME_ZONE = "Europe/Moscow";

function safeTimeZone(timeZone: string): string {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return timeZone;
  } catch {
    return FALLBACK_TIME_ZONE;
  }
}

function formatPeriodPoint(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    day: "numeric",
    month: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("day")} ${MONTHS_SHORT[Number(get("month")) - 1]}, ${get("hour")}:${get("minute")}`;
}

/** Период «19 ноя, 14:30 — 21 ноя, 14:30» во времени магазина. */
export function formatMessengerPeriod(start: Date, end: Date, timeZone: string): string {
  const tz = safeTimeZone(timeZone);
  return `${formatPeriodPoint(start, tz)} — ${formatPeriodPoint(end, tz)}`;
}

/** Сумма для мессенджера: «2 250 ₽». */
export function formatMessengerMoney(amount: number, currency: string = "RUB"): string {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export interface ReservationMessageItem {
  name: string;
  quantity: number;
  /** Цена за единицу в сутки, уже отформатированная: «750 ₽». */
  unitPriceLabel: string;
  /** Абсолютная ссылка на товар на витрине. */
  productUrl?: string;
}

export interface ReservationMessageInput {
  title: string;
  customerName?: string;
  customerPhone?: string;
  periodLabel?: string;
  items: ReservationMessageItem[];
  totalLabel?: string;
  customerNotes?: string | null;
  adminUrl?: string;
}

/** Атрибут href в Telegram HTML: экранируем и кавычки. */
const escapeAttr = (text: string) => escapeHtml(text).replace(/"/g, "&quot;");

/** Текст заявки. html: данные экранируются под Telegram; plain: для MAX, без разметки. */
export function formatReservationMessage(
  input: ReservationMessageInput,
  format: "html" | "plain",
): string {
  const html = format === "html";
  const esc = (text: string) => (html ? escapeHtml(text) : text);
  const lines = [esc(input.title)];
  if (input.customerName) lines.push(`Клиент: ${esc(input.customerName)}`);
  if (input.customerPhone) lines.push(`Телефон: ${esc(input.customerPhone)}`);
  if (input.periodLabel) lines.push(`Период: ${esc(input.periodLabel)}`);
  if (input.items.length > 0) {
    lines.push("");
    for (const item of input.items) {
      const name =
        html && item.productUrl
          ? `<a href="${escapeAttr(item.productUrl)}">${esc(item.name)}</a>`
          : esc(item.name);
      lines.push(`• ${name} × ${item.quantity} — ${esc(item.unitPriceLabel)}/сут`);
    }
  }
  if (input.totalLabel) lines.push(`Итого: ${esc(input.totalLabel)}`);
  if (input.customerNotes) lines.push(`Комментарий: ${esc(input.customerNotes)}`);
  if (input.adminUrl) lines.push(`Заявка: ${esc(input.adminUrl)}`);
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
