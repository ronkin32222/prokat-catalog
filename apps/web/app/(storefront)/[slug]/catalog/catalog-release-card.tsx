"use client";

import { ProductImage } from "@/components/product/product-image";
import { buildProductHref } from "@/components/storefront/product/util.product-card";
import { StorefrontLink } from "@/components/storefront/ui/storefront-link";
import { useFormatMoney } from "@/hooks/use-format-money";
import type { CatalogRelease } from "@/lib/storefront/catalog.queries";

const MONTHS_SHORT = ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];

/** "19 ноя" in the store's own timezone, so the day matches what the store means. */
const formatReleaseDay = (iso: string, timeZone?: string): string => {
  const parts = new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "numeric",
    timeZone,
  }).formatToParts(new Date(iso));
  const day = parts.find((part) => part.type === "day")?.value ?? "";
  const month = Number(parts.find((part) => part.type === "month")?.value);
  return `${day} ${MONTHS_SHORT[month - 1] ?? ""}`.trim();
};

const DAY_MS = 24 * 60 * 60 * 1000;

interface CatalogReleaseCardProps {
  release: CatalogRelease;
  timeZone?: string;
}

/** A dark card for a fully rented product: when it comes back, and a booking for that day. */
export const CatalogReleaseCard = ({ release, timeZone }: CatalogReleaseCardProps) => {
  const formatMoney = useFormatMoney();
  const releaseMs = new Date(release.releaseAt).getTime();
  const href = buildProductHref(release, {
    startDate: new Date(Math.max(releaseMs, Date.now())).toISOString(),
    endDate: new Date(Math.max(releaseMs, Date.now()) + DAY_MS).toISOString(),
  });

  return (
    <article className="flex w-full flex-col overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm">
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <ProductImage
          src={release.images?.[0] || "/demo/tool-placeholder.svg"}
          alt={release.name}
          sizes="(max-width: 767px) 50vw, 33vw"
          inset={false}
          containerClassName="absolute inset-0 rounded-none"
          className="opacity-80 grayscale-[30%]"
        />
        <span className="absolute top-2 left-2 inline-flex items-center gap-1.5 rounded-full bg-background/90 px-2.5 py-1 text-xs font-medium text-foreground shadow-card">
          <span aria-hidden className="size-1.5 rounded-full bg-primary" />
          {releaseMs < Date.now() ? "Ожидается возврат" : `Освободится ${formatReleaseDay(release.releaseAt, timeZone)}`}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="font-display line-clamp-2 text-base leading-tight font-extrabold uppercase">
          {release.name}
        </h3>
        {release.description ? (
          <p className="line-clamp-1 text-xs text-muted-foreground">{release.description}</p>
        ) : null}
        <p className="font-display text-lg font-black">
          {formatMoney(Number(release.price))}
          <span className="ml-1 text-sm font-normal text-muted-foreground">/ сутки</span>
        </p>
        <StorefrontLink
          href={href}
          className="mt-auto inline-flex h-11 items-center justify-center rounded-sm bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Забронировать на дату
        </StorefrontLink>
      </div>
    </article>
  );
};
