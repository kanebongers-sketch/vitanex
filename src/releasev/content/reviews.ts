/**
 * KLANTREVIEWS
 *
 * Voeg hier uitsluitend ECHTE reviews toe van echte klanten, met hun
 * toestemming (bijv. uit je reviewplatform of een e-mail na aankoop).
 * Verzonnen reviews, namen, sterren of aantallen zijn misleidend en verboden
 * volgens de Europese consumentenregels (Omnibus-richtlijn).
 *
 * Zolang deze lijst leeg is:
 * - is de reviewsectie op de live site verborgen;
 * - zie je tijdens ontwikkelen (npm run dev) lege voorbeeldkaarten.
 * Zodra er reviews staan, verschijnen ze automatisch op home en productpagina,
 * inclusief gemiddelde score en schema.org-markup voor Google.
 *
 * Voorbeeld van een review:
 * {
 *   author: "Sanne",            // voornaam of initialen, met toestemming
 *   location: "Utrecht",        // optioneel
 *   rating: 5,                  // 1 t/m 5
 *   title: "Eindelijk een vaste routine",
 *   body: "Na het hardlopen pak ik nu elke avond de roller...",
 *   date: "2026-11-02",         // ISO-datum van de review
 *   variant: "Hardlopen",       // optioneel: gevolgde programmavariant
 *   isVerifiedPurchase: true,   // alleen true als de aankoop is gecontroleerd
 * },
 */
export interface Review {
  author: string;
  location?: string;
  rating: 1 | 2 | 3 | 4 | 5;
  title?: string;
  body: string;
  date: string;
  variant?: string;
  isVerifiedPurchase: boolean;
}

export const REVIEWS: readonly Review[] = [];
