import assert from "node:assert/strict";
import { test } from "node:test";

import { formatCustomerName } from "./customer-name";

test("a last name equal to the first name is shown once", () => {
  assert.equal(formatCustomerName("Роман", "Роман"), "Роман");
  assert.equal(formatCustomerName("Роман", " роман "), "Роман");
});

test("a different last name is kept", () => {
  assert.equal(formatCustomerName("Роман", "Булович"), "Роман Булович");
});

test("a missing last name gives the first name", () => {
  assert.equal(formatCustomerName("Роман", null), "Роман");
  assert.equal(formatCustomerName("Роман", ""), "Роман");
});
