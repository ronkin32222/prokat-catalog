import { formOptions, revalidateLogic } from "@tanstack/react-form";
import { z } from "zod";

import type { CustomerFieldIssueCode } from "@louez/validations";

import { isValidRussianPhone, normalizeRussianPhone } from "@/lib/sms/ru-phone";

import type { CheckoutFieldsPlan, CheckoutFormValues } from "./checkout.types";
import { getCheckoutFieldIssues } from "./util.checkout-custom-fields";

type CheckoutTranslator = (key: string, values?: Record<string, string | number>) => string;

interface CheckoutValidatorOptions {
  /** Item-scope custom fields this cart asks for its units. */
  fieldsPlan?: CheckoutFieldsPlan;
  /** Wording of a custom field value the shared rules refuse. */
  customFieldIssueMessage?: (code: CustomerFieldIssueCode) => string;
}

export const CHECKOUT_DEFAULT_VALUES: CheckoutFormValues = {
  firstName: "",
  phone: "",
  notes: "",
  email: "",
  itemDetails: {},
};

/**
 * Checkout schema. The return type is widened on purpose: the form and the
 * `withForm` sections must carry the same validator type, and the real schema
 * is only built once the translator and the cart's item fields are known.
 */
export const createCheckoutValidator = (
  t: CheckoutTranslator,
  options: CheckoutValidatorOptions = {},
): z.ZodType<CheckoutFormValues, CheckoutFormValues> =>
  z
    .object({
      firstName: z
        .string()
        .trim()
        .min(2, t("errors.firstNameRequired"))
        .max(100, t("errors.firstNameRequired")),
      phone: z
        .string()
        .min(1, t("errors.phoneRequired"))
        .refine((value) => isValidRussianPhone(value), t("errors.invalidPhone")),
      notes: z.string().max(2000),
      // Optional: an empty value becomes a phone-based placeholder server-side.
      email: z.union([z.literal(""), z.email(t("errors.invalidEmail"))]),
      // Lenient on purpose: a unit only holds the keys the customer touched.
      itemDetails: z.record(
        z.string(),
        z.object({
          participantName: z.string().optional(),
          values: z.record(z.string(), z.string()).optional(),
        }),
      ),
    })
    .superRefine((data, ctx) => {
      if (options.fieldsPlan) {
        for (const issue of getCheckoutFieldIssues(data, options.fieldsPlan)) {
          ctx.addIssue({
            code: "custom",
            message: options.customFieldIssueMessage?.(issue.code) ?? t("errors.required"),
            path: issue.path,
          });
        }
      }
    });

const passthroughTranslator: CheckoutTranslator = (key) => key;

/**
 * Shared form options: the form (`useAppForm`) and every section (`withForm`)
 * spread these so their `form` types line up. The form replaces the
 * validator with the translated one for the cart.
 */
export const checkoutFormOptions = formOptions({
  defaultValues: CHECKOUT_DEFAULT_VALUES,
  validationLogic: revalidateLogic({ mode: "submit", modeAfterSubmission: "change" }),
  validators: {
    onSubmit: createCheckoutValidator(passthroughTranslator),
  },
});

/** The E.164 number the payload sends, from whatever the input holds. */
export const toReservationPhone = (phone: string): string =>
  normalizeRussianPhone(phone) ?? phone.trim();

/**
 * Type-only placeholder for `withForm({ props })`: TanStack reads the value
 * for inference alone, the real props always come from the parent.
 */
export const checkoutStepProps = <TProps extends object>(): TProps => Object.create(null);
