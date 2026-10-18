// ─── Club, community: invoer controleren (PUUR) ─────────────────────────────
// Systeemgrens voor de API's: alles wat binnenkomt is unknown. Streng: wat
// niet klopt wordt geweigerd met een Nederlandse melding.

import { isUuid } from '@/lib/club/kern/organisatie'
import { hoortBij, type VestigingInfo } from '@/lib/club/kern/vestigingen'
import { MAX_NAAM, MAX_TEKST, MAX_TOELICHTING, MAX_UITLEG, isMeldReden, isReactieSoort, isToegang, type MeldReden, type ReactieSoort, type Toegang } from './model'

export type Invoer<T> = { ok: true; waarde: T } | { ok: false; fout: string }

const goed = <T>(waarde: T): Invoer<T> => ({ ok: true, waarde })
const fout = <T>(tekst: string): Invoer<T> => ({ ok: false, fout: tekst })

function obj(body: unknown): Record<string, unknown> {
  return typeof body === 'object' && body !== null && !Array.isArray(body) ? (body as Record<string, unknown>) : {}
}

/** Witruimte netjes: geen lege regels in een rij, geen spaties aan de randen. */
export function schoneTekst(v: string): string {
  return v
    .replace(/\r\n?/g, '\n')
    .replace(/[\u0000-\u0008\u000b-\u001f\u007f​-‏‪-‮⁦-⁩]/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function leesBerichtTekst(body: unknown): Invoer<string> {
  const v = obj(body).tekst
  if (typeof v !== 'string') return fout('Schrijf eerst een bericht.')
  const tekst = schoneTekst(v)
  if (!tekst) return fout('Schrijf eerst een bericht.')
  if (tekst.length > MAX_TEKST) return fout(`Een bericht is hoogstens ${MAX_TEKST} tekens.`)
  return goed(tekst)
}

export function leesReactie(body: unknown): Invoer<ReactieSoort> {
  const v = obj(body).soort
  return isReactieSoort(v) ? goed(v) : fout('Kies een duim of een high five.')
}

export interface MeldInvoer {
  reden: MeldReden
  toelichting: string | null
}

export function leesMelding(body: unknown): Invoer<MeldInvoer> {
  const b = obj(body)
  if (!isMeldReden(b.reden)) return fout('Kies waarom je dit bericht meldt.')
  const t = typeof b.toelichting === 'string' ? schoneTekst(b.toelichting) : ''
  if (t.length > MAX_TOELICHTING) return fout(`De toelichting is hoogstens ${MAX_TOELICHTING} tekens.`)
  return goed({ reden: b.reden, toelichting: t || null })
}

export function leesVoorkeur(body: unknown): Invoer<{ opRanglijst: boolean }> {
  const v = obj(body).opRanglijst
  return typeof v === 'boolean' ? goed({ opRanglijst: v }) : fout('Kies of je op de ranglijsten staat.')
}

export interface GroepInvoer {
  naam: string
  uitleg: string | null
  toegang: Toegang
  vestiging: string | null
  challengeId: string | null
  lestypeId: string | null
  ranglijst: boolean
}

function optioneelId(v: unknown): Invoer<string | null> {
  if (v === null || v === undefined || v === '') return goed(null)
  return isUuid(v) ? goed(v) : fout('Deze koppeling bestaat niet.')
}

export function leesGroep(body: unknown, vestigingen: readonly VestigingInfo[]): Invoer<GroepInvoer> {
  const b = obj(body)
  const naam = typeof b.naam === 'string' ? schoneTekst(b.naam).replace(/\n/g, ' ') : ''
  if (naam.length < 2) return fout('Geef de groep een naam van minstens twee tekens.')
  if (naam.length > MAX_NAAM) return fout(`De naam is hoogstens ${MAX_NAAM} tekens.`)
  const uitleg = typeof b.uitleg === 'string' ? schoneTekst(b.uitleg) : ''
  if (uitleg.length > MAX_UITLEG) return fout(`De uitleg is hoogstens ${MAX_UITLEG} tekens.`)
  if (!isToegang(b.toegang)) return fout('Kies of de groep open of besloten is.')
  const vestiging = b.vestiging === null || b.vestiging === undefined || b.vestiging === '' ? null : b.vestiging
  if (vestiging !== null && (typeof vestiging !== 'string' || !hoortBij(vestigingen, vestiging))) return fout('Deze vestiging bestaat niet.')
  const challenge = optioneelId(b.challengeId)
  if (!challenge.ok) return challenge
  const lestype = optioneelId(b.lestypeId)
  if (!lestype.ok) return lestype
  return goed({ naam, uitleg: uitleg || null, toegang: b.toegang, vestiging, challengeId: challenge.waarde, lestypeId: lestype.waarde, ranglijst: b.ranglijst !== false })
}

export const MODERATIE_ACTIES = ['verbergen', 'plaatsen'] as const
export type ModeratieActie = (typeof MODERATIE_ACTIES)[number]

export function leesModeratie(body: unknown): Invoer<ModeratieActie> {
  const v = obj(body).actie
  return v === 'verbergen' || v === 'plaatsen' ? goed(v) : fout('Kies verbergen of plaatsen.')
}

export function leesGroepActie(body: unknown): Invoer<'archiveren' | 'terugzetten' | null> {
  const v = obj(body).actie
  if (v === undefined) return goed(null)
  return v === 'archiveren' || v === 'terugzetten' ? goed(v) : fout('Onbekende actie.')
}

export function leesLidId(body: unknown): Invoer<string> {
  const v = obj(body).lidId
  return isUuid(v) ? goed(v) : fout('Kies een lid.')
}
