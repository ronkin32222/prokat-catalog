import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { calculateCheckoutTotals } from "./util.checkout-totals";

describe("calculateCheckoutTotals", () => {
  it("estimates the rental as subtotal minus promo plus delivery", () => {
    assert.deepEqual(
      calculateCheckoutTotals({ subtotal: 100, discountAmount: 10, deliveryFee: 15 }),
      { subtotalWithInsurance: 100, total: 105 },
    );
  });

  it("never goes below zero when the promo covers the whole subtotal", () => {
    assert.equal(
      calculateCheckoutTotals({ subtotal: 50, discountAmount: 80, deliveryFee: 0 }).total,
      0,
    );
  });

  it("rounds to cents", () => {
    assert.equal(
      calculateCheckoutTotals({ subtotal: 10.123, discountAmount: 0, deliveryFee: 0 }).total,
      10.12,
    );
  });
});
