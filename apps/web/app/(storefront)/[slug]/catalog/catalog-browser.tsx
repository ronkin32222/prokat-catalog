"use client";

import { useMemo } from "react";

import { hashKey, useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { PackageIcon, SearchIcon } from "lucide-react";

import { Button } from "@louez/ui";
import { cn } from "@louez/utils";

import { RentalPeriodPicker } from "@/components/storefront/date-picker/rental-period-picker";
import { PageTracker } from "@/components/storefront/page-tracker";
import { ProductGrid } from "@/components/storefront/product/product-grid";
import { ProductGridSkeleton } from "@/components/storefront/product/product-grid-skeleton";
import { useProductCardAvailability } from "@/components/storefront/product/use-product-card-availability";
import { StorefrontLink } from "@/components/storefront/ui/storefront-link";
import { StorefrontSection } from "@/components/storefront/ui/storefront-section";
import { useStore } from "@/contexts/store-context";
import { catalogQueries } from "@/lib/queries/catalog.queries";
import { useStorefrontSearch } from "@/contexts/storefront-search-context";
import { storefrontQueries } from "@/lib/queries/storefront.queries";
import { isReservedCategoryValue } from "@/lib/storefront/catalog.constants";
import type {
  CatalogAttributeAxis,
  CatalogCategory,
  CatalogPriceBounds,
  CatalogProductsPage,
  CatalogRelease,
} from "@/lib/storefront/catalog.queries";
import {
  CLEAR_CATALOG_FILTERS_PATCH,
  type CatalogFilters,
  countActiveCatalogFilters,
  countAvailableByCategory,
  getCatalogTitle,
} from "@/lib/utils/util.rental-browse";
import type { RentalPeriodRules } from "@/lib/utils/util.rental-period";

import { CatalogActiveFilters } from "./catalog-active-filters";
import { CatalogEmptyState } from "./catalog-empty-state";
import { CatalogLayout } from "./catalog-layout";
import { CatalogReleaseCard } from "./catalog-release-card";
import { CatalogSidebar } from "./catalog-sidebar";
import { useCatalogParams } from "./use-catalog-params";
import { useCatalogPeriod } from "./use-catalog-period";

/** Placeholder input while the query is disabled; never sent. */
const EMPTY_PERIOD = { startDate: "", endDate: "" };

interface CatalogBrowserProps {
  rules: RentalPeriodRules;
  categories: CatalogCategory[];
  uncategorizedCount: number;
  /** Active products linked to no category, to count the available ones. */
  uncategorizedProductIds: string[];
  /** Every active product of the store, for the "all" row. */
  totalCount: number;
  /** The variant axes the store's units carry, for the sidebar. */
  attributeAxes: CatalogAttributeAxis[];
  /** The range the prices span for the browsed period, for the price filter. */
  priceBounds: CatalogPriceBounds;
  /** The filters the server page answers. */
  filters: CatalogFilters;
  initialPage: CatalogProductsPage;
  /** Fully rented products and when they come back; the block hides when empty. */
  releases: CatalogRelease[];
  initialDataUpdatedAt: number;
}

/**
 * The catalog: a filter rail on the left, the product grid on the right.
 * The URL holds the filters; the search query and the period come from the
 * header, which carries them on every route; availability is fetched once
 * dates are known; pages append under "Charger plus".
 */
export const CatalogBrowser = ({
  rules,
  categories,
  uncategorizedCount,
  uncategorizedProductIds,
  totalCount,
  attributeAxes,
  priceBounds: initialPriceBounds,
  filters: serverFilters,
  initialPage,
  releases,
  initialDataUpdatedAt,
}: CatalogBrowserProps) => {
  const t = useTranslations("storefront");
  const { filters, update } = useCatalogParams(categories);
  const { storeSlug } = useStore();
  const {
    period,
    value: periodValue,
    setPeriod,
  } = useCatalogPeriod({ filters, update, pricingMode: rules.pricingMode });
  const { clear: clearSearch } = useStorefrontSearch();
  const search = filters.search;
  const options = catalogQueries.pages(storeSlug, filters);
  const isInitialQuery =
    hashKey(options.queryKey) === hashKey(catalogQueries.pages(storeSlug, serverFilters).queryKey);
  const query = useInfiniteQuery({
    ...options,
    initialData: isInitialQuery
      ? {
          pages: [{ ...initialPage, priceBounds: initialPriceBounds }],
          pageParams: [null],
        }
      : undefined,
    initialDataUpdatedAt,
  });
  const isPending = query.isPending;
  const priceBounds = query.data?.pages[0]?.priceBounds ?? initialPriceBounds;
  const products = useMemo(() => {
    const byId = new Map<string, CatalogProductsPage["products"][number]>();
    for (const page of query.data?.pages ?? []) {
      for (const product of page.products) byId.set(product.id, product);
    }
    return [...byId.values()];
  }, [query.data]);
  const pages = {
    products,
    totalCount: query.data?.pages[0]?.totalCount ?? 0,
    hasMore: query.hasNextPage,
    isLoadingMore: query.isFetchingNextPage,
    loadMore: () => {
      if (!query.isFetching) void query.fetchNextPage();
    },
  };
  const availabilityByProductId = useProductCardAvailability(pages.products, period);
  // The store-wide answer, for the sidebar's per-category counts; the cards'
  // hook reads the same query, so this costs no extra request.
  const { data: storeAvailability } = useQuery({
    ...storefrontQueries.availability(period ?? EMPTY_PERIOD),
    enabled: period !== null,
  });
  const availableCounts = useMemo(
    () =>
      countAvailableByCategory(
        categories,
        uncategorizedProductIds,
        period && storeAvailability
          ? new Map(
              storeAvailability.products.map((entry) => [entry.productId, entry.availableQuantity]),
            )
          : null,
      ),
    [categories, uncategorizedProductIds, period, storeAvailability],
  );

  const handleShowAll = () => {
    clearSearch();
    update({ ...CLEAR_CATALOG_FILTERS_PATCH, search: null });
  };

  const hidesUnavailable = filters.availableOnly;
  const visibleProducts = pages.products;

  const title = getCatalogTitle(filters.category, categories, {
    catalog: period ? "Доступно на выбранные даты" : "В наличии",
    others: t("availability.categoryBrowse.others"),
  });
  const count = pages.totalCount;
  const trackedCategoryId =
    filters.category && !isReservedCategoryValue(filters.category) ? filters.category : undefined;
  const showCategories = categories.some(
    (category) => category.productCount > 0 && category.productCount < totalCount,
  );
  // Store-wide criteria keep the layout stable while results are filtered.
  const showSidebar = showCategories || attributeAxes.length >= 3;

  const sidebar = (
    <CatalogSidebar
      showCategories={showCategories}
      categories={categories}
      uncategorizedCount={uncategorizedCount}
      totalCount={totalCount}
      availableCounts={availableCounts}
      attributeAxes={attributeAxes}
      priceBounds={priceBounds}
      hasPeriod={period !== null}
      filters={filters}
      update={update}
    />
  );

  return (
    <>
      <PageTracker page="catalog" categoryId={trackedCategoryId} />

      <StorefrontSection spacing="tight" className="pt-8 sm:pt-10">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <form
            role="search"
            className="relative min-w-0 flex-1"
            onSubmit={(event) => {
              event.preventDefault();
              const value = new FormData(event.currentTarget).get("search");
              const term = typeof value === "string" ? value.trim() : "";
              update({ search: term || null });
            }}
          >
            <SearchIcon
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <input
              key={search}
              name="search"
              type="search"
              defaultValue={search}
              aria-label="Поиск по каталогу"
              placeholder="Поиск по названию или модели..."
              className="h-12 w-full rounded-lg border bg-card pr-4 pl-11 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </form>
          <div className="shrink-0">
            <RentalPeriodPicker
              layout="inline"
              value={periodValue}
              onChange={setPeriod}
              rules={rules}
            />
          </div>
        </div>
      </StorefrontSection>

      <CatalogLayout
        title={title}
        count={count}
        totalCount={totalCount}
        showSidebar={showSidebar}
        sidebar={sidebar}
        activeCount={countActiveCatalogFilters(filters)}
        sort={filters.sort}
        onSortChange={(sort) => update({ sort })}
        activeFilters={
          <CatalogActiveFilters
            filters={filters}
            categories={categories}
            attributeAxes={attributeAxes}
            priceBounds={priceBounds}
            update={update}
          />
        }
      >
        <div
          className={cn(
            "flex flex-col gap-6 motion-safe:transition-opacity motion-safe:duration-200",
            isPending && "opacity-60",
          )}
          aria-busy={isPending || undefined}
        >
          {query.isError ? (
            <div role="alert" className="flex items-center gap-3 rounded-xl border p-4">
              <p className="text-sm text-muted-foreground">{t("error.title")}</p>
              <Button
                variant="outline"
                onClick={() =>
                  void (query.isFetchNextPageError ? query.fetchNextPage() : query.refetch())
                }
              >
                {t("error.retry")}
              </Button>
            </div>
          ) : null}
          {visibleProducts.length === 0 ? (
            isPending ? (
              <ProductGridSkeleton />
            ) : query.isError ? null : totalCount === 0 ? (
              <div
                data-slot="catalog-no-products"
                className="flex min-h-32 flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-card p-6 text-center"
              >
                <PackageIcon aria-hidden className="size-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Позиции появятся здесь после публикации
                </p>
                <StorefrontLink
                  href="/contact"
                  className="inline-flex h-10 items-center rounded-sm bg-foreground px-5 text-sm font-semibold text-background"
                >
                  Связаться
                </StorefrontLink>
              </div>
            ) : (
              <CatalogEmptyState
                search={search}
                onShowAll={handleShowAll}
                onShowUnavailable={
                  hidesUnavailable ? () => update({ availableOnly: false }) : undefined
                }
                period={periodValue}
                onPeriodChange={setPeriod}
                rules={rules}
              />
            )
          ) : (
            <ProductGrid
              products={visibleProducts}
              period={period}
              availabilityByProductId={availabilityByProductId}
              variant="catalog"
            />
          )}

          {pages.hasMore && !isPending ? (
            <Button
              variant="outline"
              onClick={pages.loadMore}
              disabled={pages.isLoadingMore}
              className="h-12 w-full self-center lg:h-10 lg:w-auto lg:min-w-48"
            >
              {t("catalog.loadMore")}
            </Button>
          ) : null}
        </div>
        {releases.length > 0 ? (
          <section
            aria-labelledby="catalog-releases-title"
            className="dark flex flex-col gap-5 text-foreground"
          >
            <div>
              <h2
                id="catalog-releases-title"
                className="font-display text-2xl font-black uppercase sm:text-3xl"
              >
                Скоро освобождаются
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Оборудование, которое будет доступно в ближайшее время
              </p>
            </div>
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {releases.map((release) => (
                <li key={release.id} className="flex">
                  <CatalogReleaseCard release={release} timeZone={rules.timezone} />
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </CatalogLayout>
    </>
  );
};
