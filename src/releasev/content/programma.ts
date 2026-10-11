/**
 * PROGRAMMA-TEKSTEN — pagina /programma.
 * Huisregels: geen medische claims (herstel, mobiliteit, comfort — nooit
 * genezen of behandelen), geen verzonnen cijfers of ervaringen.
 * Videolabels beschrijven welke opname er op de placeholder moet komen.
 */
import { IMAGES, type SiteImage } from "@rv/config/images";

export interface ProgramVariant {
  id: string;
  index: string;
  name: string;
  audience: string;
  summary: string;
  focus: readonly string[];
  tools: readonly string[];
  sampleDay: readonly { label: string; minutes: string; text: string }[];
  videoLabel: string;
  videoAlt: string;
  /** Posterfoto voor de video (tijdelijk stockbeeld) */
  image: SiteImage;
}

export const PROGRAM_HERO = {
  eyebrow: "Het programma",
  titleLines: ["14 dagen", "herstel."],
  image: IMAGES.stretchBw,
  lead: "Bij elke kit hoort het videoprogramma ‘14 dagen herstel’. Je kiest de variant die past bij hoe jij beweegt, en volgt elke dag een korte sessie met de tools uit de doos.",
  videoLabel: "Trailer van het programma (30 tot 45 sec): korte fragmenten uit alle drie de varianten, rustige voice-over van de trainer",
  videoAlt: "Trailer van het videoprogramma 14 dagen herstel",
} as const;

export const PROGRAM_FACTS = [
  { value: "14", label: "dagen, elke dag een sessie" },
  { value: "15", label: "minuten per sessie, maximaal" },
  { value: "3", label: "varianten, afgestemd op je dag" },
] as const;

export const PROGRAM_STRUCTURE = {
  index: "01",
  eyebrow: "Opbouw",
  title: "Rustig beginnen, gericht opbouwen.",
  lead: "Het programma is opgebouwd in drie fases. Zo leer je eerst de tools kennen, voordat je ze dieper en gerichter inzet.",
  phases: [
    {
      days: "Dag 1 tot 4",
      title: "Kennismaken",
      text: "Je leert hoe elke tool werkt, hoeveel druk prettig is en hoe je ademhaling helpt om te ontspannen.",
    },
    {
      days: "Dag 5 tot 10",
      title: "Verdiepen",
      text: "Langere sequenties per lichaamsdeel, met mobiliteitsoefeningen die aansluiten op jouw variant.",
    },
    {
      days: "Dag 11 tot 14",
      title: "Eigen maken",
      text: "Je bouwt een vaste korte routine die je na de veertien dagen zelfstandig kunt blijven doen.",
    },
  ],
} as const;

export const PROGRAM_VARIANTS_INTRO = {
  index: "02",
  eyebrow: "Drie varianten",
  title: "Kies de variant die past bij jouw week.",
  lead: "Dezelfde tools, een andere focus. Je kunt op elk moment van variant wisselen.",
} as const;

export const PROGRAM_VARIANTS: readonly ProgramVariant[] = [
  {
    id: "kantoorwerkers",
    index: "A",
    name: "Kantoorwerkers",
    audience: "Voor wie veel zit, achter een scherm werkt en stijf opstaat na een lange dag.",
    summary: "Gericht op houding, ruimte in de bovenrug en soepele heupen na uren zitten.",
    focus: ["Nek en schouders", "Bovenrug en borst", "Heupbuigers", "Onderrug en bilspieren"],
    tools: ["Foam roller", "Duobal", "Lacrosse bal", "Stretchband", "Spiky bal"],
    sampleDay: [
      { label: "Openen", minutes: "2 min", text: "Ademhaling en rustig rollen over de bovenrug." },
      { label: "Losmaken", minutes: "5 min", text: "Duobal langs de wervelkolom en lacrosse bal voor de schouders." },
      { label: "Bewegen", minutes: "4 min", text: "Heup- en borstopeners met de stretchband." },
      { label: "Afronden", minutes: "2 min", text: "Korte check-in: hoe voelt je houding nu?" },
    ],
    videoLabel: "Voorbeeldsessie kantoorwerkers (dag 3): duobal langs de bovenrug, daglicht, thuiswerkplek op de achtergrond",
    videoAlt: "Voorbeeldvideo uit de variant voor kantoorwerkers",
    image: IMAGES.deskWindow,
  },
  {
    id: "hardlopers",
    index: "B",
    name: "Hardlopers",
    audience: "Voor wie meerdere keren per week loopt, van 5 kilometer tot de marathon.",
    summary: "Gericht op kuiten, voeten en heupen, zodat je soepel aan je volgende loop begint.",
    focus: ["Voetzolen en kuiten", "Hamstrings en quadriceps", "Heupen en bilspieren", "IT-band-regio"],
    tools: ["Spiky bal", "Foam roller", "Lacrosse bal", "Stretchband", "Duobal"],
    sampleDay: [
      { label: "Openen", minutes: "2 min", text: "Spiky bal onder de voetzolen, staand of zittend." },
      { label: "Losmaken", minutes: "6 min", text: "Foam roller over kuiten, hamstrings en bovenbenen." },
      { label: "Bewegen", minutes: "4 min", text: "Dynamische heupmobiliteit met de stretchband." },
      { label: "Afronden", minutes: "2 min", text: "Lacrosse bal voor de bilspieren en rustig uitademen." },
    ],
    videoLabel: "Voorbeeldsessie hardlopers (dag 6): foam roller over de kuiten, hardloopschoenen naast de mat",
    videoAlt: "Voorbeeldvideo uit de variant voor hardlopers",
    image: IMAGES.runnerTunnel,
  },
  {
    id: "krachtsporters",
    index: "C",
    name: "Krachtsporters",
    audience: "Voor wie traint met gewichten en ruimte wil in schouders, heupen en enkels.",
    summary: "Gericht op mobiliteit voor squat, deadlift en overhead-werk, en rustig herstel tussen sessies.",
    focus: ["Schouders en lats", "Thoracale wervelkolom", "Heupen en adductoren", "Enkels"],
    tools: ["Foam roller", "Lacrosse bal", "Duobal", "Stretchband", "Spiky bal"],
    sampleDay: [
      { label: "Openen", minutes: "2 min", text: "Foam roller over de lats en bovenrug." },
      { label: "Losmaken", minutes: "5 min", text: "Lacrosse bal voor schouders en borst, duobal voor de bovenrug." },
      { label: "Bewegen", minutes: "5 min", text: "Schouder- en enkelmobiliteit met de stretchband." },
      { label: "Afronden", minutes: "2 min", text: "Diepe squat-hold met ademhaling." },
    ],
    videoLabel: "Voorbeeldsessie krachtsporters (dag 9): stretchband voor schoudermobiliteit, rustige gym-setting",
    videoAlt: "Voorbeeldvideo uit de variant voor krachtsporters",
    image: IMAGES.deadlift,
  },
];

export const PROGRAM_ACCESS = {
  index: "03",
  eyebrow: "Toegang",
  title: "Scannen en beginnen. Geen account nodig.",
  steps: [
    { title: "Open de doos", text: "In de deksel vind je een kaart met een persoonlijke QR-code." },
    { title: "Scan de code", text: "Met de camera van je telefoon. Je komt direct bij het programma." },
    { title: "Kies je variant", text: "Kantoorwerkers, hardlopers of krachtsporters. Wisselen kan altijd." },
    { title: "Volg dag 1", text: "Leg je telefoon naast je mat en volg de video in je eigen tempo." },
  ],
  note: "Je hoeft geen account aan te maken en geen app te installeren. De video’s werken in de browser van je telefoon, tablet of laptop.",
} as const;

export const PROGRAM_HEALTH_NOTE = {
  title: "Een rustige kanttekening",
  text: "Het programma is bedoeld voor herstel, mobiliteit en comfort bij gezonde, sportieve volwassenen. Het is geen vervanging van medisch advies. Heb je een blessure, aanhoudende klachten of twijfel je of de oefeningen bij je passen? Overleg dan eerst met je huisarts of fysiotherapeut. Stop met een oefening als die niet goed voelt.",
} as const;

export const PROGRAM_CTA = {
  title: "Het programma zit bij elke kit.",
  lead: "Vijf tools, een premium doos en veertien dagen begeleiding op video.",
  button: "Bekijk de kit",
  image: IMAGES.rollerTopdown,
} as const;
