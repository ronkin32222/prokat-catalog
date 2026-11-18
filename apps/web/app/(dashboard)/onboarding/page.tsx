import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { isCurrentUserPlatformAdmin } from "@/lib/platform-admin";
import { getCurrentStore, getUserStores } from "@/lib/store-context";

import { StoreOnboardingClientPage } from "./store-onboarding-client-page";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function OnboardingStorePage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const { new: newStore } = await searchParams;
  const isCreatingNewStore = newStore === "true";

  const [currentStore, isPlatformAdmin] = await Promise.all([
    getCurrentStore(),
    isCurrentUserPlatformAdmin(),
  ]);

  // A completed active store is not an onboarding draft. This also closes the
  // profile -> /onboarding loop for legacy users whose store was already ready.
  if (!isCreatingNewStore && currentStore?.onboardingCompleted) {
    redirect("/dashboard");
  }

  const stores = isPlatformAdmin ? await getUserStores() : [];
  const currentStoreId = currentStore?.id ?? stores[0]?.id ?? null;
  return (
    <StoreOnboardingClientPage
      stores={stores}
      currentStoreId={isPlatformAdmin ? currentStoreId : null}
      editingStoreId={isCreatingNewStore ? null : (currentStore?.id ?? null)}
      initialCountry="RU"
      shouldDetectBrowserCountry={false}
      accountEmail={session.user.email}
    />
  );
}
