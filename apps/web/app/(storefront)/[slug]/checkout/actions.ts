"use server";

import { headers } from "next/headers";

import { eq } from "drizzle-orm";
import { z } from "zod";

import { db, stores } from "@louez/db";
import type { TulipPublicMode } from "@louez/types";
import {
  companySearchSchema,
  createReservationCustomerSchema,
  createReservationInputSchema,
} from "@louez/validations";

import { log } from "@/lib/evlog";
import { PRIVACY_CONSENT_VERSION } from "@/lib/legal-templates";
import { getClientIp } from "@/lib/request";
import { isRateLimited } from "@/lib/util.rate-limit";
import { getTulipCoverageSummary } from "@/lib/integrations/tulip/contracts";
import {
  searchFrenchCompanies,
  type CompanySearchResult,
} from "@louez/api/adapters/company-registry";
import { createReservation as createReservationInternal } from "@/lib/reservations/create-reservation";
import type {
  ReservationErrorParams,
  ReservationFailureDetails,
} from "@louez/api/services/reservation-failure";
import {
  getRequestedTulipOptIn,
  getTulipCheckoutMode,
  resolveTulipInsurance,
  type TulipInsuranceResolution,
} from "@/lib/reservations/resolve-tulip-insurance";

const checkoutCompanySearchSchema = z.object({
  storeId: z.string().min(1).max(64),
  query: companySearchSchema.shape.query,
});

/**
 * Company lookup that prefills the business buyer's legal name and SIREN at
 * checkout. Public on purpose (the storefront has no session) but scoped to a
 * store, and only answered when that store operates in France — the registry
 * is French-only. Any failure returns an empty list: typing the SIREN by hand
 * must always stay possible.
 */
export async function searchCheckoutCompanyRegistry(input: {
  storeId: string;
  query: string;
}): Promise<{ results: CompanySearchResult[] }> {
  const validated = checkoutCompanySearchSchema.safeParse(input);
  if (!validated.success) {
    return { results: [] };
  }

  const store = await db.query.stores.findFirst({
    where: eq(stores.id, validated.data.storeId),
    columns: { id: true, settings: true },
  });

  if (!store || (store.settings?.country ?? "FR") !== "FR") {
    return { results: [] };
  }

  const search = await searchFrenchCompanies(validated.data.query);
  if (!search.ok) {
    log.warn("recherche-entreprises", search.reason);
    return { results: [] };
  }
  return { results: search.results };
}

const tulipQuotePreviewSchema = z.object({
  storeId: z.string().min(1).max(64),
  modeOverride: z.enum(["required", "optional", "no_public"]).optional(),
  customer: createReservationCustomerSchema
    .pick({
      customerType: true,
      companyName: true,
      firstName: true,
      lastName: true,
      phone: true,
      address: true,
      city: true,
      postalCode: true,
    })
    .extend({
      // The quote form runs before the address step; a partial identity is fine.
      email: z.string().trim().max(320),
      firstName: z.string().trim().max(255),
      lastName: z.string().trim().max(255),
    }),
  items: z
    .array(
      z.object({
        productId: z.string().min(1).max(64),
        quantity: z.number().int().min(1).max(999),
      }),
    )
    .min(1)
    .max(50),
  startDate: z.string().refine((value) => Number.isFinite(Date.parse(value))),
  endDate: z.string().refine((value) => Number.isFinite(Date.parse(value))),
  tulipInsuranceOptIn: z.boolean().optional(),
});

type TulipQuotePreviewResult = TulipInsuranceResolution & { error: string | null };

const unavailableTulipQuote = (
  mode: TulipPublicMode,
  connected: boolean,
  requestedOptIn: boolean,
  error: string,
  coverage: {
    insuredProductCount: number;
    uninsuredProductCount: number;
    insuredProductIds: string[];
  },
): TulipQuotePreviewResult => ({
  mode,
  connected,
  inclusionEnabled: false,
  quoteUnavailable: true,
  quoteError: error,
  requestedOptIn,
  appliedOptIn: false,
  amount: 0,
  ...coverage,
  error,
});

/** Live insurance quote shown on the checkout before the reservation exists. */
export async function getTulipQuotePreview(input: unknown): Promise<TulipQuotePreviewResult> {
  const parsed = tulipQuotePreviewSchema.safeParse(input);
  if (!parsed.success) {
    return unavailableTulipQuote("no_public", false, false, "errors.invalidData", {
      insuredProductCount: 0,
      uninsuredProductCount: 0,
      insuredProductIds: [],
    });
  }
  const data = parsed.data;

  const store = await db.query.stores.findFirst({
    where: eq(stores.id, data.storeId),
    columns: { id: true, settings: true },
  });
  if (!store) {
    return unavailableTulipQuote("no_public", false, false, "errors.storeNotFound", {
      insuredProductCount: 0,
      uninsuredProductCount: 0,
      insuredProductIds: [],
    });
  }

  try {
    const quote = await resolveTulipInsurance({
      storeId: store.id,
      modeOverride: data.modeOverride,
      customer: data.customer,
      items: data.items,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      tulipInsuranceOptIn: data.tulipInsuranceOptIn,
      fallbackCountry: store.settings?.country || "FR",
    });
    return { ...quote, error: null };
  } catch (error) {
    const modeInfo = await getTulipCheckoutMode(store.id, data.modeOverride);
    const coverage = await getTulipCoverageSummary(data.items);
    const errorKey =
      error instanceof Error && error.message.startsWith("errors.")
        ? error.message
        : "errors.tulipQuoteFailed";

    log.warn({
      tulip: {
        event: "checkout_preview_fallback",
        storeId: store.id,
        mode: modeInfo.mode,
        error: errorKey,
      },
    });

    return unavailableTulipQuote(
      modeInfo.mode,
      modeInfo.connected,
      getRequestedTulipOptIn(modeInfo.mode, data.tulipInsuranceOptIn),
      errorKey,
      coverage,
    );
  }
}

/**
 * Result shape the current checkout client reads (`result.error` and
 * `result.reservationId` on the same union). The `?: undefined` members keep
 * that access legal until WS-11 switches the client to the discriminated
 * `ok` result of the internal function.
 */
export type CreateReservationActionResult =
  | {
      success?: undefined;
      error: string;
      errorParams?: ReservationErrorParams;
      details?: ReservationFailureDetails;
      reservationId?: undefined;
      reservationNumber?: undefined;
      paymentUrl?: undefined;
      customerId?: undefined;
      instantAccessUrl?: undefined;
    }
  | {
      success: true;
      reservationId: string;
      reservationNumber: string;
      paymentUrl: string | null;
      customerId: string;
      /** Token URL to /r/{id} when the reservation is a request (no Stripe step). */
      instantAccessUrl: string | null;
      error?: undefined;
      errorParams?: undefined;
      details?: undefined;
    };

/**
 * Public checkout submission. The payload is validated with Zod, the source
 * is always "online" (trusted callers use the internal function), and the
 * result keeps the shape the current client reads: `error`/`errorParams`/
 * `details` on failure, `success` plus ids and URLs otherwise.
 */
export async function createReservation(input: unknown): Promise<CreateReservationActionResult> {
  if (!input || typeof input !== "object") return { error: "errors.invalidData" };
  // The consent is not part of the reservation schema: it is taken out here, checked, and recorded.
  const { privacyConsent, ...body } = input as Record<string, unknown>;
  if (privacyConsent !== true) return { error: "errors.invalidData" };

  // A public form: without a limit a bot could fill the stock and the owner's chat.
  // The client address comes from Caddy's X-Forwarded-For (a client-sent X-Real-IP is ignored).
  const requestHeaders = await headers();
  const visitor = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (
    isRateLimited(`reservation:${visitor}`, 5, 10 * 60_000) ||
    isRateLimited("reservation:all", 100, 10 * 60_000)
  ) {
    return { error: "errors.tooManyRequests" };
  }
  const parsed = createReservationInputSchema.safeParse(body);
  if (!parsed.success) {
    return { error: "errors.invalidData" };
  }

  const result = await createReservationInternal({
    ...parsed.data,
    source: "online",
    customerSignedIn: false,
    termsAcceptedFromIp: getClientIp(await headers()),
    privacyConsentVersion: PRIVACY_CONSENT_VERSION,
  });

  if (!result.ok) {
    return {
      error: result.error,
      ...(result.params ? { errorParams: result.params } : {}),
      ...(result.details ? { details: result.details } : {}),
    };
  }

  return {
    success: true,
    reservationId: result.reservationId,
    reservationNumber: result.reservationNumber,
    paymentUrl: result.paymentUrl,
    customerId: result.customerId,
    instantAccessUrl: result.instantAccessUrl,
  };
}
