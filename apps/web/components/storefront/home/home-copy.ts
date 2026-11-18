import { HOME_COPY } from "@/lib/site-templates";

export { HOME_COPY, type HomeHeroPerkIcon } from "@/lib/site-templates";

export type HomeHeroPerk = (typeof HOME_COPY.hero.perks)[number];
