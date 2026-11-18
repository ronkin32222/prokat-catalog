/**
 * Russian tax and registry numbers: the control-digit rules of ФНС.
 * Pure functions, shared by the form (instant hint) and the server (refusal).
 */

const digitsOf = (value: string): number[] => value.split("").map(Number);

const sumWith = (digits: number[], weights: number[]): number =>
  weights.reduce((sum, weight, index) => sum + weight * digits[index], 0);

/** Control digit: (sum mod 11) mod 10, the ФНС rule for ИНН. */
const innControl = (digits: number[], weights: number[]): number =>
  (sumWith(digits, weights) % 11) % 10;

const INN10_WEIGHTS = [2, 4, 10, 3, 5, 9, 4, 6, 8];
const INN12_WEIGHTS_1 = [7, 2, 4, 10, 3, 5, 9, 4, 6, 8];
const INN12_WEIGHTS_2 = [3, 7, 2, 4, 10, 3, 5, 9, 4, 6, 8];

/** ИНН: 10 digits (organization) or 12 (person, sole trader), both with checksums. */
export const isValidInn = (value: string): boolean => {
  if (!/^\d{10}$|^\d{12}$/.test(value)) return false;
  const digits = digitsOf(value);
  if (value.length === 10) {
    return innControl(digits, INN10_WEIGHTS) === digits[9];
  }
  return (
    innControl(digits, INN12_WEIGHTS_1) === digits[10] &&
    innControl(digits, INN12_WEIGHTS_2) === digits[11]
  );
};

/** ОГРН: 13 digits, control = (first 12 mod 11) mod 10. */
export const isValidOgrn = (value: string): boolean => {
  if (!/^\d{13}$/.test(value)) return false;
  const head = Number(value.slice(0, 12));
  return (head % 11) % 10 === Number(value[12]);
};

/** ОГРНИП: 15 digits, control = (first 14 mod 13) mod 10. */
export const isValidOgrnip = (value: string): boolean => {
  if (!/^\d{15}$/.test(value)) return false;
  const head = Number(value.slice(0, 14));
  return (head % 13) % 10 === Number(value[14]);
};

/** Plain-language refusal for an ИНН, or null when it is fine (empty = not asked yet). */
export const innProblem = (value: string): string | null => {
  const trimmed = value.trim();
  if (!trimmed) return "Введите ИНН";
  if (!/^\d+$/.test(trimmed)) return "ИНН состоит только из цифр";
  if (trimmed.length !== 10 && trimmed.length !== 12) {
    return "ИНН должен содержать 10 цифр (организация) или 12 цифр (физлицо, ИП)";
  }
  return isValidInn(trimmed) ? null : "В ИНН опечатка: контрольная цифра не сходится. Проверьте номер";
};

/** Plain-language refusal for an ОГРН (ООО) or ОГРНИП (ИП), or null when fine. */
export const ogrnProblem = (value: string, kind: "ooo" | "ip"): string | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!/^\d+$/.test(trimmed)) return "ОГРН состоит только из цифр";
  if (kind === "ip") {
    if (trimmed.length !== 15) return "ОГРНИП содержит 15 цифр";
    return isValidOgrnip(trimmed) ? null : "В ОГРНИП опечатка: контрольная цифра не сходится";
  }
  if (trimmed.length !== 13) return "ОГРН содержит 13 цифр";
  return isValidOgrn(trimmed) ? null : "В ОГРН опечатка: контрольная цифра не сходится";
};
