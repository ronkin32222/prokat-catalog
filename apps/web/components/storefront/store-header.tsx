"use client";

import type { ReactNode } from "react";

import { ArrowLeftIcon, LockIcon, MenuIcon, PhoneIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@louez/utils";

import { CartTrigger } from "@/components/storefront/cart/cart-trigger";
import { HeaderAccountButton } from "@/components/storefront/shell/header-account-button";
import { HeaderSearchCapsule } from "@/components/storefront/shell/header-search-capsule";
import { StoreLogo } from "@/components/storefront/shell/store-logo";
import { StorefrontLink } from "@/components/storefront/ui/storefront-link";
import { useHeaderSearchVisible } from "@/components/storefront/shell/use-header-search-visible";
import { useChromeVariant } from "@/components/storefront/shell/use-chrome-variant";
import { useWindowScrolled } from "@/hooks/use-window-scrolled";
import type { RentalPeriodRules } from "@/lib/utils/util.rental-period";

interface StoreHeaderProps {
  storeName: string;
  logoUrl?: string | null;
  /** Store phone behind a call button; null hides it. */
  phone?: string | null;
  /**
   * The store's own website, when the storefront is the booking module of a
   * larger site: shown as a "back to the website" link before the logo.
   */
  websiteUrl?: string | null;
  /** Initials of the signed-in customer, computed on the server. */
  customerInitials?: string | null;
  customerIdentity?: { firstName: string; lastName: string; email: string } | null;
  /** Store-relative home href; the marketplace keeps its channel param. */
  homeHref?: string;
  homePrefetch?: boolean;
  /** Sales-channel badge next to the logo (marketplace). */
  channelBadge?: ReactNode;
  /** Store rules the period picker validates against. */
  periodRules: RentalPeriodRules;
  showAccount?: boolean;
  /** Disable account prefetching in previews with no live customer routes. */
  accountPrefetch?: boolean;
  showCart?: boolean;
  /** Controlled alternatives for previews that have no live cart or router state. */
  searchControl?: ReactNode;
  cartControl?: ReactNode;
}

/** Shared store navigation. */
export const StoreHeader = ({
  storeName,
  logoUrl,
  phone,
  websiteUrl,
  customerInitials,
  customerIdentity,
  homeHref = "/",
  homePrefetch,
  channelBadge,
  periodRules,
  showAccount = true,
  accountPrefetch,
  showCart = true,
  searchControl,
  cartControl,
}: StoreHeaderProps) => {
  const t = useTranslations("storefront");
  const variant = useChromeVariant();
  const scrolled = useWindowScrolled();
  // The search starts out on the phone everywhere but the home, whose hero
  // already carries the period search.
  const mobileSearchVisible = useHeaderSearchVisible({ showAtTop: variant !== "transparent" });
  const showCapsule = variant !== "compact";
  const showMainMenu = variant === "transparent";
  const menuLinks = [
    ["Главная", "/"],
    ["Каталог", "/catalog"],
    ["Условия", "/terms"],
    ["Контакты", "/contact"],
  ] as const;

  return (
    <header
      data-slot="store-header"
      data-variant={variant}
      className={cn(
        "sticky top-0 z-40 border-b bg-background/95 backdrop-blur transition-colors duration-200",
        scrolled ? "border-border" : "border-transparent",
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div
          className={cn(
            "flex flex-wrap items-center gap-x-2 md:h-18 md:flex-nowrap md:gap-x-3",
            showCapsule ? "py-3 md:py-0" : "h-14 md:h-16",
          )}
        >
          <div className="order-1 flex h-11 min-w-0 items-center gap-2 md:h-auto">
            {websiteUrl ? (
              <a
                href={websiteUrl}
                rel="noopener noreferrer"
                aria-label={t("header.backToWebsite")}
                className="flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none max-md:w-9 max-md:justify-center md:px-3 md:text-sm md:font-medium"
              >
                <ArrowLeftIcon aria-hidden className="size-4" />
                <span className="hidden md:inline">{t("header.backToWebsite")}</span>
              </a>
            ) : null}
            <StoreLogo
              storeName={storeName}
              logoUrl={logoUrl}
              href={homeHref}
              prefetch={homePrefetch}
              className="shrink-0"
            />
            {channelBadge ? <div className="hidden shrink-0 sm:block">{channelBadge}</div> : null}
          </div>

          {variant === "compact" ? (
            <div className="order-2 ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
              <LockIcon aria-hidden className="size-4" />
              <span className="hidden sm:inline">{t("header.secure")}</span>
            </div>
          ) : (
            <>
              {showMainMenu ? (
                <nav
                  aria-label="Основное меню"
                  className="absolute top-1/2 left-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-7 lg:flex"
                >
                  {menuLinks.map(([label, href]) => (
                    <StorefrontLink
                      key={href}
                      href={href}
                      className="text-xs font-medium uppercase transition-colors hover:text-primary"
                    >
                      {label}
                    </StorefrontLink>
                  ))}
                </nav>
              ) : null}
              {showCapsule && !showMainMenu ? (
                <div
                  className={cn(
                    "order-3 grid w-full transition-[grid-template-rows,opacity,visibility] duration-200 ease-out motion-reduce:transition-none md:visible md:absolute md:top-1/2 md:left-1/2 md:block md:max-w-sm md:-translate-x-1/2 md:-translate-y-1/2 md:opacity-100 lg:max-w-xl",
                    mobileSearchVisible
                      ? "visible grid-rows-[1fr] opacity-100"
                      : "invisible grid-rows-[0fr] opacity-0",
                  )}
                >
                  <div className="min-h-0 overflow-hidden md:overflow-visible">
                    <div className="pt-2 md:pt-0">
                      {searchControl ?? (
                        <HeaderSearchCapsule rules={periodRules} className="w-full" />
                      )}
                    </div>
                  </div>
                </div>
              ) : null}
              <nav
                aria-label={t("header.menu")}
                className="order-2 ml-auto flex items-center gap-1 md:order-3"
              >
                {phone ? (
                  <div className="flex items-center gap-3">
                    <a
                      href={`tel:${phone}`}
                      className="hidden text-sm font-semibold tabular-nums hover:text-primary lg:block"
                    >
                      {phone}
                    </a>
                    <a
                      href={`tel:${phone}`}
                      aria-label={t("header.call")}
                      className="flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                    >
                      <PhoneIcon aria-hidden className="size-5" />
                    </a>
                  </div>
                ) : null}
                {showMainMenu ? (
                  <details className="relative lg:hidden">
                    <summary
                      className="flex size-11 cursor-pointer list-none items-center justify-center rounded-sm border [&::-webkit-details-marker]:hidden"
                      aria-label="Открыть меню"
                    >
                      <MenuIcon aria-hidden className="size-5" />
                    </summary>
                    <nav
                      aria-label="Мобильное меню"
                      className="absolute top-13 right-0 flex min-w-52 flex-col border bg-card p-2 shadow-overlay"
                    >
                      {menuLinks.map(([label, href]) => (
                        <StorefrontLink
                          key={href}
                          href={href}
                          className="px-4 py-3 text-sm font-medium uppercase hover:bg-muted hover:text-primary"
                        >
                          {label}
                        </StorefrontLink>
                      ))}
                    </nav>
                  </details>
                ) : null}
                {showCart ? (cartControl ?? <CartTrigger />) : null}
                {showAccount ? (
                  <HeaderAccountButton
                    initials={customerInitials}
                    customer={customerIdentity}
                    prefetch={accountPrefetch}
                  />
                ) : null}
              </nav>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
