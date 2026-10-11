import { SITE } from "@rv/config/site";

/**
 * Quote van Kane over consistentie en herstel.
 * Wordt gebruikt op de homepage en op Over ons (één bron, overal gelijk).
 * Een regel met `emphasis` toont het woord in de accentkleur.
 */
export const KANE_QUOTE = {
  lines: [
    { text: "Consistentie bouwt je op." },
    { text: "Herstel zorgt dat je kunt blijven bouwen.", emphasis: "Herstel" },
  ],
  author: SITE.trainer.name,
  role: "Personal trainer en manager van 8 PT-locaties",
} as const;

/** De volledige quote als platte tekst (voor schermlezers en metadata). */
export const KANE_QUOTE_TEXT = KANE_QUOTE.lines.map((line) => line.text).join(" ");
