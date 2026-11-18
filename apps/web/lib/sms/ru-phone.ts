/**
 * Russian mobile/landline formatting for the public request form. The store
 * front only asks for a Russian number: input is a 10-digit national number
 * (or +7 / 8 prefixed), output is always E.164 `+7XXXXXXXXXX`.
 */
const RU_DIGITS = /^\d{10}$/;
const RU_PREFIXED = /^(?:\+7|7|8)(\d{10})$/;

/** Digits only, without the national trunk/prefix. */
const nationalDigits = (phone: string): string => {
  const digits = phone.replace(/\D/g, "");
  if (RU_PREFIXED.test(digits)) return digits.slice(-10);
  return digits;
};

/** `+7XXXXXXXXXX` or null when the number is not a plausible Russian one. */
export const normalizeRussianPhone = (phone: string): string | null => {
  const digits = nationalDigits(phone);
  return RU_DIGITS.test(digits) ? `+7${digits}` : null;
};

/** True when the value converts to a Russian E.164 number. */
export const isValidRussianPhone = (phone: string): boolean =>
  normalizeRussianPhone(phone) !== null;

const national = (phone: string): string => (normalizeRussianPhone(phone) ?? phone).slice(-10);

/** `+7 (900) 000-00-00` is 18 characters; the input never needs more. */
export const PHONE_MASK_LENGTH = 18;

/** `+7 (900) 000-00-00`, progressively while typing: `+7 (900) 0...` */
export const formatRussianPhone = (phone: string): string => {
  const digits = national(phone).replace(/\D/g, "").slice(0, 10);
  if (digits.length === 0) return "";
  let out = "+7";
  if (digits.length > 0) out += ` (${digits.slice(0, 3)}`;
  if (digits.length >= 3) out += ")";
  if (digits.length > 3) out += ` ${digits.slice(3, 6)}`;
  if (digits.length > 6) out += `-${digits.slice(6, 8)}`;
  if (digits.length > 8) out += `-${digits.slice(8, 10)}`;
  return out;
};
