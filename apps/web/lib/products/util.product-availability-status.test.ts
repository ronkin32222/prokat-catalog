import assert from "node:assert/strict";
import { test } from "node:test";

import { computeProductAvailabilityStatus } from "./util.product-availability-status";

const now = new Date("2026-11-18T12:00:00Z");
const base = {
  isUnavailable: false,
  stock: 2,
  tracksStock: true,
  bookedQuantity: 0,
  hasOverdueReturn: false,
  releaseAt: null,
};

test("a free product with units left is free", () => {
  assert.deepEqual(computeProductAvailabilityStatus({ ...base, bookedQuantity: 1 }, now), {
    status: "free",
    releasingSoon: false,
  });
});

test("all units held by reservations means rented", () => {
  const releaseAt = new Date("2026-12-01T12:00:00Z");
  assert.deepEqual(
    computeProductAvailabilityStatus({ ...base, bookedQuantity: 2, releaseAt }, now),
    { status: "rented", releasingSoon: false },
  );
});

test("a rented product that comes back within 24 hours is releasing soon", () => {
  const releaseAt = new Date("2026-11-19T06:00:00Z");
  assert.deepEqual(
    computeProductAvailabilityStatus({ ...base, bookedQuantity: 2, releaseAt }, now),
    { status: "rented", releasingSoon: true },
  );
});

test("an overdue return wins over rented", () => {
  assert.equal(
    computeProductAvailabilityStatus({ ...base, bookedQuantity: 2, hasOverdueReturn: true }, now)
      .status,
    "overdue",
  );
});

test("manual unavailability wins over everything", () => {
  assert.equal(
    computeProductAvailabilityStatus(
      { ...base, isUnavailable: true, bookedQuantity: 2, hasOverdueReturn: true },
      now,
    ).status,
    "unavailable",
  );
});

test("untracked stock is never rented out", () => {
  assert.equal(
    computeProductAvailabilityStatus({ ...base, tracksStock: false, bookedQuantity: 5 }, now)
      .status,
    "free",
  );
});
