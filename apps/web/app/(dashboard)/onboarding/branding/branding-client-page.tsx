"use client";

import { useRouter } from "next/navigation";

import { useStore } from "@tanstack/react-form";
import { useTranslations } from "next-intl";

import { Button, Checkbox, Label, Radio, RadioGroup } from "@louez/ui";
import { cn } from "@louez/utils";

import { SiteTemplatePicker } from "@/components/online-store/site-template-picker";
import { getFieldError } from "@/hooks/form/form-context";

import { OnboardingStepHeader } from "../_components/step-header";
import { ThemeDashboardPreview } from "./theme-dashboard-preview";
import { useBrandingStep } from "./use-branding-step";
const THEME_OPTIONS = [
  { value: "light", label: "themeLight" },
  { value: "dark", label: "themeDark" },
] as const;

export function BrandingClientPage() {
  const router = useRouter();
  const t = useTranslations("onboarding.branding");
  const tCommon = useTranslations("common");
  const {
    form,
    logoPreviewUrl,
    handleLogoSelected,
    handleLogoRemove,
    isUploading,
    isBusy,
    isNavigating,
    createTemplateCategories,
    setCreateTemplateCategories,
  } = useBrandingStep();
  const templateId = useStore(form.store, (state) => state.values.templateId);
  const primaryColor = useStore(form.store, (state) => state.values.primaryColor);
  const content = useStore(form.store, (state) => state.values.content);

  return (
    <>
      <OnboardingStepHeader title={t("title")} description={t("description")} />
      <form.AppForm>
        <form.Form className="space-y-6">
          <form.AppField name="logoUrl">
            {(field) => (
              <field.ImageUpload
                label={t("logo")}
                description={t("logoHelp")}
                uploadLabel={tCommon("upload")}
                removeLabel={tCommon("remove")}
                kind="logo"
                shape="square"
                previewUrl={logoPreviewUrl}
                isUploading={isUploading}
                messages={{
                  invalidType: t("logoError"),
                  tooLarge: t("logoSizeError"),
                }}
                onFileSelected={handleLogoSelected}
                onRemove={handleLogoRemove}
              />
            )}
          </form.AppField>

          <SiteTemplatePicker
            templateId={templateId}
            primaryColor={primaryColor}
            content={content}
            onTemplateChange={(value) => form.setFieldValue("templateId", value)}
            onPrimaryColorChange={(value) => form.setFieldValue("primaryColor", value)}
            onContentChange={(value) => form.setFieldValue("content", value)}
          />

          <Label className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 font-normal">
            <Checkbox
              checked={createTemplateCategories}
              onCheckedChange={setCreateTemplateCategories}
            />
            <span>
              <span className="block text-sm font-medium">Создать категории шаблона</span>
              <span className="mt-0.5 block text-sm text-muted-foreground">
                Уже существующие категории с теми же названиями не дублируются.
              </span>
            </span>
          </Label>

          <form.Field name="theme">
            {(field) => (
              <div className="space-y-2">
                <Label>{t("theme")}</Label>
                <RadioGroup
                  value={field.state.value}
                  onValueChange={(value) => field.handleChange(value as "light" | "dark")}
                  className="grid grid-cols-2 gap-3"
                >
                  {THEME_OPTIONS.map((option) => (
                    <Label
                      key={option.value}
                      className={cn(
                        "bg-muted/50 hover:bg-accent/30 has-data-checked:border-border has-data-checked:bg-muted flex cursor-pointer flex-col gap-0 rounded-xl border border-muted p-1 transition-colors",
                        "has-data-checked:outline-primary has-data-checked:outline-2 ",
                      )}
                    >
                      <Radio value={option.value} className="hidden" />
                      <ThemeDashboardPreview theme={option.value} />
                      <span className="text-sm font-medium p-1.5">{t(option.label)}</span>
                    </Label>
                  ))}
                </RadioGroup>
                {field.state.meta.errors.length > 0 && (
                  <p className="text-destructive text-sm font-medium">
                    {getFieldError(field.state.meta.errors[0])}
                  </p>
                )}
              </div>
            )}
          </form.Field>

          <div className="flex items-center gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.push("/onboarding")}
              disabled={isBusy}
            >
              {tCommon("back")}
            </Button>
            <form.SubscribeButton className="flex-1" disabled={isBusy} isPending={isNavigating}>
              {tCommon("next")}
            </form.SubscribeButton>
          </div>
        </form.Form>
      </form.AppForm>
    </>
  );
}
