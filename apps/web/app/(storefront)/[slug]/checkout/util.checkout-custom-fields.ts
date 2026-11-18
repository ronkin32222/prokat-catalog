import {
  validateCheckoutFieldValues,
  type CheckoutFieldIssue,
  type CheckoutItemDetailsInput,
  type CustomerFieldIssueCode,
  type CustomerFieldPublic,
} from "@louez/validations";

import type { CheckoutFieldsPlan, CheckoutFormValues } from "./checkout.types";

export const EMPTY_CHECKOUT_FIELDS_PLAN: CheckoutFieldsPlan = { lines: [] };

/**
 * Key of one rented unit in `itemDetails`. The cart line id survives an edit
 * of the cart where its index would not.
 */
export const toUnitKey = (lineId: string, unitIndex: number): string => `${lineId}~${unitIndex}`;

/** Form field names of the custom fields, as TanStack Form paths. */
export type CheckoutItemFieldName = `itemDetails.${string}.values.${string}`;
export type CheckoutParticipantFieldName = `itemDetails.${string}.participantName`;

export const toItemFieldName = (unitKey: string, definitionId: string): CheckoutItemFieldName =>
  `itemDetails.${unitKey}.values.${definitionId}`;

export const toParticipantFieldName = (unitKey: string): CheckoutParticipantFieldName =>
  `itemDetails.${unitKey}.participantName`;

interface ForCartAnswer {
  lines: { productId: string; quantity: number; itemFields: CustomerFieldPublic[] }[];
}

interface PlanCartLine {
  lineId: string;
  productId: string;
  productName: string;
  productImage: string | null;
  quantity: number;
}

/**
 * Pairs `storefront.customerFields.forCart` with the cart lines. A line whose
 * answer is for another product (the cart changed while the answer was on its
 * way) asks nothing until the next answer; the server re-checks anyway.
 */
export const buildCheckoutFieldsPlan = (
  answer: ForCartAnswer | undefined,
  lines: readonly PlanCartLine[],
): CheckoutFieldsPlan => {
  if (!answer) return EMPTY_CHECKOUT_FIELDS_PLAN;
  return {
    lines: lines.map((line, index) => {
      const lineAnswer = answer.lines[index];
      return {
        lineId: line.lineId,
        productName: line.productName,
        productImage: line.productImage,
        quantity: line.quantity,
        itemFields: lineAnswer?.productId === line.productId ? lineAnswer.itemFields : [],
      };
    }),
  };
};

/** The checkout has unit details to ask. */
export const hasCheckoutItemFields = (plan: CheckoutFieldsPlan): boolean =>
  plan.lines.some((line) => line.itemFields.length > 0);

type CustomFieldFormValues = Pick<CheckoutFormValues, "itemDetails">;

/** What the checkout sends of the custom fields: only what this cart asks. */
export const getCheckoutFieldsSubmission = (
  values: CustomFieldFormValues,
  plan: CheckoutFieldsPlan,
): { itemDetails: CheckoutItemDetailsInput } => ({
  itemDetails: plan.lines.flatMap((line, lineIndex) =>
    line.itemFields.length === 0
      ? []
      : [
          {
            lineIndex,
            units: Array.from({ length: line.quantity }, (_, unitIndex) => {
              const unit = values.itemDetails[toUnitKey(line.lineId, unitIndex)];
              const participantName = unit?.participantName?.trim();
              return {
                ...(participantName ? { participantName } : {}),
                values: Object.fromEntries(
                  line.itemFields.flatMap((field) => {
                    const value = unit?.values?.[field.id]?.trim();
                    return value ? [[field.id, value]] : [];
                  }),
                ),
              };
            }),
          },
        ],
  ),
});

/** Form path of a refused value (`["itemDetails", unitKey, "values", id]`), or null when its line left the cart. */
export const getCheckoutFieldIssuePath = (
  issue: CheckoutFieldIssue,
  plan: CheckoutFieldsPlan,
): string[] | null => {
  if (issue.target !== "item") return null;
  const line = plan.lines[issue.lineIndex];
  return line
    ? ["itemDetails", toUnitKey(line.lineId, issue.unitIndex), "values", issue.definitionId]
    : null;
};

/**
 * The input a server refusal belongs to, as the form names it. Null when this
 * checkout does not show that field (the store changed its rules since the
 * page loaded): the alert above the form still names it.
 */
export const getCheckoutFieldIssueName = (
  issue: CheckoutFieldIssue,
  plan: CheckoutFieldsPlan,
): CheckoutItemFieldName | null => {
  if (issue.target !== "item") return null;
  const line = plan.lines[issue.lineIndex];
  return line &&
    line.itemFields.some((field) => field.id === issue.definitionId) &&
    issue.unitIndex < line.quantity
    ? toItemFieldName(toUnitKey(line.lineId, issue.unitIndex), issue.definitionId)
    : null;
};

/**
 * Every value the shared rules refuse, with its form path: the browser runs
 * the very checks the server runs (`validateCheckoutFieldValues`).
 */
export const getCheckoutFieldIssues = (
  values: CustomFieldFormValues,
  plan: CheckoutFieldsPlan,
): { path: string[]; code: CustomerFieldIssueCode }[] => {
  if (!hasCheckoutItemFields(plan)) return [];
  const { issues } = validateCheckoutFieldValues({
    fields: { customerFields: [], lines: plan.lines },
    ...getCheckoutFieldsSubmission(values, plan),
  });
  return issues.flatMap((issue) => {
    const path = getCheckoutFieldIssuePath(issue, plan);
    return path ? [{ path, code: issue.code }] : [];
  });
};

/** The unit fields the form validates before submitting. */
export const getCheckoutItemFieldNames = (
  plan: CheckoutFieldsPlan,
): CheckoutItemFieldName[] =>
  plan.lines.flatMap((line) =>
    Array.from({ length: line.quantity }, (_, unitIndex) =>
      line.itemFields.map((field) => toItemFieldName(toUnitKey(line.lineId, unitIndex), field.id)),
    ).flat(),
  );
