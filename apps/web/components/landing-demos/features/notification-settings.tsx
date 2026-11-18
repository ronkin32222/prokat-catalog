"use client";

import { NotificationsContent } from "@/app/(dashboard)/dashboard/settings/notifications/notifications-content";
import { SettingsSceneFrame } from "@/components/landing-demos/settings-scene-frame";
import type { FeatureSceneProps } from "@/components/landing-demos/feature-demo.types";
import { useDemoLocale } from "@/components/landing-demos/use-demo-locale";
import { createDemoNotificationSettings } from "@/lib/landing-demos/customer-messages";

export const NotificationSettingsScene = ({ period: _period }: FeatureSceneProps) => {
  const locale = useDemoLocale();
  const settings = createDemoNotificationSettings(locale);

  return (
    <SettingsSceneFrame pathname="/dashboard/settings/notifications">
      <NotificationsContent settings={settings.settings} />
    </SettingsSceneFrame>
  );
};
