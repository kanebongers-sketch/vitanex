/**
 * AD-LANDINGSPAGINA'S — /kantoor, /hardlopen, /kracht.
 * Een pagina per doelgroep, zodat de pagina aansluit op de advertentie
 * (message match). Programmadata (dagschema, video) komt uit programma.ts.
 *
 * Huisregels: geen medische claims (herstel, mobiliteit, comfort, routine —
 * nooit genezen, pijn verhelpen of blessures voorkomen), geen verzonnen
 * cijfers of reviews, geen nep-urgentie.
 */
import { IMAGES, type SiteImage } from "@rv/config/images";
import { RECOVERY_KIT } from "@rv/config/product";
import { SITE } from "@rv/config/site";
import type { FaqItem, KitItem } from "@rv/lib/commerce/types";
import { PROGRAM_VARIANTS, type ProgramVariant } from "./programma";

export const LANDING_SLUGS = ["kantoor", "hardlopen", "kracht"] as const;
export type LandingSlug = (typeof LANDING_SLUGS)[number];

type VariantId = "kantoorwerkers" | "hardlopers" | "krachtsporters";
type ToolId = "roller" | "lacrosse" | "spiky" | "duo" | "band";

export interface LandingContent {
  slug: LandingSlug;
  variantId: VariantId;
  meta: { title: string; description: string };
  hero: {
    eyebrow: string;
    titleLines: readonly string[];
    lead: string;
    image: SiteImage;
    /** Tailwind object-position voor de uitsnede op mobiel */
    imagePosition: string;
  };
  situations: { title: string; items: readonly { title: string; text: string }[] };
  tools: { title: string; lead: string; items: readonly { id: ToolId; use: string }[] };
  day: { title: string; lead: string };
  offer: { title: string; lead: string };
  faq: readonly FaqItem[];
}

const RETURN_FAQ: FaqItem = {
  question: "Hoe snel heb ik de kit, en wat als hij niet bevalt?",
  answer: `${SITE.shipping.freeLabel}. ${SITE.shipping.deliveryLabel}. Je hebt ${SITE.shipping.returnDays} dagen bedenktijd na ontvangst: stuur de kit ongebruikt en compleet terug en je krijgt je geld terug.`,
};

const SWITCH_FAQ: FaqItem = {
  question: "Zit ik vast aan deze variant?",
  answer: "Nee. Na het scannen van de QR-kaart kies je je variant, en je kunt op elk moment wisselen. Alle drie de varianten (kantoor, hardlopen en kracht) zitten bij de kit.",
};

const HEALTH_ANSWER =
  "De kit en het programma zijn bedoeld voor herstel, mobiliteit en comfort bij gezonde, sportieve volwassenen. Heb je een blessure, aanhoudende klachten of twijfel je? Overleg dan eerst met je huisarts of fysiotherapeut.";

const LANDINGS: Readonly<Record<LandingSlug, LandingContent>> = {
  kantoor: {
    slug: "kantoor",
    variantId: "kantoorwerkers",
    meta: {
      title: "Herstel en mobiliteit voor wie veel zit",
      description:
        "Recovery & Mobility Kit met 14-dagen videoprogramma voor kantoorwerkers: elke dag 10 tot 15 minuten voor nek, bovenrug en heupen. Gratis verzending in NL en BE.",
    },
    hero: {
      eyebrow: "Voor wie veel zit",
      titleLines: ["Soepel op", "na een dag", "zitten."],
      lead: "Vijf recovery-tools plus 14 dagen videoprogramma voor kantoorwerkers. Elke dag een korte sessie voor nek, bovenrug en heupen.",
      image: IMAGES.deskWindow,
      imagePosition: "object-[60%_center]",
    },
    situations: {
      title: "Herken je dit?",
      items: [
        { title: "Stijf opstaan", text: "Na een middag vergaderen voelen je heupen en onderrug alsof ze vastzitten." },
        { title: "Schouders bij je oren", text: "Aan het eind van de dag merk je hoe ver je naar je scherm toe bent gekropen." },
        { title: "Geen idee waar te beginnen", text: "Je wilt wel iets doen, maar zonder plan komt het er na het werk niet van." },
      ],
    },
    tools: {
      title: "Jouw tools.",
      lead: "Alle vijf tools uit de kit, afgestemd op een dag zitten.",
      items: [
        { id: "roller", use: "Rustig rollen over de bovenrug om ruimte te maken na uren voorovergebogen werken." },
        { id: "duo", use: "Langs de wervelkolom en in de nek, met ruimte voor je ruggengraat." },
        { id: "lacrosse", use: "Gerichte druk tussen de schouderbladen en in je bilspieren." },
        { id: "band", use: "Heup- en borstopeners die je ook in je pauze kunt doen." },
        { id: "spiky", use: "Onder je voeten aan je bureau of over je onderarmen na een dag typen." },
      ],
    },
    day: {
      title: "Zo ziet een dag eruit.",
      lead: "Een korte sessie, thuis of op je werkplek. Je telefoon naast je, de video vertelt wat je doet.",
    },
    offer: {
      title: "Alles voor een soepele werkdag.",
      lead: "De complete kit, met het programma voor kantoorwerkers erbij.",
    },
    faq: [
      { question: "Heb ik veel ruimte nodig?", answer: "Nee. Een stuk vloer ter grootte van een yogamat is genoeg. Een deel van de oefeningen met de stretchband en de ballen kun je ook staand of tegen een muur doen." },
      { question: "Ik sport weinig. Is dit dan iets voor mij?", answer: "Ja. De variant voor kantoorwerkers is bedoeld voor iedereen die veel zit. De eerste vier dagen leer je de tools rustig kennen, daarna bouw je stap voor stap op." },
      SWITCH_FAQ,
      { question: "Ik heb last van mijn rug of nek. Kan ik de kit gebruiken?", answer: HEALTH_ANSWER },
      RETURN_FAQ,
    ],
  },
  hardlopen: {
    slug: "hardlopen",
    variantId: "hardlopers",
    meta: {
      title: "Herstel en mobiliteit voor hardlopers",
      description:
        "Recovery & Mobility Kit met 14-dagen videoprogramma voor hardlopers: elke dag 10 tot 15 minuten voor voeten, kuiten en heupen. Gratis verzending in NL en BE.",
    },
    hero: {
      eyebrow: "Voor hardlopers",
      titleLines: ["Sneller weer", "soepel aan", "de start."],
      lead: "Vijf recovery-tools plus 14 dagen videoprogramma voor hardlopers. Elke dag een korte sessie voor voeten, kuiten en heupen.",
      image: IMAGES.runnerNight,
      imagePosition: "object-[55%_center]",
    },
    situations: {
      title: "Herken je dit?",
      items: [
        { title: "Zware kuiten", text: "De ochtend na je lange duurloop loop je de trap af met stijve benen." },
        { title: "Herstel schiet erbij in", text: "Na het lopen ben je snel klaar. Rollen en rekken komen er zonder vast plan niet van." },
        { title: "Een roller in de hoek", text: "Je hebt er een, maar welke oefening, hoe lang en met hoeveel druk?" },
      ],
    },
    tools: {
      title: "Jouw tools.",
      lead: "Alle vijf tools uit de kit, van voetzool tot heup.",
      items: [
        { id: "spiky", use: "Onder je voetzolen, staand of zittend. Een fijne start van elke sessie." },
        { id: "roller", use: "Over kuiten, hamstrings en bovenbenen na je loopjes." },
        { id: "lacrosse", use: "Gerichte druk op je bilspieren en de zijkant van je heup." },
        { id: "band", use: "Dynamische heupmobiliteit, zodat je soepel aan je volgende loop begint." },
        { id: "duo", use: "Langs je bovenrug, voor een ontspannen houding tijdens lange loopjes." },
      ],
    },
    day: {
      title: "Zo ziet een dag eruit.",
      lead: "Een korte sessie op een vast moment in je week. De video vertelt wat je doet en hoe lang.",
    },
    offer: {
      title: "Alles voor je herstel tussen de loopjes.",
      lead: "De complete kit, met het programma voor hardlopers erbij.",
    },
    faq: [
      { question: "Wanneer doe ik de sessie: voor of na het lopen?", answer: "De sessies zijn een vaste korte routine van 10 tot 15 minuten, los van je training. Kies een moment dat in je week past, bijvoorbeeld na het lopen of ’s avonds. De video’s vertellen per dag wat je doet." },
      { question: "Ik loop nog niet zo lang. Is dit iets voor mij?", answer: "Ja. De variant voor hardlopers is gemaakt voor wie meerdere keren per week loopt, van 5 kilometer tot de marathon. De eerste vier dagen leer je de tools rustig kennen." },
      SWITCH_FAQ,
      { question: "Ik heb een loopblessure. Kan ik de kit gebruiken?", answer: HEALTH_ANSWER },
      RETURN_FAQ,
    ],
  },
  kracht: {
    slug: "kracht",
    variantId: "krachtsporters",
    meta: {
      title: "Herstel en mobiliteit voor krachtsporters",
      description:
        "Recovery & Mobility Kit met 14-dagen videoprogramma voor krachtsporters: elke dag 10 tot 15 minuten voor schouders, heupen en enkels. Gratis verzending in NL en BE.",
    },
    hero: {
      eyebrow: "Voor krachtsporters",
      titleLines: ["Soepel onder", "de stang."],
      lead: "Vijf recovery-tools plus 14 dagen videoprogramma voor krachtsporters. Elke dag een korte sessie voor schouders, heupen en enkels.",
      image: IMAGES.deadlift,
      imagePosition: "object-[40%_center]",
    },
    situations: {
      title: "Herken je dit?",
      items: [
        { title: "Stroef in de squat", text: "Je heupen en enkels geven niet de ruimte die je wilt om diep te zakken." },
        { title: "Strakke schouders", text: "Overhead-werk voelt stug na een week met veel druk- en trekoefeningen." },
        { title: "Herstel is een bijzaak", text: "Je schema staat strak, maar wat je tussen de sessies doet niet." },
      ],
    },
    tools: {
      title: "Jouw tools.",
      lead: "Alle vijf tools uit de kit, voor schouders, bovenrug, heupen en enkels.",
      items: [
        { id: "roller", use: "Over lats, bovenrug en bovenbenen, voor of na je training." },
        { id: "lacrosse", use: "Gerichte druk op schouders, borst en bilspieren." },
        { id: "duo", use: "Langs de bovenrug voor meer ruimte in je thoracale wervelkolom." },
        { id: "band", use: "Schouder- en enkelmobiliteit voor squat, deadlift en overhead-werk." },
        { id: "spiky", use: "Over je onderarmen na zware grip-sessies en onder je voetzolen." },
      ],
    },
    day: {
      title: "Zo ziet een dag eruit.",
      lead: "Een korte sessie op een trainingsdag of rustdag. De video vertelt wat je doet en hoe lang.",
    },
    offer: {
      title: "Alles voor herstel tussen je sessies.",
      lead: "De complete kit, met het programma voor krachtsporters erbij.",
    },
    faq: [
      { question: "Vervangt dit mijn warming-up?", answer: "Nee. Het programma is een losse dagelijkse routine van 10 tot 15 minuten voor herstel en mobiliteit. Je kunt onderdelen ervan wel gebruiken als aanvulling op je eigen warming-up." },
      { question: "Is de kit stevig genoeg voor zware sporters?", answer: "De foam roller heeft een stevige holle kern en de lacrosse bal is compact en stevig. Je bepaalt zelf hoeveel gewicht je erop legt." },
      SWITCH_FAQ,
      { question: "Ik heb een blessure of klachten. Kan ik de kit gebruiken?", answer: HEALTH_ANSWER },
      RETURN_FAQ,
    ],
  },
};

export function isLandingSlug(value: string): value is LandingSlug {
  return (LANDING_SLUGS as readonly string[]).includes(value);
}

export function getLanding(slug: LandingSlug): LandingContent {
  return LANDINGS[slug];
}

/** Programmavariant bij een landingspagina. Gooit een fout als de id niet (meer) bestaat. */
export function getLandingVariant(landing: LandingContent): ProgramVariant {
  const variant = PROGRAM_VARIANTS.find((item) => item.id === landing.variantId);
  if (!variant) throw new Error(`Programmavariant "${landing.variantId}" ontbreekt in programma.ts`);
  return variant;
}

export interface LandingTool extends KitItem {
  /** Doelgroepspecifieke uitleg */
  audienceUse: string;
}

/** Koppelt de tool-ids aan RECOVERY_KIT.contents. Gooit een fout bij een onbekende id. */
export function getLandingTools(landing: LandingContent, contents: readonly KitItem[] = RECOVERY_KIT.contents): LandingTool[] {
  return landing.tools.items.map(({ id, use }) => {
    const item = contents.find((content) => content.id === id);
    if (!item) throw new Error(`Tool "${id}" ontbreekt in RECOVERY_KIT.contents`);
    return { ...item, audienceUse: use };
  });
}

/** Telt de minuten van een voorbeelddag op ("2 min" + "5 min"). null als iets niet te lezen is. */
export function totalMinutes(steps: readonly { minutes: string }[]): number | null {
  const values = steps.map((step) => Number.parseInt(step.minutes, 10));
  if (values.some((value) => Number.isNaN(value))) return null;
  return values.reduce((sum, value) => sum + value, 0);
}

/** Regels voor de "In de doos"-lijst, met de variant van deze doelgroep uitgelicht. */
export function getBoxItems(variant: ProgramVariant, contents: readonly KitItem[] = RECOVERY_KIT.contents): string[] {
  return [
    ...contents.filter((item) => item.id !== "card").map((item) => item.name),
    `14-dagenprogramma: ${variant.name.toLowerCase()} + 2 andere varianten`,
    "Premium opbergdoos met QR-kaart",
  ];
}
