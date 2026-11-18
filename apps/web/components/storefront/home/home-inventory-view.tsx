import type { ReactNode } from "react";

import { useTranslations } from "next-intl";

import { SectionHeader } from "@/components/storefront/ui/section-header";
import { StorefrontLink } from "@/components/storefront/ui/storefront-link";
import { StorefrontSection } from "@/components/storefront/ui/storefront-section";

interface HomeInventoryViewProps {
  kind: "categories" | "products";
  children: ReactNode;
  linkPrefetch?: boolean;
}

/** Shared home section; its caller supplies the server-backed or local grid. */
export const HomeInventoryView = ({ kind, children, linkPrefetch }: HomeInventoryViewProps) => {
  const t = useTranslations("storefront");

  return (
    <StorefrontSection aria-labelledby="home-inventory-title" className="py-16 sm:py-24">
      <SectionHeader
        id="home-inventory-title"
        title={kind === "categories" ? "Весь спектр оборудования" : "Актуальные позиции"}
        action={
          <StorefrontLink
            href="/catalog"
            prefetch={linkPrefetch}
            className="inline-flex min-h-11 items-center border-b border-foreground text-xs font-semibold uppercase transition-colors hover:text-primary"
          >
            {t("home.viewAll")}
          </StorefrontLink>
        }
      />
      {children}
    </StorefrontSection>
  );
};
