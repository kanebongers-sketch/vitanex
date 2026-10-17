// ─── Club, afspraken: antwoord van de ledenapp-API lezen (PUUR) ─────────────
// Systeemgrens aan de kant van de app: alles uit de API is `unknown`.

import { isKleur, type Kleur } from '@/lib/club/afspraken/model'

export interface AppAfspraak {
  id: string
  start: string
  eind: string
  typeNaam: string
  kleur: Kleur
  trainer: string
  magAnnuleren: boolean
  annulerenUitleg: string | null
}

export interface AppType {
  id: string
  naam: string
  duurMin: number
  kleur: Kleur
  boekenUrenVooraf: number
  annulerenUrenVooraf: number
  trainers: { id: string; naam: string }[]
}

export interface AppData {
  komend: AppAfspraak[]
  typen: AppType[]
  horizonDagen: number
}

type Rij = Record<string, unknown>
const rij = (v: unknown): Rij | null => (typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Rij) : null)
const tekst = (v: unknown): string => (typeof v === 'string' ? v : '')
const getal = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0)

function afspraakUit(v: unknown): AppAfspraak[] {
  const r = rij(v)
  if (!r || !tekst(r.id) || !tekst(r.start)) return []
  return [{
    id: tekst(r.id),
    start: tekst(r.start),
    eind: tekst(r.eind),
    typeNaam: tekst(r.typeNaam) || 'Afspraak',
    kleur: isKleur(r.kleur) ? r.kleur : 'amber',
    trainer: tekst(r.trainer) || 'Trainer',
    magAnnuleren: r.magAnnuleren === true,
    annulerenUitleg: tekst(r.annulerenUitleg) || null,
  }]
}

function typeUit(v: unknown): AppType[] {
  const r = rij(v)
  if (!r || !tekst(r.id) || !tekst(r.naam)) return []
  const trainers = (Array.isArray(r.trainers) ? r.trainers : []).flatMap((t: unknown) => {
    const m = rij(t)
    return m && tekst(m.id) && tekst(m.naam) ? [{ id: tekst(m.id), naam: tekst(m.naam) }] : []
  })
  return [{
    id: tekst(r.id),
    naam: tekst(r.naam),
    duurMin: getal(r.duurMin),
    kleur: isKleur(r.kleur) ? r.kleur : 'amber',
    boekenUrenVooraf: getal(r.boekenUrenVooraf),
    annulerenUrenVooraf: getal(r.annulerenUrenVooraf),
    trainers,
  }]
}

export function appDataUit(data: Record<string, unknown>): AppData {
  return {
    komend: (Array.isArray(data.komend) ? data.komend : []).flatMap(afspraakUit),
    typen: (Array.isArray(data.typen) ? data.typen : []).flatMap(typeUit),
    horizonDagen: getal(data.horizonDagen) || 28,
  }
}
