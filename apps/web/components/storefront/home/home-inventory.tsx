import { getTranslations } from "next-intl/server";

import { Button } from "@louez/ui";

import { CategoryBrowseGrid } from "@/components/storefront/category-browse-grid";
import { HomeProductGrid } from "@/components/storefront/home/home-product-grid";
import { HomeInventoryView } from "@/components/storefront/home/home-inventory-view";
import { HOME_COPY } from "@/components/storefront/home/home-copy";
import { StorefrontLink } from "@/components/storefront/ui/storefront-link";
import type { HomeInventory as HomeInventoryData } from "@/lib/storefront/home.queries";

interface HomeInventoryProps {
  inventory: HomeInventoryData;
}

/**
 * What the store rents, right after the hero: four category photo tiles when
 * the store has categories, then the first four products. Empty parts are not
 * rendered (categories) or collapse to one line (products).
 */
export const HomeInventory = async ({ inventory }: HomeInventoryProps) => {
  const t = await getTranslations("storefront");
  const categories = inventory.entries.filter((entry) => entry.variant === "category").slice(0, 4);

  return (
    <div className="light bg-background text-foreground">
      {categories.length > 0 ? (
        <HomeInventoryView kind="categories">
          <CategoryBrowseGrid
            entries={categories}
            isAvailabilityLoading={false}
            showTotalsOnly
            showTitle={false}
            variant="showcase"
          />
        </HomeInventoryView>
      ) : null}
      <HomeInventoryView kind="products">
        {inventory.products.length > 0 ? (
          <HomeProductGrid products={inventory.products.slice(0, 4)} />
        ) : (
          <div className="flex flex-col gap-4 rounded-lg border bg-card px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">{t("home.noProducts")}</p>
            <Button
              variant="outline"
              render={<StorefrontLink href={HOME_COPY.emptyProducts.contactHref} />}
            >
              {HOME_COPY.emptyProducts.contactCta}
            </Button>
          </div>
        )}
      </HomeInventoryView>
    </div>
  );
};
