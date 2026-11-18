import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db, users } from "@louez/db";
import { ExternalLinkIcon, FileTextIcon } from "@louez/ui/icons";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@louez/ui";

import { SettingsPageShell } from "@/components/dashboard/settings-page-shell";
import {
  LEGAL_DOCUMENT_TITLES,
  LEGAL_TEMPLATE_DISCLAIMER,
  renderLegalDocument,
  type LegalDocumentKind,
} from "@/lib/legal-templates";
import { getDadataApiKey } from "@/lib/owner-profile/dadata";
import { buildOwnerDocumentValues } from "@/lib/owner-profile/owner-document-values";
import { getCurrentStore } from "@/lib/store-context";
import { getStorefrontUrl } from "@/lib/storefront-url";

import { OwnerProfileForm } from "./owner-profile-form";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

const PREVIEWS: { kind: LegalDocumentKind; page: "/legal" | "/terms" | null }[] = [
  { kind: "privacyPolicy", page: "/legal" },
  { kind: "personalDataConsent", page: null },
  { kind: "rentalOffer", page: "/terms" },
  { kind: "handoverAct", page: null },
];

export default async function DocumentsSettingsPage() {
  const store = await getCurrentStore();
  if (!store) {
    redirect("/onboarding");
  }

  const owner = await db.query.users.findFirst({
    where: eq(users.id, store.userId),
    columns: { name: true },
  });
  const profile = store.settings?.ownerProfile ?? null;
  const siteUrl = getStorefrontUrl(store.slug, "/");
  const storeIdentity = {
    name: store.name,
    email: store.email,
    phone: store.phone,
    address: store.address,
    ownerName: owner?.name ?? null,
  };
  const values = buildOwnerDocumentValues(profile, storeIdentity, siteUrl);

  const formDefaults = {
    kind: profile?.kind ?? "individual",
    fullName: profile?.fullName ?? owner?.name ?? "",
    organizationName: profile?.organizationName ?? "",
    directorName: profile?.directorName ?? "",
    inn: profile?.inn ?? "",
    ogrn: profile?.ogrn ?? "",
    address: profile?.address ?? store.address ?? "",
    phone: profile?.phone ?? store.phone ?? "",
    email: profile?.email ?? store.email ?? "",
    siteUrl: profile?.siteUrl ?? siteUrl,
    bankName: profile?.bank?.bankName ?? "",
    bik: profile?.bank?.bik ?? "",
    account: profile?.bank?.account ?? "",
    corrAccount: profile?.bank?.corrAccount ?? "",
    controllerName: profile?.dataController?.name ?? "",
    controllerEmail: profile?.dataController?.email ?? "",
  };

  return (
    <SettingsPageShell
      title="Документы"
      description="Кто вы: по этим данным на сайте формируются политика, оферта и согласие"
    >
      <div className="space-y-4 sm:space-y-6">
        <OwnerProfileForm defaults={formDefaults} hasDadataKey={Boolean(getDadataApiKey())} />

        <Card className="min-w-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileTextIcon className="h-5 w-5 shrink-0" />
              Документы магазина
            </CardTitle>
            <CardDescription>
              Готовые тексты уже заполнены вашими данными. Они появятся на сайте в подвале и в
              форме заявки.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {PREVIEWS.map(({ kind, page }) => (
              <details key={kind} className="rounded-lg border p-4">
                <summary className="cursor-pointer font-medium">
                  {LEGAL_DOCUMENT_TITLES[kind]}
                </summary>
                <div
                  className="prose prose-sm mt-4 max-w-none dark:prose-invert [&_h1]:text-lg [&_h2]:text-base"
                  dangerouslySetInnerHTML={{ __html: renderLegalDocument(kind, values) }}
                />
                {page ? (
                  <Button
                    variant="outline"
                    className="mt-4"
                    render={
                      <a href={getStorefrontUrl(store.slug, page)} target="_blank" rel="noopener noreferrer" />
                    }
                  >
                    <ExternalLinkIcon data-slot="icon" />
                    {page === "/legal" ? "Открыть политику на сайте" : "Открыть оферту на сайте"}
                  </Button>
                ) : null}
              </details>
            ))}
            <p className="text-xs text-muted-foreground">{LEGAL_TEMPLATE_DISCLAIMER}</p>
          </CardContent>
        </Card>
      </div>
    </SettingsPageShell>
  );
}
