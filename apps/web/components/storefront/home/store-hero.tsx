import type { ReactNode } from "react";

import {
  ArrowRightIcon,
  BadgeCheckIcon,
  ClockIcon,
  ShieldCheckIcon,
  TruckIcon,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@louez/ui";

import { HOME_COPY, type HomeHeroPerkIcon } from "@/components/storefront/home/home-copy";
import { StorefrontLink } from "@/components/storefront/ui/storefront-link";
import { SharedImage } from "@/components/ui/shared-image";

const PERK_ICONS: Record<HomeHeroPerkIcon, LucideIcon> = {
  shield: ShieldCheckIcon,
  clock: ClockIcon,
  truck: TruckIcon,
  badge: BadgeCheckIcon,
};

/** Faint radial light on the concrete backdrop, shown only when there is no photo. */
const CONCRETE_LIGHT = {
  backgroundImage:
    "radial-gradient(ellipse at 22% 18%, rgb(255 255 255 / 0.07), transparent 55%), radial-gradient(ellipse at 85% 90%, rgb(0 0 0 / 0.55), transparent 60%)",
};

interface StoreHeroProps {
  /** Right-side photo, the first product picture of the store; null shows the concrete backdrop. */
  photo?: string | null;
  /** Small chips above the eyebrow, such as the Google rating. */
  badges?: ReactNode;
  /** Compact content under the perks, such as the period search. */
  children?: ReactNode;
}

/** Dark hero: copy from `home-copy.ts`, photo on the right, perks row under the buttons. */
export const StoreHero = ({ photo, badges, children }: StoreHeroProps) => (
  <section
    className="dark relative isolate overflow-hidden border-b bg-background text-foreground"
    aria-labelledby="store-hero-title"
  >
    {photo ? (
      <>
        <SharedImage
          src={photo}
          alt=""
          fill
          priority
          sizes="(min-width: 1024px) 60vw, 100vw"
          containerClassName="absolute inset-0 rounded-none lg:left-[40%]"
          className="object-cover"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-background/80 lg:bg-transparent lg:bg-[linear-gradient(90deg,var(--background)_34%,transparent_80%)]"
        />
      </>
    ) : (
      <>
        <div aria-hidden className="storefront-concrete absolute inset-0" />
        <div aria-hidden className="absolute inset-0" style={CONCRETE_LIGHT} />
      </>
    )}

    <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col px-4 pt-12 pb-12 sm:px-6 sm:pt-16 lg:min-h-[38rem] lg:justify-center lg:px-8 lg:py-20">
      <div className="max-w-2xl">
        {badges ? <div className="mb-6 flex flex-wrap items-center gap-2">{badges}</div> : null}

        <p className="font-display text-xs font-light tracking-[0.42em] text-primary uppercase sm:text-sm">
          {HOME_COPY.hero.eyebrow}
        </p>
        <h1
          id="store-hero-title"
          className="mt-4 font-display text-[clamp(2.25rem,6vw,4.25rem)] leading-[.95] tracking-[-0.03em] uppercase"
        >
          <span className="block font-black">{HOME_COPY.hero.titleStrong}</span>
          <span className="block font-light">{HOME_COPY.hero.titleLight}</span>
        </h1>
        <p className="mt-6 max-w-xl text-base leading-7 text-foreground/75 sm:text-lg">
          {HOME_COPY.hero.lead}
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button
            render={<StorefrontLink href={HOME_COPY.hero.primaryHref} />}
            size="lg"
            className="min-h-12 rounded-lg px-7 font-semibold"
          >
            {HOME_COPY.hero.primaryCta}
            <ArrowRightIcon aria-hidden className="size-4" />
          </Button>
          <Button
            render={<StorefrontLink href={HOME_COPY.hero.secondaryHref} />}
            size="lg"
            variant="outline"
            className="min-h-12 rounded-lg border-foreground/40 bg-transparent px-7 text-foreground hover:bg-foreground hover:text-background"
          >
            {HOME_COPY.hero.secondaryCta}
          </Button>
        </div>

        <ul className="mt-10 grid grid-cols-2 gap-x-4 gap-y-5 border-t border-foreground/15 pt-6 sm:grid-cols-4">
          {HOME_COPY.hero.perks.map(({ icon, text }) => {
            const Icon = PERK_ICONS[icon];
            return (
              <li
                key={text}
                className="flex items-start gap-2.5 text-xs leading-5 text-foreground/80 sm:text-sm"
              >
                <Icon aria-hidden className="mt-0.5 size-5 shrink-0 text-primary" strokeWidth={1.5} />
                {text}
              </li>
            );
          })}
        </ul>

        {children ? <div className="mt-8">{children}</div> : null}
      </div>
    </div>
  </section>
);
