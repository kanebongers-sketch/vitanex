// ─── LifeOS — datums voor herstel ──────────────────────────────────────────
// Een herstelmeting hoort bij een KALENDERDAG, niet bij een tijdstip. Welke dag
// dat is, is de vraag waar wearable-integraties standaard op stukgaan: je wordt
// om 07:00 lokaal wakker, dat is 05:00 UTC — zelfde dag. Maar val je om 00:30
// lokaal in slaap, dan is dat 23:30 UTC de dag ervóór. Wie klakkeloos
// `new Date(iso).toISOString().slice(0, 10)` doet, schuift metingen een dag op
// zodra de gebruiker of het seizoen van tijdzone verandert.
//
// Daarom: als de bron een lokale datum meelevert (Oura's `day`), gebruiken we
// die. Levert hij alleen een tijdstip + offset (Whoop), dan rekenen we de
// lokale datum expliciet uit. Nooit gokken op de tijdzone van de server.
//
// Puur bestand: geen fetch, geen DB.

/** ISO-kalenderdatum (YYYY-MM-DD). */
export type IsoDatum = string

const DATUM_PATROON = /^\d{4}-\d{2}-\d{2}$/

/** Herkent een YYYY-MM-DD string. Geeft null bij alles wat dat niet is. */
export function isoDatum(v: unknown): IsoDatum | null {
  if (typeof v !== 'string') return null
  const kop = v.slice(0, 10)
  if (!DATUM_PATROON.test(kop)) return null
  // Patroon-match is niet genoeg: 2026-02-31 matcht wél. Laat Date het keuren.
  const d = new Date(`${kop}T00:00:00Z`)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString().slice(0, 10) === kop ? kop : null
}

/**
 * Zet een UTC-tijdstip om naar de kalenderdatum in de tijdzone van de meting.
 *
 * `offset` is de vorm die Whoop meestuurt: '+02:00', '-05:00' of 'Z'. Ontbreekt
 * hij of klopt hij niet, dan geven we null terug in plaats van stilletjes op
 * UTC terug te vallen — een dag ernaast is een stille datafout, en die willen
 * we luid.
 */
export function lokaleDatum(iso: unknown, offset: unknown): IsoDatum | null {
  if (typeof iso !== 'string') return null
  const t = new Date(iso)
  if (Number.isNaN(t.getTime())) return null

  const minuten = offsetInMinuten(offset)
  if (minuten === null) return null

  const lokaal = new Date(t.getTime() + minuten * 60_000)
  return lokaal.toISOString().slice(0, 10)
}

/** '+02:00' → 120, '-05:30' → -330, 'Z' → 0. Null bij onleesbare invoer. */
export function offsetInMinuten(offset: unknown): number | null {
  if (typeof offset !== 'string') return null
  if (offset === 'Z' || offset === 'z') return 0

  const m = /^([+-])(\d{2}):?(\d{2})$/.exec(offset.trim())
  if (!m) return null

  const teken = m[1] === '-' ? -1 : 1
  const uren = Number(m[2])
  const min = Number(m[3])
  if (!Number.isFinite(uren) || !Number.isFinite(min)) return null
  if (uren > 23 || min > 59) return null

  return teken * (uren * 60 + min)
}

/**
 * De laatste `aantal` kalenderdagen t/m `vandaag`, oplopend.
 * `vandaag` geef je expliciet mee zodat dit puur en testbaar blijft.
 */
export function laatsteDagen(vandaag: IsoDatum, aantal: number): IsoDatum[] {
  const start = new Date(`${vandaag}T00:00:00Z`)
  if (Number.isNaN(start.getTime()) || aantal <= 0) return []

  const dagen: IsoDatum[] = []
  for (let i = aantal - 1; i >= 0; i--) {
    const d = new Date(start.getTime() - i * 86_400_000)
    dagen.push(d.toISOString().slice(0, 10))
  }
  return dagen
}

/** `dagen` dagen vóór `datum`, als YYYY-MM-DD. */
export function dagenTerug(datum: IsoDatum, dagen: number): IsoDatum {
  const d = new Date(`${datum}T00:00:00Z`)
  return new Date(d.getTime() - dagen * 86_400_000).toISOString().slice(0, 10)
}

/**
 * De kalenderdag van NU in de tijdzone van de server (TZ, zie .env.example).
 *
 * Bewust NIET `toISOString().slice(0, 10)`: dat is altijd UTC. Om 01:00 in
 * Nederland is het in UTC nog gisteren, en dan synchroniseert LifeOS 's nachts
 * de verkeerde dag en toont de kaart een herstelcijfer van eergisteren.
 * `getFullYear`/`getMonth`/`getDate` zijn wél lokaal en volgen dus TZ.
 */
export function vandaagLokaal(nu: Date = new Date()): IsoDatum {
  const jaar = nu.getFullYear()
  const maand = String(nu.getMonth() + 1).padStart(2, '0')
  const dag = String(nu.getDate()).padStart(2, '0')
  return `${jaar}-${maand}-${dag}`
}
