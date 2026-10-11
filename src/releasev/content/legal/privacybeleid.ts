import { SITE } from "@rv/config/site";
import type { LegalDocument } from "@rv/components/legal/LegalPage";
import { COMPANY_IDENTITY, LEGAL_UPDATED } from "./shared";

/**
 * PRIVACYBELEID — concept op basis van de AVG (GDPR).
 * Controleer de lijst met verwerkers en bewaartermijnen tegen je eigen
 * situatie en laat dit nakijken door een jurist voor livegang.
 */
export const PRIVACYBELEID: LegalDocument = {
  path: "/privacybeleid",
  title: "Privacybeleid",
  description: `Hoe ${SITE.brandName} omgaat met je persoonsgegevens: welke gegevens we verwerken, waarom, hoe lang, met wie we ze delen en welke rechten je hebt.`,
  intro: "We verwerken zo min mogelijk gegevens, alleen voor duidelijke doelen, en we verkopen je gegevens nooit. Hieronder lees je precies wat we doen.",
  updated: LEGAL_UPDATED,
  sections: [
    {
      id: "verantwoordelijke",
      title: "Wie is verantwoordelijk?",
      blocks: [
        { kind: "p", text: "De verwerkingsverantwoordelijke in de zin van de Algemene verordening gegevensbescherming (AVG) is:" },
        COMPANY_IDENTITY,
        { kind: "p", text: `Vragen over privacy kun je sturen naar ${SITE.contact.email}.` },
      ],
    },
    {
      id: "gegevens",
      title: "Welke gegevens verwerken we?",
      blocks: [
        {
          kind: "definitions",
          items: [
            { term: "Bestelling", description: "Naam, bezorgadres, factuuradres, e-mailadres, telefoonnummer (optioneel), bestelde producten en bestelnummer." },
            { term: "Betaling", description: "Betaalmethode, betaalstatus en transactie-ID. Volledige kaartgegevens worden alleen door Stripe verwerkt, niet door ons." },
            { term: "Contact", description: "Naam, e-mailadres, onderwerp en de inhoud van je bericht." },
            { term: "Websitegebruik", description: "Technische gegevens zoals IP-adres (voor beveiliging en misbruikpreventie) en, alleen met toestemming, analytische en marketinggegevens via cookies." },
          ],
        },
        { kind: "p", text: "Voor het videoprogramma is geen account nodig. We verwerken daarvoor geen extra persoonsgegevens. [CONTROLEER DIT BIJ DE GEKOZEN VIDEOHOSTING.]" },
      ],
    },
    {
      id: "doelen",
      title: "Doelen en grondslagen",
      blocks: [
        {
          kind: "definitions",
          items: [
            { term: "Bestelling uitvoeren", description: "Verwerken, verzenden en afhandelen van je bestelling, retour of herroeping. Grondslag: uitvoering van de overeenkomst." },
            { term: "Betaling", description: "Veilig afhandelen van je betaling. Grondslag: uitvoering van de overeenkomst." },
            { term: "Administratie", description: "Bewaren van facturen en bestelgegevens. Grondslag: wettelijke verplichting (fiscale bewaarplicht)." },
            { term: "Klantcontact", description: "Beantwoorden van je vragen via het contactformulier of e-mail. Grondslag: gerechtvaardigd belang, of uitvoering van de overeenkomst als het om je bestelling gaat." },
            { term: "Beveiliging", description: "Voorkomen van misbruik van de website, zoals spam via het contactformulier. Grondslag: gerechtvaardigd belang." },
            { term: "Reviewverzoek", description: "Een keer per bestelling, ongeveer anderhalve week na levering, vragen we per e-mail naar je ervaring. Grondslag: gerechtvaardigd belang. Je kunt hier altijd bezwaar tegen maken door op die mail te antwoorden." },
            { term: "Nieuwsbrief", description: "Maximaal een mail per maand met tips en nieuws, alleen als je je zelf inschrijft. Grondslag: toestemming. Uitschrijven kan via de link in elke mail." },
            { term: "Analyse", description: "Begrijpen hoe de website wordt gebruikt, om deze te verbeteren. Grondslag: toestemming." },
            { term: "Marketing", description: "Meten van advertenties en tonen van relevante advertenties. Grondslag: toestemming." },
          ],
        },
        { kind: "p", text: "Je kunt je toestemming altijd intrekken via ‘Cookie-instellingen’ onderaan elke pagina. Dat heeft geen invloed op de rechtmatigheid van de verwerking voor de intrekking." },
      ],
    },
    {
      id: "verwerkers",
      title: "Met wie delen we gegevens?",
      blocks: [
        { kind: "p", text: "We delen gegevens alleen met partijen die nodig zijn voor de doelen hierboven. Met verwerkers sluiten we een verwerkersovereenkomst." },
        {
          kind: "definitions",
          items: [
            { term: "Stripe", description: "Betaalprovider voor iDEAL, Bancontact, creditcard en Klarna. Stripe is voor een deel van de verwerking zelfstandig verantwoordelijke." },
            { term: "Klarna", description: "Alleen als je kiest voor achteraf betalen. Klarna voert dan een eigen (krediet)controle uit en is daarvoor zelfstandig verantwoordelijke." },
            { term: "Hosting", description: "Render (Render Services, Inc.) voor het hosten van de website." },
            { term: "Afbeeldingen", description: "Een deel van de foto’s wordt (tijdelijk) geladen vanaf Unsplash. Je browser maakt daarvoor verbinding met de servers van Unsplash, waarbij je IP-adres zichtbaar is voor Unsplash." },
            { term: "E-mail", description: "Resend voor het versturen van orderbevestigingen, een reviewverzoek na je aankoop, de nieuwsbrief (alleen als je je inschrijft) en het afhandelen van contactberichten." },
            { term: "Verzending", description: "[NAAM VERVOERDER / FULFILMENTPARTIJ] voor het bezorgen van je bestelling." },
            { term: "Google Analytics", description: "Alleen na je toestemming voor analytische cookies. IP-adressen worden door Google Analytics 4 niet opgeslagen." },
            { term: "Meta (Facebook/Instagram)", description: "Alleen na je toestemming voor marketingcookies: via de Meta Pixel in je browser en, voor een betrouwbare meting van bestellingen, via de Meta Conversions API. Daarbij sturen we je e-mailadres alleen versleuteld (gehasht) mee, samen met het bestelbedrag." },
          ],
        },
        { kind: "p", text: "Sommige van deze partijen kunnen gegevens buiten de Europese Economische Ruimte verwerken, bijvoorbeeld in de Verenigde Staten. Dat gebeurt alleen met passende waarborgen, zoals het EU-VS Data Privacy Framework of door de Europese Commissie goedgekeurde modelcontractbepalingen." },
        { kind: "p", text: "We verkopen je gegevens nooit aan derden. We verstrekken gegevens alleen aan andere partijen als we daartoe wettelijk verplicht zijn." },
      ],
    },
    {
      id: "bewaartermijnen",
      title: "Hoe lang bewaren we gegevens?",
      blocks: [
        {
          kind: "definitions",
          items: [
            { term: "Facturen en bestellingen", description: "7 jaar, vanwege de fiscale bewaarplicht." },
            { term: "Klantcontact", description: "Tot 2 jaar na het laatste contact, tenzij het bericht deel uitmaakt van de administratie van een bestelling." },
            { term: "Technische logs", description: "Maximaal [TERMIJN, bijv. 30 dagen]." },
            { term: "Cookies", description: "Zie het cookiebeleid voor de bewaartermijn per cookie." },
          ],
        },
      ],
    },
    {
      id: "beveiliging",
      title: "Beveiliging",
      blocks: [
        { kind: "p", text: "We nemen passende technische en organisatorische maatregelen om je gegevens te beschermen, zoals een versleutelde verbinding (HTTPS), beperkte toegang tot gegevens en het gebruik van betrouwbare verwerkers." },
      ],
    },
    {
      id: "rechten",
      title: "Jouw rechten",
      blocks: [
        { kind: "p", text: "Je hebt op grond van de AVG de volgende rechten:" },
        {
          kind: "list",
          items: [
            "Recht op inzage in de gegevens die we van je hebben.",
            "Recht op correctie van onjuiste gegevens.",
            "Recht op verwijdering, voor zover we de gegevens niet wettelijk moeten bewaren.",
            "Recht op beperking van de verwerking.",
            "Recht op overdraagbaarheid van je gegevens.",
            "Recht van bezwaar tegen verwerking op basis van gerechtvaardigd belang.",
            "Recht om je toestemming op elk moment in te trekken.",
          ],
        },
        { kind: "p", text: `Een verzoek kun je sturen naar ${SITE.contact.email}. We reageren binnen een maand. Om misbruik te voorkomen, kunnen we je vragen je te identificeren.` },
      ],
    },
    {
      id: "klacht",
      title: "Klacht indienen",
      blocks: [
        { kind: "p", text: "Ben je niet tevreden over hoe we met je gegevens omgaan? Laat het ons eerst weten, dan zoeken we samen naar een oplossing." },
        { kind: "p", text: "Je hebt ook het recht een klacht in te dienen bij de Autoriteit Persoonsgegevens (autoriteitpersoonsgegevens.nl). Woon je in België, dan kun je terecht bij de Gegevensbeschermingsautoriteit (gegevensbeschermingsautoriteit.be)." },
      ],
    },
    {
      id: "wijzigingen",
      title: "Wijzigingen",
      blocks: [
        { kind: "p", text: "We kunnen dit privacybeleid aanpassen, bijvoorbeeld als we een nieuwe dienst gaan gebruiken. De meest recente versie staat altijd op deze pagina, met de datum van de laatste wijziging bovenaan." },
      ],
    },
  ],
};
