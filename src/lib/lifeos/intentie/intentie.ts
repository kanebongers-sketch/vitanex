// ─── LifeOS — AI-intentiedetectie ───────────────────────────────────────────
// Het gedeelde brein onder Telegram-spraakmemo's én Gmail-analyse. Eén stuk
// tekst ("herinner me vrijdag Ruben te bellen") → één gestructureerde intentie
// die de app kan uitvoeren: taak, agenda, notitie, herinnering, idee of
// follow-up.
//
// ─── EERLIJKHEID (dezelfde regel als overal in LifeOS) ──────────────────────
// Het model mag NIETS verzinnen dat er niet staat. Geen datum genoemd → wanneer
// = null, nooit een gegokte "morgen". Twijfelt het model → soort 'onduidelijk',
// zodat de app terugvraagt in plaats van de verkeerde actie te nemen. Een
// verkeerd geplande afspraak is erger dan een vraag.
//
// De classificatie draait via tool-use (gedwongen JSON), niet via vrije tekst
// die we daarna moeten parsen. Zo kan het antwoord geen vorm hebben die we niet
// aankunnen.

export type IntentieSoort =
  | 'taak'
  | 'agenda'
  | 'notitie'
  | 'herinnering'
  | 'idee'
  | 'follow_up'
  | 'onduidelijk'

/** De zes notitie-categorieën uit Kane's spec, plus 'onbekend' als vangnet. */
export type NotitieCategorie =
  | 'Werk'
  | 'Ideeën'
  | 'Persoonlijk'
  | 'Projecten'
  | 'Training'
  | 'Klanten'
  | 'onbekend'

export interface Intentie {
  soort: IntentieSoort
  /** Korte, imperatieve titel: "Ruben bellen", "Overleg marketing". */
  titel: string
  /** ISO 8601 (lokaal, met offset) of null als er geen tijd genoemd is. */
  wanneer: string | null
  /** Geschatte duur in minuten, of null. Alleen als de tekst het impliceert. */
  duurMinuten: number | null
  /** Genoemde persoon ("Jan", "Ruben"), of null. */
  persoon: string | null
  /** Genoemd project ("MentaForce"), of null. */
  project: string | null
  /** Voor notities/ideeën: de categorie. Anders 'onbekend'. */
  categorie: NotitieCategorie
  /** Modelvertrouwen 0-1. Onder een drempel behandelt de app het als onduidelijk. */
  vertrouwen: number
  /** Eén zin: waarom deze classificatie. Grounding, geen sier. */
  toelichting: string
  /** De oorspronkelijke tekst, ongewijzigd bewaard. */
  rauweTekst: string
}

const SOORTEN: readonly IntentieSoort[] = [
  'taak', 'agenda', 'notitie', 'herinnering', 'idee', 'follow_up', 'onduidelijk',
]

const CATEGORIEEN: readonly NotitieCategorie[] = [
  'Werk', 'Ideeën', 'Persoonlijk', 'Projecten', 'Training', 'Klanten', 'onbekend',
]

/** Het JSON-schema dat het model MOET invullen (tool-use). Eén bron van waarheid. */
export const INTENTIE_SCHEMA = {
  type: 'object',
  properties: {
    soort: { type: 'string', enum: [...SOORTEN] },
    titel: { type: 'string', description: 'Korte imperatieve titel.' },
    wanneer: {
      type: ['string', 'null'],
      description: 'ISO 8601 met offset, of null als er GEEN tijd genoemd is. Verzin nooit een datum.',
    },
    duurMinuten: { type: ['integer', 'null'] },
    persoon: { type: ['string', 'null'] },
    project: { type: ['string', 'null'] },
    categorie: { type: 'string', enum: [...CATEGORIEEN] },
    vertrouwen: { type: 'number', minimum: 0, maximum: 1 },
    toelichting: { type: 'string' },
  },
  required: ['soort', 'titel', 'wanneer', 'categorie', 'vertrouwen', 'toelichting'],
  additionalProperties: false,
} as const

// ─── Narrowing op de modelgrens ─────────────────────────────────────────────
// Ook een gedwongen-JSON-antwoord is externe input: we casten niet, we narrowen.
// Een veld dat niet klopt valt terug op de veilige waarde (null / 'onduidelijk').

function alsSoort(v: unknown): IntentieSoort {
  return typeof v === 'string' && (SOORTEN as readonly string[]).includes(v)
    ? (v as IntentieSoort)
    : 'onduidelijk'
}

function alsCategorie(v: unknown): NotitieCategorie {
  return typeof v === 'string' && (CATEGORIEEN as readonly string[]).includes(v)
    ? (v as NotitieCategorie)
    : 'onbekend'
}

function alsTekstOfNull(v: unknown): string | null {
  return typeof v === 'string' && v.trim().length > 0 ? v.trim() : null
}

function alsGetalOfNull(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null
}

/** Vertrouwen naar 0-1; buiten bereik of onzin → 0 (behandeld als onzeker). */
function alsVertrouwen(v: unknown): number {
  if (typeof v !== 'number' || !Number.isFinite(v)) return 0
  return Math.min(1, Math.max(0, v))
}

/**
 * Zet een ruw modelantwoord om in een `Intentie`. Puur en testbaar.
 * Geeft null als er niet eens een titel is — dan heeft het model niets bruikbaars
 * geproduceerd en moet de app terugvragen.
 */
export function leesIntentie(raw: unknown, rauweTekst: string): Intentie | null {
  if (typeof raw !== 'object' || raw === null) return null
  const o = raw as Record<string, unknown>

  const titel = alsTekstOfNull(o.titel)
  if (!titel) return null

  return {
    soort: alsSoort(o.soort),
    titel,
    wanneer: alsTekstOfNull(o.wanneer),
    duurMinuten: alsGetalOfNull(o.duurMinuten),
    persoon: alsTekstOfNull(o.persoon),
    project: alsTekstOfNull(o.project),
    categorie: alsCategorie(o.categorie),
    vertrouwen: alsVertrouwen(o.vertrouwen),
    toelichting: alsTekstOfNull(o.toelichting) ?? '',
    rauweTekst,
  }
}

/**
 * Onder dit vertrouwen behandelt de app een intentie als onduidelijk, ongeacht
 * wat het model als `soort` koos: dan liever terugvragen dan verkeerd handelen.
 */
export const VERTROUWEN_DREMPEL = 0.55

/** Moet de app terugvragen i.p.v. automatisch handelen? */
export function vraagtOmBevestiging(intentie: Intentie): boolean {
  return intentie.soort === 'onduidelijk' || intentie.vertrouwen < VERTROUWEN_DREMPEL
}

// ─── De systeemprompt ───────────────────────────────────────────────────────

/**
 * Bouwt de systeemprompt. De huidige tijd komt er expliciet ín, zodat "vrijdag"
 * en "morgen" naar een échte datum kunnen — en zodat dit deterministisch te
 * testen is zonder de klok te mocken.
 */
export function bouwSysteemPrompt(nu: Date): string {
  const nuTekst = nu.toLocaleString('nl-NL', {
    timeZone: 'Europe/Amsterdam',
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  })
  return [
    'Je bent de intentie-router van LifeOS, het persoonlijke systeem van Kane.',
    `Nu is het: ${nuTekst} (Europe/Amsterdam).`,
    '',
    'Classificeer het bericht in precies één soort:',
    '- taak: iets dat gedaan moet worden ("offerte sturen").',
    '- agenda: een afspraak met een tijd ("maandag 9:00 overleg").',
    '- notitie: informatie om te bewaren.',
    '- herinnering: een taak mét een moment om aan herinnerd te worden.',
    '- idee: een inval, vaak voor een project ("idee voor MentaForce: ...").',
    '- follow_up: iets waar later op teruggekomen moet worden.',
    '- onduidelijk: je weet het niet zeker. Kies dit liever dan te gokken.',
    '',
    'HARDE REGELS:',
    '- Verzin NOOIT een datum of tijd die niet in het bericht staat. Geen tijd genoemd → wanneer = null.',
    '- Reken relatieve tijd ("vrijdag", "morgen om 9") uit naar ISO 8601 mét offset, op basis van "nu" hierboven.',
    '- Twijfel je over de soort? Kies onduidelijk en zet vertrouwen laag.',
    '- Bij een idee of notitie: kies een categorie (Werk/Ideeën/Persoonlijk/Projecten/Training/Klanten).',
    '- toelichting: één zin waarom, verwijzend naar de woorden in het bericht.',
  ].join('\n')
}

// ─── De modelaanroep ────────────────────────────────────────────────────────

/** Zodat de aanroep injecteerbaar is in tests (geen echte API-call). */
export interface IntentieModel {
  classificeer(systeem: string, bericht: string): Promise<unknown>
}

/**
 * Bepaalt de intentie van een stuk tekst. De modelaanroep is injecteerbaar zodat
 * dit zonder netwerk te testen is; `maakAnthropicModel()` levert de echte.
 */
export async function bepaalIntentie(
  tekst: string,
  model: IntentieModel,
  nu: Date = new Date(),
): Promise<Intentie> {
  const schoon = tekst.trim()
  if (schoon.length === 0) {
    return {
      soort: 'onduidelijk', titel: '(leeg bericht)', wanneer: null, duurMinuten: null,
      persoon: null, project: null, categorie: 'onbekend', vertrouwen: 0,
      toelichting: 'Leeg bericht — niets te classificeren.', rauweTekst: tekst,
    }
  }

  let raw: unknown
  try {
    raw = await model.classificeer(bouwSysteemPrompt(nu), schoon)
  } catch (fout) {
    // Een modelstoring mag geen verkeerde actie worden: val terug op onduidelijk,
    // dan vraagt de app terug. Fout≠leeg, ook hier.
    return {
      soort: 'onduidelijk', titel: schoon.slice(0, 80), wanneer: null, duurMinuten: null,
      persoon: null, project: null, categorie: 'onbekend', vertrouwen: 0,
      toelichting: `Kon de intentie niet bepalen (${fout instanceof Error ? fout.message : 'onbekende fout'}).`,
      rauweTekst: tekst,
    }
  }

  const gelezen = leesIntentie(raw, tekst)
  if (!gelezen) {
    return {
      soort: 'onduidelijk', titel: schoon.slice(0, 80), wanneer: null, duurMinuten: null,
      persoon: null, project: null, categorie: 'onbekend', vertrouwen: 0,
      toelichting: 'Het model gaf geen bruikbare classificatie.', rauweTekst: tekst,
    }
  }
  return gelezen
}
