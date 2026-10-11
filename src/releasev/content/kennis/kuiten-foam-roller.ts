import { IMAGES } from "@rv/config/images";
import { KENNIS_PUBLISHED } from "./meta";
import type { KennisArticle } from "./types";

export const kuitenFoamRoller: KennisArticle = {
  slug: "kuiten-losmaken-met-foam-roller",
  title: "Kuiten losmaken met een foam roller",
  description:
    "Een rustige foam-roller-routine voor de kuiten, speciaal voor hardlopers: stap voor stap, met duur per oefening, veelgemaakte fouten en wanneer je beter even overlegt.",
  zone: "Kuiten",
  audience: "Hardlopers",
  image: IMAGES.runnerNight,
  datePublished: KENNIS_PUBLISHED,
  intro: [
    "Wie een paar keer per week hardloopt, kent het gevoel: na een langere duurloop of een intervaltraining voelen de kuiten strak en zwaar aan. De eerste meters van je volgende loop gaan dan wat stroever dan je zou willen.",
    "Een foam roller is een van de eenvoudigste manieren om daar thuis zelf iets aan te doen. In dit artikel lees je hoe je in ongeveer tien minuten je kuiten rustig losrolt, welke fouten we vaak zien en wanneer je beter eerst met een professional overlegt.",
  ],
  sections: [
    {
      kind: "text",
      id: "waarom",
      heading: "Waarom kuiten aandacht verdienen",
      paragraphs: [
        "Bij elke pas vangen je kuiten een deel van je lichaamsgewicht op en zetten ze je weer af. Tijdens een training gebeurt dat ontelbaar vaak. Het is dus logisch dat juist dit gebied na het lopen vaak als eerste stijf aanvoelt.",
        "Veel hardlopers vinden dat rustig rollen helpt om dat strakke gevoel wat te laten zakken en de enkels weer soepeler te laten bewegen. Zie het niet als wondermiddel, maar als een moment van aandacht voor je onderbenen: je voelt waar het gespannen zit, je ademt rustig door en je merkt hoe het weefsel onder de roller langzaam meegeeft.",
        "Daarnaast is het een prettige gewoonte om je training mee af te sluiten. Tien minuten op de mat na je loop of op je rustdag maakt herstel tot iets wat je bewust doet, in plaats van iets wat je hoopt dat vanzelf gebeurt.",
      ],
    },
    {
      kind: "steps",
      id: "routine",
      heading: "De routine, stap voor stap",
      intro:
        "Je hebt een foam roller nodig en een stuk vloer of een sportmat. Doe de routine na je loop, als je spieren nog warm zijn, of op een rustdag. Werk eerst het ene been helemaal af en daarna het andere.",
      steps: [
        {
          title: "Rustig inrollen",
          tool: "foam-roller",
          dose: "60 sec per been",
          text: "Ga zitten met je kuit op de roller en je handen naast je heupen op de grond. Til je billen een stukje op en rol langzaam van net boven je enkel tot net onder je knieholte. Houd het licht: dit is opwarmen, nog geen werk.",
        },
        {
          title: "Druk opbouwen",
          tool: "foam-roller",
          dose: "60 tot 90 sec per been",
          text: "Leg je andere been gekruist over het onderste been voor meer gewicht. Rol in korte stukjes van een paar centimeter en neem de tijd. Is het te intens, haal dan het bovenste been weer weg.",
        },
        {
          title: "Binnen- en buitenkant",
          tool: "foam-roller",
          dose: "45 sec per kant",
          text: "Draai je voet een kwartslag naar binnen, zodat de buitenkant van je kuit op de roller ligt. Rol rustig heen en weer. Draai daarna je voet naar buiten voor de binnenkant van de kuit.",
        },
        {
          title: "Pauzeren op een strak punt",
          tool: "foam-roller",
          dose: "3 tot 5 ademhalingen",
          text: "Vind je een plek die extra strak aanvoelt, blijf dan even stil liggen. Adem rustig uit en laat je been zwaar worden. Beweeg je enkel daarna een paar keer langzaam op en neer terwijl je op dezelfde plek blijft.",
        },
        {
          title: "Kuitstretch met de band",
          tool: "stretchband",
          dose: "2 × 30 sec per been",
          text: "Ga zitten met je been gestrekt voor je. Leg de stretchband om de bal van je voet en trek je tenen rustig naar je toe tot je een prettige rek in je kuit voelt. Blijf ontspannen ademen en forceer niets.",
        },
      ],
      outro:
        "Sta na afloop op en loop even rond. Veel mensen merken dat de enkels lichter aanvoelen. Voel je juist meer spanning dan ervoor, gebruik dan de volgende keer minder druk.",
    },
    {
      kind: "mistakes",
      id: "fouten",
      heading: "Veelgemaakte fouten",
      items: [
        {
          title: "Te snel rollen",
          text: "Snel heen en weer rollen voelt actief, maar geeft je lichaam weinig tijd om te ontspannen. Een tempo van een paar centimeter per seconde is meestal genoeg.",
        },
        {
          title: "Op je achillespees rollen",
          text: "De pees net boven je hiel is geen spierweefsel. Begin met rollen boven de pees en laat dat gebied met rust.",
        },
        {
          title: "Doorbijten op pijn",
          text: "Rollen mag stevig voelen, maar je moet rustig kunnen blijven ademen. Span je je kaken aan of houd je je adem in, dan is de druk te hoog.",
        },
        {
          title: "Alleen rollen, nooit bewegen",
          text: "Rollen werkt het prettigst in combinatie met beweging. Sluit af met de stretch en een paar rustige enkelcirkels.",
        },
      ],
    },
    {
      kind: "caution",
      id: "wanneer-niet",
      heading: "Wanneer niet, en wanneer overleggen",
      paragraphs: [
        "Deze routine is bedoeld voor comfort en mobiliteit bij gezonde, sportieve volwassenen. Rol niet over een zwelling, een blauwe plek, een open wond of een plek die warm of rood is.",
        "Heb je een blessure, een scherpe of stekende pijn, klachten die blijven terugkomen, of twijfel je om een andere reden of rollen bij je past? Overleg dan eerst met je huisarts, fysiotherapeut of sportarts. Zij kunnen beoordelen wat in jouw situatie verstandig is.",
      ],
    },
  ],
  tools: ["foam-roller", "stretchband"],
  variant: {
    id: "hardlopers",
    text: "In de variant voor hardlopers van het 14-dagenprogramma komt deze kuitroutine terug, aangevuld met voetzolen, hamstrings en heupen. Je ziet op video hoe je de druk doseert en hoe je het werk verdeelt over je week.",
  },
  related: ["voetzolen-spiky-bal-lacrosse-bal", "foam-rollen-hoe-vaak-hoe-lang-hoeveel-druk"],
};
