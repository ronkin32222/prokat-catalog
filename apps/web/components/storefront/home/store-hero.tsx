import type { ReactNode } from "react";

import { Button } from "@louez/ui";

import { HeroImageSlider } from "@/components/storefront/home/hero-image-slider";
import { RichTextHtml } from "@/components/storefront/ui/rich-text-html";
import { StorefrontLink } from "@/components/storefront/ui/storefront-link";
import type {
  StoreHeroAlign,
  StoreHeroShape,
  StoreHeroVerticalAlign,
} from "@/lib/utils/util.store-hero";

interface StoreHeroProps {
  name: string;
  tagline?: string | null;
  description: string | null;
  backgroundImages?: string[];
  shape: StoreHeroShape;
  align: StoreHeroAlign;
  verticalAlign: StoreHeroVerticalAlign;
  badges?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
}

/** Industrial editorial hero; its identity and photography come from store data. */
export const StoreHero = ({
  name,
  tagline,
  description,
  backgroundImages = [],
  badges,
  children,
  footer,
}: StoreHeroProps) => {
  const images = backgroundImages.length > 0 ? backgroundImages : ["/demo/hero-placeholder.svg"];

  return (
    <section className="relative overflow-hidden border-b" aria-labelledby="store-hero-title">
      <div className="absolute inset-0">
        <HeroImageSlider images={images} className="[&_img]:object-cover" />
        <div
          aria-hidden
          className="absolute inset-0 bg-[linear-gradient(90deg,rgba(20,21,20,.98)_0%,rgba(20,21,20,.82)_46%,rgba(20,21,20,.18)_100%)]"
        />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[38rem] w-full max-w-7xl flex-col justify-center px-4 py-16 sm:px-6 lg:min-h-[42rem] lg:px-8">
        <div className="max-w-3xl">
          <div className="mb-8 flex flex-wrap items-center gap-2">{badges}</div>
          <p className="font-display text-xs font-light tracking-[0.42em] text-primary uppercase sm:text-sm">
            Аренда и прокат
          </p>
          <h1
            id="store-hero-title"
            className="mt-4 font-display text-4xl leading-[.94] tracking-[-0.04em] uppercase sm:text-6xl lg:text-7xl"
          >
            <span className="block font-black">Аренда</span>
            <span className="block font-light">{name}</span>
          </h1>
          <RichTextHtml
            safeHtml={tagline || description || name}
            size="lg"
            className="mt-6 max-w-2xl prose-p:text-foreground/75 prose-strong:text-foreground"
          />
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button
              render={<StorefrontLink href="/catalog" />}
              size="lg"
              className="min-h-12 rounded-lg px-7 font-semibold"
            >
              Подобрать оборудование
            </Button>
            <Button
              render={<StorefrontLink href="/terms" />}
              size="lg"
              variant="outline"
              className="min-h-12 rounded-lg border-foreground/45 bg-transparent px-7 text-foreground hover:bg-foreground hover:text-background"
            >
              Условия аренды
            </Button>
          </div>
          {footer ? <div className="mt-10 border-t border-border pt-6">{footer}</div> : null}
        </div>
      </div>

      {children ? (
        <div className="relative z-20 mx-auto w-full max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
          {children}
        </div>
      ) : null}
    </section>
  );
};
