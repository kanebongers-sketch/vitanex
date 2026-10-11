/**
 * Teksten voor de extra blokken op de productpagina.
 * Houd vergelijkingen kwalitatief: geen merknamen, geen prijzen van anderen.
 */

export const SYSTEM_BLOCK = {
  eyebrow: "Een systeem",
  title: "Materiaal met een plan.",
  lead: "Losse tools blijven vaak in de kast liggen. Daarom hoort bij deze kit een programma dat je dag voor dag laat zien wat je doet.",
  pillars: [
    {
      title: "Het materiaal",
      body: "Vijf tools die elkaar aanvullen, van grote spiergroepen tot gerichte plekken. Alles past in een doos.",
    },
    {
      title: "Het 14-dagenplan",
      body: "Scan de QR-kaart en kies je variant: kantoor, hardlopen of kracht. Elke dag een sessie van 10 tot 15 minuten.",
    },
    {
      title: "Groeit met je mee",
      body: "Dag 1 begint rustig, dag 14 is een routine die je zelf kunt voortzetten. Daarna herhaal je het of wissel je van variant.",
    },
  ],
} as const;

export type ComparisonValue = "ja" | "nee" | "deels";

export const COMPARISON = {
  eyebrow: "Vergelijk",
  title: "Waarom een kit?",
  lead: "Materiaal heb je snel. Het verschil zit in het plan dat erbij hoort.",
  columns: ["Deze kit", "Losse tools", "Zelf online zoeken"] as const,
  rows: [
    { label: "Tools voor het hele lichaam", values: ["ja", "deels", "nee"] },
    { label: "Programma per sporttype", values: ["ja", "nee", "deels"] },
    { label: "Ontwikkeld door ervaren coaches", values: ["ja", "nee", "deels"] },
    { label: "Dag-voor-dag opbouw in 14 dagen", values: ["ja", "nee", "nee"] },
    { label: "Alles in een doos opgeborgen", values: ["ja", "nee", "nee"] },
  ] satisfies ReadonlyArray<{ label: string; values: readonly ComparisonValue[] }>,
} as const;


export const CREDENTIALS_STRIP = {
  label: "Ontwikkeld door",
} as const;

export const KIT_CONTENTS_BLOCK = {
  eyebrow: "Inhoud van de kit",
  title: "Zes onderdelen. Een doos.",
  lead: "Van grote spiergroepen tot gerichte plekken: elke tool heeft een eigen taak, en het programma laat zien wanneer je welke pakt.",
} as const;

export const SHIPPING_BLOCK = {
  eyebrow: "Verzending & retour",
  title: "Snel bij je. Zonder gedoe terug.",
  linkLabel: "Lees het volledige retourbeleid",
} as const;
