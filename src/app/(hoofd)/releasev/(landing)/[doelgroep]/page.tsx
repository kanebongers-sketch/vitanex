import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isStockImage } from "@rv/config/images";
import { SITE } from "@rv/config/site";
import { getFeaturedProduct } from "@rv/lib/commerce";
import { formatMoney } from "@rv/lib/format";
import {
  LANDING_SLUGS,
  getBoxItems,
  getLanding,
  getLandingTools,
  getLandingVariant,
  isLandingSlug,
} from "@rv/content/landing";
import { Reviews } from "@rv/components/home/Reviews";
import { AudienceTools } from "@rv/components/landing/AudienceTools";
import { LANDING_HERO_ID, LandingHero } from "@rv/components/landing/LandingHero";
import { LandingFaq } from "@rv/components/landing/LandingFaq";
import { LandingStickyBar } from "@rv/components/landing/LandingStickyBar";
import { OFFER_ID, OfferBlock } from "@rv/components/landing/OfferBlock";
import { SAMPLE_DAY_ID, SampleDay } from "@rv/components/landing/SampleDay";
import { Situations } from "@rv/components/landing/Situations";

interface LandingPageProps {
  params: Promise<{ doelgroep: string }>;
}

export const dynamicParams = false;

/** Unsplash-foto's kunnen via URL-parameters op 1200x630 worden bijgesneden; eigen foto's blijven ongewijzigd. */
function ogImageUrl(src: string): string {
  return isStockImage(src) ? `${src}?w=1200&h=630&fit=crop&q=70` : src;
}

export function generateStaticParams() {
  return LANDING_SLUGS.map((doelgroep) => ({ doelgroep }));
}

export async function generateMetadata({ params }: LandingPageProps): Promise<Metadata> {
  const { doelgroep } = await params;
  if (!isLandingSlug(doelgroep)) return {};
  const { meta, hero } = getLanding(doelgroep);
  const path = `/${doelgroep}`;
  return {
    title: meta.title,
    description: meta.description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      title: `${meta.title} · ${SITE.brandName}`,
      description: meta.description,
      url: path,
      siteName: SITE.brandName,
      locale: SITE.locale,
      images: [{ url: ogImageUrl(hero.image.src), width: 1200, height: 630, alt: hero.image.alt }],
    },
  };
}

/** Ad-landingspagina per doelgroep: een boodschap, een actie (kit in winkelwagen). */
export default async function LandingPage({ params }: LandingPageProps) {
  const { doelgroep } = await params;
  if (!isLandingSlug(doelgroep)) notFound();

  const landing = getLanding(doelgroep);
  const variant = getLandingVariant(landing);
  const product = getFeaturedProduct();
  const priceLabel = formatMoney(product.price);
  const priceValue = product.price.amount / 100;

  return (
    <>
      <LandingHero
        hero={landing.hero}
        productId={product.id}
        priceLabel={priceLabel}
        priceValue={priceValue}
        howItWorksHref={`#${SAMPLE_DAY_ID}`}
      />
      <Situations situations={landing.situations} />
      <AudienceTools intro={landing.tools} tools={getLandingTools(landing, product.contents)} />
      <SampleDay intro={landing.day} variant={variant} />
      <Reviews />
      <OfferBlock
        intro={landing.offer}
        productId={product.id}
        productName={product.name}
        priceLabel={priceLabel}
        priceValue={priceValue}
        boxItems={getBoxItems(variant, product.contents)}
      />
      <LandingFaq items={landing.faq} />
      <LandingStickyBar
        productId={product.id}
        label="In winkelwagen"
        priceLabel={priceLabel}
        priceValue={priceValue}
        heroId={LANDING_HERO_ID}
        offerId={OFFER_ID}
      />
    </>
  );
}
