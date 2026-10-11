import type { ImageKey } from "@rv/config/images";
import type { FaqItem } from "@rv/lib/commerce/types";

/**
 * HOMEPAGE-TEKSTEN — pas hier alle teksten van de homepage aan.
 * Merknaam, prijs, trainer en verzendinfo komen automatisch uit
 * src/config/site.ts en src/config/product.ts.
 *
 * Huisregels voor copy: geen nep-urgentie, geen verzonnen reviews of
 * klantaantallen, geen medische claims (praat over herstel, mobiliteit
 * en comfort — nooit over genezen, behandelen of pijn verhelpen).
 */

export interface SectionIntro {
  index: string;
  eyebrow: string;
  title: string;
  lead?: string;
}

export const HERO = {
  eyebrow: "Recovery & Mobility Kit",
  titleLines: ["Herstel", "is training."],
  lead: "De complete kit voor dagelijks herstel: foam roller, drie massageballen, stretchband en een 14-dagen videoprogramma voor kantoor, hardlopen of kracht. Tien tot vijftien minuten per dag, thuis.",
  primaryCta: "Bestel de kit",
  secondaryCta: "Bekijk het programma",
  useCaseLabel: "Kies je programma",
  useCases: [
    { label: "Kantoor", href: "/kantoor" },
    { label: "Hardlopen", href: "/hardlopen" },
    { label: "Kracht", href: "/kracht" },
  ],
  credit: "Ontwikkeld door",
} as const;

/** Korte USP-balk direct onder de hero */
export const PROOF_BAR = [
  { value: "5", label: "tools voor het hele lichaam" },
  { value: "14", label: "dagen videoprogramma" },
  { value: "3", label: "varianten: kantoor, hardlopen, kracht" },
  { value: "15", label: "minuten per dag, maximaal" },
] as const;

export const PROBLEM = {
  intro: {
    index: "01",
    eyebrow: "Het probleem",
    title: "Je traint hard. Je herstel krijgt de restjes.",
    lead: "Voor elke training heb je een plan. Voor herstel meestal niet.",
  } satisfies SectionIntro,
  situations: [
    {
      label: "Kantoor",
      title: "Acht uur zitten.",
      text: "Stugge heupen en een stijve onderrug, nog voor je training begint.",
      image: "deskWindow",
    },
    {
      label: "Hardlopen",
      title: "Kilometers die blijven hangen.",
      text: "Kuiten en voeten die de dag erna nog strak voelen.",
      image: "runnerNight",
    },
    {
      label: "Kracht",
      title: "Sterk, maar niet soepel.",
      text: "Schouders en heupen die bewegingsvrijheid missen in je squat en press.",
      image: "strength",
    },
  ] satisfies ReadonlyArray<{ label: string; title: string; text: string; image: ImageKey }>,
} as const;

export const KIT = {
  intro: {
    index: "02",
    eyebrow: "Wat zit er in de kit",
    title: "Vijf tools. Een systeem.",
    lead: "Van grote spiergroepen tot gerichte plekken. Alles wat je gebruikt, niets wat in de kast blijft liggen.",
  } satisfies SectionIntro,
  /** Foto per kit-item (id uit src/config/product.ts) */
  images: {
    roller: "foamRolling",
    lacrosse: "lacrosseBalls",
    spiky: "spikyBalls",
    duo: "feetBall",
    band: "bands",
    card: "rollersStanding",
  } satisfies Record<string, ImageKey>,
  cta: "Bekijk de kit",
} as const;

export const PROGRAM = {
  intro: {
    index: "03",
    eyebrow: "Het programma",
    title: "14 dagen. Jouw variant.",
    lead: "Scan de QR-kaart, kies je variant en volg elke dag een korte video. Geen app, geen account.",
  } satisfies SectionIntro,
  variants: [
    { id: "kantoorwerkers", name: "Kantoorwerkers", focus: "Heupen, onderrug, nek en schouders.", image: "deskWindow" },
    { id: "hardlopers", name: "Hardlopers", focus: "Kuiten, voeten, bovenbenen en heupen.", image: "runnerTunnel" },
    { id: "krachtsporters", name: "Krachtsporters", focus: "Schouders, borst, heupen en enkels.", image: "deadlift" },
  ] satisfies ReadonlyArray<{ id: string; name: string; focus: string; image: ImageKey }>,
  videoLabel: "Trailer van het programma",
  cta: "Ontdek het programma",
} as const;

export const STEPS = {
  intro: {
    index: "04",
    eyebrow: "Hoe het werkt",
    title: "Drie stappen naar een vaste routine.",
  } satisfies SectionIntro,
  items: [
    { title: "Bestel je kit", text: "Gratis verzonden in Nederland en België." },
    { title: "Scan en kies", text: "Scan de QR-kaart en kies kantoor, hardlopen of kracht." },
    { title: "10 tot 15 minuten per dag", text: "Volg veertien dagen de korte video's. Daarna weet je wat voor jou werkt." },
  ],
} as const;

export const TRAINER = {
  intro: {
    index: "05",
    eyebrow: "Over de trainer",
    title: "Uit de studio. Naar je woonkamer.",
  } satisfies SectionIntro,
  story:
    "Kane staat aan het hoofd van acht PT-locaties met een team van coaches, en leidt zelf trainers op. Overal kwam hetzelfde terug: sporters die slim trainen, maar hun herstel aan toeval overlaten. Deze kit bundelt wat de coaches dagelijks op de vloer gebruiken, met een programma dat je zelfstandig volgt.",
  photoNote: "Foto volgt",
  cta: "Lees ons verhaal",
} as const;

export const REVIEWS = {
  intro: {
    index: "06",
    eyebrow: "Ervaringen",
    title: "Wat sporters ervan vinden.",
    lead: "We tonen hier alleen echte ervaringen van klanten. Zodra die er zijn, vind je ze op deze plek.",
  } satisfies SectionIntro,
  placeholderBadge: "Voorbeeld",
  placeholderText: "Hier komt een echte klantreview zodra die er is.",
  count: 3,
} as const;

export const FAQ = {
  intro: {
    index: "07",
    eyebrow: "Veelgestelde vragen",
    title: "Goed om te weten.",
  } satisfies SectionIntro,
  extraItems: [
    {
      question: "Moet ik ervaring hebben met foam rollen of mobiliteitswerk?",
      answer: "Nee. Elke oefening wordt in de video stap voor stap voorgedaan en uitgelegd. Je bepaalt zelf hoeveel druk je zet en bouwt rustig op.",
    },
    {
      question: "Kan ik het programma vaker doen dan veertien dagen?",
      answer: "Zeker. Na de veertien dagen blijven de video's beschikbaar, zodat je ze kunt blijven gebruiken als vaste routine of een andere variant kunt proberen.",
    },
  ] satisfies FaqItem[],
} as const;

export const CLOSING = {
  eyebrow: "Klaar om te beginnen",
  titleLines: ["Herstel", "verdient een plan."],
  lead: "Vijf tools, een programma en een paar minuten per dag.",
  cta: "Bestel de kit",
  priceNote: "incl. btw",
} as const;
