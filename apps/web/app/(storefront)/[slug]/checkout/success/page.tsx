import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { and, asc, eq } from "drizzle-orm";
import { CheckCircle2 } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { db, reservationItems, reservations } from "@louez/db";
import { Separator } from "@louez/ui";

import { Price } from "@/components/storefront/ui/price";
import { StorefrontLink } from "@/components/storefront/ui/storefront-link";
import { StorefrontPageRefresh } from "@/components/storefront/ui/storefront-page-refresh";
import { StorefrontSection } from "@/components/storefront/ui/storefront-section";
import { defaultLocale } from "@/i18n/config";
import { generateStoreMetadata } from "@/lib/seo";
import { getStoreBySlug } from "@/lib/storefront/get-store-by-slug";
import { getDetailedDuration } from "@/lib/utils/duration";

interface CheckoutSuccessPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export const unstable_dynamicStaleTime = 30;

const firstValue = (value: string | string[] | undefined): string | null =>
  (Array.isArray(value) ? value[0] : value) ?? null;

export async function generateMetadata({ params }: CheckoutSuccessPageProps): Promise<Metadata> {
  const { slug } = await params;
  const [store, t] = await Promise.all([
    getStoreBySlug(slug),
    getTranslations("storefront.checkout"),
  ]);

  if (!store) {
    return { title: t("success.requestTitle") };
  }

  return generateStoreMetadata(store, {
    title: `${t("success.requestTitle")} - ${store.name}`,
    noIndex: true,
  });
}

/**
 * Where a sent request lands. The reservation is read back by its number and
 * store — the same pair the renter saw a second ago — so a stranger who
 * guesses an id gets nothing beyond that store's own reservation numbers.
 */
const CheckoutSuccessPage = async ({ params, searchParams }: CheckoutSuccessPageProps) => {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const store = await getStoreBySlug(slug);

  if (!store) {
    notFound();
  }

  const number = firstValue(query.number);
  const t = await getTranslations("storefront.checkout");

  const reservation = number
    ? await db.query.reservations.findFirst({
        where: and(eq(reservations.storeId, store.id), eq(reservations.number, number)),
        columns: {
          id: true,
          number: true,
          startDate: true,
          endDate: true,
          totalAmount: true,
        },
      })
    : null;

  const items = reservation
    ? await db.query.reservationItems.findMany({
        where: eq(reservationItems.reservationId, reservation.id),
        orderBy: (rows, { asc: order }) => [order(rows.createdAt)],
        columns: { id: true, quantity: true, totalPrice: true, productSnapshot: true },
      })
    : [];

  const period = reservation
    ? (() => {
        const dateFormat = new Intl.DateTimeFormat(defaultLocale, {
          day: "numeric",
          month: "short",
        });
        const { days, hours } = getDetailedDuration(reservation.startDate, reservation.endDate);
        const duration =
          days === 0
            ? `${hours} ${t("hourAbbreviation")}`
            : hours === 0
              ? `${days} ${t("dayAbbreviation")}`
              : `${days} ${t("dayAbbreviation")} ${hours} ${t("hourAbbreviation")}`;
        return `${dateFormat.format(reservation.startDate)} → ${dateFormat.format(reservation.endDate)} · ${duration}`;
      })()
    : null;

  return (
    <>
      <StorefrontPageRefresh renderedAt={Date.now()} />
      <StorefrontSection
        spacing="tight"
        className="light min-h-dvh bg-background py-8 text-foreground sm:py-12"
      >
        <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
          <div className="flex flex-col gap-3 rounded-2xl bg-card p-4 shadow-card sm:p-6">
            <CheckCircle2 aria-hidden className="size-8 text-success" />
            <h1 className="text-2xl font-semibold leading-tight tracking-tight">
              {t("success.requestTitle")}
            </h1>
            <p className="text-sm text-muted-foreground">{t("managerCallback")}</p>

            {reservation && (
              <>
                <p className="text-sm">
                  {t("success.reservationNumber")}: <strong>{reservation.number}</strong>
                </p>

                {items.length > 0 && (
                  <>
                    <Separator />
                    <ul className="flex flex-col gap-2">
                      {items.map((item) => (
                        <li
                          key={item.id}
                          className="flex items-baseline justify-between gap-3 text-sm"
                        >
                          <span className="min-w-0 truncate">
                            {item.productSnapshot?.name ?? ""} × {item.quantity}
                          </span>
                          <Price amount={Number(item.totalPrice)} size="sm" />
                        </li>
                      ))}
                    </ul>
                  </>
                )}

                {period && <p className="text-sm text-muted-foreground">{period}</p>}

                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="text-muted-foreground">{t("pricing.estimate")}</span>
                  <Price amount={Number(reservation.totalAmount)} size="sm" />
                </div>
              </>
            )}

            <Separator />

            <StorefrontLink href={`/${slug}`} className="text-sm underline underline-offset-4">
              {t("success.backToStore")}
            </StorefrontLink>
          </div>
        </div>
      </StorefrontSection>
    </>
  );
};

export default CheckoutSuccessPage;
