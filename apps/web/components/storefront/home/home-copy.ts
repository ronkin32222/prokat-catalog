/**
 * Копирайтинг главной страницы магазина. Здесь меняются тексты под другую нишу,
 * разметка их не содержит.
 */

export type HomeHeroPerkIcon = "shield" | "clock" | "truck" | "badge";

export const HOME_COPY = {
  hero: {
    eyebrow: "АРЕНДА И ПРОКАТ",
    titleStrong: "СТРОИТЕЛЬНЫХ",
    titleLight: "ИНСТРУМЕНТОВ",
    lead: "Профессиональное оборудование для строительства, ремонта и благоустройства. Быстро, удобно, без лишних затрат.",
    primaryCta: "Подобрать оборудование",
    primaryHref: "/catalog",
    secondaryCta: "Условия аренды",
    secondaryHref: "/terms",
    perks: [
      { icon: "shield", text: "Без залога или минимальный" },
      { icon: "clock", text: "Выдача за 10 минут" },
      { icon: "truck", text: "Доставка по городу" },
      { icon: "badge", text: "Проверенный и обслуживаемый инструмент" },
    ],
  },
  categories: {
    eyebrow: "Категории",
    title: "Весь спектр оборудования",
    action: "Смотреть все категории",
  },
  products: {
    eyebrow: "Популярное",
    title: "Актуальные позиции",
    action: "Весь каталог",
  },
  emptyProducts: {
    contactCta: "Связаться",
    contactHref: "/contact",
  },
} as const satisfies Record<string, unknown>;

export type HomeHeroPerk = (typeof HOME_COPY.hero.perks)[number];
