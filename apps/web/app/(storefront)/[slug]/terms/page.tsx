import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getLocale, getTranslations } from "next-intl/server";


import { LegalPageShell } from "@/components/storefront/shell/legal-page-shell";
import { LegalSection } from "@/components/storefront/shell/legal-section";
import { RichText } from "@/components/storefront/ui/rich-text";
import { generateStoreMetadata } from "@/lib/seo";
import { getStoreBySlug } from "@/lib/storefront/get-store-by-slug";
import { hasRichTextContent } from "@louez/utils";
import { renderLegalDocument } from "@/lib/legal-templates";
import { buildOwnerDocumentValues } from "@/lib/owner-profile/owner-document-values";
import { getStorefrontUrl } from "@/lib/storefront-url";

interface TermsPageProps {
  params: Promise<{ slug: string }>;
}

export const unstable_dynamicStaleTime = 300;

export const generateMetadata = async ({ params }: TermsPageProps): Promise<Metadata> => {
  const { slug } = await params;
  const [store, t, locale] = await Promise.all([
    getStoreBySlug(slug),
    getTranslations("storefront.legal"),
    getLocale(),
  ]);

  if (!store) {
    return {};
  }

  return generateStoreMetadata(
    {
      id: store.id,
      name: store.name,
      slug: store.slug,
      tagline: store.tagline,
      faviconUrl: store.faviconUrl,
      settings: store.settings,
      theme: store.theme,
    },
    {
      title: `${t("cgv.title")} - ${store.name}`,
      description: t("cgv.metaDescription", { name: store.name }),
      path: "/terms",
      locale,
      // Without written terms the page is a placeholder: thin content that
      // would only dilute the store's crawl budget.
      noIndex: !hasRichTextContent(store.cgv),
    },
  );
};

const TermsPage = async ({ params }: TermsPageProps) => {
  const { slug } = await params;
  const [store, t] = await Promise.all([getStoreBySlug(slug), getTranslations("storefront.legal")]);

  if (!store) {
    notFound();
  }

  const hasContact = Boolean(store.email || store.phone || store.address);

  return (
    <LegalPageShell title={t("cgv.title")}>
      {hasRichTextContent(store.cgv) ? (
        <RichText html={store.cgv} />
      ) : (
        // No text of the owner's own: the Russian offer, filled from the owner's answers.
        <RichText
          html={renderLegalDocument(
            "rentalOffer",
            buildOwnerDocumentValues(
              store.settings?.ownerProfile,
              { name: store.name, email: store.email, phone: store.phone, address: store.address },
              getStorefrontUrl(store.slug, "/"),
            ),
          )}
        />
      )}

      {hasContact ? (
        <LegalSection title={t("contact")}>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
            {store.email ? (
              <>
                <dt className="font-medium text-foreground">{t("legalNotice.email")}</dt>
                <dd>
                  <a href={`mailto:${store.email}`} className="underline underline-offset-4">
                    {store.email}
                  </a>
                </dd>
              </>
            ) : null}
            {store.phone ? (
              <>
                <dt className="font-medium text-foreground">{t("legalNotice.phone")}</dt>
                <dd>
                  <a href={`tel:${store.phone}`} className="underline underline-offset-4">
                    {store.phone}
                  </a>
                </dd>
              </>
            ) : null}
            {store.address ? (
              <>
                <dt className="font-medium text-foreground">{t("legalNotice.address")}</dt>
                <dd className="whitespace-pre-line">{store.address}</dd>
              </>
            ) : null}
          </dl>
        </LegalSection>
      ) : null}
    </LegalPageShell>
  );
};

export default TermsPage;
