"use client";

import { useCallback, useState } from "react";

import { useMutation } from "@tanstack/react-query";
import { usePostHog } from "posthog-js/react";

import type { LegMethod } from "@louez/types";
import type { CheckoutFieldIssue } from "@louez/validations";

import { useAnalytics } from "@/contexts/analytics-context";
import type { Locale } from "@/i18n/config";
import { useStorefrontUrl } from "@/hooks/use-storefront-url";
import {
  checkoutAnalyticsBaseProperties,
  productAnalyticsEvents,
} from "@/lib/product-analytics/analytics-events";

import { createReservation } from "../actions";
import type {
  CheckoutBlockedReason,
  CheckoutFieldsPlan,
  CheckoutFormValues,
  CheckoutSubmitError,
  DeliveryAddress,
} from "../checkout.types";
import type { CheckoutTotals } from "../util.checkout-totals";
import { sanitizeTranslationParams } from "../util.checkout-steps";
import { buildReservationPayload } from "../util.reservation-payload";
import type { CartItem } from "@/contexts/cart-context";
import { clearPendingCheckout } from "@/lib/storefront/util.pending-checkout-storage";

const ADVANCE_NOTICE_ERROR = "errors.advanceNoticeViolation";

interface CheckoutDeliverySelection {
  outboundMethod: LegMethod;
  outboundAddress: DeliveryAddress;
  pickupLocationId: string | null;
  returnMethod: LegMethod;
  returnAddress: DeliveryAddress;
  returnLocationId: string | null;
}

interface UseCheckoutSubmitParams {
  storeId: string;
  storeSlug: string;
  locale: Locale;
  items: CartItem[];
  subtotal: number;
  totals: CheckoutTotals;
  totalDeposit: number;
  delivery: CheckoutDeliverySelection;
  promoCode?: string;
  blockedReason: CheckoutBlockedReason | null;
  /** Unit details this cart asks; lines in the order of `items`. */
  checkoutFields: CheckoutFieldsPlan;
  onAdvanceNoticeRejected: (params: {
    advanceNoticeMinutes?: number;
    minimumStartTime?: string;
  }) => void;
  /** The server refused custom field values: every issue, to mark the exact fields. */
  onCheckoutFieldIssues: (issues: CheckoutFieldIssue[]) => void;
}

class SubmitError extends Error {
  readonly params: Record<string, string | number>;
  readonly fieldIssues: CheckoutFieldIssue[];

  constructor(
    message: string,
    params: Record<string, string | number> = {},
    fieldIssues: CheckoutFieldIssue[] = [],
  ) {
    super(message);
    this.name = "CheckoutSubmitError";
    this.params = params;
    this.fieldIssues = fieldIssues;
  }
}

/**
 * Sends the rental request and moves to the "Заявка принята" page, which
 * clears the cart. Nothing is charged here: the store confirms by phone.
 */
export const useCheckoutSubmit = ({
  storeId,
  storeSlug,
  locale,
  items,
  subtotal,
  totals,
  totalDeposit,
  delivery,
  promoCode,
  blockedReason,
  checkoutFields,
  onAdvanceNoticeRejected,
  onCheckoutFieldIssues,
}: UseCheckoutSubmitParams) => {
  const posthog = usePostHog();
  const { trackEvent } = useAnalytics();
  const { getUrl } = useStorefrontUrl(storeSlug);
  const [serverError, setServerError] = useState<CheckoutSubmitError | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const mutation = useMutation({
    mutationFn: async (values: CheckoutFormValues) => {
      if (items.length === 0) {
        throw new SubmitError("emptyCart");
      }
      if (blockedReason) {
        throw new SubmitError("lineNeedsUpdate");
      }

      const payload = buildReservationPayload({
        storeId,
        locale,
        values,
        items,
        subtotalAmount: totals.subtotalWithInsurance,
        depositAmount: totalDeposit,
        totalAmount: totals.total,
        outboundMethod: delivery.outboundMethod,
        outboundAddress: delivery.outboundAddress,
        pickupLocationId: delivery.pickupLocationId,
        returnMethod: delivery.returnMethod,
        returnAddress: delivery.returnAddress,
        returnLocationId: delivery.returnLocationId,
        promoCode,
        checkoutFields,
      });

      const result = await createReservation(payload);
      if (!result.success) {
        throw new SubmitError(
          result.error,
          sanitizeTranslationParams(result.errorParams),
          result.details?.code === "checkout_fields_invalid" ? result.details.issues : [],
        );
      }
      return result;
    },
    onSuccess: (result) => {
      setServerError(null);
      setIsRedirecting(true);

      trackEvent({
        eventType: "checkout_completed",
        metadata: {
          reservationId: result.reservationId,
          itemCount: items.length,
          subtotal,
          total: totals.total,
          reservationMode: "request",
        },
      });
      // Captured client-side so the PostHog funnel keeps the browser's
      // distinct_id; the server-side event is attributed to the customer.
      posthog.capture(productAnalyticsEvents.checkoutCompleted, {
        ...checkoutAnalyticsBaseProperties,
        store_id: storeId,
        reservation_id: result.reservationId,
        reservation_mode: "request",
        item_count: items.length,
        subtotal_amount_cents: Math.round(subtotal * 100),
        total_amount_cents: Math.round(totals.total * 100),
      });

      clearPendingCheckout();
      const params = new URLSearchParams({
        id: result.reservationId,
        number: result.reservationNumber,
      });
      window.location.assign(getUrl(`/checkout/success?${params.toString()}`));
    },
    onError: (error) => {
      setIsRedirecting(false);
      const message = error instanceof SubmitError ? error.message : "errors.generic";
      const params = error instanceof SubmitError ? error.params : {};
      if (error instanceof SubmitError && error.fieldIssues.length > 0) {
        onCheckoutFieldIssues(error.fieldIssues);
      }

      if (message === ADVANCE_NOTICE_ERROR) {
        onAdvanceNoticeRejected({
          advanceNoticeMinutes:
            typeof params.advanceNoticeMinutes === "number"
              ? params.advanceNoticeMinutes
              : undefined,
          minimumStartTime:
            typeof params.minimumStartTime === "string" ? params.minimumStartTime : undefined,
        });
      }

      posthog.capture(productAnalyticsEvents.checkoutSubmitFailed, {
        ...checkoutAnalyticsBaseProperties,
        store_id: storeId,
        error_code: message,
        failure_source: message.startsWith("errors.") ? "server" : "client_validation",
      });

      setServerError({ message, params });
    },
  });

  const submit = useCallback(
    async (values: CheckoutFormValues) => {
      if (mutation.isPending || isRedirecting) return;
      try {
        await mutation.mutateAsync(values);
      } catch {
        // Surfaced through `serverError`.
      }
    },
    [mutation, isRedirecting],
  );

  const clearServerError = useCallback(() => setServerError(null), []);

  return {
    submit,
    isSubmitting: mutation.isPending || isRedirecting,
    serverError,
    clearServerError,
  };
};
