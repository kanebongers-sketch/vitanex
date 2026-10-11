/**
 * Commerce-types. Bewust los van de databron gehouden, zodat je later
 * Shopify (Storefront API) kunt aansluiten zonder de UI te herschrijven.
 */
export interface Money {
  /** Bedrag in centen, incl. btw */
  amount: number;
  currency: "EUR";
}

export interface ProductMedia {
  id: string;
  /** Wat er op de placeholder staat: welke foto hier moet komen */
  placeholderLabel: string;
  alt: string;
  /** "video" voor how-to clips in de galerij (standaard "foto") */
  kind?: "foto" | "video";
  /** Pad naar een echte foto in /public, bijv. "/images/kit-hero.jpg". Leeg = placeholder */
  src?: string;
  /** Posterfoto voor een video die nog niet bestaat (toont foto + play + "Video volgt") */
  poster?: string;
}

export interface KitItem {
  id: string;
  name: string;
  detail: string;
  use: string;
  /** Lichaamszones waarvoor deze tool bedoeld is ("Gebruik het voor") */
  zones: readonly string[];
  /** Foto van de tool (pad in /public of tijdelijke stockfoto uit IMAGES) */
  image?: { src: string; alt: string };
}

export interface Spec {
  label: string;
  value: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  price: Money;
  sku: string;
  /** Naam van een optionele env-variabele met een Stripe Price-ID */
  stripePriceEnv?: string;
  highlights: readonly string[];
  media: readonly ProductMedia[];
  contents: readonly KitItem[];
  specs: readonly Spec[];
  faq: readonly FaqItem[];
  /** false = geen eigen productpagina (bijv. een pakketvariant). Standaard true. */
  isListed?: boolean;
  /** Aantal kits in dit pakket (1 = solo, 2 = duo). Standaard 1. */
  packSize?: number;
  /** Id van het basisproduct waarvan dit een pakketvariant is */
  packOf?: string;
}
