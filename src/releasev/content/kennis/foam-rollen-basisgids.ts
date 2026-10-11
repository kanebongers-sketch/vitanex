import { IMAGES } from "@rv/config/images";
import { KENNIS_PUBLISHED } from "./meta";
import type { KennisArticle } from "./types";

export const foamRollenBasisgids: KennisArticle = {
  slug: "foam-rollen-hoe-vaak-hoe-lang-hoeveel-druk",
  title: "Foam rollen: hoe vaak, hoe lang en hoeveel druk",
  description:
    "De basisgids voor foam rollen: hoe vaak per week, hoe lang per spiergroep en hoeveel druk prettig is. Met een eerste routine voor beginners en de fouten die we het vaakst zien.",
  zone: "Basisgids",
  audience: "Beginners en iedereen die wil bijsturen",
  image: IMAGES.foamRolling,
  datePublished: KENNIS_PUBLISHED,
  intro: [
    "Een foam roller is simpel: een cilinder waar je overheen rolt. Toch zijn de vragen die we erover krijgen bijna altijd dezelfde. Hoe vaak moet ik rollen? Hoe lang per spiergroep? En hoeveel pijn mag het doen?",
    "In deze basisgids zetten we de vuistregels op een rij die we in ons team gebruiken bij het coachen van sporters. Het zijn geen harde wetten: je lichaam is je beste meetinstrument. Maar het geeft je een goed vertrekpunt.",
  ],
  sections: [
    {
      kind: "text",
      id: "waarom",
      heading: "Waarom rollen, en wat je mag verwachten",
      paragraphs: [
        "Veel mensen gebruiken een foam roller om na het sporten of na een lange dag stijfheid te laten zakken en soepeler te bewegen. Het is een manier om je lichaam rustig af te tasten: je voelt waar het strak zit en je geeft dat gebied bewust aandacht.",
        "Verwacht er geen wonderen van. Rollen is een prettige aanvulling op voldoende bewegen, slapen en een verstandig opgebouwde training, geen vervanging daarvan. Juist omdat het zo laagdrempelig is, werkt het het best als vaste, korte gewoonte.",
      ],
    },
    {
      kind: "text",
      id: "hoe-vaak",
      heading: "Hoe vaak?",
      paragraphs: [
        "Voor de meeste mensen is een paar keer per week een prettig ritme, en dagelijks kort rollen kan ook prima. Kort en regelmatig voelt voor veel mensen beter dan een lange sessie in het weekend.",
        "Goede momenten zijn na een training, op een rustdag of 's avonds als afsluiting van een dag met veel zitten. Rol je voor een training, houd het dan kort en combineer het met een gewone warming-up.",
      ],
    },
    {
      kind: "text",
      id: "hoe-lang",
      heading: "Hoe lang?",
      paragraphs: [
        "Als vuistregel houden wij ongeveer 30 tot 90 seconden per spiergroep aan. Begin aan de korte kant en kijk hoe je lichaam reageert. Een complete sessie van tien tot vijftien minuten is ruim voldoende om de belangrijkste gebieden langs te gaan.",
        "Langer is niet automatisch beter. Merk je dat een gebied na een minuut niet meer verandert, ga dan verder naar het volgende of wissel naar beweging en rekken.",
      ],
    },
    {
      kind: "text",
      id: "hoeveel-druk",
      heading: "Hoeveel druk?",
      paragraphs: [
        "Wij gebruiken een eenvoudige schaal van 1 tot 10, waarbij 1 nauwelijks iets voelen is en 10 het meest intense dat je kunt bedenken. Mik op ongeveer een 5 tot 7: stevig en duidelijk voelbaar, maar je kunt rustig blijven ademen en je spieren blijven ontspannen.",
        "Je regelt de druk met je lichaamsgewicht. Meer steun op je handen of je andere voet betekent minder druk; een been over het andere leggen betekent meer. Merk je dat je je adem inhoudt, je gezicht vertrekt of je spieren aanspant, dan is het te veel.",
      ],
    },
    {
      kind: "steps",
      id: "routine",
      heading: "Een eerste routine voor beginners",
      intro:
        "Deze korte routine gaat de grote spiergroepen langs. Rol langzaam, ongeveer een paar centimeter per seconde, en adem rustig door.",
      steps: [
        {
          title: "Kuiten",
          tool: "foam-roller",
          dose: "45 sec per been",
          text: "Zittend met je kuit op de roller, handen naast je heupen. Til je billen op en rol van boven je enkel tot onder je knie.",
        },
        {
          title: "Bovenbenen voorkant",
          tool: "foam-roller",
          dose: "60 sec",
          text: "Lig op je buik met de roller onder je bovenbenen, steunend op je onderarmen. Rol van net boven je knie tot onder je heup.",
        },
        {
          title: "Bilspieren",
          tool: "foam-roller",
          dose: "45 sec per kant",
          text: "Zit op de roller, enkel op de andere knie, en leun iets naar de kant van het gekruiste been. Rol in kleine bewegingen.",
        },
        {
          title: "Bovenrug",
          tool: "foam-roller",
          dose: "8 rustige herhalingen",
          text: "Roller dwars onder je bovenrug, handen achter je hoofd, billen op de grond. Strek rustig over de roller en kom terug.",
        },
        {
          title: "Afronden met beweging",
          tool: "stretchband",
          dose: "2 tot 3 min",
          text: "Sluit af met een paar rustige stretches met de band, bijvoorbeeld voor je hamstrings en schouders. Zo neem je de ruimte die je net hebt gevoeld mee in beweging.",
        },
      ],
    },
    {
      kind: "mistakes",
      id: "fouten",
      heading: "Veelgemaakte fouten",
      items: [
        {
          title: "Pijn als maatstaf",
          text: "Harder is niet beter. Als je je moet schrap zetten, werk je tegen je lichaam in in plaats van mee.",
        },
        {
          title: "Te snel heen en weer",
          text: "Rustig rollen en af en toe pauzeren op een strakke plek voelt voor de meeste mensen prettiger dan snel heen en weer bewegen.",
        },
        {
          title: "Over gewrichten en botten rollen",
          text: "Rol over spieren, niet over je knieschijf, enkelbotjes, ellebogen of direct op de onderrug.",
        },
        {
          title: "Alleen rollen",
          text: "Rollen is een onderdeel. Combineer het met beweging en rekken, zodat je de nieuwe ruimte ook echt gebruikt.",
        },
      ],
    },
    {
      kind: "caution",
      id: "wanneer-niet",
      heading: "Wanneer niet, en wanneer overleggen",
      paragraphs: [
        "Rol niet over blauwe plekken, wondjes, zwellingen, spataderen of plekken die warm, rood of gevoelig zijn. Heb je een blessure, recent een operatie gehad, ben je zwanger of heb je een medische aandoening of gebruik je bloedverdunners? Overleg dan eerst met je huisarts of fysiotherapeut.",
        "Voel je tijdens het rollen een scherpe, stekende of uitstralende pijn, of tintelingen? Stop dan direct. Blijven klachten aanhouden, laat ze dan beoordelen door een professional.",
      ],
    },
  ],
  tools: ["foam-roller", "stretchband", "lacrosse-bal"],
  variant: {
    text: "Twijfel je nog hoe je het aanpakt? Het 14-dagenprogramma begint in alle drie de varianten met vier dagen kennismaken: je leert hoe elke tool werkt en hoeveel druk voor jou prettig is, voordat je gerichter aan de slag gaat.",
  },
  related: ["kuiten-losmaken-met-foam-roller", "onderrug-en-heupen-na-een-dag-zitten", "schouders-en-bovenrug-voor-krachtsporters"],
};
