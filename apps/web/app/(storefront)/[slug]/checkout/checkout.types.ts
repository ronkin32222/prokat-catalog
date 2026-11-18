import type { BusinessHours, DeliverySettings, TaxSettings } from "@louez/types";
import type { CustomerFieldPublic, StorefrontPromoValidateOutput } from "@louez/validations";

import type { RentalUnitFormValues } from "@/components/storefront/customer-fields/customer-fields.types";

import type { getTulipQuotePreview } from "./actions";

export type { LegMethod } from "@louez/types";

export type ReservationMode = "payment" | "request";
export type TulipInsuranceMode = "required" | "optional" | "no_public";
/** One page, one form: the details step is a section of it, never a separate screen. */
export type StepId = "request";

export interface CheckoutLocationOption {
  id: string | null;
  name: string;
  address: string | null;
  city: string | null;
  postalCode: string | null;
  country: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface CheckoutTulipInsurance {
  enabled: boolean;
  mode: TulipInsuranceMode;
}

export interface CheckoutFormProps {
  storeSlug: string;
  storeId: string;
  pricingMode: "day" | "hour" | "week";
  reservationMode: ReservationMode;
  taxSettings?: TaxSettings;
  deliverySettings?: DeliverySettings;
  storeAddress?: string | null;
  storeLatitude?: number | null;
  storeLongitude?: number | null;
  storeName?: string;
  /** The store's public contacts, offered when the store is not taking bookings. */
  storeEmail?: string | null;
  storePhone?: string | null;
  /** ISO-2 country of the store. */
  storeCountry: string;
  locations?: CheckoutLocationOption[];
  tulipInsurance?: CheckoutTulipInsurance;
  hasActivePromoCodes?: boolean;
  businessHours?: BusinessHours;
  advanceNoticeMinutes: number;
  minRentalMinutes: number;
  timezone?: string;
}

export interface CheckoutFormValues {
  firstName: string;
  phone: string;
  notes: string;
  /** Optional: the request works without one, an empty value becomes a phone placeholder. */
  email: string;
  /** Item-scope fields: one entry per rented unit, keyed by `toUnitKey(lineId, unitIndex)`. */
  itemDetails: Record<string, RentalUnitFormValues>;
}

/** A cart line as the custom fields see it: what to ask about each of its units. */
export interface CheckoutFieldsLine {
  lineId: string;
  productName: string;
  productImage: string | null;
  quantity: number;
  /** Empty when the line asks nothing; in the owner's layout, each with its width. */
  itemFields: CustomerFieldPublic[];
}

/** What this cart asks about its units, lines in cart order (index = the payload's `lineIndex`). */
export interface CheckoutFieldsPlan {
  lines: CheckoutFieldsLine[];
}

export interface DeliveryAddress {
  address: string;
  city: string;
  postalCode: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
}

export type LineResolutionState =
  | { status: "loading" }
  | {
      status: "resolved";
      combinationKey: string;
      selectedAttributes: Record<string, string>;
    }
  | { status: "invalid" };

export type ValidatedPromo = Extract<StorefrontPromoValidateOutput, { ok: true }>["promo"];

export type TulipQuotePreview = Awaited<ReturnType<typeof getTulipQuotePreview>>;

export interface TulipQuoteCustomer {
  customerType: "business" | "individual";
  companyName?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  postalCode?: string;
}

export interface TulipQuotePreviewInput {
  storeId: string;
  customer: TulipQuoteCustomer;
  items: Array<{ productId: string; quantity: number }>;
  startDate: string;
  endDate: string;
  tulipInsuranceOptIn?: boolean;
}

/** Why the submit button is disabled; shown under it instead of a 50 % button. */
export type CheckoutBlockedReason =
  | "resolving"
  | "lineNeedsUpdate"
  | "advisorRequired"
  | "insuranceRequiredFailed"
  | "advanceNotice"
  | "quoteLoading";

export interface CheckoutSubmitError {
  /** Message key (`errors.*`) or a plain message. */
  message: string;
  params?: Record<string, string | number>;
}
