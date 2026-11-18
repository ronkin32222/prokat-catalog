import "server-only";

import { and, eq, inArray, isNotNull, lte, gt, or, sql } from "drizzle-orm";

import {
  BLOCKING_RESERVATION_STATUSES,
  db,
  effectiveProductQuantitySql,
  reservationAvailabilityEndSql,
  reservationItems,
  reservations,
  products,
} from "@louez/db";

import {
  computeProductAvailabilityStatus,
  type ProductAvailabilityStatusResult,
} from "./util.product-availability-status";

/**
 * Availability status of every product of a store right now. Reads the same
 * blocking reservations as the storefront catalogue (`BLOCKING_RESERVATION_STATUSES`,
 * `reservationAvailabilityEndSql`), so the dashboard and the storefront agree.
 * `productIds` narrows the result when only some products are needed.
 */
export async function loadProductAvailabilityStatuses(
  storeId: string,
  now: Date = new Date(),
  productIds?: string[],
): Promise<Map<string, ProductAvailabilityStatusResult>> {
  const productRows = await db
    .select({
      id: products.id,
      isUnavailable: products.isUnavailable,
      stockKind: products.stockKind,
      stock: effectiveProductQuantitySql(),
    })
    .from(products)
    .where(
      and(
        eq(products.storeId, storeId),
        productIds ? inArray(products.id, productIds) : undefined,
      ),
    );

  const booked = await db
    .select({
      productId: reservationItems.productId,
      quantity: sql<number>`SUM(${reservationItems.quantity})`.mapWith(Number),
      releaseAt: sql<Date>`MIN(${reservationAvailabilityEndSql()})`.mapWith(reservations.endDate),
      overdue: sql<number>`MAX(CASE WHEN ${reservations.status} = 'ongoing' AND ${reservations.endDate} < ${now} THEN 1 ELSE 0 END)`.mapWith(
        Number,
      ),
    })
    .from(reservationItems)
    .innerJoin(reservations, eq(reservations.id, reservationItems.reservationId))
    .where(
      and(
        eq(reservations.storeId, storeId),
        inArray(reservations.status, [...BLOCKING_RESERVATION_STATUSES]),
        lte(reservations.startDate, now),
        or(gt(reservationAvailabilityEndSql(), now), eq(reservations.status, "ongoing")),
        eq(reservationItems.isCustomItem, false),
        isNotNull(reservationItems.productId),
      ),
    )
    .groupBy(reservationItems.productId);

  const bookedById = new Map(
    booked.flatMap((row) => (row.productId ? [[row.productId, row] as const] : [])),
  );

  return new Map(
    productRows.map((row) => {
      const entry = bookedById.get(row.id);
      const result = computeProductAvailabilityStatus(
        {
          isUnavailable: row.isUnavailable,
          stock: row.stock ?? 0,
          tracksStock: row.stockKind !== "untracked",
          bookedQuantity: entry?.quantity ?? 0,
          hasOverdueReturn: entry?.overdue === 1,
          releaseAt: entry?.releaseAt ?? null,
        },
        now,
      );
      return [row.id, result] as const;
    }),
  );
}
