import assert from "node:assert/strict";
import { test } from "node:test";

import { innProblem, isValidInn, isValidOgrn, isValidOgrnip, ogrnProblem } from "./validators";

test("ИНН организации (10 цифр) проверяется контрольной цифрой", () => {
  assert.equal(isValidInn("7707083893"), true);
  assert.equal(isValidInn("7707083894"), false);
});

test("ИНН физлица/ИП (12 цифр) проверяется двумя контрольными цифрами", () => {
  // Контрольные цифры 5 и 9 посчитаны по алгоритму ФНС (не сверено с реестром).
  assert.equal(isValidInn("500100732259"), true);
  assert.equal(isValidInn("500100732250"), false);
});

test("ИНН неверной длины и с буквами отклоняется", () => {
  assert.equal(isValidInn("770708389"), false);
  assert.equal(isValidInn("77070838AB"), false);
  assert.match(innProblem("123") ?? "", /10 цифр/);
  assert.equal(innProblem("7707083893"), null);
  assert.match(innProblem("7707083894") ?? "", /контрольная/);
});

test("ОГРН (13 цифр) и ОГРНИП (15 цифр) проверяются контрольной цифрой", () => {
  assert.equal(isValidOgrn("1027700132195"), true);
  assert.equal(isValidOgrn("1027700132196"), false);
  assert.equal(isValidOgrn("102770013219"), false);
  assert.equal(isValidOgrnip("304500116000157"), true);
  assert.equal(isValidOgrnip("304500116000158"), false);
});

test("сообщения для ОГРН учитывают тип: ИП ждёт 15 цифр", () => {
  assert.equal(ogrnProblem("", "ip"), null);
  assert.match(ogrnProblem("1027700132195", "ip") ?? "", /15 цифр/);
  assert.equal(ogrnProblem("1027700132195", "ooo"), null);
});
