/**
 * BEELDBANK — alle foto's op een plek.
 *
 * TIJDELIJK: dit zijn rechtenvrije stockfoto's van Unsplash (Unsplash License:
 * gratis commercieel gebruik, naamsvermelding niet verplicht). Ze tonen NIET
 * exact jouw kit. Vervang ze voor livegang door eigen foto's:
 *   1. zet je foto in /public/images/ (bijv. /public/images/hero.jpg)
 *   2. verander hieronder `src` in "/images/hero.jpg" en pas de `alt` aan.
 */
export interface SiteImage {
  src: string;
  alt: string;
}

const unsplash = (id: string) => `https://images.unsplash.com/${id}`;

export const IMAGES = {
  hero: {
    src: unsplash("photo-1579758629938-03607ccdbaba"),
    alt: "Sporter zit uit te rusten op een bank in een donkere sportschool",
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
    src: unsplash("photo-1574680096145-d05b474e2155"),
    alt: "Krachtsporter met een halterstang op de schouders, zwart-wit",
  },
  deadlift: {
    src: unsplash("photo-1605296867304-46d5465a13f1"),
    alt: "Krachtsporter maakt zich klaar voor een deadlift in een donkere ruimte",
  },
  runnerNight: {
    src: unsplash("photo-1679769177248-727f4d1047a5"),
    alt: "Hardloper zit gehurkt op een verlichte weg in de avond",
  },
  runnerTunnel: {
    src: unsplash("photo-1512291152593-07033c65b791"),
    alt: "Hardloper onder een overkapping bij zonsondergang",
  },
  stretchBw: {
    src: unsplash("photo-1640262653851-103cbaf802d5"),
    alt: "Vrouw doet een hamstringstretch op een mat, zwart-wit",
  },
  floorStretch: {
    src: unsplash("photo-1701826510575-33d570b9d7f7"),
    alt: "Man doet een mobiliteitsoefening op de vloer van een lichte studio",
  },
  deskWindow: {
    src: unsplash("photo-1639384375285-55891b4ea5b8"),
    alt: "Iemand werkt aan een bureau bij het raam",
  },
  /** Portret van de trainer: vervang altijd door een echte foto */
  trainer: {
    src: unsplash("photo-1605296867304-46d5465a13f1"),
    alt: "Placeholder: vervang door een portret van de trainer",
  },
} as const satisfies Record<string, SiteImage>;

export type ImageKey = keyof typeof IMAGES;

/**
 * true voor tijdelijke stockfoto's. Productbeelden met stockfoto's krijgen
 * het label "Sfeerbeeld", zodat niemand denkt dat dit exact de kit is.
 * Zodra je eigen foto's in /public/images staan, verdwijnt het label vanzelf.
 */
export function isStockImage(src: string | undefined): boolean {
  return Boolean(src?.startsWith("https://images.unsplash.com/"));
}
