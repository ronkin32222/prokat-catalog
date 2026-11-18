"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { revalidateLogic, useStore } from "@tanstack/react-form";

import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, toastManager } from "@louez/ui";
import { BuildingIcon, FileTextIcon, SearchIcon, UsersIcon } from "@louez/ui/icons";

import { FloatingSaveBar } from "@/components/dashboard/floating-save-bar";
import { FormRadioCardGroup } from "@/components/form/form-radio-card-group";
import { RootError } from "@/components/form/root-error";
import { useAppForm } from "@/hooks/form/form";
import {
  ownerProfileInputSchema,
  type OwnerProfileInput,
} from "@/lib/owner-profile/owner-profile-input";
import { innProblem, ogrnProblem } from "@/lib/owner-profile/validators";

import { lookupCompanyByInn, saveOwnerProfile } from "./actions";

/** Same rules as the server; the messages point at the field the owner must fix. */
const formSchema = ownerProfileInputSchema.superRefine((value, ctx) => {
  const innIssue = value.inn ? innProblem(value.inn) : null;
  if (innIssue) ctx.addIssue({ code: "custom", message: innIssue, path: ["inn"] });
  if ((value.kind === "ooo" || value.kind === "ip") && value.ogrn) {
    const ogrnIssue = ogrnProblem(value.ogrn, value.kind === "ip" ? "ip" : "ooo");
    if (ogrnIssue) ctx.addIssue({ code: "custom", message: ogrnIssue, path: ["ogrn"] });
  }
});

export type OwnerProfileFormDefaults = OwnerProfileInput;

interface OwnerProfileFormProps {
  defaults: OwnerProfileFormDefaults;
  /** Whether a DaData key is stored; the key itself is never sent to the browser. */
  hasDadataKey: boolean;
}

const KIND_OPTIONS = [
  { value: "self_employed", label: "Самозанятый", description: "Работаю как самозанятый (НПД)", icon: UsersIcon },
  { value: "ip", label: "ИП", description: "Индивидуальный предприниматель", icon: BuildingIcon },
  { value: "ooo", label: "ООО", description: "Общество с ограниченной ответственностью", icon: BuildingIcon },
  { value: "individual", label: "Физлицо", description: "Сдаю без регистрации как физическое лицо", icon: UsersIcon },
] as const;

export const OwnerProfileForm = ({ defaults, hasDadataKey }: OwnerProfileFormProps) => {
  const router = useRouter();
  const [rootError, setRootError] = useState<string | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);

  const form = useAppForm({
    defaultValues: defaults,
    validators: { onSubmit: formSchema },
    validationLogic: revalidateLogic({ mode: "submit", modeAfterSubmission: "change" }),
    onSubmit: async ({ value }) => {
      setRootError(null);
      const result = await saveOwnerProfile(value);
      if (result.status === "error") {
        setRootError(result.error);
        return;
      }
      toastManager.add({ title: "Сохранено. Документы на сайте обновлены", type: "success" });
      router.refresh();
    },
  });

  const isDirty = useStore(form.store, (state) => state.isDirty);
  const isSubmitting = useStore(form.store, (state) => state.isSubmitting);
  const kind = useStore(form.store, (state) => state.values.kind);
  const isOrganization = kind === "ooo";
  const hasOgrn = kind === "ooo" || kind === "ip";

  /** «Заполнить по ИНН»: fills the fields the registry knows; the owner still checks them. */
  const fillByInn = async () => {
    const inn = form.getFieldValue("inn");
    setIsLookingUp(true);
    setRootError(null);
    const result = await lookupCompanyByInn(inn);
    setIsLookingUp(false);
    if (result.status === "error") {
      setRootError(result.error);
      return;
    }
    const { party } = result;
    if (party.isIndividual) {
      if (party.name) form.setFieldValue("fullName", party.name);
    } else {
      if (party.organizationName) form.setFieldValue("organizationName", party.organizationName);
      if (party.directorName) form.setFieldValue("directorName", party.directorName);
    }
    if (party.ogrn) form.setFieldValue("ogrn", party.ogrn);
    if (party.address) form.setFieldValue("address", party.address);
    toastManager.add({ title: "Данные подставлены из реестра. Проверьте их", type: "success" });
  };

  return (
    <form.AppForm>
      <form.Form className="space-y-4 sm:space-y-6">
        <RootError error={rootError} />

        <Card className="min-w-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UsersIcon className="h-5 w-5 shrink-0" />
              Кто вы
            </CardTitle>
            <CardDescription>
              Это нужно, чтобы документы на сайте были оформлены от вашего имени. Остальное
              подставляется из данных магазина.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form.AppField name="kind">
              {(field) => (
                <FormRadioCardGroup
                  value={field.state.value}
                  onChange={(next) => field.handleChange(next)}
                  options={KIND_OPTIONS}
                  label="Ваш статус"
                  columns={2}
                />
              )}
            </form.AppField>

            <div className="grid gap-4 sm:grid-cols-2">
              {isOrganization ? (
                <>
                  <div className="sm:col-span-2">
                    <form.AppField name="organizationName">
                      {(field) => (
                        <field.Input
                          label="Полное наименование организации"
                          description="Как в учредительных документах, например ООО «Ромашка»"
                        />
                      )}
                    </form.AppField>
                  </div>
                  <form.AppField name="directorName">
                    {(field) => (
                      <field.Input
                        label="ФИО руководителя"
                        description="Тот, кто подписывает договоры"
                      />
                    )}
                  </form.AppField>
                </>
              ) : (
                <div className="sm:col-span-2">
                  <form.AppField name="fullName">
                    {(field) => (
                      <field.Input
                        label="ФИО"
                        description="Подставлено из вашего аккаунта, при необходимости исправьте"
                      />
                    )}
                  </form.AppField>
                </div>
              )}

              <div className="flex flex-col gap-2 sm:col-span-2 sm:flex-row sm:items-end">
                <div className="min-w-0 flex-1">
                  <form.AppField name="inn">
                    {(field) => (
                      <field.Input
                        label="ИНН"
                        description="10 цифр для организации, 12 для ИП и физлица. Проверяем контрольную сумму сразу"
                        inputMode="numeric"
                        maxLength={12}
                      />
                    )}
                  </form.AppField>
                </div>
                {hasDadataKey ? (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isLookingUp || isSubmitting}
                    onClick={fillByInn}
                  >
                    <SearchIcon data-slot="icon" />
                    {isLookingUp ? "Ищем..." : "Заполнить по ИНН"}
                  </Button>
                ) : null}
              </div>

              {hasOgrn ? (
                <div className="sm:col-span-2">
                  <form.AppField name="ogrn">
                    {(field) => (
                      <field.Input
                        label={kind === "ip" ? "ОГРНИП" : "ОГРН"}
                        description={
                          kind === "ip"
                            ? "15 цифр, указан в выписке ЕГРИП"
                            : "13 цифр, указан в выписке ЕГРЮЛ"
                        }
                        inputMode="numeric"
                        maxLength={15}
                      />
                    )}
                  </form.AppField>
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileTextIcon className="h-5 w-5 shrink-0" />
              Контакты для документов
            </CardTitle>
            <CardDescription>
              Заполнено из магазина. Измените, если в документах нужен другой адрес или телефон.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <form.AppField name="address">
                {(field) => <field.Input label="Адрес (юридический или почтовый)" />}
              </form.AppField>
            </div>
            <form.AppField name="phone">
              {(field) => <field.Input label="Телефон" type="tel" inputMode="tel" placeholder="+7" />}
            </form.AppField>
            <form.AppField name="email">
              {(field) => <field.Input label="Email" type="email" inputMode="email" />}
            </form.AppField>
            <div className="sm:col-span-2">
              <form.AppField name="siteUrl">
                {(field) => <field.Input label="Сайт" description="Адрес вашего магазина" />}
              </form.AppField>
            </div>
          </CardContent>
        </Card>

        <details className="rounded-xl border bg-card p-4">
          <summary className="cursor-pointer text-sm font-medium">Дополнительно: банк и ответственный за персональные данные</summary>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <form.AppField name="bankName">
                {(field) => <field.Input label="Банк" description="Нужен только для реквизитов в договоре" />}
              </form.AppField>
            </div>
            <form.AppField name="bik">
              {(field) => <field.Input label="БИК" inputMode="numeric" maxLength={9} />}
            </form.AppField>
            <form.AppField name="account">
              {(field) => <field.Input label="Расчётный счёт (р/с)" inputMode="numeric" maxLength={20} />}
            </form.AppField>
            <form.AppField name="corrAccount">
              {(field) => <field.Input label="Корреспондентский счёт (к/с)" inputMode="numeric" maxLength={20} />}
            </form.AppField>
            <form.AppField name="controllerName">
              {(field) => (
                <field.Input
                  label="Ответственный за персональные данные"
                  description="По умолчанию вы сами"
                />
              )}
            </form.AppField>
            <form.AppField name="controllerEmail">
              {(field) => (
                <field.Input
                  label="Email для запросов о персональных данных"
                  description="Сюда клиенты пишут, если хотят узнать или удалить свои данные"
                  type="email"
                />
              )}
            </form.AppField>
          </div>
        </details>

        <FloatingSaveBar
          isDirty={isDirty}
          isLoading={isSubmitting}
          onReset={() => form.reset()}
        />
      </form.Form>
    </form.AppForm>
  );
};
