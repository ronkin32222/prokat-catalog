import assert from "node:assert/strict";
import { test } from "node:test";

import { renderLegalDocument, renderLegalTemplate } from "../legal-templates";
import { buildOwnerDocumentValues } from "./owner-document-values";
import { lookupDadataParty, parseDadataPartyResponse } from "./dadata";

const store = { name: "Прокат Луч", email: "shop@example.ru", phone: "+79001234567", address: "Москва, ул. Ленина, 1", ownerName: "Иван Петров" };
const now = new Date(2026, 10, 18);

test("подстановка экранирует HTML и ставит прочерк за пустое поле", () => {
  assert.equal(renderLegalTemplate("A {{x}} B {{y}}", { x: "<b>&\"", y: "" }), "A &lt;b&gt;&amp;&quot; B —");
});

test("значения из магазина подставляются, если анкета пуста", () => {
  const values = buildOwnerDocumentValues(null, store, "https://shop.example", now);
  assert.equal(values.operatorName, "Иван Петров");
  assert.equal(values.email, "shop@example.ru");
  assert.equal(values.address, "Москва, ул. Ленина, 1");
  assert.equal(values.siteUrl, "https://shop.example");
  assert.equal(values.ogrnPart, "");
});

test("ИП: ФИО и ОГРНИП из анкеты важнее данных магазина", () => {
  const values = buildOwnerDocumentValues(
    { kind: "ip", fullName: "Петрова Анна Сергеевна", inn: "500100732259", ogrn: "304500116000157", email: "ip@example.ru" },
    store,
    "https://shop.example",
    now,
  );
  assert.equal(values.operatorName, "Петрова Анна Сергеевна");
  assert.equal(values.ogrnPart, ", ОГРНИП 304500116000157");
  assert.equal(values.email, "ip@example.ru");
  assert.equal(values.dataControllerEmail, "ip@example.ru");
});

test("ООО берёт полное наименование, документ получает ОГРН", () => {
  const values = buildOwnerDocumentValues(
    { kind: "ooo", organizationName: "ООО «Луч»", inn: "7707083893", ogrn: "1027700132195" },
    store,
    "https://shop.example",
    now,
  );
  const html = renderLegalDocument("rentalOffer", values);
  assert.match(html, /ООО «Луч»/);
  assert.match(html, /ОГРН 1027700132195/);
  assert.match(html, /Типовой шаблон\. Рекомендуется проверка юристом\./);
});

test("разбор ответа DaData для ООО и ИП", () => {
  const ooo = parseDadataPartyResponse({
    suggestions: [{ value: "ООО ЛУЧ", data: { type: "LEGAL", inn: "7707083893", ogrn: "1027700132195", name: { full_with_opf: "ООО «Луч»" }, management: { name: "Петров Иван" }, address: { value: "г Москва, ул Ленина, 1" } } }],
  });
  assert.deepEqual(ooo, {
    name: "ООО «Луч»",
    organizationName: "ООО «Луч»",
    directorName: "Петров Иван",
    ogrn: "1027700132195",
    address: "г Москва, ул Ленина, 1",
    inn: "7707083893",
    isIndividual: false,
  });
  const ip = parseDadataPartyResponse({
    suggestions: [{ data: { type: "INDIVIDUAL", inn: "500100732259", ogrn: "304500116000157", fio: { surname: "Петрова", name: "Анна", patronymic: "Сергеевна" } } }],
  });
  assert.equal(ip?.name, "Петрова Анна Сергеевна");
  assert.equal(ip?.organizationName, null);
  assert.equal(ip?.isIndividual, true);
});

test("пустой или чужой ответ DaData даёт null", () => {
  assert.equal(parseDadataPartyResponse({ suggestions: [] }), null);
  assert.equal(parseDadataPartyResponse(null), null);
  assert.equal(parseDadataPartyResponse("oops"), null);
});

test("без ключа или при ошибке сети DaData не вызывается и не ломает форму", async () => {
  let calls = 0;
  const fakeFetch = (async () => {
    calls += 1;
    throw new Error("network down");
  }) as unknown as typeof fetch;
  assert.equal(await lookupDadataParty("7707083893", "  ", fakeFetch), null);
  assert.equal(calls, 0);
  assert.equal(await lookupDadataParty("7707083893", "key", fakeFetch), null);
  assert.equal(calls, 1);
});
