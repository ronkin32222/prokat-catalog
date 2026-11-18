import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getLocale, getTranslations } from "next-intl/server";

import { GoogleRatingPill } from "@/components/storefront/home/google-rating-pill";
import { HomeInventory } from "@/components/storefront/home/home-inventory";
import { HomePeriodSearch } from "@/components/storefront/home/home-period-search";
import { StoreAbout } from "@/components/storefront/home/store-about";
import { StoreBenefits } from "@/components/storefront/home/store-benefits";
import { StoreConsultation } from "@/components/storefront/home/store-consultation";
import { StoreHero } from "@/components/storefront/home/store-hero";
import { StoreLocation } from "@/components/storefront/home/store-location";
import { StoreTestimonials } from "@/components/storefront/home/store-testimonials";
import { PageTracker } from "@/components/storefront/page-tracker";
import { JsonLd, generateLocalBusinessSchema, generateStoreMetadata, generateWebSiteSchema, stripHtml } from "@/lib/seo";
import { getStoreBySlug } from "@/lib/storefront/get-store-by-slug";
import { loadHomePage } from "@/lib/storefront/home.queries";
import { resolveStoreContactChannels } from "@/lib/storefront/util.store-contact";
import { buildOpeningHoursSpecification } from "@/lib/utils/util.opening-hours";
import { getStorePeriodRules } from "@/lib/utils/util.store-period-rules";

interface StorefrontPageProps {
  params: Promise<{ slug: string }>;
}

// Keep public browse pages in the router cache for five minutes.
export const unstable_dynamicStaleTime = 300;

/** Same rule as the reviews block: only recommendations reach the storefront. */
const MIN_HOME_REVIEW_RATING = 4;

export const generateMetadata = async ({ params }: StorefrontPageProps): Promise<Metadata> => {
  const { slug } = await params;
  const [store, t, locale] = await Promise.all([
    getStoreBySlug(slug),
    getTranslations("storefront.meta"),
    getLocale(),
  ]);

  if (!store) {
    return { title: t("storeNotFound") };
  }

  return generateStoreMetadata(store, {
    title: t("homeTitle", { store: store.name }),
    description:
      stripHtml(store.tagline || "") ||
      (store.description ? stripHtml(store.description) : t("description", { store: store.name })),
    locale,
  });
};

const StorefrontPage = async ({ params }: StorefrontPageProps) => {
  const { slug } = await params;
  const t = await getTranslations("storefront");
  const data = await loadHomePage(slug, {
    others: t("availability.categoryBrowse.others"),
    othersDescription: t("availability.categoryBrowse.othersDescription"),
    all: t("catalog.allProducts"),
  });

  if (!data) {
    notFound();
  }

  const { store, settings, inventory, place, sections } = data;
  const ratingHref = place.showReviews ? "#reviews" : (place.details?.mapsUrl ?? null);
  // The hero photo is the first picture of the featured products; the bundled drill photo stands in until one exists.
  const heroPhoto =
    inventory.products.find((product) => product.images?.[0])?.images?.[0] ??
    "/demo/hero-drill.webp";
  const reviews =
    sections.reviews && place.showReviews && place.details
      ? place.details.reviews
          .filter((review) => review.rating >= MIN_HOME_REVIEW_RATING)
          .map((review) => ({
            authorName: review.authorName,
            rating: review.rating,
            text: review.text,
          }))
      : [];

  return (
    <>
      <PageTracker page="home" />
      <JsonLd
        data={[
          generateLocalBusinessSchema(store, {
            openingHoursSpecification: buildOpeningHoursSpecification(settings.businessHours),
            mapUrl: place.details?.mapsUrl,
          }),
          generateWebSiteSchema(store),
        ]}
      />

      <StoreHero
        photo={heroPhoto}
        badges={
          sections.reviews && place.rating !== null ? (
            <GoogleRatingPill rating={place.rating} reviewCount={place.reviewCount} href={ratingHref} />
          ) : undefined
        }
      >
        <HomePeriodSearch rules={getStorePeriodRules(settings)} />
      </StoreHero>

      <HomeInventory inventory={inventory} />
      <StoreAbout />
      <StoreBenefits />
      <StoreConsultation />
      <StoreTestimonials reviews={reviews} />

      {sections.map && store.address ? (
        <StoreLocation
          name={store.name}
          address={store.address}
          contact={resolveStoreContactChannels(store)}
          latitude={store.latitude}
          longitude={store.longitude}
        />
      ) : null}
    </>
  );
};

export default StorefrontPage;
