"use client";

import { createContext, type ReactNode, useContext } from "react";

import type { BusinessHours } from "@louez/types";

/** The store rules the date picker needs, read from the store settings on the server. */
export interface StorefrontRentalRules {
  storeSlug: string;
  businessHours?: BusinessHours;
  advanceNoticeMinutes: number;
  minRentalMinutes: number;
  maxRentalMinutes: number | null;
  timezone?: string;
}

const StorefrontRentalRulesContext = createContext<StorefrontRentalRules | null>(null);

export const StorefrontRentalRulesProvider = ({
  value,
  children,
}: {
  value: StorefrontRentalRules;
  children: ReactNode;
}) => (
  <StorefrontRentalRulesContext.Provider value={value}>{children}</StorefrontRentalRulesContext.Provider>
);

/** Null outside the storefront shell (e.g. landing demos), where no date editing is offered. */
export const useStorefrontRentalRules = (): StorefrontRentalRules | null =>
  useContext(StorefrontRentalRulesContext);
