/**
 * SITECONFIG — merknaam, bedrijfsgegevens, contact en navigatie.
 * Alles tussen [HAKEN] is een placeholder die je moet invullen voor livegang.
 */
export const SITE = {
  brandName: "RELEASE V",
  tagline: "Herstel dat je volhoudt.",
  description:
    "Premium recovery- en mobilitykit met 14-dagen videoprogramma, ontwikkeld door een ervaren personal trainer. Gratis verzending in Nederland en België.",
  // Standaard het live domein; lokaal: NEXT_PUBLIC_RELEASEV_SITE_URL=http://releasev.localhost:3000
  url: (process.env.NEXT_PUBLIC_RELEASEV_SITE_URL ?? "https://releasev.nl").replace(/\/$/, ""),
  locale: "nl_NL",
  language: "nl",

  contact: {
    email: "[E-MAILADRES]",
    phone: "[TELEFOONNUMMER]",
    responseTime: "We reageren binnen een werkdag.",
  },

  company: {
    legalName: "[BEDRIJFSNAAM]",
    kvk: "[KVK-NUMMER]",
    vat: "[BTW-NUMMER]",
    street: "[STRAAT EN HUISNUMMER]",
    postalCity: "[POSTCODE EN PLAATS]",
    country: "Nederland",
  },

  shipping: {
    countries: ["NL", "BE"] as const,
    freeLabel: "Gratis verzending in NL en BE",
    deliveryLabel: "Levering binnen 1 tot 2 werkdagen", // placeholder: stem af met je fulfilment
    returnDays: 14,
  },

  trainer: {
    name: "Kane",
    role: "Personal trainer, manager van 8 PT-locaties en opleider van trainers",
    /** Feiten voor vertrouwensblokken (home, over ons, productpagina) */
    credentials: [
      { value: "8", label: "PT-locaties" },
      { value: "Team", label: "van coaches op de vloer" },
      { value: "Opleider", label: "leidt zelf trainers op" },
    ],
  },

  social: {
    instagram: "", // bijv. "https://instagram.com/jouwmerk"
  },
} as const;

export const PRODUCT_PATH = "/product/recovery-mobility-kit";

export const MAIN_NAV = [
  { href: PRODUCT_PATH, label: "De kit" },
  { href: "/programma", label: "Het programma" },
  { href: "/kennis", label: "Kennis" },
  { href: "/over-ons", label: "Over ons" },
  { href: "/contact", label: "Contact" },
] as const;

export const LEGAL_NAV = [
  { href: "/algemene-voorwaarden", label: "Algemene voorwaarden" },
  { href: "/privacybeleid", label: "Privacybeleid" },
  { href: "/retourbeleid", label: "Retourbeleid" },
  { href: "/cookiebeleid", label: "Cookiebeleid" },
] as const;
