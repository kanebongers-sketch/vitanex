import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { SITE } from "@rv/config/site";
import { getAllProducts, getPacksFor, getProductBySlug } from "@rv/lib/commerce";
import type { Product } from "@rv/lib/commerce";
import { packSavings, pricePerKit } from "@rv/lib/packs";
import type { PackOption } from "@rv/components/product/PackSelector";
import { formatMoney } from "@rv/lib/format";
import { Container } from "@rv/components/ui/Container";
import { Eyebrow } from "@rv/components/ui/Eyebrow";
import { Faq } from "@rv/components/ui/Faq";
import { BuyBox } from "@rv/components/product/BuyBox";
import { CheckoutCancelledNotice } from "@rv/components/product/CheckoutCancelledNotice";
import { ProductGallery } from "@rv/components/product/ProductGallery";
import { KitContents } from "@rv/components/product/KitContents";
import { ShippingInfo, SpecList } from "@rv/components/product/ProductDetails";
import { Reviews } from "@rv/components/home/Reviews";
import { TrackViewItem } from "@rv/components/product/TrackViewItem";
import { ProductJsonLd } from "@rv/components/product/ProductJsonLd";
import { Comparison, SystemPillars } from "@rv/components/product/ProductStory";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllProducts().map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) return {};
  const path = `/product/${product.slug}`;
  const title = `${product.name} | ${formatMoney(product.price)}`;
  return {
    title,
    description: product.description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      title: `${title} · ${SITE.brandName}`,
      description: product.tagline,
      url: path,
      siteName: SITE.brandName,
      locale: SITE.locale,
      // Zonder deze regel valt de standaard share-afbeelding weg zodra een pagina eigen openGraph zet
      images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: product.name }],
    },
  };
}

function toPackOptions(base: Product): PackOption[] {
  return getPacksFor(base.id).map((pack) => {
    const units = pack.packSize ?? 1;
    const savings = packSavings(base, pack);
    return {
      id: pack.id,
      title: units === 1 ? "Solo · 1 kit" : `Duo · ${units} kits`,
      detail: units === 1 ? "Voor jezelf" : `Voor jou en je partner of trainingsmaatje · ${formatMoney(pricePerKit(pack))} per kit`,
      priceLabel: formatMoney(pack.price),
      priceValue: pack.price.amount / 100,
      savingsLabel: savings.amount > 0 ? `Je bespaart ${formatMoney(savings)}` : undefined,
    };
  });
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) notFound();

  return (
    <>
      <ProductJsonLd product={product} />
      <TrackViewItem value={product.price.amount / 100} itemId={product.id} />

      <section aria-label={product.name} className="pb-section-sm pt-4 sm:pt-8">
        <Container>
          <Suspense fallback={null}>
            <CheckoutCancelledNotice />
          </Suspense>
          <div className="grid gap-8 md:grid-cols-12 md:gap-10 lg:gap-16">
            <div className="md:col-span-7">
              <ProductGallery media={product.media} productName={product.name} />
            </div>
            <div className="md:col-span-5">
              <div className="md:sticky md:top-28">
                <BuyBox
                  productId={product.id}
                  name={product.name}
                  tagline={product.tagline}
                  priceLabel={formatMoney(product.price)}
                  priceValue={product.price.amount / 100}
                  highlights={product.highlights}
                  imageSrc={product.media[0]?.src}
                  packs={toPackOptions(product)}
                  boxItems={[
                    ...product.contents.filter((item) => item.id !== "card").map((item) => item.name),
                    "14-dagenprogramma (3 varianten)",
                    "Premium opbergdoos",
                  ]}
                />
              </div>
            </div>
          </div>
        </Container>
      </section>

      <div className="border-t border-line py-section-sm">
        <Container>
          <KitContents items={product.contents} />
        </Container>
      </div>
      <div className="py-section-sm">
        <Container>
          <SystemPillars />
        </Container>
      </div>
      <div className="border-t border-line py-section-sm">
        <Container>
          <Comparison />
        </Container>
      </div>
      <div className="border-t border-line py-section-sm">
        <Container>
          <SpecList specs={product.specs} />
        </Container>
      </div>
      <ShippingInfo />
      <Reviews />
      <div className="py-section">
        <Container>
          <section aria-labelledby="veelgestelde-vragen" className="grid gap-10 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-4">
              <Eyebrow index="07">Vragen</Eyebrow>
              <h2 id="veelgestelde-vragen" className="mt-5 font-display text-display-lg uppercase">
                Veel&shy;gestelde vragen.
              </h2>
            </div>
            <Faq items={product.faq} className="lg:col-span-8" />
          </section>
        </Container>
      </div>
    </>
  );
}
