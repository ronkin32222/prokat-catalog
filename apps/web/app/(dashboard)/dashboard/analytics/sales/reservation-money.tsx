import { cache } from "react";

import { and, eq, gte, lte } from "drizzle-orm";
import { formatInTimeZone } from "date-fns-tz";

import type { SalesWindow } from "@louez/api/services/sales-window";
import { db, reservations } from "@louez/db";
import { formatCurrency } from "@louez/utils";

import { getRequestFormatLocale } from "@/lib/i18n/format-locale.server";

/** Statuses whose amount counts as the store's money: agreed, handed out or finished. */
const MONEY_STATUSES = new Set(["confirmed", "ongoing", "completed"]);

const STATUS_ROWS = [
  { status: "pending", label: "Ждут подтверждения", dot: "bg-amber-400" },
  { status: "confirmed", label: "Подтверждены", dot: "bg-sky-400" },
  { status: "ongoing", label: "В аренде", dot: "bg-emerald-400" },
  { status: "completed", label: "Завершены", dot: "bg-zinc-400" },
  { status: "cancelled", label: "Отменены", dot: "bg-red-400" },
] as const;

/** One read per request: the money card and the status card share it. */
const loadRows = cache(async (storeId: string, startMs: number, endMs: number) =>
  db
    .select({
      status: reservations.status,
      total: reservations.totalAmount,
      start: reservations.startDate,
    })
    .from(reservations)
    .where(
      and(
        eq(reservations.storeId, storeId),
        gte(reservations.startDate, new Date(startMs)),
        lte(reservations.startDate, new Date(endMs)),
      ),
    )
    .limit(5000),
);

interface SectionProps {
  storeId: string;
  window: SalesWindow;
  currency: string;
}

/** Money from reservations for the period: the total, the average booking and a bar per day. */
export async function ReservationMoneySection({ storeId, window, currency }: SectionProps) {
  const { intl: formatLocale } = await getRequestFormatLocale();
  const rows = await loadRows(storeId, window.start.getTime(), window.end.getTime());
  const monthly = window.granularity === "month";
  const keyFormat = monthly ? "yyyy-MM" : "yyyy-MM-dd";

  const money = rows.filter((row) => MONEY_STATUSES.has(row.status));
  const total = money.reduce((sum, row) => sum + Number(row.total), 0);
  const average = money.length > 0 ? total / money.length : 0;

  const byDay = new Map<string, { sum: number; at: Date }>();
  for (const row of money) {
    const key = formatInTimeZone(row.start, window.timezone, keyFormat);
    const entry = byDay.get(key) ?? { sum: 0, at: row.start };
    entry.sum += Number(row.total);
    byDay.set(key, entry);
  }
  const bars = [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b));
  const max = Math.max(1, ...bars.map(([, entry]) => entry.sum));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <p className="text-muted-foreground text-xs">Деньги по броням</p>
          <p className="text-2xl font-bold tabular-nums sm:text-3xl">
            {formatCurrency(total, currency, formatLocale)}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Броней в деньгах</p>
          <p className="text-2xl font-bold tabular-nums sm:text-3xl">{money.length}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Средний чек</p>
          <p className="text-2xl font-bold tabular-nums sm:text-3xl">
            {formatCurrency(average, currency, formatLocale)}
          </p>
        </div>
      </div>

      {bars.length === 0 ? (
        <p className="text-muted-foreground rounded-lg border border-dashed p-6 text-center text-sm">
          За выбранный период подтверждённых броней пока нет.
        </p>
      ) : (
        <div className="flex h-48 items-end gap-1.5" role="img" aria-label="Деньги по дням">
          {bars.map(([key, entry]) => (
            <div key={key} className="flex min-w-0 flex-1 flex-col items-center gap-1">
              <div
                className="bg-primary w-full rounded-t-sm"
                style={{ height: `${Math.max(4, (entry.sum / max) * 100)}%` }}
                title={`${formatInTimeZone(entry.at, window.timezone, monthly ? "LLLL yyyy" : "d MMM")}: ${formatCurrency(entry.sum, currency, formatLocale)}`}
              />
              <span className="text-muted-foreground truncate text-[10px]">
                {formatInTimeZone(entry.at, window.timezone, monthly ? "LLL" : "d.MM")}
              </span>
            </div>
          ))}
        </div>
      )}
      <p className="text-muted-foreground text-xs">
        Считаются подтверждённые, выданные и завершённые брони с началом в выбранном периоде.
      </p>
    </div>
  );
}

/** How many bookings sit in each status for the period. */
export async function ReservationStatusesSection({ storeId, window }: SectionProps) {
  const rows = await loadRows(storeId, window.start.getTime(), window.end.getTime());
  const counts = new Map<string, number>();
  for (const row of rows) {
    // Rejected and declined are shown with the cancelled ones.
    const status = row.status === "rejected" || row.status === "declined" ? "cancelled" : row.status;
    counts.set(status, (counts.get(status) ?? 0) + 1);
  }
  const all = STATUS_ROWS.reduce((sum, item) => sum + (counts.get(item.status) ?? 0), 0);

  return (
    <div className="space-y-3">
      <p className="text-2xl font-bold tabular-nums sm:text-3xl">{all}</p>
      <ul className="space-y-2 text-sm">
        {STATUS_ROWS.map((item) => (
          <li key={item.status} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2">
              <span aria-hidden className={`size-2.5 rounded-full ${item.dot}`} />
              {item.label}
            </span>
            <span className="font-semibold tabular-nums">{counts.get(item.status) ?? 0}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
