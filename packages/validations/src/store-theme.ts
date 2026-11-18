import { SITE_TEMPLATE_IDS } from "@louez/types";
import { z } from "zod";

export const siteTemplateIdSchema = z.enum(SITE_TEMPLATE_IDS);

export const siteContentOverridesSchema = z.object({
  eyebrow: z.string().trim().max(40).optional(),
  titleStrong: z.string().trim().max(30).optional(),
  titleLight: z.string().trim().max(30).optional(),
  lead: z.string().trim().max(220).optional(),
  perks: z
    .tuple([
      z.string().trim().max(60),
      z.string().trim().max(60),
      z.string().trim().max(60),
      z.string().trim().max(60),
    ])
    .optional(),
});
