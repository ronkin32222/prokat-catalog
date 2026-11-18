import { redirect } from "next/navigation";
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@louez/ui";
import { SettingsPageShell } from "@/components/dashboard/settings-page-shell";
import { getCurrentStore } from "@/lib/store-context";

// Площадки для России. Подключения пока нет: карточки только показывают, что будет.
const CHANNELS = [
  { name: "Авито" },
  { name: "Юла" },
  { name: "Яндекс Карты" },
  { name: "2ГИС" },
  { name: "ВКонтакте" },
];

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function SalesChannelsPage() {
  const store = await getCurrentStore();
  if (!store) redirect("/onboarding");

  return (
    <SettingsPageShell
      title="Каналы продаж"
      description="Здесь будет автоматическая публикация ваших позиций на площадках. Подключение появится позже."
    >
      <div className="grid gap-4 md:grid-cols-2">
        {CHANNELS.map((channel) => (
          <Card key={channel.name}>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <CardTitle>{channel.name}</CardTitle>
                  <CardDescription>Автоматическая публикация позиций из каталога</CardDescription>
                </div>
                <Badge variant="secondary" size="sm">
                  Скоро
                </Badge>
              </div>
            </CardHeader>
            <CardContent />
          </Card>
        ))}
      </div>
    </SettingsPageShell>
  );
}
