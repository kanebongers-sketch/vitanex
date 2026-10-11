import { IMAGES } from "@rv/config/images";
import { KENNIS_PUBLISHED } from "./meta";
import type { KennisArticle } from "./types";

export const voetzolenBallen: KennisArticle = {
  slug: "voetzolen-spiky-bal-lacrosse-bal",
  title: "Voetzolen: spiky bal en lacrosse bal",
  description:
    "Je voeten dragen je hele dag. Zo gebruik je de spiky bal en de lacrosse bal voor je voetzolen: een korte routine, het verschil tussen de twee ballen en waar je op let.",
  zone: "Voetzolen",
  audience: "Iedereen die veel staat, loopt of sport",
  image: IMAGES.feetBall,
  datePublished: KENNIS_PUBLISHED,
  intro: [
    "Je voeten krijgen weinig aandacht, terwijl ze de hele dag je gewicht dragen. Of je nu veel staat voor je werk, hardloopt of in de sportschool traint: aan het eind van de dag voelen de voetzolen vaak moe en strak aan.",
    "Het mooie is dat je ze heel makkelijk kunt meenemen in je dag. Een bal onder je voet kan aan je bureau, voor de tv of terwijl je je tanden poetst. In dit artikel lees je hoe je de spiky bal en de lacrosse bal elk op hun eigen manier gebruikt.",
  ],
  sections: [
    {
      kind: "text",
      id: "waarom",
      heading: "Waarom je voetzolen aandacht verdienen",
      paragraphs: [
        "Je voet bestaat uit veel kleine botjes, spieren en bindweefsel die samen elke stap opvangen. Schoenen geven steun, maar zorgen er ook voor dat je voeten minder zelf bewegen. Veel mensen vinden het daarom prettig om hun voetzolen af en toe bewust los te rollen en te bewegen.",
        "Na een korte sessie voelen de voeten vaak lichter en 'wakkerder' aan. Sommige mensen merken ook dat de kuiten en de achterkant van de benen daarna wat soepeler aanvoelen; je kunt dat zelf eenvoudig testen door voor en na het rollen voorover te buigen en te voelen hoe ver je komt.",
      ],
    },
    {
      kind: "text",
      id: "verschil",
      heading: "Spiky bal of lacrosse bal?",
      paragraphs: [
        "De spiky bal is zachter en heeft noppen. Die geven een prikkelend, activerend gevoel en verdelen de druk over een groter oppervlak. Ideaal om mee te beginnen, als opwarming of als je voeten gevoelig zijn.",
        "De lacrosse bal is massief en glad. Daarmee kun je veel gerichter en dieper werken op een plek, bijvoorbeeld op de bal van je voet of langs de binnenkant van je voetboog. Gebruik hem na de spiky bal, als je voeten al wat gewend zijn aan de druk.",
      ],
    },
    {
      kind: "steps",
      id: "routine",
      heading: "De voetroutine",
      intro:
        "Begin zittend, zodat je de druk makkelijk kunt doseren. Gaat dat goed, dan kun je later staand werken voor meer gewicht. Doe eerst een voet helemaal en wissel dan.",
      steps: [
        {
          title: "Wakker maken met de spiky bal",
          tool: "spiky-bal",
          dose: "60 sec per voet",
          text: "Zet je voet op de spiky bal en rol rustig van je hiel naar de bal van je voet en terug. Houd de druk licht. Het mag prikkelen, maar het moet prettig blijven.",
        },
        {
          title: "Kleine cirkels",
          tool: "spiky-bal",
          dose: "30 sec per zone",
          text: "Maak kleine cirkels op drie plekken: onder de hiel, midden in je voetboog en onder de bal van je voet. Zo kom je overal even langs.",
        },
        {
          title: "Gericht werken met de lacrosse bal",
          tool: "lacrosse-bal",
          dose: "60 tot 90 sec per voet",
          text: "Wissel naar de lacrosse bal. Rol langzaam in de lengte van je voet, langs de binnenkant van de voetboog. Vind je een strak plekje, blijf daar dan een paar ademhalingen rustig staan.",
        },
        {
          title: "Tenen spreiden en krullen",
          tool: "lacrosse-bal",
          dose: "8 tot 10 herhalingen",
          text: "Laat de bal onder de bal van je voet liggen. Krul je tenen rustig om de bal heen en spreid ze daarna zo ver als je kunt. Dit voegt beweging toe aan het rollen.",
        },
        {
          title: "Voet en kuit rekken",
          tool: "stretchband",
          dose: "2 × 30 sec per been",
          text: "Ga zitten met je been gestrekt, leg de stretchband om de bal van je voet en trek je tenen rustig richting je scheen. Je voelt de rek in je voetzool en kuit.",
        },
      ],
      outro:
        "Sta daarna op en loop even op blote voeten rond. Vergelijk hoe je voeten aanvoelen met hoe het was voordat je begon.",
    },
    {
      kind: "mistakes",
      id: "fouten",
      heading: "Veelgemaakte fouten",
      items: [
        {
          title: "Meteen vol gewicht staand",
          text: "Staand rollen geeft veel druk. Begin zittend en bouw het pas op als het zittend makkelijk en prettig voelt.",
        },
        {
          title: "Op de hiel blijven drukken",
          text: "De hiel zelf is bot. Rol er rustig overheen, maar bouw daar geen diepe druk op met de lacrosse bal.",
        },
        {
          title: "Alleen op klachtendagen",
          text: "Een minuutje per dag voelt voor de meeste mensen prettiger dan af en toe een lange, intensieve sessie.",
        },
      ],
    },
    {
      kind: "caution",
      id: "wanneer-niet",
      heading: "Wanneer niet, en wanneer overleggen",
      paragraphs: [
        "Rol niet over wondjes, blaren, wratten, een zwelling of plekken die rood en warm zijn. Heb je diabetes, verminderd gevoel in je voeten of een slechte doorbloeding, overleg dan eerst met je huisarts of podotherapeut voordat je met een bal aan je voeten werkt.",
        "Heb je ochtendpijn onder je hiel, klachten die langer dan een paar weken aanhouden of een stekende pijn bij het lopen? Laat dat dan beoordelen door een huisarts, fysiotherapeut of podotherapeut.",
      ],
    },
  ],
  tools: ["spiky-bal", "lacrosse-bal", "stretchband"],
  variant: {
    id: "hardlopers",
    text: "In de variant voor hardlopers van het 14-dagenprogramma begint elke sessie met de voetzolen. Daarna ga je via de kuiten en hamstrings naar de heupen, zodat je de hele keten van voet tot heup meeneemt.",
  },
  related: ["kuiten-losmaken-met-foam-roller", "foam-rollen-hoe-vaak-hoe-lang-hoeveel-druk"],
};
