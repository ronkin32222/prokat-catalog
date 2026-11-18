import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { CustomerFieldPublic } from "@louez/validations";

import type { CheckoutFieldsPlan } from "./checkout.types";
import {
  buildCheckoutFieldsPlan,
  getCheckoutFieldIssueName,
  getCheckoutFieldIssues,
  getCheckoutFieldsSubmission,
  toItemFieldName,
  toUnitKey,
} from "./util.checkout-custom-fields";

const field = (overrides: Partial<CustomerFieldPublic> & { id: string }): CustomerFieldPublic => ({
  label: overrides.id,
  type: "text",
  format: null,
  options: null,
  unit: null,
  helpText: null,
  position: 0,
  width: "half",
  scope: "item",
  collectMode: "optional",
  isSensitive: false,
  ...overrides,
});

const height = field({ id: "height", type: "number", unit: "cm", collectMode: "required" });
const notes = field({ id: "notes", type: "textarea" });

const bikeLine = {
  lineId: "line-bike",
  productId: "bike",
  productName: "Fat bike",
  productImage: null,
  quantity: 2,
};

const plan: CheckoutFieldsPlan = {
  lines: [{ ...bikeLine, itemFields: [height, notes] }],
};

describe("buildCheckoutFieldsPlan", () => {
  it("asks nothing before the answer arrives", () => {
    assert.deepEqual(buildCheckoutFieldsPlan(undefined, [bikeLine]), { lines: [] });
  });

  it("drops the fields of a line whose product changed since the answer", () => {
    const answer = { lines: [{ productId: "other", quantity: 2, itemFields: [height] }] };
    assert.deepEqual(buildCheckoutFieldsPlan(answer, [bikeLine]).lines[0]?.itemFields, []);
  });
});

describe("getCheckoutFieldsSubmission", () => {
  it("sends one entry per unit, trimmed, with empty values left out", () => {
    const values = {
      itemDetails: {
        [toUnitKey("line-bike", 0)]: {
          participantName: "  Anna ",
          values: { height: " 180 ", notes: "   " },
        },
      },
    };
    assert.deepEqual(getCheckoutFieldsSubmission(values, plan), {
      itemDetails: [
        {
          lineIndex: 0,
          units: [
            { participantName: "Anna", values: { height: "180" } },
            { values: {} },
          ],
        },
      ],
    });
  });
});

describe("getCheckoutFieldIssues", () => {
  it("flags a required unit field left empty, with its form path", () => {
    const issues = getCheckoutFieldIssues({ itemDetails: {} }, plan);
    assert.ok(
      issues.some(
        (issue) =>
          issue.code === "required" &&
          issue.path.join(".") === `itemDetails.${toUnitKey("line-bike", 0)}.values.height`,
      ),
    );
  });

  it("returns nothing when no line asks item fields", () => {
    assert.deepEqual(getCheckoutFieldIssues({ itemDetails: {} }, { lines: [] }), []);
  });
});

describe("getCheckoutFieldIssueName", () => {
  it("maps an item issue to its input name, and ignores other targets", () => {
    assert.equal(
      getCheckoutFieldIssueName(
        { target: "item", lineIndex: 0, unitIndex: 1, definitionId: "height", code: "required" },
        plan,
      ),
      toItemFieldName(toUnitKey("line-bike", 1), "height"),
    );
    assert.equal(
      getCheckoutFieldIssueName(
        { target: "customer", definitionId: "height", code: "required" },
        plan,
      ),
      null,
    );
  });
});
