"use client";

import { Clock3Icon, MailIcon, MapPinIcon, PhoneIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import type { OwnerProfile, StoreSocialLinks } from "@louez/types";

import { SOCIAL_NETWORK_LABELS, SocialNetworkIcon } from "@/components/shared/social-network-icon";
import { useChromeVariant } from "@/components/storefront/shell/use-chrome-variant";
import { StorefrontLink } from "@/components/storefront/ui/storefront-link";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { buildOwnerDocumentValues } from "@/lib/owner-profile/owner-document-values";
import { resolveStoreSocialLinks } from "@/lib/utils/util.store-social-links";

interface StoreFooterProps {
  storeName: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  social?: StoreSocialLinks | null;
  footerNote?: string | null;
  /** The owner's answers: the operator line of the footer (name, ИНН, ОГРН). */
  ownerProfile?: OwnerProfile | null;
  showAccount?: boolean;
  linkPrefetch?: boolean;
  showLanguageSwitcher?: boolean;
}

const LINK_CLASS_NAME =
  "inline-flex min-h-10 items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary";
const HEADING_CLASS_NAME = "font-display text-sm font-extrabold tracking-[-0.01em] uppercase";

/** Three-column storefront footer; the source link is retained for AGPL-3.0 section 13. */
export const StoreFooter = ({
  storeName,
  email,
  phone,
  address,
  social,
  footerNote,
  ownerProfile,
  showAccount = true,
  linkPrefetch,
  showLanguageSwitcher = true,
}: StoreFooterProps) => {
  const t = useTranslations("storefront.footer");
  const variant = useChromeVariant();
  const socialLinks = resolveStoreSocialLinks(social);
  const compact = variant === "compact";
  const operator = ownerProfile
    ? buildOwnerDocumentValues(ownerProfile, { name: storeName, email, phone, address }, "")
    : null;
  const operatorLine = operator
    ? `Оператор персональных данных и арендодатель: ${operator.operatorStatus} ${operator.operatorName}, ИНН ${operator.inn || "—"}${operator.ogrnPart}`
    : null;

  return (
    <footer data-slot="store-footer" className="border-t bg-secondary py-10 sm:py-14">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {!compact ? (
          <div className="grid gap-10 sm:grid-cols-3">
            <div>
              <h2 className={HEADING_CLASS_NAME}>{storeName}</h2>
              <div className="mt-4 flex flex-col">
                {phone ? (
                  <a href={`tel:${phone}`} className={LINK_CLASS_NAME}>
                    <PhoneIcon aria-hidden className="size-4" />
                    {phone}
                  </a>
                ) : null}
                {email ? (
                  <a href={`mailto:${email}`} className={LINK_CLASS_NAME}>
                    <MailIcon aria-hidden className="size-4" />
                    <span className="truncate">{email}</span>
                  </a>
                ) : null}
                {address ? (
                  <a
                    href={`https://yandex.ru/maps/?text=${encodeURIComponent(address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={LINK_CLASS_NAME}
                  >
                    <MapPinIcon aria-hidden className="size-4 shrink-0" />
                    <span>{address}</span>
                  </a>
                ) : null}
              </div>
              {socialLinks.length > 0 ? (
                <ul className="mt-3 flex gap-1">
                  {socialLinks.map(({ network, url }) => (
                    <li key={network}>
                      <a
                        href={url}
                        target="_blank"
                        rel="me noopener noreferrer"
                        aria-label={SOCIAL_NETWORK_LABELS[network]}
                        className="flex size-10 items-center justify-center text-muted-foreground hover:text-primary"
                      >
                        <SocialNetworkIcon network={network} className="size-4" />
                      </a>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            <div>
              <h2 className={HEADING_CLASS_NAME}>Меню</h2>
              <nav aria-label="Меню в подвале" className="mt-4 flex flex-col">
                <StorefrontLink prefetch={linkPrefetch} href="/" className={LINK_CLASS_NAME}>
                  Главная
                </StorefrontLink>
                <StorefrontLink prefetch={linkPrefetch} href="/catalog" className={LINK_CLASS_NAME}>
                  {t("catalog")}
                </StorefrontLink>
                <StorefrontLink prefetch={linkPrefetch} href="/terms" className={LINK_CLASS_NAME}>
                  Условия
                </StorefrontLink>
                <StorefrontLink prefetch={linkPrefetch} href="/contact" className={LINK_CLASS_NAME}>
                  {t("contact")}
                </StorefrontLink>
                {showAccount ? (
                  <StorefrontLink
                    prefetch={linkPrefetch}
                    href="/account"
                    className={LINK_CLASS_NAME}
                  >
                    {t("myReservations")}
                  </StorefrontLink>
                ) : null}
              </nav>
            </div>

            <div>
              <h2 className={HEADING_CLASS_NAME}>График работы</h2>
              <p className="mt-4 flex items-start gap-2 text-sm leading-6 text-muted-foreground">
                <Clock3Icon aria-hidden className="mt-1 size-4 shrink-0 text-primary" />
                Время выдачи и возврата уточняйте по телефону.
              </p>
              {footerNote?.trim() ? (
                <p className="mt-4 text-xs whitespace-pre-line text-muted-foreground">
                  {footerNote.trim()}
                </p>
              ) : null}
            </div>
          </div>
        ) : (
          <nav aria-label={t("legalInfo")} className="flex flex-wrap gap-x-6">
            <StorefrontLink prefetch={linkPrefetch} href="/terms" className={LINK_CLASS_NAME}>
              {t("cgv")}
            </StorefrontLink>
            <StorefrontLink prefetch={linkPrefetch} href="/legal" className={LINK_CLASS_NAME}>
              Политика обработки ПД
            </StorefrontLink>
          </nav>
        )}

        {operatorLine ? (
          <p className="mt-8 text-xs text-muted-foreground">{operatorLine}</p>
        ) : null}

        <div className="mt-8 flex flex-col gap-3 border-t pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <nav aria-label={t("legalInfo")} className="flex gap-5">
            <StorefrontLink prefetch={linkPrefetch} href="/terms" className="hover:text-foreground">
              {t("cgv")}
            </StorefrontLink>
            <StorefrontLink prefetch={linkPrefetch} href="/legal" className="hover:text-foreground">
              Политика обработки ПД
            </StorefrontLink>
          </nav>
          <div className="flex items-center gap-3">
            {showLanguageSwitcher ? (
              <LanguageSwitcher
                variant="compact"
                className="text-muted-foreground hover:text-foreground"
              />
            ) : null}
            <a
              // AGPL-3.0 §13: the offer of the source stays, as small as it can be. Points at this fork.
              href={process.env.NEXT_PUBLIC_SOURCE_URL ?? "https://github.com/ronkin32222/prokat-catalog"}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] leading-none opacity-40 hover:opacity-100"
            >
              Исходный код
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
