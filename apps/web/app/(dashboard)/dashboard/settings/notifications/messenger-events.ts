/** События бронирования, которые владелец получает в Telegram и MAX. */
export const MESSENGER_EVENT_ITEMS = [
  { key: "reservation_new", label: "Новая заявка" },
  { key: "reservation_confirmed", label: "Заявка подтверждена" },
  { key: "reservation_rejected", label: "Заявка отклонена" },
  { key: "reservation_cancelled", label: "Бронь отменена" },
  { key: "reservation_picked_up", label: "Оборудование выдано" },
  { key: "reservation_completed", label: "Оборудование возвращено" },
] as const;

export type MessengerEventKey = (typeof MESSENGER_EVENT_ITEMS)[number]["key"];
