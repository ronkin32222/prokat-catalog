import assert from "node:assert/strict";
import { test } from "node:test";

import { getCountryByCode, getTimezoneForCountry } from "./countries";
import { isSupportedCurrency } from "./currencies";
import { formatCurrency, getCurrencySymbol } from "./formatting";

test("Russia and rubles are supported with Russian defaults", () => {
  assert.deepEqual(getCountryByCode("RU"), { code: "RU", timezone: "Europe/Moscow" });
  assert.equal(getTimezoneForCountry("RU"), "Europe/Moscow");
  assert.equal(isSupportedCurrency("RUB"), true);
  assert.equal(getCurrencySymbol("RUB"), "₽");
  assert.match(formatCurrency(1234.5, "RUB"), /₽/);
});
