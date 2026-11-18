"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Wrench } from "lucide-react";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Checkbox, Input, toastManager } from "@louez/ui";

import {
  PRODUCT_AVAILABILITY_LABELS,
  type ProductAvailabilityStatus,
} from "@/lib/products/util.product-availability-status";

import { setProductsUnavailable } from "../availability-actions";

const STATUS_BADGE: Record<ProductAvailabilityStatus, "success" | "warning" | "error" | "secondary"> = {
  free: "success",
  rented: "warning",
  overdue: "error",
  unavailable: "secondary",
};

interface ProductAvailabilityCardProps {
  productId: string;
  status: ProductAvailabilityStatus;
  releasingSoon: boolean;
  isUnavailable: boolean;
  unavailableNote: string | null;
}

export function ProductAvailabilityCard({
  productId,
  status,
  releasingSoon,
  isUnavailable,
  unavailableNote,
}: ProductAvailabilityCardProps) {
  const router = useRouter();
  const [unavailable, setUnavailable] = useState(isUnavailable);
  const [note, setNote] = useState(unavailableNote ?? "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const result = await setProductsUnavailable({
        productIds: [productId],
        unavailable,
        note,
      });
      if ("error" in result) {
        toastManager.add({ title: result.error, type: "error" });
        return;
      }
      toastManager.add({ title: "Сохранено", type: "success" });
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            Доступность
          </span>
          <Badge variant={STATUS_BADGE[status]} size="sm">
            {PRODUCT_AVAILABILITY_LABELS[status]}
            {releasingSoon ? " · скоро освободится" : ""}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={unavailable} onCheckedChange={(checked) => setUnavailable(checked === true)} />
          Временно недоступна для аренды
        </label>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Причина</label>
          <Input
            value={note}
            maxLength={255}
            placeholder="Например: ремонт, обслуживание"
            disabled={!unavailable}
            onChange={(e) => setNote(e.target.value)}
            className="text-sm"
          />
        </div>
        <Button onClick={save} isPending={saving}>
          Сохранить
        </Button>
      </CardContent>
    </Card>
  );
}
