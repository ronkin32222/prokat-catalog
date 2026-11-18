import { and, desc, eq, gte, lt } from "drizzle-orm";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { getStorefrontAvailability } from "@louez/api/services";
import { salesStore } from "@louez/api/services/sales-analytics";
import { getStoreMetrics } from "@louez/api/services/store-metrics";
import { getStoreCalendar, type StoreCalendar } from "@louez/api/services/sales-window";
import { db, reservations } from "@louez/db";
import { Button, Card, CardHeader, CardPanel, CardTitle } from "@louez/ui";

import {
  AdaptiveStats,
  PendingRequests,
  ReservationsCalendarPrefetch,
  TodayActivity,
} from "@/components/dashboard/home";
import { OverviewStockPanels } from "@/components/dashboard/home/overview-stock-panels";
import { RecentReservations } from "@/components/dashboard/home/recent-reservations";
import { PlanningTimeline } from "@/app/(dashboard)/dashboard/reservations/calendar/planning-timeline";
import { getCalendarProducts } from "@/app/(dashboard)/dashboard/reservations/calendar/data";
import { determineStoreState } from "@/lib/dashboard/metrics";
import { getCurrentStore } from "@/lib/store-context";

export const instant = false;

const getTodaysDepartures = async (storeId: string, now: Date, calendar: StoreCalendar) => {
  const rows = await db.query.reservations.findMany({
    where: and(
      eq(reservations.storeId, storeId),
      eq(reservations.status, "confirmed"),
      gte(reservations.startDate, calendar.todayStart),
      lt(reservations.startDate, calendar.tomorrowStart),
    ),
    with: { customer: true, items: { with: { product: true } } },
    orderBy: [reservations.startDate],
    limit: 5,
  });

  return rows.map((row) => ({ ...row, isOverdue: row.startDate < now }));
};

const getTodaysReturns = async (storeId: string, now: Date, calendar: StoreCalendar) => {
  const rows = await db.query.reservations.findMany({
    where: and(
      eq(reservations.storeId, storeId),
      eq(reservations.status, "ongoing"),
      gte(reservations.endDate, calendar.todayStart),
      lt(reservations.endDate, calendar.tomorrowStart),
    ),
    with: { customer: true, items: { with: { product: true } } },
    orderBy: [reservations.endDate],
    limit: 5,
  });

  return rows.map((row) => ({ ...row, isOverdue: row.endDate < now }));
};

const getPendingReservations = (storeId: string) =>
  db.query.reservations.findMany({
    where: and(eq(reservations.storeId, storeId), eq(reservations.status, "pending")),
    with: { customer: true, items: { with: { product: true } } },
    orderBy: [desc(reservations.createdAt)],
    limit: 5,
  });

const getRecentReservations = (storeId: string) =>
  db.query.reservations.findMany({
    where: eq(reservations.storeId, storeId),
    with: { customer: true, items: { with: { product: true } } },
    orderBy: [desc(reservations.createdAt)],
    limit: 5,
  });

const getSoonReturns = (storeId: string, now: Date) =>
  db.query.reservations.findMany({
    where: and(
      eq(reservations.storeId, storeId),
      eq(reservations.status, "ongoing"),
      gte(reservations.endDate, now),
    ),
    with: { items: { with: { product: true } } },
    orderBy: [reservations.endDate],
    limit: 8,
  });

export default async function DashboardHomePage() {
  const store = await getCurrentStore();
  if (!store) return null;

  const now = new Date();
  const timezone = store.settings?.timezone ?? null;
  const currency = salesStore(store).currency;
  const calendar = getStoreCalendar(now, timezone);
  const availabilityEnd = new Date(now.getTime() + 60_000);

  const [metrics, departures, returns, pending, products, availability, recent, soonRows] =
    await Promise.all([
      getStoreMetrics({ id: store.id, currency }, { timezone, now }),
      getTodaysDepartures(store.id, now, calendar),
      getTodaysReturns(store.id, now, calendar),
      getPendingReservations(store.id),
      getCalendarProducts(store.id),
      getStorefrontAvailability({
        store: { id: store.id, settings: store.settings ?? null },
        startDate: now.toISOString(),
        endDate: availabilityEnd.toISOString(),
      }),
      getRecentReservations(store.id),
      getSoonReturns(store.id, now),
    ]);

  const productById = new Map(products.map((product) => [product.id, product]));
  const available = availability.products
    .filter((product) => product.availableQuantity === null || product.availableQuantity > 0)
    .flatMap((product) => {
      const details = productById.get(product.productId);
      return details
        ? [
            {
              id: details.id,
              name: details.name,
              images: details.images,
              availableQuantity: product.availableQuantity,
            },
          ]
        : [];
    })
    .slice(0, 4);

  const seenSoonProductIds = new Set<string>();
  const soon = soonRows
    .flatMap((reservation) =>
      reservation.items.flatMap((item) => {
        const product = item.product;
        if (!product || seenSoonProductIds.has(product.id)) return [];
        seenSoonProductIds.add(product.id);
        return [
          {
            reservationId: reservation.id,
            productId: product.id,
            name: product.name,
            images: product.images,
            endDate: reservation.endDate,
          },
        ];
      }),
    )
    .slice(0, 4);

  const storeState = determineStoreState(metrics);

  return (
    <div className="space-y-4 sm:space-y-5">
      {storeState !== "virgin" && storeState !== "building" && <ReservationsCalendarPrefetch />}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="dashboard-heading text-4xl font-semibold uppercase tracking-tight sm:text-5xl">
            Обзор
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Выдачи, возвраты и загрузка оборудования на сегодня.
          </p>
        </div>
        {metrics.pendingReservations > 0 && (
          <Button render={<Link href="/dashboard/reservations?status=pending" />}>
            Новые заявки: {metrics.pendingReservations}
            <ArrowRight className="size-4" />
          </Button>
        )}
      </div>

      <AdaptiveStats metrics={metrics} storeState={storeState} />

      {storeState !== "virgin" && storeState !== "building" && (
        <div className="grid min-w-0 gap-4 2xl:grid-cols-[minmax(0,1fr)_23rem]">
          <Card className="flex min-h-[34rem] min-w-0 flex-col rounded-xl border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between gap-3 p-4 pb-3 sm:p-5 sm:pb-3">
              <CardTitle className="dashboard-heading text-xl font-semibold uppercase tracking-wide">
                Загрузка оборудования
              </CardTitle>
              <Button variant="ghost" size="sm" render={<Link href="/dashboard/reservations?view=planning" />}>
                Открыть планирование
              </Button>
            </CardHeader>
            <CardPanel className="flex min-h-0 flex-1 flex-col px-4 pb-4 sm:px-5 sm:pb-5">
              <PlanningTimeline products={products} currency={currency} storeId={store.id} readOnly />
            </CardPanel>
          </Card>
          <OverviewStockPanels available={available} soon={soon} />
        </div>
      )}

      <TodayActivity departures={departures} returns={returns} />
      <PendingRequests pending={pending} />
      <RecentReservations
        reservations={recent.flatMap((reservation) =>
          reservation.customer ? [{ ...reservation, customer: reservation.customer }] : [],
        )}
        currency={currency}
      />
    </div>
  );
}
