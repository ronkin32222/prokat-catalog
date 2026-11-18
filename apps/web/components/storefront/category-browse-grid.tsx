"use client";

import type { ReactNode } from "react";

import { useTranslations } from "next-intl";

import { ArrowUpRightIcon, LayersIcon, ProductIcon, TagIcon } from "@louez/ui/icons";
import { cn } from "@louez/utils";

import { StorefrontLink } from "@/components/storefront/ui/storefront-link";
import { SharedImage } from "@/components/ui/shared-image";

/** Reserved `?category=` values, so "browse everything" and "no category" stay
 * distinguishable from "nothing picked yet" (no param at all). */
export const ALL_CATEGORIES_VALUE = "all";
export const UNCATEGORIZED_CATEGORY_VALUE = "uncategorized";

export interface CategoryBrowseEntry {
  /** A category id, or one of the reserved values above. */
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  /** Products in this bucket that can be booked for the selected dates. */
  availableCount: number;
  /** Products in this bucket, availability aside. Shown while availability loads. */
  totalCount: number;
  variant: "category" | "uncategorized" | "all";
  /**
   * Store-relative catalog link. When set the tile is a real link
   * (crawlable, middle-clickable); otherwise it is a button firing `onSelect`.
   */
  href?: string;
}

interface CategoryBrowseGridProps {
  entries: CategoryBrowseEntry[];
  /** While true the cards show the total count instead of the available count. */
  isAvailabilityLoading: boolean;
  /**
   * Surfaces without selected dates (the homepage) have no availability to
   * report at all, so the cards advertise the bucket size permanently.
   */
  showTotalsOnly?: boolean;
  /** The grid owns its heading by default; pass false when the host section already has one. */
  showTitle?: boolean;
  /** Client-side selection, for entries without an `href`. */
  onSelect?: (categoryId: string) => void;
  /** `showcase`: dark photo tiles in four columns, number and name only (the home page). */
  variant?: "default" | "showcase";
  className?: string;
}

const VARIANT_ICON = {
  category: LayersIcon,
  uncategorized: TagIcon,
  all: ProductIcon,
} as const;

/** Same surface as a product card: inset image, hairline that darkens, image zoom. */
const tileClassName =
  "dark group flex h-full w-full flex-col gap-2 overflow-hidden rounded-lg border bg-card text-left text-card-foreground outline-none transition-transform duration-200 hover:-translate-y-1 focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none";

const showcaseTileClassName =
  "dark group relative flex aspect-4/5 w-full overflow-hidden rounded-lg border bg-card text-card-foreground outline-none transition-transform duration-200 hover:-translate-y-1 focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none";

interface CategoryTileProps {
  entry: CategoryBrowseEntry;
  onSelect?: (categoryId: string) => void;
  className?: string;
  children: ReactNode;
}

const CategoryTile = ({ entry, onSelect, className = tileClassName, children }: CategoryTileProps) =>
  entry.href ? (
    <StorefrontLink href={entry.href} className={className}>
      {children}
    </StorefrontLink>
  ) : (
    <button type="button" onClick={() => onSelect?.(entry.id)} className={className}>
      {children}
    </button>
  );

/**
 * Category tiles: image or icon, name, product count. Each tile is a link
 * when the entry carries an `href` (home page) or a button when the host
 * filters in place (catalog).
 */
export const CategoryBrowseGrid = ({
  entries,
  isAvailabilityLoading,
  showTotalsOnly = false,
  showTitle = true,
  onSelect,
  variant = "default",
  className,
}: CategoryBrowseGridProps) => {
  const t = useTranslations("storefront.availability");

  if (entries.length === 0) return null;

  if (variant === "showcase") {
    return (
      <ul
        className={cn("grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4", className)}
        data-slot="category-browse-grid"
      >
        {entries.map((entry, index) => {
          const Icon = VARIANT_ICON[entry.variant];
          return (
            <li key={entry.id} className="flex">
              <CategoryTile entry={entry} onSelect={onSelect} className={showcaseTileClassName}>
                {entry.imageUrl ? (
                  <>
                    <SharedImage
                      src={entry.imageUrl}
                      alt=""
                      fill
                      sizes="(max-width: 1023px) 50vw, 25vw"
                      fallbackIcon={Icon}
                      containerClassName="absolute inset-0 rounded-none"
                      className="object-cover motion-safe:transition-[scale] motion-safe:duration-[400ms] motion-safe:ease-out motion-safe:group-hover:scale-[1.04]"
                    />
                    <div
                      aria-hidden
                      className="absolute inset-0 bg-gradient-to-t from-background via-background/35 to-transparent"
                    />
                  </>
                ) : null}
                <span
                  aria-hidden
                  className="absolute top-4 left-4 font-display text-3xl font-light text-foreground/85"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-3">
                  <h3 className="line-clamp-2 font-display text-sm font-extrabold uppercase sm:text-base">
                    {entry.name}
                  </h3>
                  <ArrowUpRightIcon aria-hidden className="size-5 shrink-0 text-primary" />
                </div>
              </CategoryTile>
            </li>
          );
        })}
      </ul>
    );
  }

  const showTotals = showTotalsOnly || isAvailabilityLoading;

  return (
    <div className={cn("flex flex-col gap-3", className)} data-slot="category-browse-grid">
      {showTitle ? (
        <h2 className="text-lg font-semibold leading-snug">{t("categoryBrowse.title")}</h2>
      ) : null}

      <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
        {entries.map((entry, index) => {
          const Icon = VARIANT_ICON[entry.variant];
          const isAll = entry.variant === "all";
          const countLabel = showTotals
            ? t("productCountPlural", { count: entry.totalCount })
            : t("categoryBrowse.availableCount", { count: entry.availableCount });

          return (
            <li key={entry.id} className="flex">
              <CategoryTile entry={entry} onSelect={onSelect}>
                {/* Inset image, as on the product card: the frame's radius is
                    concentric with the tile's (outer = inner + padding). */}
                <div className="relative aspect-4/3 overflow-hidden bg-muted">
                  {entry.imageUrl ? (
                    <SharedImage
                      src={entry.imageUrl}
                      alt=""
                      fill
                      sizes="(max-width: 767px) 50vw, (max-width: 1023px) 33vw, 25vw"
                      fallbackIcon={Icon}
                      containerClassName="absolute inset-0 rounded-none"
                      // `scale` is its own property in Tailwind v4, not part of `transform`.
                      className="object-cover motion-safe:transition-[opacity,scale] motion-safe:duration-[400ms] motion-safe:ease-out motion-safe:group-hover:scale-[1.04]"
                    />
                  ) : (
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 flex items-center justify-center text-muted-foreground"
                    >
                      <Icon className="size-8" />
                    </div>
                  )}
                </div>

                <div className="flex flex-1 flex-col gap-2 p-4">
                  <span className="font-display text-3xl font-light text-muted-foreground">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="flex items-start justify-between gap-3">
                    <h3
                      className={cn(
                        "line-clamp-2 font-display text-sm font-extrabold uppercase sm:text-base",
                        isAll && "font-semibold",
                      )}
                    >
                      {entry.name}
                    </h3>
                    <ArrowUpRightIcon aria-hidden className="size-5 shrink-0 text-primary" />
                  </div>
                  {entry.description ? (
                    <p className="line-clamp-1 text-xs text-muted-foreground">
                      {entry.description}
                    </p>
                  ) : null}
                  <p
                    className={cn(
                      "text-xs tabular-nums",
                      showTotals ? "text-muted-foreground" : "font-medium text-success",
                    )}
                  >
                    {countLabel}
                  </p>
                </div>
              </CategoryTile>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
