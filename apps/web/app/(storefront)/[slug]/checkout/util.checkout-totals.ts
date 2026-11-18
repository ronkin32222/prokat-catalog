export interface CheckoutTotalsInput {
  /** Rental lines after tier discounts, before promo. */
  subtotal: number;
  /** Promo discount already capped to the subtotal by the server. */
  discountAmount: number;
  deliveryFee: number;
}

export interface CheckoutTotals {
  subtotalWithInsurance: number;
  /** What the rental is estimated to cost: subtotal − promo + delivery. */
  total: number;
}

export type CheckoutSubmitLabel = { kind: "request" };

const roundToCents = (amount: number): number => Math.round(amount * 100) / 100;

/**
 * Single source for the summary and the "ориентировочная стоимость аренды"
 * line. The public form only ever sends a request: no deposit, no amount due
 * now, only an estimate the manager confirms.
 */
export const calculateCheckoutTotals = ({
  subtotal,
  discountAmount,
  deliveryFee,
}: CheckoutTotalsInput): CheckoutTotals => ({
  subtotalWithInsurance: roundToCents(subtotal),
  total: roundToCents(Math.max(0, subtotal - discountAmount) + deliveryFee),
});

export const getCheckoutSubmitLabel = (): CheckoutSubmitLabel => ({ kind: "request" });
