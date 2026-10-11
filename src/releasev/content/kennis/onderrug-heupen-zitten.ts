import { IMAGES } from "@rv/config/images";
import { KENNIS_PUBLISHED } from "./meta";
import type { KennisArticle } from "./types";

export const onderrugHeupenZitten: KennisArticle = {
  slug: "onderrug-en-heupen-na-een-dag-zitten",
  title: "Onderrug en heupen na een dag zitten",
  description:
    "Stijf na een dag achter je bureau? Een korte avondroutine voor onderrug, bilspieren en heupen met foam roller, lacrosse bal en stretchband. Rustig, praktisch en zonder gedoe.",
  zone: "Onderrug & heupen",
  audience: "Kantoorwerkers",
  image: IMAGES.deskWindow,
  datePublished: KENNIS_PUBLISHED,
  intro: [
    "Acht uur achter een scherm, een uur in de auto of trein en 's avonds nog even op de bank. Op zo'n dag zit je al snel meer dan je beweegt. Veel mensen merken dat aan het eind van de dag: opstaan gaat stroef, de onderrug voelt vast en de heupen lijken wat korter dan 's ochtends.",
    "Je hoeft geen uur te trainen om daar iets tegenover te zetten. In dit artikel vind je een routine van ongeveer twaalf minuten die je 's avonds naast de bank of na het werk op een mat kunt doen.",
  ],
  sections: [
    {
      kind: "text",
      id: "waarom",
      heading: "Waarom zitten zo vastzittend voelt",
      paragraphs: [
        "Als je zit, staan je heupen urenlang in dezelfde gebogen stand. De spieren aan de voorkant van je heup blijven verkort, je bilspieren doen weinig en je onderrug houdt je romp vaak in een houding vast. Dat is op zich niet erg: je lichaam is gemaakt om allerlei houdingen aan te nemen. Het probleem is vooral dat je lang in dezelfde houding blijft.",
        "Daarom draait deze routine om afwisseling. Je geeft je bilspieren en de zijkant van je heupen aandacht met de foam roller en de lacrosse bal, en je opent daarna de voorkant van je heupen met een rustige stretch. Veel mensen vinden dat ze daarna makkelijker rechtop staan en soepeler bewegen.",
        "Rol niet direct op de onderrug zelf. In ons team raden we dat af: anders dan bij de bovenrug zitten er geen ribben omheen, en veel mensen vinden rollen daar onprettig. Je werkt dus vooral rondom de onderrug: bilspieren, heupen en de bovenrug.",
      ],
    },
    {
      kind: "steps",
      id: "routine",
      heading: "De avondroutine",
      intro:
        "Leg je mat op een rustige plek, zet je telefoon even weg en neem de tijd. Beweeg in een tempo waarbij je rustig door je neus kunt blijven ademen.",
      steps: [
        {
          title: "Bilspieren rollen",
          tool: "foam-roller",
          dose: "60 sec per kant",
          text: "Ga zitten op de foam roller, leg je rechterenkel op je linkerknie en leun iets naar rechts. Rol langzaam over je rechterbilspier in kleine bewegingen. Wissel daarna van kant.",
        },
        {
          title: "Zijkant van de heup",
          tool: "foam-roller",
          dose: "45 sec per kant",
          text: "Ga op je zij liggen met de roller net onder je heupbot. Steun op je onderarm en zet je bovenste voet voor je op de grond om het gewicht te doseren. Rol een klein stukje op en neer.",
        },
        {
          title: "Lacrosse bal voor de bil",
          tool: "lacrosse-bal",
          dose: "60 tot 90 sec per kant",
          text: "Leg de lacrosse bal onder je bilspier, liggend of tegen een muur. Zoek een plek die strak aanvoelt en blijf daar even liggen. Laat je knie langzaam naar buiten en weer terug zakken.",
        },
        {
          title: "Bovenrug openen",
          tool: "foam-roller",
          dose: "8 tot 10 rustige herhalingen",
          text: "Leg de roller dwars onder je bovenrug, handen achter je hoofd en billen op de grond. Laat je bovenrug rustig over de roller strekken en kom weer terug. Blijf boven je onderste ribben; de onderrug zelf rol je niet.",
        },
        {
          title: "Heupopener met band",
          tool: "stretchband",
          dose: "2 × 30 tot 45 sec per kant",
          text: "Zet een knie op de grond en de andere voet voor je, in een uitvalspositie. Houd de stretchband boven je hoofd gespannen tussen je handen, span je billen licht aan en schuif je heup een klein stukje naar voren tot je rek voelt aan de voorkant van je heup.",
        },
      ],
      outro:
        "Sta daarna rustig op en loop een minuutje rond. Doe je de routine een paar avonden achter elkaar, dan merk je vanzelf welke stappen voor jou het prettigst zijn.",
    },
    {
      kind: "mistakes",
      id: "fouten",
      heading: "Veelgemaakte fouten",
      items: [
        {
          title: "Direct op de onderrug rollen",
          text: "Het voelt misschien logisch om te rollen waar je de spanning voelt, maar werk liever rondom de onderrug: bilspieren, heupen en bovenrug.",
        },
        {
          title: "Holle rug bij de heupopener",
          text: "Als je in de uitvalspositie je onderrug hol trekt, verplaatst de rek zich weg van je heup. Span je billen licht aan en houd je ribben boven je bekken.",
        },
        {
          title: "Alles in een keer goedmaken",
          text: "Een uur rollen na een week stilzitten werkt meestal minder prettig dan elke dag een paar minuten. Kort en regelmatig wint het van lang en af en toe.",
        },
        {
          title: "De dag zelf vergeten",
          text: "De routine is een mooie afsluiter, maar ook overdag helpt het om af en toe op te staan, even te lopen of van houding te wisselen.",
        },
      ],
    },
    {
      kind: "caution",
      id: "wanneer-niet",
      heading: "Wanneer niet, en wanneer overleggen",
      paragraphs: [
        "Deze routine is bedoeld voor comfort en mobiliteit, niet als behandeling. Voel je uitstralende klachten naar je been, tintelingen of een doof gevoel, of heb je rugklachten die niet vanzelf afnemen? Stop dan met de oefeningen en overleg met je huisarts of fysiotherapeut.",
        "Ben je zwanger, heb je recent een operatie gehad of heb je een aandoening aan je rug of heupen, vraag dan eerst een professional of en hoe je deze oefeningen kunt doen.",
      ],
    },
  ],
  tools: ["foam-roller", "lacrosse-bal", "stretchband"],
  variant: {
    id: "kantoorwerkers",
    text: "De variant voor kantoorwerkers van het 14-dagenprogramma bouwt hierop voort. Naast heupen en bilspieren besteed je aandacht aan nek, schouders en bovenrug, met korte sessies die je na het werk volgt op video.",
  },
  related: ["schouders-en-bovenrug-voor-krachtsporters", "foam-rollen-hoe-vaak-hoe-lang-hoeveel-druk"],
};
