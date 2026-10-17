// ─── Fit Factory Club, training: coaching per oefening (PUUR) ───────────────
// De uitleg zoals een goede trainer die geeft: eerst de 3 tot 5 kernpunten die
// je hardop zegt ("1. Rug recht", "2. Knieen niet op slot"), dan de opstelling,
// de uitvoering in stappen, de fouten die je op de vloer echt ziet met de
// correctie, ademhaling en tempo. Eigen tekst van Fit Factory, niets vertaald
// of overgenomen. Gekoppeld op de exacte oefeningnaam (club_oefeningen.naam).

export interface Kernpunt {
  /** Het commando zelf, kort en actief: "Rug recht", "Knieen niet op slot". Maximaal 32 tekens. */
  punt: string
  /** Waarom en hoe je het voelt, een zin. Maximaal 140 tekens. */
  uitleg: string
}

export interface Fout {
  /** Wat je ziet gebeuren: "Onderrug wordt bol". Maximaal 60 tekens. */
  fout: string
  /** De correctie die je geeft. Maximaal 140 tekens. */
  beter: string
}

export interface Coaching {
  /** 3 tot 5, de belangrijkste eerst. */
  kernpunten: Kernpunt[]
  /** 1 tot 3 zinnen: hoe je gaat staan, zitten of liggen en het toestel instelt. */
  opstelling: string[]
  /** 2 tot 4 stappen van een herhaling. */
  stappen: string[]
  /** 2 tot 4 veelgemaakte fouten. */
  fouten: Fout[]
  /** Een zin: wanneer in- en uitademen. */
  ademhaling: string
  /** Een korte zin, bijvoorbeeld "2 tellen omlaag, 1 tel omhoog". */
  tempo: string
  /** Optioneel: een lichtere variant of aanpassing. Maximaal 140 tekens. */
  makkelijker?: string
  /** Optioneel: een zwaardere variant. Maximaal 140 tekens. */
  zwaarder?: string
}

export type CoachingBoek = Readonly<Record<string, Coaching>>
