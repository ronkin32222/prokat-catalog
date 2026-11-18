"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { useSearchParams } from "next/navigation";

import { AlertCircle } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { usePostHog } from "posthog-js/react";

import { Alert, AlertDescription, AlertTitle } from "@louez/ui";
import { STORE_NOT_ACCEPTING_RESERVATIONS_ERROR } from "@louez/types";
import type { CheckoutFieldIssue } from "@louez/validations";

import { DatePickerModal } from "@/components/storefront/date-picker-modal";
import { useCustomerFieldIssueMessage } from "@/components/storefront/customer-fields/use-customer-field-issue-message";
import { useAnalytics } from "@/contexts/analytics-context";
import { useCart } from "@/contexts/cart-context";
import { useAppForm } from "@/hooks/form/form";
import { defaultLocale } from "@/i18n/config";
import { isLocale } from "@/lib/i18n/format-locale";
import {
  checkoutAnalyticsBaseProperties,
  productAnalyticsEvents,
} from "@/lib/product-analytics/analytics-events";
import { getCheckoutReturnHref } from "@/lib/utils/util.checkout-return";

import { CheckoutEmptyCartState } from "./components/checkout-empty-cart-state";
import { CheckoutRequestForm } from "./components/checkout-request-form";
import { CheckoutSkeleton } from "./components/checkout-skeleton";
import { CheckoutStorePausedDialog } from "./components/checkout-store-paused-dialog";
import { CheckoutFormView } from "./checkout-form-view";

import type { CheckoutBlockedReason, CheckoutFormProps, CheckoutFormValues } from "./checkout.types";
import { useCheckoutAdvanceNotice } from "./hooks/use-checkout-advance-notice";
import { useCheckoutCustomFields } from "./hooks/use-checkout-custom-fields";
import { useCheckoutDelivery } from "./hooks/use-checkout-delivery";
import { useCheckoutLineResolutions } from "./hooks/use-checkout-line-resolutions";
import { useCheckoutPromo } from "./hooks/use-checkout-promo";
import { useCheckoutSubmit } from "./hooks/use-checkout-submit";
import { getCheckoutFieldIssueName } from "./util.checkout-custom-fields";
import { calculateCheckoutTotals } from "./util.checkout-totals";
import {
  CHECKOUT_DEFAULT_VALUES,
  checkoutFormOptions,
  createCheckoutValidator,
} from "./validator.checkout";

export const CheckoutForm = ({
  storeSlug,
  storeId,
  pricingMode,
  taxSettings,
  deliverySettings,
  storeLatitude,
  storeLongitude,
  storeName,
  storeEmail,
  storePhone,
  locations,
  hasActivePromoCodes = false,
  businessHours,
  advanceNoticeMinutes,
  minRentalMinutes,
  timezone,
}: CheckoutFormProps) => {
  const t = useTranslations("storefront.checkout");
  const tErrors = useTranslations("errors");
  const activeLocale = useLocale();
  const locale = isLocale(activeLocale) ? activeLocale : defaultLocale;
  const posthog = usePostHog();
  const { trackEvent } = useAnalytics();
  const {
    items,
    isHydrated,
    resolutionStatus,
    isResolving,
    getSubtotal,
    getTotalDeposit,
    globalStartDate,
    globalEndDate,
    getDisplayableSavings,
  } = useCart();
  const searchParams = useSearchParams();
  const returnHref = getCheckoutReturnHref(searchParams.get("returnTo"));

  const subtotal = getSubtotal();
  const totalDeposit = getTotalDeposit();
  const { savings: totalSavings, originalSubtotal } = getDisplayableSavings();

  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const stepRef = useRef<HTMLDivElement>(null);
  const submitRef = useRef<(values: CheckoutFormValues) => Promise<void>>(async () => undefined);

  const promo = useCheckoutPromo({ items, subtotal });
  const delivery = useCheckoutDelivery({
    deliverySettings,
    storeLatitude,
    storeLongitude,
    subtotal,
    deliveryEligibilitySubtotal: subtotal - promo.discountAmount,
    locations,
  });
  const { lineResolutions, itemsWithResolved, hasInvalidLines, hasUnresolvedLines } =
    useCheckoutLineResolutions({ items });
  const customFields = useCheckoutCustomFields({ items: itemsWithResolved });
  const customFieldIssueMessage = useCustomerFieldIssueMessage();

  const validator = useMemo(
    () =>
      createCheckoutValidator((key, params) => t(key, params), {
        fieldsPlan: customFields.plan,
        customFieldIssueMessage,
      }),
    [customFieldIssueMessage, customFields.plan, t],
  );

  const form = useAppForm({
    ...checkoutFormOptions,
    defaultValues: CHECKOUT_DEFAULT_VALUES,
    validators: { onSubmit: validator },
    onSubmit: async ({ value }) => submitRef.current(value),
  });


  const advanceNotice = useCheckoutAdvanceNotice({
    startDate: globalStartDate,
    advanceNoticeMinutes,
    timezone,
  });

  const totals = useMemo(
    () =>
      calculateCheckoutTotals({
        subtotal,
        discountAmount: promo.discountAmount,
        deliveryFee: delivery.totalFee,
      }),
    [delivery.totalFee, promo.discountAmount, subtotal],
  );

  const blockedReason: CheckoutBlockedReason | null = hasInvalidLines
    ? "lineNeedsUpdate"
    : hasUnresolvedLines || isResolving
      ? "resolving"
      : advanceNotice.issue
        ? "advanceNotice"
        : null;

  const { submit, isSubmitting, serverError, clearServerError } = useCheckoutSubmit({
    storeId,
    storeSlug,
    locale,
    items: itemsWithResolved,
    subtotal,
    totals,
    totalDeposit,
    delivery,
    blockedReason,
    promoCode: promo.promo?.code,
    checkoutFields: customFields.plan,
    onAdvanceNoticeRejected: advanceNotice.reportServerIssue,
    onCheckoutFieldIssues: (issues: CheckoutFieldIssue[]) => {
      // The store may have changed what it asks since the page loaded.
      customFields.refresh();
      for (const issue of issues) {
        const name = getCheckoutFieldIssueName(issue, customFields.plan);
        if (!name) continue;
        const message = customFieldIssueMessage(issue.code);
        form.setFieldMeta(name, (prev) => {
          // No meta yet for a field that never rendered (the folded summary).
          const errorMap = prev === undefined ? {} : prev.errorMap;
          return { ...prev, isTouched: true, errorMap: { ...errorMap, onServer: message } };
        });
      }
    },
  });

  useEffect(() => {
    submitRef.current = submit;
  }, [submit]);

  const checkoutStartedRef = useRef(false);
  useEffect(() => {
    if (items.length === 0 || checkoutStartedRef.current) return;
    checkoutStartedRef.current = true;
    trackEvent({ eventType: "checkout_started", metadata: { itemCount: items.length, subtotal } });
  }, [items.length, subtotal, trackEvent]);

  useEffect(() => {
    if (items.length === 0) return;
    posthog.capture(productAnalyticsEvents.checkoutStepViewed, {
      ...checkoutAnalyticsBaseProperties,
      store_id: storeId,
      step: "request",
      step_index: 0,
      steps_total: 1,
      direction: "forward",
    });
  }, [posthog, storeId]);

  if (!isHydrated || resolutionStatus === "loading") {
    return <CheckoutSkeleton />;
  }

  if (items.length === 0) {
    return <CheckoutEmptyCartState />;
  }

  const serverErrorMessage = serverError
    ? serverError.message.startsWith("errors.")
      ? tErrors(serverError.message.slice("errors.".length), serverError.params)
      : serverError.message === "emptyCart"
        ? t("emptyCart")
        : serverError.message === "lineNeedsUpdate"
          ? t("lineNeedsUpdate")
          : tErrors("generic")
    : null;

  const summaryProps = {
    items: itemsWithResolved,
    taxSettings,
    globalStartDate,
    globalEndDate,
    subtotal,
    originalSubtotal,
    totalSavings,
    totalDeposit,
    totals,
    hasDeliveryLegs: delivery.outboundMethod === "address" || delivery.returnMethod === "address",
    deliveryFee: delivery.totalFee,
    deliveryFeeReady: delivery.canContinue,
    lineResolutions,
    promo: promo.promo,
    discountAmount: promo.discountAmount,
    onEditDates: () => setIsDatePickerOpen(true),
  };

  return (
    <CheckoutFormView
      returnHref={returnHref}
      summaryProps={summaryProps}
      stepRef={stepRef}
      error={
        serverError &&
        serverErrorMessage &&
        serverError.message !== STORE_NOT_ACCEPTING_RESERVATIONS_ERROR && (
          <Alert variant="error" className="mb-4">
            <AlertCircle />
            <AlertTitle>{t("submitError.title")}</AlertTitle>
            <AlertDescription>
              <span>{serverErrorMessage}</span>
            </AlertDescription>
          </Alert>
        )
      }
      footer={
        <>
          <DatePickerModal
            storeSlug={storeSlug}
            pricingMode={pricingMode}
            businessHours={businessHours}
            advanceNotice={advanceNotice.issue?.advanceNoticeMinutes ?? advanceNoticeMinutes}
            minRentalMinutes={minRentalMinutes}
            timezone={timezone}
            isOpen={isDatePickerOpen}
            onClose={() => setIsDatePickerOpen(false)}
            initialStartDate={globalStartDate ?? undefined}
            initialEndDate={globalEndDate ?? undefined}
            redirectOnSubmit={false}
          />
          {/* The card gate's refusal: nothing for the renter to fix, so no inline error. */}
          <CheckoutStorePausedDialog
            open={serverError?.message === STORE_NOT_ACCEPTING_RESERVATIONS_ERROR}
            onClose={clearServerError}
            storeName={storeName}
            storeEmail={storeEmail}
            storePhone={storePhone}
          />
        </>
      }
    >
      <form.AppForm>
        <form.Form formName="checkout">
          <CheckoutRequestForm
            form={form}
            lines={customFields.plan.lines}
            promo={promo}
            hasActivePromoCodes={hasActivePromoCodes}
            isSubmitting={isSubmitting}
            blockedReason={blockedReason}
            advanceNoticeMinutes={advanceNotice.issue?.advanceNoticeMinutes ?? advanceNoticeMinutes}
          />
        </form.Form>
      </form.AppForm>
    </CheckoutFormView>
  );
};
