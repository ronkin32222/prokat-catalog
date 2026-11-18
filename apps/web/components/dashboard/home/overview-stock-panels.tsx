import Link from "next/link";

import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { ArrowRight, PackageCheck, Timer } from "lucide-react";

import { Badge } from "@louez/ui";

import { DashboardEmptyState } from "@/components/dashboard/shared/dashboard-empty-state";
import { DashboardSectionCard } from "@/components/dashboard/shared/dashboard-section-card";
import { ProductImage } from "@/components/product/product-image";

export interface OverviewAvailableProduct {
  id: string;
  name: string;
  images: string[] | null;
  availableQuantity: number | null;
}

export interface OverviewSoonReturn {
  reservationId: string;
  productId: string;
  name: string;
  images: string[] | null;
  endDate: Date;
}

export const OverviewStockPanels = ({
  available,
  soon,
}: {
  available: OverviewAvailableProduct[];
  soon: OverviewSoonReturn[];
}) => (
  <div className="grid min-w-0 content-start gap-4">
    <DashboardSectionCard
      title="В наличии"
      icon={PackageCheck}
      accent="success"
      action={<Badge variant="success">{available.length}</Badge>}
    >
      {available.length === 0 ? (
        <DashboardEmptyState
          icon={PackageCheck}
          title="Нет свободных позиций"
          description="Проверьте календарь возвратов или добавьте оборудование."
        />
      ) : (
        <div className="divide-y divide-border">
          {available.map((product) => (
            <Link
              key={product.id}
              href={`/dashboard/products/${product.id}`}
              className="flex min-h-16 items-center gap-3 py-2.5 transition-colors duration-200 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none"
            >
              <ProductImage
                src={product.images?.[0]}
                alt={product.name}
                sizes="48px"
                containerClassName="size-12 shrink-0 rounded-lg bg-background"
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{product.name}</span>
                <span className="text-xs text-muted-foreground">
                  {product.availableQuantity === null
                    ? "Без учёта количества"
                    : `Свободно: ${product.availableQuantity}`}
                </span>
              </span>
              <ArrowRight className="size-4 text-muted-foreground" />
            </Link>
          ))}
        </div>
      )}
    </DashboardSectionCard>

    <DashboardSectionCard
      title="Освободятся скоро"
      icon={Timer}
      accent="pending"
      action={<Badge variant="pending">{soon.length}</Badge>}
    >
      {soon.length === 0 ? (
        <DashboardEmptyState
          icon={Timer}
          title="Возвратов пока нет"
          description="Здесь появятся позиции с ближайшим плановым возвратом."
        />
      ) : (
        <div className="divide-y divide-border">
          {soon.map((product) => (
            <Link
              key={`${product.reservationId}-${product.productId}`}
              href={`/dashboard/reservations/${product.reservationId}`}
              className="flex min-h-16 items-center gap-3 py-2.5 transition-colors duration-200 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none"
            >
              <ProductImage
                src={product.images?.[0]}
                alt={product.name}
                sizes="48px"
                containerClassName="size-12 shrink-0 rounded-lg bg-background"
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{product.name}</span>
                <span className="text-xs text-muted-foreground">Плановый возврат</span>
              </span>
              <Badge variant="pending" className="shrink-0">
                {format(product.endDate, "d MMM, HH:mm", { locale: ru })}
              </Badge>
            </Link>
          ))}
        </div>
      )}
    </DashboardSectionCard>
  </div>
);
