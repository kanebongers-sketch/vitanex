import { SITE } from "@rv/config/site";
import { JsonLd } from "./JsonLd";

/**
 * Organization + WebSite structured data voor de hele site.
 * Mount een keer in de root layout: <SiteJsonLd />.
 */
function buildGraph(): Record<string, unknown> {
  const organizationId = `${SITE.url}/#organization`;
  const sameAs = [SITE.social.instagram].filter((url) => url.length > 0);

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": organizationId,
        name: SITE.brandName,
        legalName: SITE.company.legalName,
        url: SITE.url,
        logo: `${SITE.url}/icon`,
        description: SITE.description,
        email: SITE.contact.email,
        telephone: SITE.contact.phone,
        vatID: SITE.company.vat,
        address: {
          "@type": "PostalAddress",
          streetAddress: SITE.company.street,
          addressLocality: SITE.company.postalCity,
          addressCountry: "NL",
        },
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "customer service",
          email: SITE.contact.email,
          availableLanguage: ["nl"],
          areaServed: [...SITE.shipping.countries],
        },
        ...(sameAs.length > 0 ? { sameAs } : {}),
      },
      {
        "@type": "WebSite",
        "@id": `${SITE.url}/#website`,
        url: SITE.url,
        name: SITE.brandName,
        description: SITE.description,
        inLanguage: "nl-NL",
        publisher: { "@id": organizationId },
      },
    ],
  };
}

export function SiteJsonLd() {
  return <JsonLd data={buildGraph()} />;
}
