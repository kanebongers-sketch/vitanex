import { SITE } from "@rv/config/site";
import type { LegalBlock } from "@rv/components/legal/LegalPage";

/**
 * Gedeelde bouwstenen voor de juridische teksten.
 * Vul de datum in zodra een jurist de teksten heeft gecontroleerd.
 */
export const LEGAL_UPDATED = "[DATUM]";

/** Volledige bedrijfsgegevens, zichtbaar weergegeven op elke juridische pagina. */
export const COMPANY_IDENTITY: LegalBlock = {
  kind: "definitions",
  items: [
    { term: "Handelsnaam", description: SITE.brandName },
    { term: "Statutaire naam", description: SITE.company.legalName },
    { term: "Adres", description: `${SITE.company.street}, ${SITE.company.postalCity}, ${SITE.company.country}` },
    { term: "KvK-nummer", description: SITE.company.kvk },
    { term: "Btw-nummer", description: SITE.company.vat },
    { term: "E-mail", description: SITE.contact.email },
    { term: "Telefoon", description: SITE.contact.phone },
  ],
};
