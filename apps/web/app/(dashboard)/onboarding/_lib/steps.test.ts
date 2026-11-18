import assert from "node:assert/strict";
import { test } from "node:test";

import { getNextOnboardingPath, getOnboardingSteps, getStripeKycReturnPath } from "./steps";

// The onboarding's flow: the conditional steps, and where each step goes next.

const flow = (options: Partial<Parameters<typeof getOnboardingSteps>[0]> = {}) =>
  getOnboardingSteps({
    needsReeentIntro: false,
    needsProfile: false,
    needsSource: false,
    ...options,
  });

test("the onboarding keeps only store, branding and mode", () => {
  assert.deepEqual(
    flow().map((step) => step.key),
    ["store", "branding", "payment"],
  );
  assert.deepEqual(
    flow({ needsProfile: true, needsSource: true }).map((step) => step.key),
    ["store", "branding", "payment"],
  );
});

test("the payment step finishes onboarding", () => {
  assert.equal(getNextOnboardingPath(flow(), "/onboarding/stripe"), "/dashboard");
});

test("a step outside this flow still goes to the next step of the flow", () => {
  assert.equal(
    getNextOnboardingPath(flow({ needsSource: true }), "/onboarding/profile"),
    "/onboarding",
  );
});

test("Stripe's KYC returns to the settings callback", () => {
  assert.equal(getStripeKycReturnPath(flow()), null);
});
