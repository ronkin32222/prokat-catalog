import Link from "next/link";

import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { CalendarDays } from "lucide-react";

import { Badge, Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@louez/ui";
import { formatCurrency } from "@louez/utils";

import { DashboardEmptyState } from "@/components/dashboard/shared/dashboard-empty-state";
import { DashboardSectionCard } from "@/components/dashboard/shared/dashboard-section-card";
import { ProductImage } from "@/components/product/product-image";

type ReservationStatus =
  | "pending"
  | "confirmed"
  | "ongoing"
  | "completed"
  | "cancelled"
  | "rejected"
  | "quote"
  | "declined"
  | null;

const STATUS = {
  pending: { label: "Новая заявка", variant: "pending" },
  confirmed: { label: "Ждёт выдачи", variant: "review" },
  ongoing: { label: "В аренде", variant: "success" },
  completed: { label: "Возвращено", variant: "expired" },
  cancelled: { label: "Отменено", variant: "expired" },
  rejected: { label: "Отклонено", variant: "failed" },
  quote: { label: "Предложение", variant: "submitted" },
  declined: { label: "Отклонено", variant: "failed" },
} as const;

export interface OverviewRecentReservation {
  id: string;
  number: string;
  status: ReservationStatus;
  startDate: Date;
  endDate: Date;
  totalAmount: string;
  customer: { firstName: string; lastName: string };
  items: Array<{
    id: string;
    product: { name: string; images: string[] | null } | null;
  }>;
}

export const RecentReservations = ({
  reservations,
  currency,
}: {
  reservations: OverviewRecentReservation[];
  currency: string;
}) => (
  <DashboardSectionCard
    title="Последние бронирования"
    action={
      <Button variant="ghost" size="sm" render={<Link href="/dashboard/reservations?view=list" />}>
        Все бронирования
      </Button>
    }
    contentClassName="px-0 pb-0 sm:px-0 sm:pb-0"
  >
    {reservations.length === 0 ? (
      <DashboardEmptyState
        icon={CalendarDays}
        title="Бронирований пока нет"
        description="Создайте первое бронирование — оно появится здесь."
      />
    ) : (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>№</TableHead>
              <TableHead>Клиент</TableHead>
              <TableHead>Оборудование</TableHead>
              <TableHead>Период</TableHead>
              <TableHead className="text-right">Стоимость</TableHead>
              <TableHead>Статус</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reservations.map((reservation) => {
              const product = reservation.items[0]?.product;
              const status = STATUS[reservation.status ?? "pending"];

              return (
                <TableRow key={reservation.id}>
                  <TableCell>
                    <Link className="font-mono text-xs hover:underline" href={`/dashboard/reservations/${reservation.id}`}>
                      #{reservation.number}
                    </Link>
                  </TableCell>
                  <TableCell className="font-medium">
                    {reservation.customer.firstName} {reservation.customer.lastName}
                  </TableCell>
                  <TableCell>
                    <span className="flex min-w-44 items-center gap-2.5">
                      <ProductImage
                        src={product?.images?.[0]}
                        alt={product?.name ?? "Оборудование"}
                        sizes="40px"
                        containerClassName="size-10 shrink-0 rounded-md bg-background"
                      />
                      <span className="truncate">{product?.name ?? "Позиция удалена"}</span>
                    </span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {format(reservation.startDate, "d MMM", { locale: ru })} — {format(reservation.endDate, "d MMM", { locale: ru })}
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {formatCurrency(Number(reservation.totalAmount), currency)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    )}
  </DashboardSectionCard>
);
