import assert from "node:assert/strict";
import { test } from "node:test";

import { formatRussianPhone, isValidRussianPhone, normalizeRussianPhone } from "./ru-phone";

test("accepts a 10-digit national number and the +7 / 7 / 8 forms", () => {
  assert.equal(normalizeRussianPhone("9000000000"), "+79000000000");
  assert.equal(normalizeRussianPhone("+7 (900) 000-00-00"), "+79000000000");
  assert.equal(normalizeRussianPhone("7 900 000 00 00"), "+79000000000");
  assert.equal(normalizeRussianPhone("89000000000"), "+79000000000");
  assert.equal(normalizeRussianPhone("8 (900) 000-00-00"), "+79000000000");
});

test("formats progressively while typing", () => {
  assert.equal(formatRussianPhone(""), "");
  assert.equal(formatRussianPhone("9"), "+7 (9");
  assert.equal(formatRussianPhone("900"), "+7 (900)");
  assert.equal(formatRussianPhone("900000"), "+7 (900) 000");
  assert.equal(formatRussianPhone("9000000000"), "+7 (900) 000-00-00");
});

test("refuses numbers that are not 10 digits", () => {
  assert.equal(normalizeRussianPhone("900000000"), null);
  assert.equal(normalizeRussianPhone("90000000001"), null);
  assert.equal(normalizeRussianPhone("abc"), null);
  assert.equal(isValidRussianPhone(""), false);
  assert.equal(isValidRussianPhone("+7 (900) 000-00-00"), true);
});
