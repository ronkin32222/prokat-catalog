import type { ReactNode } from "react";

import {
  CheckCircle2Icon,
  DrillIcon,
  HammerIcon,
  HardHatIcon,
  PaintbrushIcon,
  RulerIcon,
  WrenchIcon,
} from "lucide-react";

import { Button } from "@louez/ui";

import { HeroImageSlider } from "@/components/storefront/home/hero-image-slider";
import { RichTextHtml } from "@/components/storefront/ui/rich-text-html";
import { StorefrontLink } from "@/components/storefront/ui/storefront-link";
import type {
  StoreHeroAlign,
  StoreHeroShape,
  StoreHeroVerticalAlign,
} from "@/lib/utils/util.store-hero";

interface StoreHeroCategory {
  name: string;
  href: string;
}

interface StoreHeroProps {
  name: string;
  tagline?: string | null;
  description: string | null;
  backgroundImages?: string[];
  shape: StoreHeroShape;
  align: StoreHeroAlign;
  verticalAlign: StoreHeroVerticalAlign;
  categories?: StoreHeroCategory[];
  badges?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
}

const CATEGORY_ICONS = [DrillIcon, HammerIcon, RulerIcon, WrenchIcon, PaintbrushIcon, HardHatIcon];
const DEFAULT_CATEGORIES: StoreHeroCategory[] = [
  { name: "Шуруповёрты", href: "/catalog" },
  { name: "Перфораторы", href: "/catalog" },
  { name: "Пилы", href: "/catalog" },
  { name: "Шлифмашины", href: "/catalog" },
  { name: "Лобзики", href: "/catalog" },
  { name: "Оснастка", href: "/catalog" },
];

/** Tool-rental hero based on the reference layout; tenant data remains in the live slots. */
export const StoreHero = ({
  name,
  tagline,
  description,
  backgroundImages = [],
  categories = [],
  badges,
  children,
  footer,
}: StoreHeroProps) => {
  const images = backgroundImages.length > 0 ? backgroundImages : ["/demo/hero-drill.webp"];
  const shownCategories = categories.length > 0 ? categories : DEFAULT_CATEGORIES;

  return (
    <section
      className="relative overflow-hidden border-b bg-background"
      aria-labelledby="store-hero-title"
    >
      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[15rem_minmax(0,1fr)] lg:px-8 lg:py-10">
        <nav aria-label="Категории инструмента" className="min-w-0">
          <ul className="flex snap-x gap-2 overflow-x-auto pb-2 lg:flex-col lg:gap-0 lg:overflow-visible lg:rounded-sm lg:border lg:bg-card lg:pb-0">
            {shownCategories.slice(0, 6).map((category, index) => {
              const Icon = CATEGORY_ICONS[index % CATEGORY_ICONS.length];
              return (
                <li
                  key={`${category.href}-${category.name}`}
                  className="shrink-0 lg:border-b lg:last:border-b-0"
                >
                  <StorefrontLink
                    href={category.href}
                    className="flex min-h-12 items-center gap-3 border bg-card px-4 text-xs font-medium uppercase transition-colors hover:border-primary hover:text-primary lg:border-0"
                  >
                    <Icon aria-hidden className="size-5 shrink-0 text-primary" strokeWidth={1.5} />
                    {category.name}
                  </StorefrontLink>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="storefront-concrete relative grid min-h-[36rem] overflow-hidden rounded-sm border lg:grid-cols-[minmax(0,1.05fr)_minmax(18rem,.95fr)]">
          <div className="relative z-20 flex max-w-2xl flex-col justify-center gap-5 px-6 py-12 sm:px-10 lg:px-12">
            <div className="flex flex-wrap items-center gap-2">{badges}</div>
            <p className="font-display text-sm font-light tracking-[0.04em] text-primary uppercase sm:text-base">
              Аренда и прокат
            </p>
            <h1
              id="store-hero-title"
              className="font-display text-balance text-4xl leading-[1.05] font-black tracking-[-0.01em] uppercase sm:text-5xl xl:text-6xl"
            >
              Строительных инструментов
            </h1>
            <RichTextHtml
              safeHtml={tagline || description || name}
              size="lg"
              className="max-w-xl prose-p:text-foreground/75 prose-strong:text-foreground"
            />
            <ul className="space-y-2 text-sm text-foreground/85">
              <li className="flex items-center gap-2">
                <CheckCircle2Icon
                  aria-hidden
                  className="size-5 shrink-0 fill-primary text-primary-foreground"
                />
                Проверенный инструмент, готовый к работе
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2Icon
                  aria-hidden
                  className="size-5 shrink-0 fill-primary text-primary-foreground"
                />
                Быстрая выдача и понятные условия аренды
              </li>
            </ul>
            <Button
              render={<StorefrontLink href="/catalog" />}
              size="lg"
              className="w-fit rounded-sm px-7 font-semibold uppercase"
            >
              Смотреть каталог
            </Button>
            {footer}
          </div>

          <div className="relative min-h-72 overflow-hidden sm:min-h-96 lg:min-h-full">
            <div
              aria-hidden
              className="absolute inset-0 z-10 bg-[linear-gradient(90deg,rgba(0,0,0,.85),rgba(0,0,0,.35)_60%,rgba(0,0,0,.1))] lg:-left-24"
            />
            <div
              aria-hidden
              className="absolute inset-x-[12%] bottom-[7%] z-10 h-16 rounded-[50%] bg-primary/25 blur-2xl"
            />
            <HeroImageSlider
              images={images}
              className="transition-transform duration-500 motion-safe:[transform:perspective(900px)_rotateY(-6deg)] motion-safe:hover:[transform:perspective(900px)_rotateY(0deg)] [&_img]:object-contain [&_img]:drop-shadow-[0_24px_32px_rgba(0,0,0,.6)]"
            />
          </div>
        </div>

        {children ? <div className="lg:col-start-2">{children}</div> : null}
      </div>
    </section>
  );
};
