"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Switch, toastManager } from "@louez/ui";
import type { NotificationSettings } from "@louez/types";
import { setMessengerEventEnabled } from "./actions";
import { MESSENGER_EVENT_ITEMS, type MessengerEventKey } from "./messenger-events";

type EventValues = Record<MessengerEventKey, boolean>;

// Как в диспетчере (lib/notifications/dispatcher.ts): без сохранённого значения событие включено.
const initialValues = (settings: NotificationSettings): EventValues =>
  Object.fromEntries(
    MESSENGER_EVENT_ITEMS.map(({ key }) => [key, settings[key].telegram ?? true]),
  ) as EventValues;

export const MessengerEventsCard = ({ settings }: { settings: NotificationSettings }) => {
  const [values, setValues] = useState<EventValues>(() => initialValues(settings));
  const [pending, setPending] = useState<MessengerEventKey | null>(null);

  const handleChange = async (key: MessengerEventKey, enabled: boolean) => {
    setValues((prev) => ({ ...prev, [key]: enabled }));
    setPending(key);
    try {
      const result = await setMessengerEventEnabled(key, enabled);
      if ("error" in result) throw new Error(result.error);
    } catch {
      setValues((prev) => ({ ...prev, [key]: !enabled }));
      toastManager.add({ title: "Не удалось сохранить настройку", type: "error" });
    } finally {
      setPending(null);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle>Какие события присылать в Telegram и MAX</CardTitle>
        <CardDescription>
          Включённые события придут во все подключённые мессенджеры.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="divide-y">
          {MESSENGER_EVENT_ITEMS.map(({ key, label }) => (
            <li key={key} className="flex items-center justify-between gap-4 py-3">
              <span className="text-sm font-medium">{label}</span>
              <Switch
                aria-label={label}
                checked={values[key]}
                disabled={pending === key}
                onCheckedChange={(checked) => handleChange(key, checked)}
              />
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};
