"use client";

import type { ComponentProps, ReactNode, Ref } from "react";
import { useTranslations } from "next-intl";

import { BackLink } from "@/components/storefront/ui/back-link";
import { CheckoutOrderSummary } from "@/app/(storefront)/[slug]/checkout/components/checkout-order-summary";
import { CheckoutSummaryBar } from "@/app/(storefront)/[slug]/checkout/components/checkout-summary-bar";

interface CheckoutFormViewProps {
  returnHref: string;
  summaryProps: ComponentProps<typeof CheckoutOrderSummary>;
  stepRef?: Ref<HTMLDivElement>;
  error?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}

/** Checkout layout: the request form on the left, the estimate on the right. */
export const CheckoutFormView = ({
  returnHref,
  summaryProps,
  stepRef,
  error,
  children,
  footer,
}: CheckoutFormViewProps) => {
  const t = useTranslations("storefront.checkout");
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <BackLink href={returnHref} />
        <h1 className="text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
          {t("title")}
        </h1>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-8">
        <div ref={stepRef} className="min-w-0 scroll-mt-4">
          {error}

          {children}
        </div>

        <aside
          className="hidden lg:sticky lg:top-4 lg:block"
          data-demo-target="checkout-order-summary"
        >
          <CheckoutOrderSummary {...summaryProps} />
        </aside>
      </div>

      <CheckoutSummaryBar {...summaryProps} />

      {footer}
    </div>
  );
};
