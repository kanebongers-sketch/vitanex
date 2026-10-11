import type { Product } from "@rv/lib/commerce/types";
import { IMAGES } from "./images";
import { SITE } from "./site";

/**
 * PRODUCTDATA — prijs, teksten, inhoud en specificaties van de kit.
 * Prijs staat in centen (6900 = €69,00 incl. btw).
 * Waarden tussen [HAKEN] controleren bij je leverancier voor livegang.
 */
export const RECOVERY_KIT: Product = {
  id: "recovery-mobility-kit",
  slug: "recovery-mobility-kit",
  name: "Recovery & Mobility Kit",
  tagline: "Vijf tools en een 14-dagenprogramma voor herstel dat je volhoudt.",
  description:
    "Een complete kit voor dagelijks herstel en mobiliteit: holle foam roller, lacrosse bal, spiky bal, duobal en stretchband, in een premium doos. Inclusief toegang tot het videoprogramma ‘14 dagen herstel’ in drie varianten: kantoorwerkers, hardlopers en krachtsporters.",
  price: { amount: 6900, currency: "EUR" },
  sku: "RMK-001",
  stripePriceEnv: "RELEASEV_STRIPE_PRICE_ID_KIT",
  highlights: [
    "Een vaste herstelroutine van 10 tot 15 minuten per dag",
    "Dag voor dag begeleid met video, afgestemd op jouw sport",
    "Van kuiten tot bovenrug: alles voor het hele lichaam in een doos",
    "Ontwikkeld door het team achter 8 PT-locaties",
  ],
  // Alt-teksten volgen nu de tijdelijke stockfoto's. Bij eigen foto's: schrijf een alt die beschrijft wat er echt op staat.
  media: [
    { id: "hero", placeholderLabel: "Complete kit, bovenaanzicht op lichte achtergrond", alt: IMAGES.rollerTopdown.alt, src: IMAGES.rollerTopdown.src },
    { id: "roller", placeholderLabel: "Holle foam roller, close-up van de textuur", alt: IMAGES.rollerClose.alt, src: IMAGES.rollerClose.src },
    { id: "balls", placeholderLabel: "Lacrosse bal, spiky bal en duobal naast elkaar", alt: IMAGES.spikyBalls.alt, src: IMAGES.spikyBalls.src },
    { id: "band", placeholderLabel: "Stretchband, opgerold", alt: IMAGES.bands.alt, src: IMAGES.bands.src },
    { id: "howto-roller", kind: "video", placeholderLabel: "How-to clip (10 tot 20 s): foam roller op de kuiten", alt: "Korte video: zo gebruik je de foam roller op je kuiten", poster: IMAGES.foamRolling.src },
    { id: "howto-balls", kind: "video", placeholderLabel: "How-to clip (10 tot 20 s): lacrosse bal op de bilspieren", alt: "Korte video: zo gebruik je de lacrosse bal", poster: IMAGES.feetBall.src },
    { id: "box", placeholderLabel: "Premium doos met QR-kaart", alt: IMAGES.rollersStanding.alt, src: IMAGES.rollersStanding.src },
    { id: "lifestyle", placeholderLabel: "Sfeerbeeld: kit in gebruik in een woonkamer", alt: IMAGES.floorStretch.alt, src: IMAGES.floorStretch.src },
  ],
  contents: [
    { id: "roller", name: "Holle foam roller", detail: "33 cm, stevige holle kern", use: "Kuiten, bovenbenen, rug en lats. Het werkpaard van de kit.", zones: ["Kuiten","Bovenbenen","Rug","Lats"], image: IMAGES.rollerClose },
    { id: "lacrosse", name: "Lacrosse bal", detail: "Compact en stevig", use: "Gerichte druk op bilspieren, schouderbladen en voetzolen.", zones: ["Bilspieren","Schouderbladen","Voetzolen"], image: IMAGES.lacrosseBalls },
    { id: "spiky", name: "Spiky bal", detail: "Met zachte noppen", use: "Voetzolen, onderarmen en handen. Fijn na een lange dag.", zones: ["Voetzolen","Onderarmen","Handen"], image: IMAGES.spikyBalls },
    { id: "duo", name: "Duobal", detail: "Pinda-vorm", use: "Langs de rug en nek, met ruimte voor de wervelkolom.", zones: ["Bovenrug","Nek","Kuiten"], image: IMAGES.feetBall },
    { id: "band", name: "Stretchband", detail: "Voor begeleide stretches", use: "Hamstrings, heupen en schouders, rustig opbouwend.", zones: ["Hamstrings","Heupen","Schouders"], image: IMAGES.bands },
    { id: "card", name: "QR-kaart en premium doos", detail: "Toegang tot het programma", use: "Scan en kies je variant: kantoor, hardlopen of kracht.", zones: ["Kantoor","Hardlopen","Kracht"], image: IMAGES.rollersStanding },
  ],
  specs: [
    { label: "Foam roller", value: "33 cm lang, Ø [DIAMETER] cm, holle kern, [MATERIAAL]" },
    { label: "Lacrosse bal", value: "Ø [DIAMETER] cm, [MATERIAAL]" },
    { label: "Spiky bal", value: "Ø [DIAMETER] cm, [MATERIAAL]" },
    { label: "Duobal", value: "[AFMETINGEN], [MATERIAAL]" },
    { label: "Stretchband", value: "[LENGTE] cm, [MATERIAAL]" },
    { label: "Gewicht totaal", value: "[GEWICHT] kg" },
    { label: "Programma", value: "14 dagen, 3 varianten, online video" },
    { label: "Verpakking", value: "Premium merkdoos, [AFMETINGEN DOOS]" },
  ],
  faq: [
    { question: "Voor wie is de kit bedoeld?", answer: "Voor sporters die serieus trainen en hun herstel en mobiliteit structureel willen aanpakken. Of je nu kantoorwerk combineert met sport, hardloopt of krachttraint: er is een programmavariant die bij je past." },
    { question: "Hoe krijg ik toegang tot het videoprogramma?", answer: "In de doos zit een kaart met een QR-code. Scan hem met je telefoon, kies je variant en je kunt direct beginnen. Je hebt geen account of app nodig." },
    { question: "Hoeveel tijd kost het per dag?", answer: "Elke sessie duurt tien tot vijftien minuten. Het programma is gemaakt om vol te houden, ook op drukke dagen." },
    { question: "Ik heb een blessure of klachten. Kan ik de kit gebruiken?", answer: "De kit en het programma zijn bedoeld voor herstel, mobiliteit en comfort bij gezonde sporters. Heb je pijn, een blessure of een medische aandoening? Overleg dan eerst met je huisarts of fysiotherapeut." },
    { question: "Welke programmavariant past bij mij?", answer: "Zit je veel op je werk, kies dan Kantoor. Loop je meerdere keren per week hard, kies Hardlopen. Train je vooral met gewichten, kies Kracht. Na het scannen van de QR-code kies je je variant; je kunt later altijd wisselen." },
    { question: "Blijft het programma beschikbaar na de 14 dagen?", answer: "[CONTROLEER] Ja, je houdt toegang tot de video’s, zodat je het programma kunt herhalen of een andere variant kunt volgen." },
    { question: "Wat is het verschil met losse tools kopen?", answer: "Losse tools geven je materiaal, maar geen plan. In deze kit zijn de tools op elkaar afgestemd en krijg je een programma per sporttype erbij, zodat je weet wat je wanneer doet." },
    { question: "Hoe snel heb ik de kit in huis?", answer: `${SITE.shipping.freeLabel}. ${SITE.shipping.deliveryLabel}.` },
    { question: "Ik heb nog nooit met een foam roller gewerkt. Is dit iets voor mij?", answer: "Ja. De eerste vier dagen van het programma zijn bedoeld om de tools rustig te leren kennen: hoe je ze gebruikt en hoeveel druk prettig is. Daarna bouw je stap voor stap op." },
    { question: "Is de foam roller hard of zacht?", answer: "[CONTROLEER bij leverancier] De holle kern maakt de roller stevig, het reliëf geeft variatie in druk. Je bepaalt zelf hoeveel gewicht je erop legt." },
    { question: "Waar kijk ik de video’s?", answer: "De QR-code opent het programma in je browser. Je kijkt dus op je telefoon, tablet of laptop, zonder app of account." },
    { question: "Wat gebeurt er na mijn bestelling?", answer: `Je krijgt direct een bevestigingsmail. Daarna versturen we je kit: ${SITE.shipping.freeLabel.toLowerCase()}, ${SITE.shipping.deliveryLabel.toLowerCase()}. In de doos zit de QR-kaart waarmee je meteen kunt beginnen.` },
    { question: "Wat als er iets mis is met de kit?", answer: "Dan lossen we het op. Naast je 14 dagen bedenktijd heb je altijd recht op de wettelijke garantie. Neem contact op en we zoeken samen een oplossing." },
    { question: "Wat als de kit niet bevalt?", answer: "Je hebt 14 dagen bedenktijd na ontvangst. Stuur de kit ongebruikt en compleet terug en je krijgt je geld terug. Lees het retourbeleid voor alle details." },
  ],
};

/**
 * DUO-PAKKET — twee complete kits, voor jou en je partner of trainingsmaatje.
 * PRIJS IS EEN VOORSTEL: pas `price.amount` aan (in centen). Het voordeel
 * ten opzichte van twee losse kits wordt automatisch berekend en getoond.
 */
export const RECOVERY_KIT_DUO: Product = {
  ...RECOVERY_KIT,
  id: "recovery-mobility-kit-duo",
  slug: "recovery-mobility-kit-duo",
  name: "Recovery & Mobility Kit Duo",
  tagline: "Twee complete kits: voor jou en je partner of trainingsmaatje.",
  description:
    "Twee complete Recovery & Mobility Kits, elk met eigen toegang tot het 14-dagen videoprogramma. Samen een vaste herstelroutine opbouwen.",
  price: { amount: 11900, currency: "EUR" },
  sku: "RMK-002-DUO",
  stripePriceEnv: "RELEASEV_STRIPE_PRICE_ID_KIT_DUO",
  isListed: false,
  packSize: 2,
  packOf: RECOVERY_KIT.id,
};
