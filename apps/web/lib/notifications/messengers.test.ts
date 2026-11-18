import assert from "node:assert/strict";
import { afterEach, describe, test } from "node:test";

import {
  checkMaxBotToken,
  escapeHtml,
  formatMessengerMessage,
  formatMessengerMoney,
  formatMessengerPeriod,
  formatReservationMessage,
  maskToken,
  parseTelegramChatFromUpdates,
  sendMaxMessage,
  sendTelegramMessage,
  sendTelegramPhoto,
  splitPhotoCaption,
  TELEGRAM_CAPTION_LIMIT,
  toAbsoluteUrl,
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

describe("toAbsoluteUrl", () => {
  test("turns a relative path into an absolute URL on the app origin", () => {
    assert.equal(toAbsoluteUrl("/demo/tool-1.webp", "https://app.example.ru"), "https://app.example.ru/demo/tool-1.webp");
  });

  test("keeps an absolute URL as it is", () => {
    assert.equal(toAbsoluteUrl("https://cdn.example.ru/a.jpg", "https://app.example.ru"), "https://cdn.example.ru/a.jpg");
  });

  test("returns null when there is no base to resolve against", () => {
    assert.equal(toAbsoluteUrl("/files/a.webp", ""), null);
  });
});

describe("splitPhotoCaption", () => {
  test("keeps a short text whole as the caption", () => {
    assert.deepEqual(splitPhotoCaption("Заявка\nКлиент"), { caption: "Заявка\nКлиент" });
  });

  test("uses the title line as caption and sends the full text after it when too long", () => {
    const long = `Новая заявка №1\n${"x".repeat(TELEGRAM_CAPTION_LIMIT)}`;
    const { caption, followUp } = splitPhotoCaption(long);
    assert.equal(caption, "Новая заявка №1");
    assert.equal(followUp, long);
  });
});

describe("formatMessengerPeriod", () => {
  test("shows both ends in the store's timezone", () => {
    const start = new Date("2026-11-19T11:30:00Z"); // 14:30 Москва
    const end = new Date("2026-11-21T11:30:00Z");
    assert.equal(formatMessengerPeriod(start, end, "Europe/Moscow"), "19 ноя, 14:30 — 21 ноя, 14:30");
  });

  test("falls back to Moscow time for a missing or invalid timezone", () => {
    const start = new Date("2026-11-19T11:30:00Z");
    assert.equal(formatMessengerPeriod(start, start, ""), "19 ноя, 14:30 — 19 ноя, 14:30");
  });
});

describe("formatMessengerMoney", () => {
  test("formats rubles with a space group separator and no decimals", () => {
    assert.equal(formatMessengerMoney(2250, "RUB").replace(/\s/g, " "), "2 250 ₽");
  });
});

describe("formatReservationMessage", () => {
  const base = {
    title: "Новая заявка №TEST-1007",
    customerName: "Анна <Иванова> & Ко",
    customerPhone: "+79001234567",
    periodLabel: "19 ноя, 14:30 — 21 ноя, 14:30",
    totalLabel: "2 250 ₽",
    adminUrl: "https://app.example.ru/dashboard/reservations/res1",
  };

  test("lists items with links, total, phone and admin link in HTML", () => {
    const text = formatReservationMessage(
      {
        ...base,
        items: [
          {
            name: "Перфоратор SDS-Plus 800 Вт",
            quantity: 1,
            unitPriceLabel: "750 ₽",
            productUrl: "https://ddm.example.ru/product/perforator",
          },
        ],
        customerNotes: "Приедем <поздно>",
      },
      "html",
    );
    assert.equal(
      text,
      [
        "Новая заявка №TEST-1007",
        "Клиент: Анна &lt;Иванова&gt; &amp; Ко",
        "Телефон: +79001234567",
        "Период: 19 ноя, 14:30 — 21 ноя, 14:30",
        "",
        '• <a href="https://ddm.example.ru/product/perforator">Перфоратор SDS-Plus 800 Вт</a> × 1 — 750 ₽/сут',
        "Итого: 2 250 ₽",
        "Комментарий: Приедем &lt;поздно&gt;",
        "Заявка: https://app.example.ru/dashboard/reservations/res1",
      ].join("\n"),
    );
  });

  test("omits the items block when there are no items and keeps no markup in plain mode", () => {
    const text = formatReservationMessage(
      { ...base, items: [], totalLabel: undefined },
      "plain",
    );
    assert.equal(text.includes("•"), false);
    assert.equal(text.includes("Итого"), false);
    assert.ok(text.includes("Клиент: Анна <Иванова> & Ко"));
  });

  test("escapes the product name in HTML and leaves it raw in plain mode", () => {
    const input = { ...base, items: [{ name: "A & <B>", quantity: 2, unitPriceLabel: "1 ₽" }] };
    assert.ok(formatReservationMessage(input, "html").includes("• A &amp; &lt;B&gt; × 2 — 1 ₽/сут"));
    assert.ok(formatReservationMessage(input, "plain").includes("• A & <B> × 2 — 1 ₽/сут"));
  });
});

describe("sendTelegramPhoto", () => {
  test("posts photo URL, caption and HTML parse mode to sendPhoto", async () => {
    const calls = stubFetch(200, { ok: true, result: {} });
    const result = await sendTelegramPhoto("123:TOKEN", "-100", "https://app.example.ru/a.webp", "Подпись");
    assert.deepEqual(result, { ok: true });
    assert.equal(calls[0].url, "https://api.telegram.org/bot123:TOKEN/sendPhoto");
    assert.deepEqual(JSON.parse(String(calls[0].init?.body)), {
      chat_id: "-100",
      photo: "https://app.example.ru/a.webp",
      caption: "Подпись",
      parse_mode: "HTML",
    });
  });

  test("reports Telegram's refusal so the caller can fall back to a text message", async () => {
    stubFetch(400, { ok: false, description: "Bad Request: wrong file identifier/HTTP URL specified" });
    const result = await sendTelegramPhoto("123:TOKEN", "-100", "http://localhost/a.webp", "x");
    assert.equal(result.ok, false);
    assert.match(result.error ?? "", /Bad Request/);
  });
});
