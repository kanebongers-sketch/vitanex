// ─── Fit Factory PT · extra meetopties bij een meting of weging (PUUR) ──────
// Naast de vaste maten (metingen.ts) kiest de PT'er per klant zelf extra waarden,
// zoals spiermassa of rusthartslag. Opslag: pt_metingen.extra (jsonb, migratie 446)
// als { sleutel: getal }. Geen normen of oordelen: alleen meten en verschil tonen.

export type ExtraGroep = 'samenstelling' | 'gezondheid' | 'omtrek' | 'kracht'

export const EXTRA_GROEP_LABEL: Record<ExtraGroep, string> = {
  samenstelling: 'Lichaamssamenstelling',
  gezondheid: 'Gezondheid en herstel',
  omtrek: 'Omtrekmaten',
  kracht: 'Kracht en huidplooien',
}

export interface ExtraVeld {
  sleutel: string
  label: string
  /** Kort, achter het getal ("kg"); leeg als er geen eenheid bij hoort. */
  eenheid: string
  /** Tussen haakjes bij het invoerveld, of null. */
  uitleg: string | null
  min: number
  max: number
  decimalen: 0 | 1
  groep: ExtraGroep
}

export const EXTRA_VELDEN = [
  { sleutel: 'spiermassaKg', label: 'Spiermassa', eenheid: 'kg', uitleg: 'kg', min: 5, max: 150, decimalen: 1, groep: 'samenstelling' },
  { sleutel: 'vetmassaKg', label: 'Vetmassa', eenheid: 'kg', uitleg: 'kg', min: 1, max: 250, decimalen: 1, groep: 'samenstelling' },
  { sleutel: 'visceraalVet', label: 'Visceraal vet', eenheid: '', uitleg: 'niveau 1 tot 59', min: 1, max: 59, decimalen: 0, groep: 'samenstelling' },
  { sleutel: 'vochtPct', label: 'Vochtpercentage', eenheid: '%', uitleg: '%', min: 20, max: 80, decimalen: 1, groep: 'samenstelling' },
  { sleutel: 'botmassaKg', label: 'Botmassa', eenheid: 'kg', uitleg: 'kg', min: 0.5, max: 10, decimalen: 1, groep: 'samenstelling' },
  { sleutel: 'bmrKcal', label: 'BMR rustverbranding', eenheid: 'kcal', uitleg: 'kcal', min: 500, max: 5000, decimalen: 0, groep: 'samenstelling' },
  { sleutel: 'metaboleLeeftijd', label: 'Metabole leeftijd', eenheid: 'jaar', uitleg: 'jaar', min: 10, max: 100, decimalen: 0, groep: 'samenstelling' },
  { sleutel: 'bmi', label: 'BMI', eenheid: '', uitleg: null, min: 10, max: 80, decimalen: 1, groep: 'samenstelling' },
  { sleutel: 'rusthartslag', label: 'Rusthartslag', eenheid: 'slagen/min', uitleg: 'slagen per minuut', min: 25, max: 150, decimalen: 0, groep: 'gezondheid' },
  { sleutel: 'bloeddrukBoven', label: 'Bloeddruk boven', eenheid: 'mmHg', uitleg: 'mmHg', min: 60, max: 260, decimalen: 0, groep: 'gezondheid' },
  { sleutel: 'bloeddrukOnder', label: 'Bloeddruk onder', eenheid: 'mmHg', uitleg: 'mmHg', min: 30, max: 160, decimalen: 0, groep: 'gezondheid' },
  { sleutel: 'slaapUur', label: 'Slaap gemiddeld', eenheid: 'uur', uitleg: 'uur per nacht', min: 1, max: 14, decimalen: 1, groep: 'gezondheid' },
  { sleutel: 'energie', label: 'Energie', eenheid: '', uitleg: '1 tot 10', min: 1, max: 10, decimalen: 0, groep: 'gezondheid' },
  { sleutel: 'nekCm', label: 'Nek', eenheid: 'cm', uitleg: 'cm', min: 20, max: 80, decimalen: 1, groep: 'omtrek' },
  { sleutel: 'schoudersCm', label: 'Schouders', eenheid: 'cm', uitleg: 'cm', min: 60, max: 200, decimalen: 1, groep: 'omtrek' },
  { sleutel: 'onderarmCm', label: 'Onderarm', eenheid: 'cm', uitleg: 'cm', min: 10, max: 60, decimalen: 1, groep: 'omtrek' },
  { sleutel: 'kuitCm', label: 'Kuit', eenheid: 'cm', uitleg: 'cm', min: 15, max: 80, decimalen: 1, groep: 'omtrek' },
  { sleutel: 'bovenbeenCm', label: 'Bovenbeen', eenheid: 'cm', uitleg: 'cm', min: 25, max: 120, decimalen: 1, groep: 'omtrek' },
  { sleutel: 'huidplooienMm', label: 'Huidplooien totaal', eenheid: 'mm', uitleg: 'mm', min: 5, max: 400, decimalen: 1, groep: 'kracht' },
  { sleutel: 'knijpkrachtKg', label: 'Knijpkracht', eenheid: 'kg', uitleg: 'kg', min: 1, max: 120, decimalen: 1, groep: 'kracht' },
] as const satisfies readonly ExtraVeld[]

export type ExtraSleutel = (typeof EXTRA_VELDEN)[number]['sleutel']
/** Alleen de ingevulde extra waarden; een lege meting heeft {}. */
export type ExtraWaarden = Partial<Record<ExtraSleutel, number>>

const PER_SLEUTEL = new Map<string, ExtraVeld>(EXTRA_VELDEN.map((v) => [v.sleutel, v]))

export function isExtraSleutel(v: unknown): v is ExtraSleutel {
  return typeof v === 'string' && PER_SLEUTEL.has(v)
}

export function extraVeld(sleutel: ExtraSleutel): ExtraVeld {
  return PER_SLEUTEL.get(sleutel) as ExtraVeld
}

/** Label met uitleg voor het invoerveld: "Rusthartslag (slagen per minuut)". */
export function extraInvoerLabel(v: ExtraVeld): string {
  return v.uitleg ? `${v.label} (${v.uitleg})` : v.label
}

/** "82,4 kg", "9" (zonder eenheid). Hoogstens een decimaal, zoals getalNl. */
export function metEenheid(n: number, eenheid: string): string {
  const getal = new Intl.NumberFormat('nl-NL', { maximumFractionDigits: 1 }).format(n)
  return eenheid ? `${getal} ${eenheid}` : getal
}

function afronden(n: number, decimalen: number): number {
  const f = 10 ** decimalen
  return Math.round(n * f) / f
}

const isLeeg = (v: unknown) => v === null || v === undefined || (typeof v === 'string' && v.trim() === '')

function alsGetal(v: unknown): number {
  if (typeof v === 'number') return v
  if (typeof v === 'string') return Number(v.trim().replace(',', '.'))
  return NaN
}

function bereikFout(v: ExtraVeld): string {
  const eenheid = v.eenheid ? ` ${v.eenheid}` : ''
  return `${v.label}: vul een getal tussen ${metEenheid(v.min, '')} en ${metEenheid(v.max, '')}${eenheid} in.`
}

type Lees<T> = { ok: true; waarde: T } | { ok: false; fout: string }

/**
 * Invoer van het formulier (systeemgrens, streng): alleen bekende sleutels,
 * getallen binnen het bereik, afgerond op de decimalen van het veld. Lege
 * velden tellen niet mee. Ontbreekt `extra`, dan is het {}.
 */
export function leesExtraInvoer(v: unknown): Lees<ExtraWaarden> {
  if (v === null || v === undefined) return { ok: true, waarde: {} }
  if (typeof v !== 'object' || Array.isArray(v)) return { ok: false, fout: 'Ongeldige extra metingen.' }
  const uit: ExtraWaarden = {}
  for (const [sleutel, ruw] of Object.entries(v as Record<string, unknown>)) {
    if (!isExtraSleutel(sleutel)) return { ok: false, fout: 'Onbekende meetoptie. Ververs de pagina en probeer het opnieuw.' }
    if (isLeeg(ruw)) continue
    const veld = extraVeld(sleutel)
    const n = alsGetal(ruw)
    if (!Number.isFinite(n) || n < veld.min || n > veld.max) return { ok: false, fout: bereikFout(veld) }
    uit[sleutel] = afronden(n, veld.decimalen)
  }
  return { ok: true, waarde: uit }
}

/**
 * Een opgeslagen waarde (database, mild): oude rijen zonder extra geven {},
 * onbekende of onleesbare waarden worden overgeslagen in plaats van de hele
 * meting te laten verdwijnen.
 */
export function leesExtraOpgeslagen(v: unknown): ExtraWaarden {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) return {}
  const uit: ExtraWaarden = {}
  for (const [sleutel, ruw] of Object.entries(v as Record<string, unknown>)) {
    if (!isExtraSleutel(sleutel)) continue
    const veld = extraVeld(sleutel)
    const n = alsGetal(ruw)
    if (Number.isFinite(n) && n >= veld.min && n <= veld.max) uit[sleutel] = afronden(n, veld.decimalen)
  }
  return uit
}

/** De sleutels die in deze metingen ingevuld zijn, in de vaste volgorde van EXTRA_VELDEN. */
function gebruikteSleutels(lijsten: readonly ExtraWaarden[]): ExtraSleutel[] {
  return EXTRA_VELDEN.map((v) => v.sleutel).filter((s) => lijsten.some((e) => e[s] !== undefined))
}

/**
 * Wat de PT'er bij deze klant eerder gemeten heeft, staat bij de volgende
 * weging of meting al klaar (in de vaste volgorde).
 */
export function extraVoorselectie(metingen: readonly { extra: ExtraWaarden }[]): ExtraSleutel[] {
  return gebruikteSleutels(metingen.map((m) => m.extra))
}

/** Formulierwaarden (tekst) van de gekozen velden → body voor de API. */
export function extraBody(gekozen: readonly ExtraSleutel[], waarden: Readonly<Record<string, string>>): Record<string, string> {
  return Object.fromEntries(gekozen.map((s) => [s, waarden[s] ?? '']).filter(([, w]) => w.trim() !== ''))
}
