"use client";

import type { NotificationSettings } from "@louez/types";
import { useTranslations } from "next-intl";
import { SettingsPageShell } from "@/components/dashboard/settings-page-shell";
import { MessengerCards } from "@/app/(dashboard)/dashboard/settings/notifications/messengers-cards";
import { MessengerEventsCard } from "@/app/(dashboard)/dashboard/settings/notifications/messenger-events-card";

export const NotificationsContent = ({ settings }: { settings: NotificationSettings }) => {
  const t = useTranslations("dashboard.settings");

  return (
    <SettingsPageShell
      title={t("notifications.title")}
      description={t("notifications.description")}
    >
      <div className="space-y-6">
        <MessengerCards messengers={settings.messengers} />
        <MessengerEventsCard settings={settings} />
      </div>
    </SettingsPageShell>
  );
};
