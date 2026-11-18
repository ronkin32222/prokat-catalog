import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";

import { isRateLimited, resetRateLimits } from "./util.rate-limit";

beforeEach(resetRateLimits);

test("allows up to the limit, then refuses", () => {
  for (let i = 0; i < 3; i++) assert.equal(isRateLimited("a", 3, 1000, 100 + i), false);
  assert.equal(isRateLimited("a", 3, 1000, 200), true);
});

test("keys are independent", () => {
  for (let i = 0; i < 3; i++) isRateLimited("a", 3, 1000, 100);
  assert.equal(isRateLimited("b", 3, 1000, 100), false);
});

test("slots free up once the window has passed", () => {
  for (let i = 0; i < 3; i++) isRateLimited("a", 3, 1000, 100);
  assert.equal(isRateLimited("a", 3, 1000, 1200), false);
});
