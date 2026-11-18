import Link from "next/link";

import { Package } from "lucide-react";

import { Badge, Card, CardPanel } from "@louez/ui";
import { formatCurrency } from "@louez/utils";

import { ProductImage } from "@/components/product/product-image";

import type { ProductListItem } from "./types";

const STATUS = {
  active: { label: "Опубликовано", variant: "success" },
  draft: { label: "Черновик", variant: "pending" },
  archived: { label: "В архиве", variant: "expired" },
} as const;

export const ProductsGrid = ({
  products,
  currency = "RUB",
}: {
  products: ProductListItem[];
  currency?: string;
}) => (
  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
    {products.map((product) => {
      const status = STATUS[product.status ?? "draft"];

      return (
        <Link
          key={product.id}
          href={`/dashboard/products/${product.id}`}
          className="group rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Card className="h-full overflow-hidden rounded-xl border-border bg-card transition-colors duration-200 group-hover:border-primary/45 motion-reduce:transition-none">
            <div className="relative aspect-[4/3] bg-background">
              <ProductImage
                src={product.images?.[0]}
                alt={product.name}
                sizes="(min-width: 1536px) 22vw, (min-width: 1280px) 30vw, (min-width: 640px) 45vw, 100vw"
                containerClassName="size-full rounded-none"
              />
              <Badge variant={status.variant} className="absolute left-3 top-3">
                {status.label}
              </Badge>
            </div>
            <CardPanel className="space-y-3 p-4">
              <div className="min-w-0">
                <p className="truncate font-medium">{product.name}</p>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Package className="size-3.5" />
                  {product.category?.name ?? "Без категории"} ·{" "}
                  {product.stockKind === "untracked"
                    ? "без учёта остатка"
                    : `${product.quantity} шт.`}
                </p>
              </div>
              <p className="text-lg font-semibold tabular-nums">
                {formatCurrency(Number(product.price), currency)}
                <span className="ml-1 text-xs font-normal text-muted-foreground">базовая цена</span>
              </p>
            </CardPanel>
          </Card>
        </Link>
      );
    })}
  </div>
);
