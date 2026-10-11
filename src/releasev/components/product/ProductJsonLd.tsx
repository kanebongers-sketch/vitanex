import { SITE } from "@rv/config/site";
import type { Product } from "@rv/lib/commerce/types";
import { toDecimalString } from "@rv/lib/format";
import { JsonLd } from "@rv/components/seo/JsonLd";
import { isStockImage } from "@rv/config/images";
import { REVIEWS } from "@rv/content/reviews";
import { summarizeReviews } from "@rv/lib/reviews";

function absoluteUrl(path: string): string {
  return path.startsWith("http") ? path : `${SITE.url}${path}`;
}

function shippingDetails() {
  return SITE.shipping.countries.map((country) => ({
    "@type": "OfferShippingDetails",
    shippingRate: { "@type": "MonetaryAmount", value: "0", currency: "EUR" },
    shippingDestination: { "@type": "DefinedRegion", addressCountry: country },
    deliveryTime: {
      "@type": "ShippingDeliveryTime",
      handlingTime: { "@type": "QuantitativeValue", minValue: 0, maxValue: 1, unitCode: "DAY" },
      transitTime: { "@type": "QuantitativeValue", minValue: 1, maxValue: 2, unitCode: "DAY" },
    },
  }));
}

function returnPolicy() {
  return {
    "@type": "MerchantReturnPolicy",
    applicableCountry: [...SITE.shipping.countries],
    returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
    merchantReturnDays: SITE.shipping.returnDays,
    returnMethod: "https://schema.org/ReturnByMail",
  };
}

/** Alleen echte reviews: zonder reviews geen rating-markup. */
function reviewMarkup() {
  const summary = summarizeReviews(REVIEWS);
  if (summary.average === null) return {};
  return {
    aggregateRating: { "@type": "AggregateRating", ratingValue: summary.average, reviewCount: summary.count, bestRating: 5, worstRating: 1 },
    review: REVIEWS.slice(0, 10).map((item) => ({
      "@type": "Review",
      author: { "@type": "Person", name: item.author },
      datePublished: item.date,
      reviewBody: item.body,
      reviewRating: { "@type": "Rating", ratingValue: item.rating, bestRating: 5, worstRating: 1 },
    })),
  };
}

/** schema.org Product. Stockfoto's worden bewust niet als productbeeld opgegeven. */
export function ProductJsonLd({ product }: { product: Product }) {
  const url = `${SITE.url}/product/${product.slug}`;
  const images = product.media
    .filter((item) => item.src && !isStockImage(item.src))
    .map((item) => absoluteUrl(item.src as string));

  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        description: product.description,
        sku: product.sku,
        brand: { "@type": "Brand", name: SITE.brandName },
        image: images.length > 0 ? images : [`${SITE.url}/opengraph-image`],
        url,
        ...reviewMarkup(),
        offers: {
          "@type": "Offer",
          url,
          price: toDecimalString(product.price),
          priceCurrency: product.price.currency,
          availability: "https://schema.org/InStock",
          itemCondition: "https://schema.org/NewCondition",
          shippingDetails: shippingDetails(),
          hasMerchantReturnPolicy: returnPolicy(),
        },
      }}
    />
  );
}
