import { formOptions, revalidateLogic } from "@tanstack/react-form";

import type { CustomerProfileFormValues } from "@/components/storefront/customer-fields/customer-fields.types";
import { EMPTY_CUSTOMER_PROFILE_FORM_VALUES } from "@/components/storefront/customer-fields/util.customer-profile-fields";

import type { CheckoutInitialCustomer } from "./util.checkout-customer";

/**
 * Values of the customer's own profile form (account page). Separate from the
 * public request form: the request asks only name, phone, note and e-mail.
 */
export interface CustomerProfileFormState {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  isBusinessCustomer: boolean;
  companyName: string;
  companyNumber: string;
  vatNumber: string;
  address: string;
  city: string;
  postalCode: string;
  profileFields: CustomerProfileFormValues;
}

export const CUSTOMER_PROFILE_FORM_DEFAULT_VALUES: CustomerProfileFormState = {
  email: "",
  firstName: "",
  lastName: "",
  phone: "",
  isBusinessCustomer: false,
  companyName: "",
  companyNumber: "",
  vatNumber: "",
  address: "",
  city: "",
  postalCode: "",
  profileFields: EMPTY_CUSTOMER_PROFILE_FORM_VALUES,
};

/** Form options shared by the profile form and its address/business sections. */
export const customerProfileFormOptions = formOptions({
  defaultValues: CUSTOMER_PROFILE_FORM_DEFAULT_VALUES,
  validationLogic: revalidateLogic({ mode: "submit", modeAfterSubmission: "change" }),
});

/** The profile form opens with the signed-in customer's own data. */
export const getCustomerProfileDefaultValues = (
  customer: CheckoutInitialCustomer,
): CustomerProfileFormState => ({
  ...CUSTOMER_PROFILE_FORM_DEFAULT_VALUES,
  ...customer,
});
