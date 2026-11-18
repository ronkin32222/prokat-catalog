"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, Power, Search, Send } from "lucide-react";
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, toastManager } from "@louez/ui";
import type { NotificationSettings } from "@louez/types";
import type { TelegramChatInfo } from "@/lib/notifications/messengers";
import {
  connectMessenger,
  disconnectMessenger,
  findTelegramChatId,
  sendTestMessengerMessage,
  type MessengerKind,
} from "./actions";

type MessengerConfig = NonNullable<NotificationSettings["messengers"]>[MessengerKind];

const CARD_COPY: Record<MessengerKind, { title: string; description: string; icon: typeof Send }> = {
  telegram: {
    title: "Telegram",
    description: "Заявки и оплаты придут в Telegram-чат владельца.",
    icon: Send,
  },
  max: {
    title: "MAX",
    description: "Заявки и оплаты придут в чат бота MAX.",
    icon: MessageSquare,
  },
};

const TOKEN_HINT = "Создайте бота у @BotFather (Telegram) или в кабинете MAX для партнёров, вставьте токен.";

/** Ошибки серверных действий: ключи вида errors.* показываем общим текстом. */
const errorText = (error: string) =>
  error.startsWith("errors.") ? "Недостаточно прав или сервис недоступен" : error;

type Busy = "connect" | "find" | "test" | "disconnect" | null;

/** Вызывает действие, показывает ошибку тостом; вернёт результат только при успехе. */
async function runAction<T extends object>(fn: () => Promise<T>): Promise<T | null> {
  try {
    const result = await fn();
    const error = (result as { error?: string }).error;
    if (error) {
      toastManager.add({ title: errorText(error), type: "error" });
      return null;
    }
    return result;
  } catch {
    toastManager.add({ title: "Не удалось выполнить действие", type: "error" });
    return null;
  }
}

const MessengerCard = ({ kind, config }: { kind: MessengerKind; config?: MessengerConfig }) => {
  const router = useRouter();
  const copy = CARD_COPY[kind];
  const Icon = copy.icon;
  const connected = !!config?.enabled;

  const [token, setToken] = useState("");
  const [chatId, setChatId] = useState(config?.chatId ?? "");
  const [busy, setBusy] = useState<Busy>(null);
  // The chat found by «Найти чат», waiting for the owner to confirm it is theirs.
  const [foundChat, setFoundChat] = useState<TelegramChatInfo | null>(null);

  const withBusy = async <T extends object>(name: Exclude<Busy, null>, fn: () => Promise<T>) => {
    setBusy(name);
    try {
      return await runAction(fn);
    } finally {
      setBusy(null);
    }
  };

  const handleConnect = async () => {
    const result = await withBusy("connect", () => connectMessenger(kind, token, chatId));
    if (!result) return;
    setToken("");
    toastManager.add({ title: `${copy.title} подключён`, type: "success" });
    router.refresh();
  };

  // getUpdates returns the last chat that wrote to the bot, which may be someone else's:
  // the ID goes into the field only after the owner confirms the name shown below.
  const handleFindChat = async () => {
    const result = await withBusy("find", () => findTelegramChatId(token));
    if (!result?.chat) return;
    setFoundChat(result.chat);
  };

  const handleConfirmFoundChat = () => {
    if (!foundChat) return;
    setChatId(foundChat.chatId);
    setFoundChat(null);
    toastManager.add({ title: "ID чата подставлен, подключите бота", type: "success" });
  };

  const handleTest = async () => {
    const result = await withBusy("test", () => sendTestMessengerMessage(kind));
    if (!result) return;
    toastManager.add({ title: "Тестовое сообщение отправлено", type: "success" });
  };

  const handleDisconnect = async () => {
    const result = await withBusy("disconnect", () => disconnectMessenger(kind));
    if (!result) return;
    setChatId("");
    toastManager.add({ title: `${copy.title} отключён`, type: "success" });
    router.refresh();
  };

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <CardTitle className="flex items-center gap-2">
              <Icon className="h-4 w-4 shrink-0" />
              {copy.title}
            </CardTitle>
            <CardDescription>{copy.description}</CardDescription>
          </div>
          <Badge variant={connected ? "success" : "secondary"} size="sm">
            {connected ? "Подключено" : "Не подключено"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="space-y-3">
          {connected && config && (
            <p className="text-xs text-muted-foreground">
              Токен: <span className="font-mono">{config.botToken}</span>
            </p>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Токен бота</label>
            <Input
              type="password"
              autoComplete="off"
              placeholder={connected ? "Новый токен, чтобы заменить" : "Вставьте токен бота"}
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">ID чата</label>
            <div className="flex gap-2">
              <Input
                value={chatId}
                onChange={(e) => setChatId(e.target.value)}
                className="flex-1 text-sm"
              />
              {kind === "telegram" && (
                <Button
                  variant="outline"
                  onClick={handleFindChat}
                  isPending={busy === "find"}
                  disabled={!token.trim() && !connected}
                >
                  <Search className="h-4 w-4" />
                  Найти чат
                </Button>
              )}
            </div>
          </div>

          {foundChat && (
            <div className="rounded-md border p-2 text-xs">
              <p>
                Найден чат: {foundChat.firstName ?? "без имени"}
                {foundChat.username ? ` (@${foundChat.username})` : ""} ({foundChat.chatId})
              </p>
              <p className="mt-1 text-muted-foreground">Проверьте, что это ваш чат с ботом.</p>
              <div className="mt-2 flex gap-2">
                <Button size="sm" onClick={handleConfirmFoundChat}>
                  Это мой чат
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setFoundChat(null)}>
                  Отмена
                </Button>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handleConnect}
              isPending={busy === "connect"}
              disabled={!token.trim() || !chatId.trim()}
            >
              Подключить
            </Button>
            {connected && (
              <>
                <Button variant="outline" onClick={handleTest} isPending={busy === "test"}>
                  Отправить тест
                </Button>
                <Button variant="ghost" onClick={handleDisconnect} isPending={busy === "disconnect"}>
                  <Power className="h-4 w-4" />
                  Отключить
                </Button>
              </>
            )}
          </div>

          <p className="text-xs text-muted-foreground">{TOKEN_HINT}</p>
          {kind === "telegram" && (
            <p className="text-xs text-muted-foreground">
              Напишите боту /start, затем нажмите «Найти чат». ID можно ввести вручную.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export const MessengerCards = ({ messengers }: { messengers?: NotificationSettings["messengers"] }) => (
  <div className="grid gap-4 md:grid-cols-2">
    <MessengerCard kind="telegram" config={messengers?.telegram} />
    <MessengerCard kind="max" config={messengers?.max} />
  </div>
);
