import type { OwnerKind, OwnerProfile } from "@louez/types";

import { formatRussianDate, type LegalDocumentValues } from "../legal-templates";

/** What the store itself already knows; the owner's answers win over it. */
export interface StoreIdentityForDocuments {
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  /** Name of the owner's account, used as ФИО when the owner left it empty. */
  ownerName?: string | null;
}

export const OWNER_KIND_LABELS: Record<OwnerKind, string> = {
  self_employed: "Самозанятый",
  ip: "ИП",
  ooo: "ООО",
  individual: "Физическое лицо",
};

const OWNER_STATUS: Record<OwnerKind, string> = {
  self_employed: "самозанятый",
  ip: "индивидуальный предприниматель",
  ooo: "Общество с ограниченной ответственностью",
  individual: "физическое лицо",
};

const clean = (value: string | null | undefined): string => value?.trim() ?? "";

/**
 * The placeholder values of the documents: the owner's answers, falling back
 * to the store's own contacts, so nothing is asked twice.
 */
export const buildOwnerDocumentValues = (
  profile: OwnerProfile | null | undefined,
  store: StoreIdentityForDocuments,
  siteUrl: string,
  now: Date = new Date(),
): LegalDocumentValues => {
  const kind: OwnerKind = profile?.kind ?? "individual";
  const isOrganization = kind === "ooo";
  const operatorName = isOrganization
    ? clean(profile?.organizationName) || store.name
    : clean(profile?.fullName) || clean(store.ownerName) || store.name;
  const ogrn = clean(profile?.ogrn);
  const email = clean(profile?.email) || clean(store.email);
  const controller = profile?.dataController;

  return {
    operatorName,
    operatorStatus: OWNER_STATUS[kind],
    inn: clean(profile?.inn),
    ogrn,
    ogrnPart: ogrn ? `, ${kind === "ip" ? "ОГРНИП" : "ОГРН"} ${ogrn}` : "",
    address: clean(profile?.address) || clean(store.address),
    phone: clean(profile?.phone) || clean(store.phone),
    email,
    siteUrl: clean(profile?.siteUrl) || siteUrl,
    date: formatRussianDate(now),
    dataControllerName: clean(controller?.name) || operatorName,
    dataControllerEmail: clean(controller?.email) || email,
  };
};

