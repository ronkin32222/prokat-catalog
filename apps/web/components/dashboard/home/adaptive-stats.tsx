"use client";

import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import {
  CalendarSolidIcon,
  CreditCardSolidIcon,
  ParticipantsSolidIcon,
  ProductSolidIcon,
} from "@louez/ui/icons";
import { formatCurrency } from "@louez/utils";

import { DashboardStatCard } from "@/components/dashboard/shared/dashboard-stat-card";
import { useStoreCurrency } from "@/contexts/store-context";
import type { StoreMetrics, StoreState } from "./home-types";
import { calculateGrowth } from "./home-utils";
import { ReservationCalendarPrefetchBoundary } from "./reservation-calendar-prefetch-boundary";

interface AdaptiveStatsProps {
  metrics: StoreMetrics;
  storeState: StoreState;
}

/** Two columns on phones, one row of four from `lg` — same rhythm everywhere. */
const GRID_CLASS_NAME = "grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4";
const TODAY_DEPARTURES_HREF =
  "/dashboard/reservations?restorePreferredView=true&date=today&period=today&operation=departure&status=confirmed&statuses=confirmed";
const TODAY_RETURNS_HREF =
  "/dashboard/reservations?restorePreferredView=true&date=today&period=today&operation=return&status=ongoing&statuses=ongoing";

export const AdaptiveStats = ({ metrics, storeState }: AdaptiveStatsProps) => {
  const currency = useStoreCurrency();

  // Catalog-focused stats while the store is still being set up.
  if (storeState === "virgin" || storeState === "building") {
    return (
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <DashboardStatCard
          title="Оборудование"
          value={metrics.activeProductCount}
          icon={ProductSolidIcon}
          accent="submitted"
          href="/dashboard/products"
          subtitle={
            metrics.draftProductCount > 0
              ? `${metrics.draftProductCount} в черновиках`
              : undefined
          }
        />
        <DashboardStatCard
          title="Клиенты"
          value={metrics.customerCount}
          icon={ParticipantsSolidIcon}
          accent="progress"
          href="/dashboard/customers"
        />
      </div>
    );
  }

  const revenueGrowth = calculateGrowth(metrics.monthlyRevenue, metrics.lastMonthRevenue);

  return (
    <div className={GRID_CLASS_NAME}>
      <DashboardStatCard
        title="Активные аренды"
        value={metrics.ongoingReservations}
        icon={CalendarSolidIcon}
        accent="success"
        href="/dashboard/reservations?status=ongoing"
        subtitle="Сейчас у клиентов"
      />
      <ReservationCalendarPrefetchBoundary href={TODAY_DEPARTURES_HREF}>
        <DashboardStatCard
          title="Выдача сегодня"
          value={metrics.todaysDepartures}
          icon={ArrowUpRight}
          accent="pending"
          href={TODAY_DEPARTURES_HREF}
          subtitle="Нужно выдать"
        />
      </ReservationCalendarPrefetchBoundary>
      <ReservationCalendarPrefetchBoundary href={TODAY_RETURNS_HREF}>
        <DashboardStatCard
          title="Возврат сегодня"
          value={metrics.todaysReturns}
          icon={ArrowDownRight}
          accent="review"
          href={TODAY_RETURNS_HREF}
          subtitle="Нужно принять"
        />
      </ReservationCalendarPrefetchBoundary>
      <DashboardStatCard
        title="Выручка за месяц"
        value={formatCurrency(metrics.monthlyRevenue, currency)}
        icon={CreditCardSolidIcon}
        accent="submitted"
        href="/dashboard/analytics/sales"
        trend={revenueGrowth}
        subtitle="К прошлому месяцу"
      />
    </div>
  );
};
