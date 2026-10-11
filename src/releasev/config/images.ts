/**
 * BEELDBANK: alle foto's op een plek.
 *
 * TIJDELIJK zijn er twee soorten sfeerbeelden, die geen van beide exact jouw kit tonen:
 *  - rechtenvrije stockfoto's van Unsplash (Unsplash License: gratis commercieel gebruik);
 *  - AI-beelden (GPT Image 2.5) in /public/releasev/images/ai/, gemaakt met de beeldgenerator.
 * Vervang ze voor livegang door eigen foto's:
 *   1. zet je foto in /public/releasev/images/ (bijv. hero.jpg)
 *   2. verander hieronder `src` in "/releasev/images/hero.jpg" en pas de `alt` aan.
 */
export interface SiteImage {
  src: string;
  alt: string;
}

const unsplash = (id: string) => `https://images.unsplash.com/${id}`;
const AI_IMAGE_DIR = "/releasev/images/ai/";
const ai = (file: string) => `${AI_IMAGE_DIR}${file}`;

export const IMAGES = {
  hero: {
    src: ai("hero.webp"),
    alt: "Sporter zit na de training rustig op de vloer van een donkere studio, zacht licht door het raam",
  },
  foamRolling: {
    src: unsplash("photo-1591741535585-9c4f52b3f13f"),
    alt: "Iemand rolt de bovenbenen los op een foam roller op een sportmat",
  },
  rollerClose: {
    src: unsplash("photo-1653617748437-895c016e88b1"),
    alt: "Close-up van een foam roller met reliëf",
  },
  spikyBalls: {
    src: unsplash("photo-1685633225377-50d1f1e01fee"),
    alt: "Massageballen met noppen op een donkere sportvloer",
  },
  lacrosseBalls: {
    src: unsplash("photo-1685633224704-161d7032379e"),
    alt: "Zwarte massageballen tegen een donkere muur",
  },
  rollersStanding: {
    src: unsplash("photo-1763004871583-4183d64096b1"),
    alt: "Twee opgerolde matten in zacht strijklicht",
  },
  rollerTopdown: {
    src: unsplash("photo-1683758575782-a632dbbe9eed"),
    alt: "Sporter ligt met de rug op een foam roller op een mat",
  },
  feetBall: {
    src: unsplash("photo-1787089574835-366ffd17b429"),
    alt: "Blote voeten op een sportmat met een massagebal",
  },
  bands: {
    src: unsplash("photo-1584827386916-b5351d3ba34b"),
    alt: "Gekleurde weerstandsbanden die aan een rek hangen",
  },
  strength: {
    src: ai("kracht.webp"),
    alt: "Krachtsporter staat rustig bij het squatrek tussen twee sets in een donkere gym",
  },
  deadlift: {
    src: ai("deadlift.webp"),
    alt: "Krachtsporter maakt de handen klaar met magnesium voor een deadlift",
  },
  runnerNight: {
    src: ai("hardlopen.webp"),
    alt: "Hardloper rekt de bovenbenen na een ochtendrun op een rustige straat in de mist",
  },
  runnerTunnel: {
    src: ai("hardlopen-avond.webp"),
    alt: "Hardloper rust even uit langs een weg bij zonsondergang",
  },
  stretchBw: {
    src: ai("stretch.webp"),
    alt: "Vrouw doet een hamstringstretch met een stretchband op een mat",
  },
  floorStretch: {
    src: ai("thuis.webp"),
    alt: "Iemand rolt in de avond de bovenrug los op een foam roller in de woonkamer",
  },
  deskWindow: {
    src: ai("kantoor.webp"),
    alt: "Iemand ontspant de nek en schouders aan een bureau bij het raam",
  },
  /** Portret van de trainer: vervang altijd door een echte foto */
  trainer: {
    src: unsplash("photo-1605296867304-46d5465a13f1"),
    alt: "Placeholder: vervang door een portret van de trainer",
  },
} as const satisfies Record<string, SiteImage>;

export type ImageKey = keyof typeof IMAGES;

/**
 * true voor tijdelijke sfeerbeelden (stockfoto's en AI-beelden). Productbeelden
 * daarmee krijgen het label "Sfeerbeeld", zodat niemand denkt dat dit exact de kit is.
 * Zodra je eigen foto's in /public/releasev/images staan, verdwijnt het label vanzelf.
 */
export function isStockImage(src: string | undefined): boolean {
  return Boolean(src?.startsWith("https://images.unsplash.com/") || src?.startsWith(AI_IMAGE_DIR));
}
