"use client";

import { useCallback, useMemo } from "react";

import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";

import type { CartItem } from "@/contexts/cart-context";
import { orpc } from "@/lib/orpc/react";

import type { CheckoutFieldsPlan } from "../checkout.types";
import { buildCheckoutFieldsPlan } from "../util.checkout-custom-fields";

/** What a store asks only changes when its owner edits the settings. */
const CUSTOM_FIELDS_STALE_TIME = 60_000;

/** `storefront.customerFields.forCart` takes at most this many lines. */
const MAX_LINES = 50;

interface UseCheckoutCustomFieldsParams {
  /** Cart lines in checkout order: their index is the payload's `lineIndex`. */
  items: CartItem[];
}

/**
 * The unit details this cart asks ("что должно быть в комплекте"): one card
 * per rented unit. The public request form collects no customer profile, so
 * only the item-scope fields are used from the cart answer.
 */
export const useCheckoutCustomFields = ({ items }: UseCheckoutCustomFieldsParams) => {
  const queryClient = useQueryClient();
  const lines = items.map((item) => ({ productId: item.productId, quantity: item.quantity }));
  const enabled = lines.length > 0 && lines.length <= MAX_LINES;

  const query = useQuery(
    orpc.storefront.customerFields.forCart.queryOptions({
      input: { lines, customerType: "individual" },
      enabled,
      placeholderData: keepPreviousData,
      staleTime: CUSTOM_FIELDS_STALE_TIME,
    }),
  );

  const plan = useMemo<CheckoutFieldsPlan>(
    () => buildCheckoutFieldsPlan(query.data, items),
    [items, query.data],
  );

  /** The server refused values: the store may have changed its rules since the page loaded. */
  const refresh = useCallback(() => {
    void queryClient.invalidateQueries({
      queryKey: orpc.storefront.customerFields.forCart.key(),
    });
  }, [queryClient]);

  return {
    plan,
    /** First answer still on its way: submitting waits for it, a question must not be skipped. */
    isLoading: enabled && query.isPending,
    refresh,
  };
};
