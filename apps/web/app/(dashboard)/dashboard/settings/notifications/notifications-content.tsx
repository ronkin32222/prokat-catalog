"use client";

import type { ComponentProps } from "react";
import { useTranslations } from "next-intl";
import { SettingsPageShell } from "@/components/dashboard/settings-page-shell";
import { NotificationsForm } from "@/app/(dashboard)/dashboard/settings/notifications/notifications-form";
import { MessengerCards } from "@/app/(dashboard)/dashboard/settings/notifications/messengers-cards";

export const NotificationsContent = ({ ...props }: ComponentProps<typeof NotificationsForm>) => {
  const t = useTranslations("dashboard.settings");

  return (
    <SettingsPageShell
      title={t("notifications.title")}
      description={t("notifications.description")}
    >
      <MessengerCards messengers={props.settings.messengers} />
      <NotificationsForm {...props} />
    </SettingsPageShell>
  );
};
