"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CalendarDaysIcon } from "lucide-react";

import { Button } from "@louez/ui";
import { cn } from "@louez/utils";

import { DatePickerModal } from "@/components/storefront/date-picker-modal";
import {
  type StorefrontRentalRules,
  useStorefrontRentalRules,
} from "@/components/storefront/shell/rental-rules-context";
import { type CartPeriod, useCartState } from "@/contexts/cart-context";
import { useStoreTimezone } from "@/contexts/store-context";
import { formatDetailedDuration } from "@/lib/utils/duration";
import { formatRentalPeriod } from "@/lib/utils/store-date";

interface CartPeriodSummaryProps {
  period: CartPeriod | null;
  className?: string;
}

const toPeriodValue = (period: CartPeriod): { start: Date; end: Date } | null => {
  const start = new Date(period.startDate);
  const end = new Date(period.endDate);
  return Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) ? null : { start, end };
};

/** The date picker for the cart's period: it writes the new period back to the cart. */
const CartPeriodEditor = ({
  period,
  rules,
}: {
  period: CartPeriod | null;
  rules: StorefrontRentalRules;
}) => {
  const t = useTranslations("storefront.dateSelection");
  const { pricingMode } = useCartState();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="ml-auto shrink-0"
        onClick={() => setIsOpen(true)}
      >
        <CalendarDaysIcon aria-hidden />
        {period ? t("changeDates") : t("chooseDates")}
      </Button>
      <DatePickerModal
        storeSlug={rules.storeSlug}
        pricingMode={pricingMode}
        businessHours={rules.businessHours}
        advanceNotice={rules.advanceNoticeMinutes}
        minRentalMinutes={rules.minRentalMinutes}
        maxRentalMinutes={rules.maxRentalMinutes}
        timezone={rules.timezone}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        initialStartDate={period?.startDate}
        initialEndDate={period?.endDate}
        redirectOnSubmit={false}
      />
    </>
  );
};

/**
 * The cart's rental period: the dates on one side, how long they add up to on
 * the other, and a control to change them in place. Where the storefront shell
 * is absent (landing demos) it only states the period, and nothing without one.
 */
export const CartPeriodSummary = ({ period, className }: CartPeriodSummaryProps) => {
  const t = useTranslations("storefront.dateSelection");
  const locale = useLocale();
  const timezone = useStoreTimezone();
  const rules = useStorefrontRentalRules();
  const value = period ? toPeriodValue(period) : null;

  if (!value && !rules) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex flex-wrap items-baseline justify-between gap-x-3 gap-y-2 rounded-2xl bg-muted px-4 py-3 text-sm",
        className,
      )}
      data-slot="cart-period-summary"
    >
      {value ? (
        <>
          <span className="min-w-0 font-medium">
            {formatRentalPeriod(value.start, value.end, { timezone, locale, style: "long" })}
          </span>
          <span className="shrink-0 text-muted-foreground">
            {formatDetailedDuration(value.start, value.end, {
              day: t("durationDay"),
              days: t("durationDays"),
              and: t("and"),
            })}
          </span>
        </>
      ) : null}
      {rules ? <CartPeriodEditor period={period} rules={rules} /> : null}
    </div>
  );
};
