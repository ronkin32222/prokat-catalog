"use server";

import { revalidatePath } from "next/cache";

import { eq } from "drizzle-orm";

import { db, stores } from "@louez/db";
import type { StoreSettings } from "@louez/types";

import { getDadataApiKey, lookupDadataParty, type DadataParty } from "@/lib/owner-profile/dadata";
import {
  mergeOwnerProfile,
  ownerProfileInputSchema,
  ownerProfileProblem,
} from "@/lib/owner-profile/owner-profile-input";
import { innProblem } from "@/lib/owner-profile/validators";
import { getCurrentStore, hasPermission } from "@/lib/store-context";

export type OwnerProfileActionResult =
  | { status: "success" }
  | { status: "error"; error: string };

/** Saves the owner's answers into the store's `settings` JSON. No migration. */
export async function saveOwnerProfile(input: unknown): Promise<OwnerProfileActionResult> {
  const store = await getCurrentStore();
  if (!store) return { status: "error", error: "errors.unauthorized" };
  if (!hasPermission(store.role, "manage_settings")) {
    return { status: "error", error: "errors.permissionDenied" };
  }

  const parsed = ownerProfileInputSchema.safeParse(input);
  if (!parsed.success) return { status: "error", error: "errors.invalidData" };

  const problem = ownerProfileProblem(parsed.data);
  if (problem) return { status: "error", error: problem };

  const current = await db.query.stores.findFirst({
    where: eq(stores.id, store.id),
    columns: { settings: true },
  });
  const settings: StoreSettings = {
    ...(current?.settings ?? { reservationMode: "payment", advanceNoticeMinutes: 1440 }),
    ownerProfile: mergeOwnerProfile(current?.settings?.ownerProfile, parsed.data),
  };

  await db.update(stores).set({ settings }).where(eq(stores.id, store.id));
  revalidatePath("/dashboard/settings/documents");
  return { status: "success" };
}

export type LookupByInnResult =
  | { status: "success"; party: DadataParty }
  | { status: "error"; error: string };

/** «Заполнить по ИНН»: asks DaData with the stored key. Only shown when a key is set. */
export async function lookupCompanyByInn(inn: string): Promise<LookupByInnResult> {
  const store = await getCurrentStore();
  if (!store) return { status: "error", error: "errors.unauthorized" };
  if (!hasPermission(store.role, "manage_settings")) {
    return { status: "error", error: "errors.permissionDenied" };
  }
  const apiKey = getDadataApiKey();
  if (!apiKey) return { status: "error", error: "errors.invalidData" };

  const problem = innProblem(inn);
  if (problem) return { status: "error", error: problem };

  const party = await lookupDadataParty(inn.trim(), apiKey);
  if (!party) {
    return { status: "error", error: "Не удалось найти организацию по этому ИНН. Заполните поля вручную" };
  }
  return { status: "success", party };
}
