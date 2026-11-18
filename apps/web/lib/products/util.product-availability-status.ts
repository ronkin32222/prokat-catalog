/**
 * Availability status of one product (a rental item), computed from its
 * reservations. Used by the dashboard list and by the storefront catalog, so
 * both show the same answer.
 *
 * Priority: unavailable > overdue return > rented > free. `releasingSoon` is a
 * flag on top of "rented", not a status of its own.
 */

export const PRODUCT_AVAILABILITY_STATUSES = [
  "free",
  "rented",
  "overdue",
  "unavailable",
] as const;

export type ProductAvailabilityStatus = (typeof PRODUCT_AVAILABILITY_STATUSES)[number];

/** A rented product whose first unit comes back within this window is "soon". */
export const RELEASING_SOON_WINDOW_MS = 24 * 60 * 60 * 1000;

export interface ProductAvailabilityInput {
  /** The owner took the product out of rental by hand (repair, maintenance). */
  isUnavailable: boolean;
  /** Units the product has (`products.quantity`), only for tracked stock. */
  stock: number;
  /** Stock is tracked (`stockKind !== "untracked"`). Untracked items are never rented out. */
  tracksStock: boolean;
  /** Units held right now by blocking reservations (pending, confirmed, ongoing). */
  bookedQuantity: number;
  /** A reservation is `ongoing` and its end date has passed. */
  hasOverdueReturn: boolean;
  /** When the first booked unit comes back; null when nothing is booked. */
  releaseAt: Date | null;
}

export interface ProductAvailabilityStatusResult {
  status: ProductAvailabilityStatus;
  releasingSoon: boolean;
}

export function computeProductAvailabilityStatus(
  input: ProductAvailabilityInput,
  now: Date = new Date(),
): ProductAvailabilityStatusResult {
  if (input.isUnavailable) return { status: "unavailable", releasingSoon: false };
  if (input.hasOverdueReturn) return { status: "overdue", releasingSoon: false };
  if (!input.tracksStock || input.bookedQuantity < input.stock) {
    return { status: "free", releasingSoon: false };
  }
  const releasingSoon =
    input.releaseAt !== null &&
    input.releaseAt.getTime() - now.getTime() <= RELEASING_SOON_WINDOW_MS;
  return { status: "rented", releasingSoon };
}

/** Human labels and badge colours, shared by the dashboard and the storefront. */
export const PRODUCT_AVAILABILITY_LABELS: Record<ProductAvailabilityStatus, string> = {
  free: "Свободно",
  rented: "В аренде",
  overdue: "Просрочен возврат",
  unavailable: "Недоступно",
};
