import { SITE } from "@rv/config/site";
import type { LegalDocument } from "@rv/components/legal/LegalPage";
import { COMPANY_IDENTITY, LEGAL_UPDATED } from "./shared";

/**
 * RETOURBELEID — concept volgens het wettelijke herroepingsrecht bij koop
 * op afstand, inclusief het modelformulier voor herroeping (Bijlage I
 * bij art. 6:230o BW). Vul retourkosten en retouradres in.
 */
const days = SITE.shipping.returnDays;

const companyLine = `${SITE.company.legalName} (${SITE.brandName}), ${SITE.company.street}, ${SITE.company.postalCity}, ${SITE.company.country}, ${SITE.contact.email}`;

export const RETOURBELEID: LegalDocument = {
  path: "/retourbeleid",
  title: "Retourbeleid",
  description: `Retourneren bij ${SITE.brandName}: ${days} dagen bedenktijd na ontvangst, zo meld je een retour, en wanneer je je geld terugkrijgt. Inclusief modelformulier voor herroeping.`,
  intro: `Past de kit toch niet bij je? Je hebt ${days} dagen bedenktijd. Hieronder staat stap voor stap hoe retourneren werkt.`,
  updated: LEGAL_UPDATED,
  sections: [
    {
      id: "bedenktijd",
      title: "Bedenktijd",
      blocks: [
        { kind: "p", text: `Je mag je bestelling binnen ${days} dagen zonder opgave van reden herroepen. De bedenktijd begint op de dag nadat jij, of iemand die je hebt aangewezen, het pakket hebt ontvangen.` },
      ],
    },
    {
      id: "stappen",
      title: "Zo werkt retourneren",
      blocks: [
        {
          kind: "list",
          items: [
            `Meld je retour binnen ${days} dagen na ontvangst. Stuur een e-mail naar ${SITE.contact.email} met je naam en bestelnummer, of gebruik het modelformulier onderaan deze pagina.`,
            "Je ontvangt van ons een bevestiging met het retouradres en verdere instructies.",
            `Stuur het product binnen ${days} dagen na je melding terug, goed verpakt, bij voorkeur in de originele doos.`,
            `We betalen het aankoopbedrag, inclusief eventuele standaard verzendkosten, binnen ${days} dagen na je melding terug via dezelfde betaalmethode. We mogen wachten met terugbetalen tot we het product hebben ontvangen of tot je aantoont dat je het hebt teruggestuurd.`,
          ],
        },
      ],
    },
    {
      id: "retourkosten",
      title: "Retourkosten",
      blocks: [
        { kind: "p", text: "[RETOURKOSTEN: kies een optie en verwijder de andere] Optie A: De kosten voor het terugsturen zijn voor jouw rekening. Optie B: Je ontvangt van ons een gratis retourlabel." },
        { kind: "p", text: "Stuur je retour aangetekend of met track-and-trace en bewaar het verzendbewijs. Zo kun je aantonen dat het pakket is verstuurd." },
      ],
    },
    {
      id: "staat-van-product",
      title: "Staat van het product",
      blocks: [
        { kind: "p", text: "Tijdens de bedenktijd mag je het product uitpakken en bekijken zoals je dat in een winkel zou doen. Ga er zorgvuldig mee om." },
        { kind: "p", text: "Is het product meer gebruikt dan nodig om de aard, kenmerken en werking vast te stellen, of is het beschadigd of vuil, dan kunnen we een vergoeding voor de waardevermindering in rekening brengen." },
        { kind: "p", text: "Stuur de kit zo compleet mogelijk terug, inclusief alle tools, de doos en de QR-kaart." },
      ],
    },
    {
      id: "defect",
      title: "Product beschadigd of niet in orde?",
      blocks: [
        { kind: "p", text: `Is er iets mis met je kit bij ontvangst? Dat valt niet onder de bedenktijd maar onder de wettelijke garantie. Mail ons met een foto via ${SITE.contact.email}, dan zorgen we voor een passende oplossing. De kosten hiervan zijn voor ons.` },
      ],
    },
    {
      id: "gegevens",
      title: "Onze gegevens",
      blocks: [COMPANY_IDENTITY, { kind: "p", text: "Let op: het adres hierboven is niet automatisch het retouradres. Je ontvangt het retouradres na je melding." }],
    },
    {
      id: "modelformulier",
      title: "Modelformulier voor herroeping",
      blocks: [
        { kind: "p", text: "Dit formulier is wettelijk vastgesteld. Je bent niet verplicht het te gebruiken: een e-mail met dezelfde informatie is ook voldoende. Kopieer de tekst, vul hem in en stuur hem naar ons." },
        {
          kind: "form",
          title: "Modelformulier voor herroeping",
          lines: [
            "(dit formulier alleen invullen en terugzenden wanneer u de overeenkomst wilt herroepen)",
            `Aan: ${companyLine}`,
            "Ik/Wij* deel/delen* u hierbij mede dat ik/wij* onze overeenkomst betreffende de verkoop van de volgende goederen herroep/herroepen*:",
            "…………………………………………………………",
            "Besteld op* / ontvangen op*: ……………………",
            "Bestelnummer: ……………………",
            "Naam/Namen consument(en): ……………………",
            "Adres consument(en): ……………………",
            "Handtekening van consument(en) (alleen wanneer dit formulier op papier wordt ingediend): ……………………",
            "Datum: ……………………",
            "* Doorhalen wat niet van toepassing is.",
          ],
        },
      ],
    },
  ],
};
