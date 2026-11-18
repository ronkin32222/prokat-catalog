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

/**
 * National digits of what the user sees or pastes. The masked display itself
 * (`+7 (9`) comes back through here on every keystroke, so a leading country
 * code `7` / `8` is dropped only when it is a prefix (a `+`, or more than ten
 * digits), never when it is the first digit of the national number.
 */
const toNationalDigits = (value: string): string => {
  let digits = value.replace(/\D/g, "");
  // Typed key by key, `+7…` / `8…` arrive as a lone 7 / 8 (the mask wipes the `+`), and no
  // Russian mobile or city number starts with 7 or 8, so a leading 7 / 8 is the prefix.
  // shortcut: a toll-free 8-800 number typed without a prefix loses its 8; use +7 800….
  if (digits[0] === "7" || digits[0] === "8") digits = digits.slice(1);
  return digits.slice(0, 10);
};

/** `+7 (900) 000-00-00` is 18 characters; the input never needs more. */
export const PHONE_MASK_LENGTH = 18;

/**
 * `+7 (900) 000-00-00`, progressively while typing. A separator appears only
 * once a digit follows it, so Backspace can always remove the last character.
 */
export const formatRussianPhone = (phone: string): string => {
  const digits = toNationalDigits(phone);
  if (digits.length === 0) return "";
  let out = `+7 (${digits.slice(0, 3)}`;
  if (digits.length > 3) out += `) ${digits.slice(3, 6)}`;
  if (digits.length > 6) out += `-${digits.slice(6, 8)}`;
  if (digits.length > 8) out += `-${digits.slice(8, 10)}`;
  return out;
};
