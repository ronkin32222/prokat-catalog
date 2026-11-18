export const ONBOARDING_STEPS = [
  { path: "/onboarding/reeent", key: "reeent", labelKey: "steps.reeent" },
  { path: "/onboarding/profile", key: "profile", labelKey: "steps.profile" },
  { path: "/onboarding", key: "store", labelKey: "steps.store" },
  { path: "/onboarding/branding", key: "branding", labelKey: "steps.branding" },
  { path: "/onboarding/stripe", key: "payment", labelKey: "steps.payment" },
  { path: "/onboarding/source", key: "source", labelKey: "steps.source" },
] as const;

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];
export type OnboardingStepKey = OnboardingStep["key"];
export type OnboardingStepPath = OnboardingStep["path"];

/** Where the flow goes once its last step is done. */
export const ONBOARDING_END_PATH = "/dashboard";

export function getOnboardingStepKey(pathname: string): OnboardingStepKey | null {
  return ONBOARDING_STEPS.find((step) => step.path === pathname)?.key ?? null;
}

// Russia-only onboarding keeps only the store details, branding and operating mode.
export function getOnboardingSteps(options: {
  needsReeentIntro: boolean;
  needsProfile: boolean;
  needsSource: boolean;
}): OnboardingStep[] {
  void options;
  return ONBOARDING_STEPS.filter((step) => ["store", "branding", "payment"].includes(step.key));
}

export function getOnboardingStepIndex(steps: readonly OnboardingStep[], pathname: string): number {
  return steps.findIndex((step) => step.path === pathname);
}

const stepOrder = (path: string) => ONBOARDING_STEPS.findIndex((step) => step.path === path);

/**
 * The step of this flow that comes after `path`, or the dashboard after the last one.
 * `path` itself need not be in the flow.
 */
export function getNextOnboardingPath(
  steps: readonly OnboardingStep[],
  path: OnboardingStepPath,
): OnboardingStepPath | typeof ONBOARDING_END_PATH {
  const after = stepOrder(path);
  return steps.find((step) => stepOrder(step.path) > after)?.path ?? ONBOARDING_END_PATH;
}

/**
 * Where Stripe's hosted KYC, started at the payment step, comes back to: the next step
 * of this flow (the source step), or null for the settings
 * callback screen when the flow ends with the payment step.
 */
export function getStripeKycReturnPath(
  steps: readonly OnboardingStep[],
): OnboardingStepPath | null {
  const next = getNextOnboardingPath(steps, "/onboarding/stripe");
  return next === ONBOARDING_END_PATH ? null : next;
}
