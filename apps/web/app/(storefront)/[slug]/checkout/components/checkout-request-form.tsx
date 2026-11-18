"use client";

import { Send } from "lucide-react";
import { useTranslations } from "next-intl";

import { useStore } from "@tanstack/react-form";

import { Alert, Button, Checkbox, Separator } from "@louez/ui";
import { cn } from "@louez/utils";

import { CustomerFieldFormInput } from "@/components/storefront/customer-fields/customer-field-form-input";
import { StorefrontLink } from "@/components/storefront/ui/storefront-link";
import { RentalUnitCard } from "@/components/storefront/customer-fields/rental-unit-card";
import { RentalUnitParticipantInput } from "@/components/storefront/customer-fields/rental-unit-participant-input";
import { getFieldError } from "@/hooks/form/form-context";
import { withForm } from "@/hooks/form/form";
import { formatRussianPhone, PHONE_MASK_LENGTH } from "@/lib/sms/ru-phone";

import type { CheckoutFieldsLine } from "../checkout.types";
import type { useCheckoutPromo } from "../hooks/use-checkout-promo";
import type { CheckoutBlockedReason } from "../checkout.types";
import { toItemFieldName, toParticipantFieldName, toUnitKey } from "../util.checkout-custom-fields";
import { checkoutFormOptions, checkoutStepProps } from "../validator.checkout";
import { CheckoutPromoCode } from "./checkout-promo-code";

/** Why the request cannot be sent yet, in words the renter understands. */
const blockedMessage = (reason: CheckoutBlockedReason, noticeMinutes: number): string => {
  switch (reason) {
    case "advanceNotice": {
      const hours = Math.max(1, Math.round(noticeMinutes / 60));
      return `Заявку нужно подать не менее чем за ${hours} ч до начала аренды. Выберите более позднее время.`;
    }
    case "lineNeedsUpdate":
      return "На выбранные даты позиция недоступна. Измените даты или состав заказа.";
    case "resolving":
    case "quoteLoading":
      return "Проверяем наличие, секунду…";
    default:
      return "Заявку пока нельзя отправить. Проверьте даты и позиции.";
  }
};

interface CheckoutRequestFormProps {
  /** Lines asking unit details; one card per rented unit. */
  lines: CheckoutFieldsLine[];
  promo: ReturnType<typeof useCheckoutPromo>;
  hasActivePromoCodes: boolean;
  isSubmitting: boolean;
  /** A refused cart or a missing quote stops the request before it is sent; the reason is told to the visitor. */
  blockedReason: CheckoutBlockedReason | null;
  /** Minimum notice before the start, in minutes (store setting). */
  advanceNoticeMinutes: number;
}

/**
 * The whole public checkout: name, phone, an optional note and e-mail, one
 * "Отправить заявку" button. Nothing is paid here; the manager calls back.
 */
export const CheckoutRequestForm = withForm({
  ...checkoutFormOptions,
  props: checkoutStepProps<CheckoutRequestFormProps>(),
  render: ({ form, lines, promo, hasActivePromoCodes, isSubmitting, blockedReason, advanceNoticeMinutes }) => {
    const isBlocked = blockedReason !== null;
    const t = useTranslations("storefront.checkout");
    const askingLines = lines.filter((line) => line.itemFields.length > 0);
    // Not ticked by default: the request cannot be sent until the customer ticks it.
    const privacyConsent = useStore(form.store, (state) => state.values.privacyConsent);

    return (
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold leading-tight tracking-tight sm:text-2xl">
            {t("steps.contact")}
          </h2>
          <p className="text-sm text-muted-foreground">{t("contactDescription")}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <form.AppField name="firstName">
            {(field) => (
              <field.Input
                label={t("firstName")}
                placeholder={t("firstNamePlaceholder")}
                autoComplete="given-name"
              />
            )}
          </form.AppField>

          <form.AppField name="phone">
            {(field) => (
              <field.Input
                label={t("phone")}
                description={t("phoneHint")}
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                // The field keeps what was typed; only the display is masked.
                value={formatRussianPhone(field.state.value)}
                maxLength={PHONE_MASK_LENGTH}
              />
            )}
          </form.AppField>

          <div className="sm:col-span-2">
            <form.AppField name="email">
              {(field) => (
                <field.Input
                  label={t("email")}
                  description={t("emailHint")}
                  placeholder={t("emailPlaceholder")}
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                />
              )}
            </form.AppField>
          </div>

          <div className="sm:col-span-2">
            <form.AppField name="notes">
              {(field) => (
                <field.Textarea
                  label={t("notes")}
                  placeholder={t("notesPlaceholder")}
                  rows={3}
                />
              )}
            </form.AppField>
          </div>
        </div>

        {askingLines.length > 0 && (
          <>
            <Separator />
            <div className="flex flex-col gap-1">
              <h3 className="text-base font-semibold">{t("customFields.detailsTitle")}</h3>
              <p className="text-sm text-muted-foreground">{t("customFields.detailsIntro")}</p>
            </div>
            {askingLines.flatMap((line) =>
              Array.from({ length: line.quantity }, (_, unitIndex) => {
                const unitKey = toUnitKey(line.lineId, unitIndex);
                return (
                  <RentalUnitCard
                    key={unitKey}
                    productName={line.productName}
                    productImage={line.productImage}
                    unitIndex={unitIndex}
                    quantity={line.quantity}
                  >
                    <div className="grid items-start gap-3 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <form.AppField name={toParticipantFieldName(unitKey)}>
                          {() => <RentalUnitParticipantInput />}
                        </form.AppField>
                      </div>
                      {line.itemFields.map((field) => (
                        <div
                          key={field.id}
                          className={cn("min-w-0", field.width === "full" && "sm:col-span-2")}
                        >
                          <form.AppField name={toItemFieldName(unitKey, field.id)}>
                            {() => <CustomerFieldFormInput field={field} />}
                          </form.AppField>
                        </div>
                      ))}
                    </div>
                  </RentalUnitCard>
                );
              }),
            )}
          </>
        )}

        {hasActivePromoCodes && (
          <CheckoutPromoCode
            promo={promo.promo}
            discountAmount={promo.discountAmount}
            isValidating={promo.isValidating}
            validationError={promo.validationError}
            onValidate={promo.validate}
            onRemove={promo.remove}
            onClearError={promo.clearError}
          />
        )}

        <form.AppField name="privacyConsent">
          {(field) => (
            <div className="flex flex-col gap-1">
              <label className="flex cursor-pointer items-start gap-3 text-sm leading-snug">
                <Checkbox
                  className="mt-0.5"
                  checked={field.state.value}
                  onCheckedChange={(checked) => field.handleChange(checked === true)}
                />
                <span>
                  Я даю согласие на обработку персональных данных и принимаю{" "}
                  <StorefrontLink
                    prefetch={false}
                    href="/legal"
                    target="_blank"
                    className="font-medium underline underline-offset-4"
                  >
                    Политику обработки ПД
                  </StorefrontLink>{" "}
                  и{" "}
                  <StorefrontLink
                    prefetch={false}
                    href="/terms"
                    target="_blank"
                    className="font-medium underline underline-offset-4"
                  >
                    условия аренды
                  </StorefrontLink>
                  .
                </span>
              </label>
              {field.state.meta.errors.length > 0 ? (
                <p className="text-destructive text-sm">{getFieldError(field.state.meta.errors[0])}</p>
              ) : null}
            </div>
          )}
        </form.AppField>

        <Alert>
          <p>{t("managerCallback")}</p>
        </Alert>

        {blockedReason ? (<p role="alert" className="text-destructive text-sm">{blockedMessage(blockedReason, advanceNoticeMinutes)}</p>) : null}

        <Button
          type="submit"
          size="lg"
          className="h-12 w-full sm:w-auto sm:min-w-64"
          disabled={isSubmitting || isBlocked || !privacyConsent}
        >
          <Send data-slot="icon" />
          {isSubmitting ? t("processing") : t("submitRequest")}
        </Button>
      </div>
    );
  },
});

/** The promo hook's shape, so the request form takes exactly what its parent has. */
export type CheckoutRequestPromo = ReturnType<typeof useCheckoutPromo>;
