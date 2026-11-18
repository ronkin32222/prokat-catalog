import { z } from "zod";

import type { OwnerProfile } from "@louez/types";

import { innProblem, ogrnProblem } from "./validators";

const text = (max: number) => z.string().trim().max(max);

export const ownerProfileInputSchema = z.object({
  kind: z.enum(["self_employed", "ip", "ooo", "individual"]),
  fullName: text(200),
  organizationName: text(300),
  directorName: text(200),
  inn: text(12),
  ogrn: text(15),
  address: text(500),
  phone: text(30),
  email: z.union([z.literal(""), z.email("Проверьте адрес почты")]),
  siteUrl: text(200),
  bankName: text(200),
  bik: text(9),
  account: text(20),
  corrAccount: text(20),
  controllerName: text(200),
  controllerEmail: z.union([z.literal(""), z.email("Проверьте адрес почты")]),
});

export type OwnerProfileInput = z.infer<typeof ownerProfileInputSchema>;

const orNull = (value: string) => (value.trim() ? value.trim() : null);

/** The ИНН and ОГРН checks the form shows; the server refuses what the form would. */
export const ownerProfileProblem = (input: OwnerProfileInput): string | null => {
  if (input.inn.trim()) {
    const problem = innProblem(input.inn);
    if (problem) return problem;
  }
  if ((input.kind === "ooo" || input.kind === "ip") && input.ogrn.trim()) {
    const problem = ogrnProblem(input.ogrn, input.kind === "ip" ? "ip" : "ooo");
    if (problem) return problem;
  }
  return null;
};

/** Merges the answers into `settings.ownerProfile`; the other settings keep their values. */
export const mergeOwnerProfile = (
  current: OwnerProfile | null | undefined,
  input: OwnerProfileInput,
  now: Date = new Date(),
): OwnerProfile => {
  return {
    kind: input.kind,
    fullName: orNull(input.fullName),
    organizationName: orNull(input.organizationName),
    directorName: orNull(input.directorName),
    inn: orNull(input.inn),
    ogrn: orNull(input.ogrn),
    address: orNull(input.address),
    phone: orNull(input.phone),
    email: orNull(input.email),
    siteUrl: orNull(input.siteUrl),
    bank: {
      bankName: orNull(input.bankName),
      bik: orNull(input.bik),
      account: orNull(input.account),
      corrAccount: orNull(input.corrAccount),
    },
    dataController: {
      name: orNull(input.controllerName),
      email: orNull(input.controllerEmail),
    },
    updatedAt: now.toISOString(),
  };
};

