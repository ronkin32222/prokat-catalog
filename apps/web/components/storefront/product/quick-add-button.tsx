"use client";

import { Button } from "@louez/ui";
import { BagPlusIcon } from "@louez/ui/icons";
import { cn } from "@louez/utils";

interface QuickAddButtonProps {
  label: string;
  onClick: () => void;
  className?: string;
}

/** Full-width product action used by every catalog card. */
export const QuickAddButton = ({ label, onClick, className }: QuickAddButtonProps) => (
  <Button
    data-slot="product-quick-add"
    data-product-quick-add=""
    type="button"
    onClick={onClick}
    className={cn("h-11 w-full rounded-sm font-semibold uppercase", className)}
  >
    <BagPlusIcon className="size-4" />
    {label}
  </Button>
);
