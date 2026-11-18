import assert from "node:assert/strict";
import { afterEach, describe, test } from "node:test";

import {
  checkMaxBotToken,
  escapeHtml,
  formatMessengerMessage,
  maskToken,
  parseTelegramChatFromUpdates,
  sendMaxMessage,
  sendTelegramMessage,
} from "./messengers";

const originalFetch = globalThis.fetch;

function stubFetch(status: number, body: unknown) {
  const calls: { url: string; init?: RequestInit }[] = [];
  globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), init });
    return new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }) as typeof fetch;
  return calls;
}

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("maskToken", () => {
  test("shows only the last four characters", () => {
    assert.equal(maskToken("123456:ABC-secret-1234"), "••••1234");
  });

  test("hides short tokens completely", () => {
    assert.equal(maskToken("abc"), "••••");
  });

  test("trims surrounding whitespace before masking", () => {
    assert.equal(maskToken("  token-9876  "), "••••9876");
  });
});

describe("escapeHtml", () => {
  test("escapes the characters Telegram HTML mode treats as markup", () => {
    assert.equal(escapeHtml("<b>Иванов & Ко</b>"), "&lt;b&gt;Иванов &amp; Ко&lt;/b&gt;");
  });
});

describe("parseTelegramChatFromUpdates", () => {
  test("returns the most recent chat that wrote to the bot", () => {
    const body = {
      ok: true,
      result: [
        { update_id: 1, message: { chat: { id: 111, first_name: "Анна" } } },
        { update_id: 2, message: { chat: { id: -222, username: "shop_owner" } } },
        { update_id: 3, edited_channel_post: {} },
      ],
    };
    assert.deepEqual(parseTelegramChatFromUpdates(body), {
      chatId: "-222",
      firstName: undefined,
      username: "shop_owner",
    });
  });

  test("returns null when there are no messages", () => {
    assert.equal(parseTelegramChatFromUpdates({ ok: true, result: [] }), null);
  });

  test("returns null for malformed bodies", () => {
    assert.equal(parseTelegramChatFromUpdates(null), null);
    assert.equal(parseTelegramChatFromUpdates({ ok: false }), null);
    assert.equal(parseTelegramChatFromUpdates({ result: "oops" }), null);
  });
});

describe("formatMessengerMessage", () => {
  test("builds a short Russian text with only the known fields", () => {
    assert.equal(
      formatMessengerMessage({
        eventLabel: "Новая заявка",
        storeName: "Прокат",
        reservationNumber: "R-42",
        customerName: "Иван Петров",
        periodLabel: "03.12 10:00 — 05.12 18:00",
        amountLabel: "5 000 ₽",
      }),
      [
        "Новая заявка — Прокат",
        "Заявка №R-42",
        "Клиент: Иван Петров",
        "Период: 03.12 10:00 — 05.12 18:00",
        "Сумма: 5 000 ₽",
      ].join("\n"),
    );
  });

  test("skips missing optional fields", () => {
    assert.equal(
      formatMessengerMessage({ eventLabel: "Оплата получена", storeName: "" }),
      "Оплата получена",
    );
  });
});

describe("messenger API adapters", () => {
  test("Telegram sendMessage posts chat_id and HTML parse mode", async () => {
    const calls = stubFetch(200, { ok: true, result: {} });
    const result = await sendTelegramMessage("123:TOKEN", "-100", "Привет");
    assert.deepEqual(result, { ok: true });
    assert.equal(calls[0].url, "https://api.telegram.org/bot123:TOKEN/sendMessage");
    assert.deepEqual(JSON.parse(String(calls[0].init?.body)), {
      chat_id: "-100",
      text: "Привет",
      parse_mode: "HTML",
    });
  });

  test("Telegram surfaces the API description on ok:false", async () => {
    stubFetch(200, { ok: false, description: "Bad Request: chat not found" });
    const result = await sendTelegramMessage("123:TOKEN", "-100", "Привет");
    assert.deepEqual(result, { ok: false, error: "Bad Request: chat not found" });
  });

  test("MAX sendMessage puts chat_id in the query and the token in Authorization", async () => {
    const calls = stubFetch(200, {});
    const result = await sendMaxMessage("max-token", "42", "Тест");
    assert.deepEqual(result, { ok: true });
    assert.equal(calls[0].url, "https://platform-api.max.ru/messages?chat_id=42");
    assert.equal(calls[0].init?.method, "POST");
    const headers = calls[0].init?.headers as Record<string, string>;
    assert.equal(headers.Authorization, "max-token");
    assert.deepEqual(JSON.parse(String(calls[0].init?.body)), { text: "Тест" });
  });

  test("MAX token check reports the HTTP status on failure", async () => {
    stubFetch(401, {});
    const result = await checkMaxBotToken("bad");
    assert.deepEqual(result, { ok: false, error: "MAX API вернул 401" });
  });
});
