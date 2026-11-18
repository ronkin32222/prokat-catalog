import type { LegMethod } from "@louez/types";
import type { CreateReservationInput } from "@louez/validations";

import type { CartItem } from "@/contexts/cart-context";
import type { Locale } from "@/i18n/config";
import { calculateCartItemPrice } from "@/lib/utils/cart-pricing";

import type { CheckoutFieldsPlan, CheckoutFormValues, DeliveryAddress } from "./checkout.types";
import { getCheckoutFieldsSubmission } from "./util.checkout-custom-fields";
import { toReservationPhone } from "./validator.checkout";

interface BuildReservationPayloadInput {
  storeId: string;
  locale: Locale;
  values: CheckoutFormValues;
  items: CartItem[];
  /**
   * Client amounts. The server reprices every line from the database and
   * only logs these (the schema still requires them).
   */
  subtotalAmount: number;
  depositAmount: number;
  totalAmount: number;
  outboundMethod: LegMethod;
  outboundAddress: DeliveryAddress;
  pickupLocationId?: string | null;
  returnMethod: LegMethod;
  returnAddress: DeliveryAddress;
  returnLocationId?: string | null;
  promoCode?: string;
  /** Unit details this cart asks; lines in the order of `items`. */
  checkoutFields?: CheckoutFieldsPlan;
}

type DeliveryLeg = CreateReservationInput["delivery"] extends { outbound: infer TLeg } | undefined
  ? TLeg
  : never;

const buildDeliveryLeg = (
  method: LegMethod,
  address: DeliveryAddress,
  locationId?: string | null,
): DeliveryLeg => {
  if (method === "store") {
    return { method: "store", locationId: locationId ?? null };
  }

  return {
    method: "address",
    address: address.address,
    city: address.city,
    postalCode: address.postalCode,
    country: address.country,
    latitude: address.latitude ?? undefined,
    longitude: address.longitude ?? undefined,
  };
};

/**
 * The customer e-mail the reservation is stored under. `customers.email` is
 * required and unique per store, but the request form does not ask for one:
 * an anonymous buyer gets the phone number under a non-routable domain, and
 * nothing is ever sent to it (`isPlaceholderEmail`).
 */
export const PLACEHOLDER_EMAIL_DOMAIN = "phone.invalid";

export const isPlaceholderEmail = (email: string): boolean =>
  email.trim().toLowerCase().endsWith(`@${PLACEHOLDER_EMAIL_DOMAIN}`);

export const toReservationEmail = (phone: string, email: string): string => {
  const typed = email.trim();
  if (typed) return typed;
  const digits = toReservationPhone(phone).replace(/\D/g, "");
  return `${digits}@${PLACEHOLDER_EMAIL_DOMAIN}`;
};

export const buildReservationPayload = ({
  storeId,
  locale,
  values,
  items,
  subtotalAmount,
  depositAmount,
  totalAmount,
  outboundMethod,
  outboundAddress,
  pickupLocationId,
  returnMethod,
  returnAddress,
  returnLocationId,
  promoCode,
  checkoutFields,
}: BuildReservationPayloadInput): CreateReservationInput => ({
  storeId,
  customer: {
    email: toReservationEmail(values.phone, values.email),
    firstName: values.firstName.trim(),
    // One name is asked: the schema wants both, so it repeats.
    lastName: values.firstName.trim(),
    phone: toReservationPhone(values.phone),
    customerType: "individual",
  },
  items: items.map((item) => {
    const priceResult = calculateCartItemPrice(item, null, null);

    return {
      lineId: item.lineId,
      productId: item.productId,
      selectedAttributes: item.selectedAttributes,
      resolvedCombinationKey: item.resolvedCombinationKey,
      resolvedAttributes: item.resolvedAttributes,
      quantity: item.quantity,
      startDate: item.startDate,
      endDate: item.endDate,
      unitPrice: priceResult.subtotal / Math.max(1, item.quantity),
      depositPerUnit: item.deposit,
      productSnapshot: {
        name: item.productName,
        description: null,
        images: item.productImage ? [item.productImage] : [],
        combinationKey: item.resolvedCombinationKey || null,
        selectedAttributes: item.resolvedAttributes || item.selectedAttributes || null,
      },
    };
  }),
  customerNotes: values.notes.trim() || undefined,
  // No insurance is sold through the public request form.
  subtotalAmount,
  depositAmount,
  totalAmount,
  locale,
  promoCode,
  delivery: {
    outbound: buildDeliveryLeg(outboundMethod, outboundAddress, pickupLocationId),
    return: buildDeliveryLeg(returnMethod, returnAddress, returnLocationId),
  },
  ...(checkoutFields ? getCheckoutFieldsSubmission(values, checkoutFields) : {}),
});
