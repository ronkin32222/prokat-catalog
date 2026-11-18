import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { CustomerFieldPublic } from "@louez/validations";
import { createReservationInputSchema } from "@louez/validations";

import type { CartItem } from "@/contexts/cart-context";

import type { CheckoutFieldsPlan, DeliveryAddress } from "./checkout.types";

import { buildReservationPayload } from "./util.reservation-payload";
import { CHECKOUT_DEFAULT_VALUES } from "./validator.checkout";

const NO_ADDRESS: DeliveryAddress = {
  address: "",
  city: "",
  postalCode: "",
  country: "FR",
  latitude: null,
  longitude: null,
};

const bike: CartItem = {
  lineId: "line-bike",
  selectionSignature: "__default",
  productId: "bike0000000000000001",
  productName: "Fat bike",
  productImage: null,
  price: 38,
  deposit: 0,
  quantity: 2,
  maxQuantity: 5,
  pricingKind: "duration",
  startDate: "2026-10-20T09:00:00.000Z",
  endDate: "2026-10-22T09:00:00.000Z",
  pricingMode: "day",
};

const field = (id: string, scope: "customer" | "item"): CustomerFieldPublic => ({
  id,
  label: id,
  type: "text",
  format: null,
  options: null,
  unit: null,
  helpText: null,
  position: 0,
  width: "half",
  scope,
  collectMode: "optional",
  isSensitive: false,
});

const build =(checkoutFields?: CheckoutFieldsPlan, phone = "+79161234567", email = "") =>
  buildReservationPayload({
    storeId: "store000000000000001",
    locale: "ru",
    values: { ...CHECKOUT_DEFAULT_VALUES, firstName: "Иван", phone, email, notes: "" },
    items: [bike],
    subtotalAmount: 152,
    depositAmount: 0,
    totalAmount: 152,
    outboundMethod: "store",
    outboundAddress: NO_ADDRESS,
    returnMethod: "store",
    returnAddress: NO_ADDRESS,
    checkoutFields,
  });

describe("buildReservationPayload", () => {
  it("sends the E.164 phone and a placeholder e-mail when none is typed", () => {
    const payload = build(undefined, "8 (916) 123-45-67");
    assert.equal(payload.customer.phone, "+79161234567");
    assert.equal(payload.customer.email, "79161234567@phone.invalid");
    assert.equal(createReservationInputSchema.safeParse(payload).success, true);
  });

  it("keeps a typed e-mail", () => {
    assert.equal(build(undefined, "+79161234567", " Lea@Example.test ").customer.email, "Lea@Example.test");
  });

  it("carries the unit details the cart asks, in the shape the server accepts", () => {
    const checkoutFields: CheckoutFieldsPlan = {
      lines: [
        {
          lineId: "line-bike",
          productName: "Fat bike",
          productImage: null,
          quantity: 2,
          itemFields: [field("height", "item")],
        },
      ],
    };
    const payload = build(checkoutFields);
    assert.deepEqual(payload.itemDetails, [{ lineIndex: 0, units: [{ values: {} }, { values: {} }] }]);
    assert.equal(createReservationInputSchema.safeParse(payload).success, true);
  });

  it("sends no unit details when the cart asks none", () => {
    assert.deepEqual(build({ lines: [] }).itemDetails, []);
  });
});
