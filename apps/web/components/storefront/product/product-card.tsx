"use client";

import { useTranslations } from "next-intl";

import { Badge } from "@louez/ui";
import { CheckIcon } from "@louez/ui/icons";
import { cn } from "@louez/utils";

import { ProductImage } from "@/components/product/product-image";
import { AvailabilityBadge } from "@/components/storefront/availability-badge";
import { Price } from "@/components/storefront/ui/price";
import { StorefrontLink } from "@/components/storefront/ui/storefront-link";
import { useFormatMoney } from "@/hooks/use-format-money";
import type { StorefrontCatalogProduct } from "@/lib/storefront/storefront.types";
import { parseStorefrontDecimal } from "@/lib/utils/util.storefront-product-pricing";

import { QuickAddButton } from "./quick-add-button";
import { useProductCardPricing } from "./use-product-card-pricing";
import {
  type ProductCardAvailability,
  type ProductCardPeriod,
  getStockAvailability,
} from "./util.product-card";

/** Two columns on phones, three from `md`, four from `lg`: the sizes match. */
export const PRODUCT_CARD_IMAGE_SIZES = "(max-width: 767px) 50vw, (max-width: 1023px) 33vw, 25vw";

/** Turns the card into a toggle: picking, not browsing. */
export interface ProductCardSelection {
  selected: boolean;
  onToggle: () => void;
}

interface ProductCardBaseProps {
  product: StorefrontCatalogProduct;
  /** Prices the period total instead of the base rate. */
  period?: ProductCardPeriod | null;
  /** Server availability for the period; stock only when absent. */
  availability?: ProductCardAvailability | null;
  /** Above the fold: the first four cards of a grid. */
  priority?: boolean;
  /** Stable demo slot when the product has no uploaded image. */
  fallbackIndex?: number;
  className?: string;
}

type ProductCardProps = ProductCardBaseProps &
  (
    | {
        /** Store-relative product page link; `StorefrontLink` adds the base path. */
        href: string;
        selection?: never;
        /** Renders the one-tap add bar in the image. Simple products only. */
        onQuickAdd?: () => void;
      }
    | { href?: never; selection: ProductCardSelection; onQuickAdd?: never }
  );

/**
 * The one product card of the storefront, in two moods. Browsing: the title
 * links to the product page and stretches over the whole card, which leaves
 * the quick add free to sit in the image. Picking (an accessory offered
 * after an add): the same card is a toggle that says whether it is selected.
 */
export const ProductCard = ({
  product,
  href,
  selection,
  period,
  availability,
  onQuickAdd,
  priority = false,
  fallbackIndex = 0,
  className,
}: ProductCardProps) => {
  const t = useTranslations("storefront.product");
  const formatMoney = useFormatMoney();
  const pricing = useProductCardPricing(product, period);
  const currentAvailability = availability ?? getStockAvailability(product);
  const isUnavailable =
    currentAvailability !== null &&
    currentAvailability.status !== "available" &&
    currentAvailability.status !== "limited" &&
    currentAvailability.status !== "in_cart";
  const shownAvailability: ProductCardAvailability = currentAvailability ?? {
    status: "available",
    availableQuantity: null,
  };
  const deposit = parseStorefrontDecimal(product.deposit);

  const shellClassName = cn(
    "relative flex h-full flex-col gap-3 rounded-sm border bg-card text-left outline-none",
    // Browsing: the hairline of the resting card darkens under the pointer.
    // No elevation — the image zoom below is what answers the hover. The ring
    // follows the title link, the only thing here a keyboard can focus.
    !selection && [
      "transition-[border-color,transform] duration-200 ease-out group-hover:-translate-y-1 group-hover:border-primary",
      "has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-ring",
    ],
    // Picking: the card is the button, and it sits in a carousel that clips
    // its edges, so its outline is drawn inside it, by the overlay below.
    selection && "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
  );

  const content = (
    <>
      {/* Inset image: a frame of card around it, its radius concentric with
          the card's own (outer radius = inner radius + padding). */}
      <div className="p-1 pb-0">
        <div className="relative aspect-[4/5] overflow-hidden rounded-md border bg-muted sm:aspect-4/3">
          <ProductImage
            src={product.images?.[0] || `/demo/tool-${(fallbackIndex % 8) + 1}.webp`}
            alt={product.name}
            sizes={PRODUCT_CARD_IMAGE_SIZES}
            priority={priority}
            inset={false}
            containerClassName="absolute inset-0 rounded-none"
            className={cn(
              // The 4/3 frame crops the zoom, so the card itself never moves.
              // `scale` is its own property in Tailwind v4, not part of `transform`.
              "motion-safe:transition-[opacity,scale] motion-safe:duration-300 motion-safe:ease-out motion-safe:group-hover:scale-[1.03]",
              isUnavailable && "opacity-60 grayscale",
            )}
          />
          <div className="pointer-events-none absolute left-2 top-2 flex flex-col items-start gap-1">
            {pricing.promoPercent > 0 && !isUnavailable ? (
              <Badge variant="promo" className="shadow-card">
                -{pricing.promoPercent}%
              </Badge>
            ) : null}
            <AvailabilityBadge
              status={shownAvailability.status}
              availableQuantity={shownAvailability.availableQuantity}
              className="shadow-card"
            />
          </div>
          {selection ? (
            <span
              aria-hidden="true"
              className={cn(
                "absolute right-2 top-2 flex size-6 items-center justify-center rounded-full border bg-background/90 text-transparent shadow-card backdrop-blur transition-colors",
                selection.selected && "border-primary bg-primary text-primary-foreground",
              )}
            >
              <CheckIcon className="size-3.5" />
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 px-4 pb-1">
        <h3 className="font-display line-clamp-2 text-base leading-tight font-extrabold tracking-[-0.01em] uppercase sm:text-lg">
          {href === undefined ? (
            product.name
          ) : (
            // Stretched link: the pseudo-element covers the card, so the whole
            // surface navigates without a button ever nesting inside a link.
            <StorefrontLink
              className="outline-none after:absolute after:inset-0 after:rounded-lg"
              href={href}
              data-demo-target="product-link"
            >
              {product.name}
            </StorefrontLink>
          )}
        </h3>
        <Price
          amount={pricing.amount}
          compareAt={pricing.compareAt}
          per={pricing.per}
          label={pricing.label}
          size="xl"
          tone="primary"
        />
        {deposit != null && deposit > 0 ? (
          <span className="text-xs text-muted-foreground">
            {t("booking.depositHold")}: {formatMoney(deposit)}
          </span>
        ) : null}
      </div>

      {onQuickAdd ? (
        <div className="px-4 pb-4">
          <QuickAddButton label="Заказать" onClick={onQuickAdd} />
        </div>
      ) : null}

      {/* Last child: an inset ring is painted under the children, and the
          image would eat its top edge. */}
      {selection ? (
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-0 rounded-lg ring-inset transition-shadow duration-200",
            selection.selected
              ? "ring-2 ring-primary"
              : "ring-1 ring-border group-hover:ring-foreground/16",
          )}
        />
      ) : null}
    </>
  );

  return (
    <article
      className={cn("group relative", className)}
      data-slot="product-card"
      data-product-id={product.id}
    >
      {href !== undefined ? (
        <div className={shellClassName}>{content}</div>
      ) : (
        <button
          data-demo-target="extra-select"
          aria-pressed={selection?.selected}
          className={cn(shellClassName, "w-full")}
          onClick={selection?.onToggle}
          type="button"
        >
          {content}
        </button>
      )}
    </article>
  );
};
