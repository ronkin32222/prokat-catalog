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
  assert.equal(formatRussianPhone("900"), "+7 (900");
  assert.equal(formatRussianPhone("9001"), "+7 (900) 1");
  assert.equal(formatRussianPhone("900000"), "+7 (900) 000");
  assert.equal(formatRussianPhone("89001112233"), "+7 (900) 111-22-33");
  assert.equal(formatRussianPhone("+7 900 111 22 33"), "+7 (900) 111-22-33");
  assert.equal(formatRussianPhone("9000000000"), "+7 (900) 000-00-00");
});

test("refuses numbers that are not 10 digits", () => {
  assert.equal(normalizeRussianPhone("900000000"), null);
  assert.equal(normalizeRussianPhone("90000000001"), null);
  assert.equal(normalizeRussianPhone("abc"), null);
  assert.equal(isValidRussianPhone(""), false);
  assert.equal(isValidRussianPhone("+7 (900) 000-00-00"), true);
});

// The input shows the mask and feeds it back: typing and Backspace must be stable.
test("typing one digit at a time never garbles the mask", () => {
  let shown = "";
  for (const ch of "9001112233") shown = formatRussianPhone(shown + ch);
  assert.equal(shown, "+7 (900) 111-22-33");
});

test("typing +7… or 8… key by key gives the same national number", () => {
  for (const typed of ["+79261234567", "89261234567", "79261234567", "9261234567"]) {
    let shown = "";
    for (const ch of typed) shown = formatRussianPhone(shown + ch);
    assert.equal(shown, "+7 (926) 123-45-67", typed);
  }
});

test("Backspace erases the mask down to empty", () => {
  let shown = formatRussianPhone("9001112233");
  const seen = [shown];
  while (shown !== "") {
    shown = formatRussianPhone(shown.slice(0, -1));
    seen.push(shown);
    assert.ok(seen.length < 30, "mask keeps re-adding characters");
  }
  assert.equal(shown, "");
});
