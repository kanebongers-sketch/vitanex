import { IMAGES } from "@rv/config/images";
import { KENNIS_PUBLISHED } from "./meta";
import type { KennisArticle } from "./types";

export const schoudersBovenrugKracht: KennisArticle = {
  slug: "schouders-en-bovenrug-voor-krachtsporters",
  title: "Schouders en bovenrug voor krachtsporters",
  description:
    "Meer ruimte voor squat, bench en overhead press? Een mobiliteitsroutine voor schouders, lats en bovenrug met foam roller, duobal, lacrosse bal en stretchband.",
  zone: "Schouders & bovenrug",
  audience: "Krachtsporters",
  image: IMAGES.strength,
  datePublished: KENNIS_PUBLISHED,
  intro: [
    "Wie traint met gewichten, vraagt veel van schouders en bovenrug. Een low-bar squat vraagt dat je de stang comfortabel op je rug kunt leggen, bij de bench press wil je je schouderbladen stevig kunnen positioneren en overhead werk vraagt ruimte boven je hoofd.",
    "Voelt dat stroef, dan ga je snel compenseren: een holle onderrug, ellebogen die uitwaaieren of een stang die net niet goed ligt. In dit artikel lees je hoe je in tien tot vijftien minuten je bovenlichaam klaarmaakt voor een training of rustig afsluit op een rustdag.",
  ],
  sections: [
    {
      kind: "text",
      id: "waarom",
      heading: "Waarom mobiliteit hier het verschil maakt",
      paragraphs: [
        "Je schouder is een beweeglijk gewricht dat samenwerkt met je schouderblad en je bovenrug. Kan je bovenrug weinig strekken of draaien, dan moet je schouder dat vaak opvangen. Andersom geeft een soepele bovenrug je schouders meer ruimte om hun werk te doen.",
        "Veel krachtsporters merken dat een korte mobiliteitsroutine voor de training helpt om sneller in een goede positie te komen. De eerste werksets voelen dan vaak prettiger en je kunt je meer concentreren op techniek in plaats van op een stijve schouder.",
        "Belangrijk: mobiliteit is geen vervanging van een goede warming-up met lichte sets. Zie deze routine als voorbereiding daarop, of als rustig herstelmoment op een dag dat je niet traint.",
      ],
    },
    {
      kind: "steps",
      id: "routine",
      heading: "De routine voor je bovenlichaam",
      intro:
        "Doe stap 1 tot en met 3 voor elke training waarin je squat, drukt of trekt. Stap 4 en 5 kun je toevoegen op een rustdag of als je wat meer tijd hebt.",
      steps: [
        {
          title: "Bovenrug strekken",
          tool: "foam-roller",
          dose: "8 tot 10 herhalingen op 3 hoogtes",
          text: "Leg de roller dwars onder je bovenrug, handen achter je hoofd. Laat je bovenrug rustig over de roller strekken en kom weer terug. Schuif de roller daarna een paar centimeter hoger en herhaal. Blijf boven je onderste ribben.",
        },
        {
          title: "Lats rollen",
          tool: "foam-roller",
          dose: "45 tot 60 sec per kant",
          text: "Ga op je zij liggen met de roller onder je oksel en je arm gestrekt boven je hoofd, duim naar het plafond. Rol een klein stukje richting je ribben en terug. Draai je romp iets naar voren en naar achteren om de hele spier te raken.",
        },
        {
          title: "Duobal langs de wervelkolom",
          tool: "duobal",
          dose: "6 tot 8 rustige herhalingen",
          text: "Leg de duobal onder je bovenrug zodat je wervelkolom in de groef valt en de twee bollen links en rechts liggen. Kruis je armen voor je borst en strek rustig over de bal heen. Schuif een stukje op en herhaal.",
        },
        {
          title: "Achterkant schouder",
          tool: "lacrosse-bal",
          dose: "60 sec per kant",
          text: "Ga met je rug tegen een muur staan en leg de lacrosse bal tussen je schouderblad en de achterkant van je schouder. Buig licht door je knieën om de bal rustig te laten rollen. Beweeg je arm langzaam voor je borst langs voor extra variatie.",
        },
        {
          title: "Pass-throughs met band",
          tool: "stretchband",
          dose: "2 × 10 herhalingen",
          text: "Pak de stretchband breed vast met gestrekte armen voor je. Breng de band in een rustige boog over je hoofd naar achter je rug en weer terug. Begin met een brede greep en ga pas smaller als dat soepel gaat zonder je ellebogen te buigen.",
        },
      ],
      outro:
        "Ga daarna door met je gewone warming-up: lege stang, lichte sets en dan pas zwaarder. Merk je dat een kant stroever is dan de andere, geef die kant dan wat extra tijd.",
    },
    {
      kind: "mistakes",
      id: "fouten",
      heading: "Veelgemaakte fouten",
      items: [
        {
          title: "Te lang rollen vlak voor zware sets",
          text: "Een paar minuten is genoeg voor de training. Lange, intensieve sessies bewaar je liever voor een rustdag.",
        },
        {
          title: "Holle onderrug bij het strekken",
          text: "Bij het strekken over de roller wil je beweging uit de bovenrug halen. Houd je billen op de grond en je buik licht gespannen.",
        },
        {
          title: "Te smalle greep bij pass-throughs",
          text: "Een te smalle greep dwingt je om te compenseren met je ellebogen of onderrug. Breed beginnen is geen zwakte, het is slim doseren.",
        },
        {
          title: "Rollen op het schoudergewricht zelf",
          text: "Werk met de lacrosse bal op de spieren rond je schouderblad en de achterkant van je schouder, niet op het botje bovenop je schouder.",
        },
      ],
    },
    {
      kind: "caution",
      id: "wanneer-niet",
      heading: "Wanneer niet, en wanneer overleggen",
      paragraphs: [
        "Voel je bij een beweging een scherpe pijn, een klikkend of instabiel gevoel in je schouder, of tintelingen in je arm of hand? Stop dan met die oefening. Mobiliteit hoort stevig maar prettig te voelen.",
        "Heb je een bestaande schouder- of rugblessure, of blijven klachten terugkomen tijdens of na het trainen, overleg dan met een fysiotherapeut of sportarts voordat je verder gaat. Een goede coach kan daarnaast meekijken naar je techniek.",
      ],
    },
  ],
  tools: ["foam-roller", "duobal", "lacrosse-bal", "stretchband"],
  variant: {
    id: "krachtsporters",
    text: "De variant voor krachtsporters van het 14-dagenprogramma combineert deze bovenlichaamroutine met heup- en enkelmobiliteit voor squat en deadlift. Op video zie je per dag precies welke tool je gebruikt en hoe lang.",
  },
  related: ["onderrug-en-heupen-na-een-dag-zitten", "foam-rollen-hoe-vaak-hoe-lang-hoeveel-druk"],
};
