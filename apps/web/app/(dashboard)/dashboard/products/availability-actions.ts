"use server";

import { revalidatePath } from "next/cache";

import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";

import { db, products } from "@louez/db";
import { hasPermission } from "@louez/utils";

import { getCurrentStore } from "@/lib/store-context";

const setUnavailableSchema = z.object({
  productIds: z.array(z.string().min(1)).min(1).max(200),
  unavailable: z.boolean(),
  note: z.string().trim().max(255).optional(),
});

/**
 * Takes products out of rental (repair, maintenance) or back into it. Only the
 * manual flag changes; "free" / "rented" / "overdue" come from reservations.
 * Returning a product to rental clears its note.
 */
export async function setProductsUnavailable(input: {
  productIds: string[];
  unavailable: boolean;
  note?: string;
}): Promise<{ success: true } | { error: string }> {
  const store = await getCurrentStore();
  if (!store) return { error: "errors.unauthorized" };
  if (!hasPermission(store.role, "write")) return { error: "errors.permissionDenied" };

  const parsed = setUnavailableSchema.safeParse(input);
  if (!parsed.success) return { error: "Проверьте список позиций" };

  const { productIds, unavailable } = parsed.data;
  const note = unavailable && parsed.data.note ? parsed.data.note : null;

  await db
    .update(products)
    .set({ isUnavailable: unavailable, unavailableNote: note })
    .where(and(eq(products.storeId, store.id), inArray(products.id, productIds)));

  revalidatePath("/dashboard/products");
  return { success: true };
}
