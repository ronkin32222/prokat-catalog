import type { ReactNode } from "react";

import { ArrowUpRightIcon } from "lucide-react";

import { HOME_COPY } from "@/components/storefront/home/home-copy";
import { StorefrontLink } from "@/components/storefront/ui/storefront-link";

interface HomeInventoryViewProps {
  kind: "categories" | "products";
  children: ReactNode;
  linkPrefetch?: boolean;
}

/** Light home section with an eyebrow, a big title and a link into the catalog. */
export const HomeInventoryView = ({ kind, children, linkPrefetch }: HomeInventoryViewProps) => {
  const copy = HOME_COPY[kind];
  const titleId = `home-${kind}-title`;

  return (
    <section
      aria-labelledby={titleId}
      className={
        kind === "products"
          ? "light border-t bg-background py-16 text-foreground sm:py-20"
          : "light bg-background py-16 text-foreground sm:py-20"
      }
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-display text-xs font-light tracking-[0.4em] text-muted-foreground uppercase">
              {copy.eyebrow}
            </p>
            <h2
              id={titleId}
              className="mt-3 font-display text-4xl leading-[.95] font-black tracking-[-0.03em] uppercase sm:text-5xl"
            >
              {copy.title}
            </h2>
          </div>
          <StorefrontLink
            href="/catalog"
            prefetch={linkPrefetch}
            className="inline-flex min-h-11 items-center gap-2 border-b border-foreground text-sm font-semibold transition-colors hover:text-primary"
          >
            {copy.action}
            <ArrowUpRightIcon aria-hidden className="size-4" />
          </StorefrontLink>
        </div>
        <div className="mt-10">{children}</div>
      </div>
    </section>
  );
};
