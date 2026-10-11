import { SITE } from "@rv/config/site";
import { IMAGES } from "@rv/config/images";

/**
 * OVER-ONS-TEKSTEN — pagina /over-ons.
 * Alles tussen [HAKEN] is een placeholder: vul in met echte, controleerbare
 * gegevens. Verzin geen jaartallen, aantallen klanten of prestaties.
 */

export const ABOUT_HERO = {
  eyebrow: "Over ons",
  titleLines: ["Gemaakt op", "de trainings\u00ADvloer."],
  subtitle: "Niet in een vergaderzaal.",
  lead: `${SITE.brandName} begon met een vraag die ${SITE.trainer.name} steeds vaker hoorde: “Wat kan ik thuis doen om beter te herstellen?” Het antwoord werd deze kit.`,
  portraitLabel: `Portret van ${SITE.trainer.name}, staand op een van de PT-locaties, natuurlijk licht, rustige blik in de camera`,
  portraitAlt: `Portret van ${SITE.trainer.name}`,
  /** Tijdelijk beeld: vervang IMAGES.trainer door een echt portret */
  portrait: IMAGES.trainer,
  portraitNote: "Foto volgt",
} as const;

export const ABOUT_STORY = {
  index: "01",
  eyebrow: "Het verhaal",
  title: "Van de trainingsvloer naar een doos op je mat.",
  paragraphs: [
    `${SITE.trainer.name}: ${SITE.trainer.role.charAt(0).toLowerCase()}${SITE.trainer.role.slice(1)}. Met [AANTAL JAAR] jaar ervaring in het begeleiden van mensen die serieus trainen, van kantoorwerkers met een vol schema tot lopers die naar een marathon toewerken.`,
    `Op 8 PT-locaties werkt een team van coaches elke dag met cliënten op de vloer. Kane leidt daarnaast zelf trainers op, met veel aandacht voor hoe je herstel en mobiliteit goed begeleidt.`,
    "Wat opviel: training krijgt alle aandacht, herstel schiet erbij in. Niet uit onwil, maar omdat het onduidelijk is wat je moet doen, hoe lang, en met welke spullen. Losse foam rollers en ballen belanden in de kast.",
    "Daarom bundelden we de tools die de coaches dagelijks gebruiken in een kit. Het programma erbij volgt dezelfde aanpak die Kane aan trainers leert: korte sessies, duidelijke uitleg, en een ritme dat je na veertien dagen zelf kunt vasthouden.",
    "[PERSOONLIJKE NOOT VAN DE TRAINER: waarom dit project belangrijk voor je is, in je eigen woorden, twee tot drie zinnen.]",
  ],
  studioLabel: "Sfeerbeeld op een PT-locatie: trainer geeft uitleg bij de foam roller, cliënt luistert (met toestemming in beeld)",
  studioAlt: "De trainer geeft uitleg over het gebruik van de foam roller op een van de PT-locaties",
  image: IMAGES.floorStretch,
} as const;


export const ABOUT_VALUES = {
  index: "02",
  eyebrow: "Waar we voor staan",
  title: "Drie woorden die elke keuze sturen.",
  items: [
    {
      name: "Rustig",
      text: "Geen hype, geen haast. Herstel vraagt om aandacht en ademruimte, en zo maken we ook onze producten en video’s: helder, kalm en zonder ruis.",
    },
    {
      name: "Deskundig",
      text: "Elke oefening en elke tool komt uit de dagelijkse praktijk van de coaches op onze PT-locaties en uit het werk van Kane als opleider van trainers. We leggen uit waarom iets werkt en houden het eerlijk over wat het wel en niet doet.",
    },
    {
      name: "Volhouden",
      text: "Een routine van tien minuten die je elke dag doet, is meer waard dan een uur dat je een keer doet. Alles is ontworpen om het makkelijk te maken om door te gaan.",
    },
  ],
} as const;

export const ABOUT_DETAILS = {
  index: "03",
  eyebrow: "Achter de schermen",
  title: "Wie er achter de kit staat.",
  facts: [
    { label: "Ontwikkeld door", value: SITE.trainer.name },
    { label: "Rol", value: SITE.trainer.role },
    { label: "Opleiding en certificeringen", value: "[OPLEIDING / CERTIFICERINGEN]" },
    { label: "Gevestigd in", value: "[PLAATS / REGIO]" },
  ],
  /** Tijdelijke stockbeelden; label beschrijft de foto die er uiteindelijk moet komen */
  gallery: [
    { label: "Detailfoto: handen van de trainer met de lacrosse bal", image: IMAGES.lacrosseBalls },
    { label: "Interieur van een van de PT-locaties, rustige ochtend, geen mensen", image: IMAGES.strength },
  ],
} as const;

export const ABOUT_CTA = {
  title: "Benieuwd naar wat er in de doos zit?",
  primary: "Bekijk de kit",
  secondary: "Over het programma",
  image: IMAGES.rollersStanding,
} as const;
