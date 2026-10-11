import { SITE } from "@rv/config/site";
import type { LegalDocument } from "@rv/components/legal/LegalPage";
import { COMPANY_IDENTITY, LEGAL_UPDATED } from "./shared";

/**
 * COOKIEBELEID — sluit aan op de werking van de cookiebanner
 * (src/components/consent) en de tracking-loader (Analytics.tsx).
 * Pas aan als je andere tools gaat gebruiken.
 */
export const COOKIEBELEID: LegalDocument = {
  path: "/cookiebeleid",
  title: "Cookiebeleid",
  description: `Welke cookies en vergelijkbare technieken ${SITE.brandName} gebruikt, waarvoor, en hoe je je keuze op elk moment wijzigt.`,
  intro: "Alleen wat nodig is om de webshop te laten werken staat standaard aan. Analytische en marketingcookies plaatsen we pas nadat je daar toestemming voor geeft.",
  updated: LEGAL_UPDATED,
  sections: [
    {
      id: "wat-zijn-cookies",
      title: "Wat zijn cookies?",
      blocks: [
        { kind: "p", text: "Cookies zijn kleine tekstbestanden die een website op je apparaat opslaat. Vergelijkbare technieken, zoals localStorage in je browser en trackingpixels, vallen in dit beleid ook onder ‘cookies’." },
      ],
    },
    {
      id: "noodzakelijk",
      title: "Noodzakelijke cookies",
      blocks: [
        { kind: "p", text: "Deze zijn nodig om de webshop te laten werken. Hiervoor is geen toestemming vereist en ze staan altijd aan." },
        {
          kind: "definitions",
          items: [
            { term: "Winkelwagen", description: "Onthoudt welke producten in je winkelwagen zitten (localStorage). Blijft bewaard tot je de winkelwagen leegt of je browsergegevens wist." },
            { term: "Cookie-keuze", description: "Onthoudt welke cookies je hebt toegestaan, zodat we het niet bij elk bezoek opnieuw vragen (localStorage, sleutel ‘cookie-consent’). Blijft bewaard tot je je browsergegevens wist." },
            { term: "Betaling", description: "Tijdens het afrekenen kan Stripe functionele cookies plaatsen om de betaling veilig te verwerken en fraude te voorkomen." },
          ],
        },
      ],
    },
    {
      id: "analytisch",
      title: "Analytische cookies",
      blocks: [
        { kind: "p", text: "Alleen met je toestemming. Hiermee zien we hoe bezoekers de website gebruiken, zodat we deze kunnen verbeteren." },
        {
          kind: "definitions",
          items: [
            { term: "Google Analytics 4", description: "Cookies _ga en _ga_* van Google. Meten bezoeken, paginaweergaven en aankopen. Bewaartermijn maximaal 2 jaar. We gebruiken Google Consent Mode: zonder toestemming worden geen analytische cookies geplaatst." },
          ],
        },
      ],
    },
    {
      id: "marketing",
      title: "Marketingcookies",
      blocks: [
        { kind: "p", text: "Alleen met je toestemming. Hiermee meten we de resultaten van advertenties en kunnen we relevante advertenties tonen op andere platforms." },
        {
          kind: "definitions",
          items: [
            { term: "Meta Pixel", description: "Cookie _fbp van Meta (Facebook en Instagram). Meet onder andere het toevoegen aan de winkelwagen en aankopen. Bewaartermijn maximaal 3 maanden." },
          ],
        },
      ],
    },
    {
      id: "wijzigen",
      title: "Je keuze wijzigen",
      blocks: [
        { kind: "p", text: "Bij je eerste bezoek kies je zelf: ‘Alleen noodzakelijk’, ‘Alles accepteren’ of je eigen instellingen. Je kunt je keuze op elk moment aanpassen of intrekken via de link ‘Cookie-instellingen’ onderaan elke pagina." },
        { kind: "p", text: "Je kunt cookies ook verwijderen of blokkeren via de instellingen van je browser. De webshop werkt dan mogelijk minder goed; je winkelwagen wordt dan bijvoorbeeld niet onthouden." },
      ],
    },
    {
      id: "contact",
      title: "Vragen",
      blocks: [
        { kind: "p", text: "Meer over hoe we met persoonsgegevens omgaan, lees je in ons privacybeleid. Vragen over cookies kun je stellen via:" },
        COMPANY_IDENTITY,
      ],
    },
  ],
};
