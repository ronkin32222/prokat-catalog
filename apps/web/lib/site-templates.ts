import type { SiteContentOverrides, SiteTemplateId, StoreTheme } from "@louez/types";

export type { SiteTemplateId } from "@louez/types";

export type HomeHeroPerkIcon = "shield" | "clock" | "truck" | "badge";

interface SiteTemplateContent {
  eyebrow: string;
  titleStrong: string;
  titleLight: string;
  lead: string;
  perks: [string, string, string, string];
}

export interface SiteTemplate {
  id: SiteTemplateId;
  title: string;
  description: string;
  accent: string;
  defaultContent: SiteTemplateContent;
  suggestedCategories: [string, string, string, string];
}

export const SITE_TEMPLATES = [
  {
    id: "tools",
    title: "Инструмент и оборудование",
    description: "Для строительного инструмента, техники и оборудования.",
    accent: "#E8BE91",
    defaultContent: {
      eyebrow: "АРЕНДА И ПРОКАТ",
      titleStrong: "СТРОИТЕЛЬНЫХ",
      titleLight: "ИНСТРУМЕНТОВ",
      lead: "Профессиональное оборудование для строительства, ремонта и благоустройства. Быстро, удобно, без лишних затрат.",
      perks: [
        "Без залога или минимальный",
        "Выдача за 10 минут",
        "Доставка по городу",
        "Проверенный и обслуживаемый инструмент",
      ],
    },
    suggestedCategories: [
      "Электроинструмент",
      "Строительная техника",
      "Измерительное оборудование",
      "Садовая техника",
    ],
  },
  {
    id: "machinery",
    title: "Спецтехника",
    description: "Для аренды строительной техники и оборудования для объектов.",
    accent: "#E77D46",
    defaultContent: {
      eyebrow: "АРЕНДА СПЕЦТЕХНИКИ",
      titleStrong: "СПЕЦТЕХНИКА",
      titleLight: "ДЛЯ ВАШЕЙ СТРОЙКИ",
      lead: "Экскаваторы, погрузчики, генераторы и другая техника для строительных и хозяйственных работ с регулярным обслуживанием.",
      perks: [
        "Техника с оператором",
        "Подача на объект",
        "Гибкие сроки аренды",
        "Регулярное обслуживание",
      ],
    },
    suggestedCategories: [
      "Земляные работы",
      "Погрузка и подъём",
      "Генераторы и компрессоры",
      "Уплотнение",
    ],
  },
  {
    id: "home-garden",
    title: "Для дома и сада",
    description: "Для бытовой техники, ремонта, уборки и сезонных работ.",
    accent: "#6FAF73",
    defaultContent: {
      eyebrow: "ПРОКАТ ДЛЯ ДОМА",
      titleStrong: "ИНСТРУМЕНТ",
      titleLight: "И САДОВАЯ ТЕХНИКА",
      lead: "Техника для ухода за домом, садом и дачей — для разовых задач и сезонных работ без необходимости покупать своё оборудование.",
      perks: [
        "Простая техника для бытовых задач",
        "Чистое оборудование",
        "Аренда без лишней покупки",
        "Для разовых и сезонных работ",
      ],
    },
    suggestedCategories: ["Садовая техника", "Уборка", "Ремонт дома", "Для дачи"],
  },
  {
    id: "auto",
    title: "Авто и транспорт",
    description: "Для проката автомобилей, фургонов, мототехники и прицепов.",
    accent: "#5B9BD5",
    defaultContent: {
      eyebrow: "АРЕНДА",
      titleStrong: "АВТО",
      titleLight: "И ТРАНСПОРТА",
      lead: "Транспорт для поездок, перевозок и повседневных задач с понятными условиями аренды и выбором подходящего формата.",
      perks: [
        "Подтверждение за 15 минут",
        "Страховка включена",
        "Чистый и проверенный транспорт",
        "Выдача по договору",
      ],
    },
    suggestedCategories: ["Легковые", "Фургоны и грузовые", "Мото и скутеры", "Прицепы"],
  },
  {
    id: "events",
    title: "Мероприятия и праздники",
    description: "Для оборудования, мебели и декора для событий.",
    accent: "#D86A9A",
    defaultContent: {
      eyebrow: "ПРОКАТ ДЛЯ",
      titleStrong: "ПРАЗДНИКОВ",
      titleLight: "И МЕРОПРИЯТИЙ",
      lead: "Звук, свет, мебель, декор и развлечения для камерных встреч, праздников и крупных событий в одном каталоге.",
      perks: [
        "Оборудование для разных форматов",
        "Подбор под площадку",
        "Готовые комплекты",
        "Удобные сроки аренды",
      ],
    },
    suggestedCategories: ["Звук и свет", "Мебель и шатры", "Декор", "Игры и аттракционы"],
  },
  {
    id: "electronics",
    title: "Электроника и фото",
    description: "Для камер, света, звука, дронов и компьютерной техники.",
    accent: "#4DC3C3",
    defaultContent: {
      eyebrow: "ПРОКАТ",
      titleStrong: "ТЕХНИКИ",
      titleLight: "ДЛЯ ТВОРЧЕСТВА",
      lead: "Камеры, объективы, свет, звук и цифровая техника для съёмок, презентаций, трансляций и творческих проектов.",
      perks: [
        "Техника для разных задач",
        "Проверка перед выдачей",
        "Совместимые комплекты",
        "Аксессуары в каталоге",
      ],
    },
    suggestedCategories: ["Камеры и объективы", "Свет и звук", "Дроны", "Компьютеры и экраны"],
  },
  {
    id: "sport",
    title: "Спорт и туризм",
    description: "Для спортивного снаряжения, активного отдыха и путешествий.",
    accent: "#B8D342",
    defaultContent: {
      eyebrow: "ПРОКАТ",
      titleStrong: "СПОРТА",
      titleLight: "И ТУРИЗМА",
      lead: "Снаряжение для прогулок, поездок, кемпинга и сезонных видов спорта — выбирайте комплект под свой маршрут и формат отдыха.",
      perks: [
        "Снаряжение для разных сезонов",
        "Подбор по формату отдыха",
        "Комплекты и аксессуары",
        "Проверка перед выдачей",
      ],
    },
    suggestedCategories: ["Велосипеды", "Туризм и кемпинг", "Зимний спорт", "Водный спорт"],
  },
] as const satisfies readonly SiteTemplate[];

export const getSiteTemplate = (id: string | null | undefined): SiteTemplate =>
  SITE_TEMPLATES.find((template) => template.id === id) ?? SITE_TEMPLATES[0];

const resolveContent = (
  defaults: SiteTemplateContent,
  overrides?: SiteContentOverrides,
): SiteTemplateContent => ({
  eyebrow: overrides?.eyebrow ?? defaults.eyebrow,
  titleStrong: overrides?.titleStrong ?? defaults.titleStrong,
  titleLight: overrides?.titleLight ?? defaults.titleLight,
  lead: overrides?.lead ?? defaults.lead,
  perks: overrides?.perks ?? defaults.perks,
});

const DEFAULT_CONTENT = SITE_TEMPLATES[0].defaultContent;

export const HOME_COPY = {
  hero: {
    ...DEFAULT_CONTENT,
    primaryCta: "Подобрать оборудование",
    primaryHref: "/catalog",
    secondaryCta: "Условия аренды",
    secondaryHref: "/terms",
    perks: DEFAULT_CONTENT.perks.map((text, index) => ({
      icon: (["shield", "clock", "truck", "badge"] as const)[index],
      text,
    })),
  },
  categories: {
    eyebrow: "Категории",
    title: "Весь спектр оборудования",
    action: "Смотреть все категории",
  },
  products: { eyebrow: "Популярное", title: "Актуальные позиции", action: "Весь каталог" },
  emptyProducts: { contactCta: "Связаться", contactHref: "/contact" },
} as const satisfies Record<string, unknown>;

export const resolveHomeCopy = (
  theme: Pick<StoreTheme, "templateId" | "content"> | null | undefined,
) => {
  const content = resolveContent(getSiteTemplate(theme?.templateId).defaultContent, theme?.content);
  return {
    ...HOME_COPY,
    hero: {
      ...HOME_COPY.hero,
      ...content,
      perks: HOME_COPY.hero.perks.map((perk, index) => ({ ...perk, text: content.perks[index] })),
    },
  };
};
