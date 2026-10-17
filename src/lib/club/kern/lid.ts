// ─── Fit Factory clubsoftware: het lid (gedeeld) ────────────────────────────
// Het lid zoals elk onderdeel het nodig heeft (rooster, check-in, intake, app).
// Geen bedragen: geld en contracten blijven in Sportivity.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Vestiging } from './vestiging'
import { isVestigingSlug } from './vestigingen'

export const LID_STATUSSEN = ['actief', 'gepauzeerd', 'opgezegd', 'gestopt', 'proef'] as const
export type LidStatus = (typeof LID_STATUSSEN)[number]

export const LID_STATUS_LABEL: Record<LidStatus, string> = {
  actief: 'Actief',
  gepauzeerd: 'Gepauzeerd',
  opgezegd: 'Opgezegd',
  gestopt: 'Gestopt',
  proef: 'Proeflid',
}

/** Mag dit lid trainen en lessen boeken? Opgezegd mag tot de einddatum. */
export function magTrainen(status: LidStatus): boolean {
  return status === 'actief' || status === 'proef' || status === 'opgezegd'
}

export interface Lid {
  id: string
  vestiging: Vestiging
  lidnummer: string | null
  sportivityId: string | null
  voornaam: string
  achternaam: string
  email: string | null
  telefoon: string | null
  geboortedatum: string | null
  geslacht: 'man' | 'vrouw' | 'anders' | null
  abonnement: string | null
  status: LidStatus
  lidSinds: string | null
  einddatum: string | null
  tags: string[]
  coachId: string | null
  demo: boolean
}

export const LID_KOLOMMEN =
  'id, vestiging, lidnummer, sportivity_id, voornaam, achternaam, email, telefoon, geboortedatum, geslacht, abonnement, status, lid_sinds, einddatum, tags, coach_id, demo'

function tekst(v: unknown): string | null {
  return typeof v === 'string' && v.trim() !== '' ? v : null
}

function isStatus(v: unknown): v is LidStatus {
  return typeof v === 'string' && (LID_STATUSSEN as readonly string[]).includes(v)
}

/** Systeemgrens: een databaserij naar een Lid, of null als de rij onbruikbaar is. */
export function lidUitRij(rij: unknown): Lid | null {
  if (typeof rij !== 'object' || rij === null) return null
  const r = rij as Record<string, unknown>
  const id = tekst(r.id)
  const voornaam = tekst(r.voornaam)
  const achternaam = tekst(r.achternaam)
  if (!id || !voornaam || !achternaam || !isVestigingSlug(r.vestiging)) return null
  const geslacht = r.geslacht === 'man' || r.geslacht === 'vrouw' || r.geslacht === 'anders' ? r.geslacht : null
  return {
    id,
    vestiging: r.vestiging,
    lidnummer: tekst(r.lidnummer),
    sportivityId: tekst(r.sportivity_id),
    voornaam,
    achternaam,
    email: tekst(r.email),
    telefoon: tekst(r.telefoon),
    geboortedatum: tekst(r.geboortedatum),
    geslacht,
    abonnement: tekst(r.abonnement),
    status: isStatus(r.status) ? r.status : 'actief',
    lidSinds: tekst(r.lid_sinds),
    einddatum: tekst(r.einddatum),
    tags: Array.isArray(r.tags) ? r.tags.filter((t): t is string => typeof t === 'string') : [],
    coachId: tekst(r.coach_id),
    demo: r.demo === true,
  }
}

export function volledigeNaam(lid: Pick<Lid, 'voornaam' | 'achternaam'>): string {
  return `${lid.voornaam} ${lid.achternaam}`
}

/** Initialen voor een avatar: "Sanne de Vries" wordt "SV". */
export function initialen(lid: Pick<Lid, 'voornaam' | 'achternaam'>): string {
  const laatste = lid.achternaam.trim().split(/\s+/).pop() ?? ''
  return `${lid.voornaam.charAt(0)}${laatste.charAt(0)}`.toUpperCase()
}

/** Eén lid op id, of null (ook bij een fout: de pagina toont dan "niet gevonden"). */
export async function haalLid(admin: SupabaseClient, userId: string, id: string): Promise<Lid | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null
  const { data, error } = await admin.from('club_leden').select(LID_KOLOMMEN).eq('user_id', userId).eq('id', id).maybeSingle()
  if (error) {
    console.error('[club] lid lezen mislukt', error.message)
    return null
  }
  return lidUitRij(data)
}

/** Zoek leden van een vestiging op naam, lidnummer, e-mail of telefoon. Leeg = de eerste `limiet` op naam. */
export async function zoekLeden(
  admin: SupabaseClient,
  userId: string,
  vestiging: Vestiging,
  zoekterm: string,
  limiet = 20,
): Promise<Lid[] | null> {
  let q = admin.from('club_leden').select(LID_KOLOMMEN).eq('user_id', userId).eq('vestiging', vestiging)
  const term = zoekterm.trim().replace(/[%,()*]/g, ' ').slice(0, 60).trim()
  if (term) {
    const delen = term.split(/\s+/).slice(0, 3)
    for (const deel of delen) {
      const p = `%${deel}%`
      q = q.or(`voornaam.ilike.${p},achternaam.ilike.${p},lidnummer.ilike.${p},email.ilike.${p},telefoon.ilike.${p}`)
    }
  }
  const { data, error } = await q.order('achternaam').order('voornaam').limit(Math.min(Math.max(limiet, 1), 200))
  if (error) {
    console.error('[club] leden zoeken mislukt', error.message)
    return null
  }
  return (data ?? []).map(lidUitRij).filter((l): l is Lid => l !== null)
}
