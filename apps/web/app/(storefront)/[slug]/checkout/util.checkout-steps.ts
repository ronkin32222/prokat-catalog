/** Keeps only the string/number params next-intl can interpolate. */
export const sanitizeTranslationParams = (
  params: Record<string, unknown> | undefined,
): Record<string, string | number> => {
  if (!params) return {};

  const cleaned: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string" || typeof value === "number") {
      cleaned[key] = value;
    }
  }
  return cleaned;
};
