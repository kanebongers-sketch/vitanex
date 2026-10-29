// ─── Fit Factory Club: de behoudsscore uitgesplitst (PUUR) ──────────────────
// Per onderdeel de punten en een zin die zegt waar ze vandaan komen. Dezelfde
// woorden als in de uitleg van de lijst (perWeekTekst), zodat alles klopt.

import { noShowTekst, perWeekTekst, type Behoud } from './behoud'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { LEDEN } from '@/lib/aiyourgym/taal/woorden/club/leden'

export interface Onderdeel {
  label: string
  punten: number
  max: number
  uitleg: string
}

function hoofdletter(tekst: string): string {
  return tekst.charAt(0).toUpperCase() + tekst.slice(1)
}

type BehoudTekst = (typeof LEDEN)['nl']['behoud']

function frequentie(b: Behoud, t: BehoudTekst, taal: Taal): string {
  return b.recentPerWeek > 0 ? t.laatste4Weken(hoofdletter(perWeekTekst(b.recentPerWeek, taal))) : t.nietLaatste4Weken
}

function trend(b: Behoud, t: BehoudTekst, taal: Taal): string {
  if (b.eerderPerWeek === null) return t.teKortLid
  if (b.eerderPerWeek === 0) return t.kwamNietEerder
  return t.wasEerder(perWeekTekst(b.eerderPerWeek, taal))
}

function recent(b: Behoud, t: BehoudTekst): string {
  if (b.dagenSinds === null) return t.geenBezoek12
  if (b.dagenSinds === 0) return t.vandaagGeweest
  if (b.dagenSinds === 1) return t.gisterenGeweest
  return t.laatsteBezoekDagen(b.dagenSinds)
}

function lidDuur(dagen: number | null, t: BehoudTekst): string {
  if (dagen === null) return t.lidSindsOnbekend
  if (dagen < 90) return t.nieuwLid
  const maanden = Math.floor(dagen / 30.44)
  if (maanden < 24) return t.maandenLid(maanden)
  return t.jaarLid(Math.floor(dagen / 365.25))
}

export function behoudOnderdelen(b: Behoud, taal: Taal = 'nl'): Onderdeel[] {
  const t = LEDEN[taal].behoud
  const l = t.onderdelen
  return [
    { label: l.frequentie, punten: b.onderdelen.frequentie, max: 30, uitleg: frequentie(b, t, taal) },
    { label: l.trend, punten: b.onderdelen.trend, max: 30, uitleg: trend(b, t, taal) },
    { label: l.recent, punten: b.onderdelen.recent, max: 25, uitleg: recent(b, t) },
    { label: l.noShows, punten: b.onderdelen.noShows, max: 10, uitleg: t.noShows8Weken(noShowTekst(b.noShows, taal)) },
    { label: l.lidDuur, punten: b.onderdelen.lidDuur, max: 5, uitleg: lidDuur(b.lidDagen, t) },
  ]
}
