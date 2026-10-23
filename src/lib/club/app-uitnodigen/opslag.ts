// ─── Club, leden op de app: inplannen en de rem (SERVER-ONLY) ───────────────
// Uitnodigingen en aangevraagde links gaan als mail in de wachtrij
// (club_meldingen); de cron verstuurt ze rustig. Elke query filtert op de
// sportschool (user_id) die van de server komt, nooit van de pagina.

import type { SupabaseClient } from '@supabase/supabase-js'
import { LID_KOLOMMEN, lidUitRij, type Lid } from '@/lib/club/kern/lid'
import { vestigingenUitRijen } from '@/lib/club/kern/vestigingen'
import type { Organisatie } from '@/lib/club/kern/organisatie'
import { alleRijen } from '@/lib/club/leden/data'
import { lidMagApp } from '@/lib/club/ledenlogin/toegang'
import { haalLedenMetApp } from './met-app'
import {
  AANVRAAG_VENSTER_MS, aanvraagSleutel, exactPatroon, linkTekst, remOordeel, selecteer, spreidMoment, uitnodigingSleutel, uitnodigingTekst,
  type RemOordeel, type Selectie, type UitnodigInvoer,
} from './regels'

const MELDINGEN = 'club_meldingen'
const AANVRAGEN = 'club_app_aanvragen'
const BLOK = 500

function log(wat: string, fout: { message: string } | null | undefined): void {
  if (fout) console.error(`[club/app-uitnodigen] ${wat} mislukt`, fout.message)
}

async function haalAfgemeld(admin: SupabaseClient, userId: string): Promise<Set<string> | null> {
  const rijen = await alleRijen('afmeldingen', (van, tot) =>
    admin.from('club_meldingen_voorkeuren').select('lid_id').eq('user_id', userId).eq('mails', false).order('lid_id').range(van, tot),
  )
  return rijen ? new Set(rijen.map((r) => String((r as { lid_id: unknown }).lid_id))) : null
}

async function haalLeden(admin: SupabaseClient, userId: string, vestigingen: readonly string[]): Promise<Lid[] | null> {
  const rijen = await alleRijen('leden', (van, tot) =>
    admin.from('club_leden').select(LID_KOLOMMEN).eq('user_id', userId).in('vestiging', [...vestigingen]).order('id').range(van, tot),
  )
  return rijen ? rijen.map(lidUitRij).filter((l): l is Lid => l !== null) : null
}

// ─── Iedereen uitnodigen ────────────────────────────────────────────────────

/** Wie een uitnodiging zou krijgen, met de tellingen. null bij een leesfout. */
export async function bekijkUitnodigingen(admin: SupabaseClient, userId: string, invoer: UitnodigInvoer): Promise<Selectie | null> {
  const [leden, metApp, afgemeld] = await Promise.all([haalLeden(admin, userId, invoer.vestigingen), haalLedenMetApp(admin, userId), haalAfgemeld(admin, userId)])
  if (!leden || !metApp || !afgemeld) return null
  return selecteer(leden, invoer, metApp, afgemeld)
}

/** Hoeveel uitnodigingen van deze sportschool nog in de wachtrij staan (om achter aan te sluiten). */
async function alGepland(admin: SupabaseClient, userId: string): Promise<number> {
  const { count, error } = await admin.from(MELDINGEN).select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('soort', 'app_uitnodiging').eq('status', 'gepland')
  log('wachtrij tellen', error)
  return count ?? 0
}

export interface PlanUitslag {
  selectie: Selectie
  /** Nieuw in de wachtrij gezet. */
  gepland: number
  /** Vandaag al uitgenodigd (niet nog een keer). */
  alVandaag: number
}

/** Een uitnodigingsmail per lid in de wachtrij, gespreid over de rondes van de cron. null bij een fout. */
export async function planUitnodigingen(admin: SupabaseClient, org: Pick<Organisatie, 'id' | 'naam'>, invoer: UitnodigInvoer, nu: Date): Promise<PlanUitslag | null> {
  const selectie = await bekijkUitnodigingen(admin, org.id, invoer)
  if (!selectie) return null
  const start = await alGepland(admin, org.id)
  const rijen = selectie.teSturen.map((lid, i) => {
    const tekst = uitnodigingTekst(lid.voornaam, org.naam)
    return {
      user_id: org.id, lid_id: lid.id, soort: 'app_uitnodiging', kanaal: 'email', sleutel: uitnodigingSleutel(lid.id, nu),
      onderwerp: tekst.onderwerp.slice(0, 200), inhoud: tekst.mail, status: 'gepland', gepland_op: spreidMoment(start + i, nu).toISOString(),
    }
  })
  let gepland = 0
  for (let i = 0; i < rijen.length; i += BLOK) {
    const { data, error } = await admin.from(MELDINGEN).upsert(rijen.slice(i, i + BLOK), { onConflict: 'user_id,sleutel,kanaal', ignoreDuplicates: true }).select('id')
    if (error) {
      log('uitnodigingen inplannen', error)
      return null
    }
    gepland += data?.length ?? 0
  }
  return { selectie, gepland, alVandaag: rijen.length - gepland }
}

// ─── Zelf een link aanvragen ────────────────────────────────────────────────

/**
 * De rem: tel de aanvragen van het laatste uur per adres en per IP, en schrijf
 * deze aanvraag erbij (ook als hij over de grens gaat, dan blijft de rem staan).
 * Bij een leesfout: dicht (liever geen mail dan een open deur).
 */
export async function registreerAanvraag(admin: SupabaseClient, emailHash: string, ipHash: string, userId: string | null, nu: Date): Promise<{ oordeel: RemOordeel; id: string | null }> {
  const sinds = new Date(nu.getTime() - AANVRAAG_VENSTER_MS).toISOString()
  const tel = (kolom: 'email_hash' | 'ip_hash', waarde: string) =>
    admin.from(AANVRAGEN).select('id', { count: 'exact', head: true }).eq(kolom, waarde).gte('aangemaakt_op', sinds)
  const [adres, ip] = await Promise.all([tel('email_hash', emailHash), tel('ip_hash', ipHash)])
  log('rem lezen', adres.error ?? ip.error)
  const oordeel = adres.error || ip.error ? 'ip' : remOordeel(adres.count ?? 0, ip.count ?? 0)
  const { data, error } = await admin.from(AANVRAGEN).insert({ user_id: userId, email_hash: emailHash, ip_hash: ipHash, aangemaakt_op: nu.toISOString() }).select('id').maybeSingle()
  log('aanvraag vastleggen', error)
  // Opruimen: de rem kijkt maar een uur terug; na een dag is een rij niets meer waard.
  const { error: oud } = await admin.from(AANVRAGEN).delete().lt('aangemaakt_op', new Date(nu.getTime() - 86_400_000).toISOString())
  log('oude aanvragen opruimen', oud)
  const id = (data as { id?: unknown } | null)?.id
  return { oordeel, id: typeof id === 'string' ? id : null }
}

/** Hooguit zoveel leden per adres (een gezin deelt soms een adres). */
const MAX_LEDEN_PER_ADRES = 3

async function ledenMetIds(admin: SupabaseClient, userId: string, ids: string[]): Promise<unknown[]> {
  if (ids.length === 0) return []
  const { data, error } = await admin.from('club_leden').select(LID_KOLOMMEN).eq('user_id', userId).in('id', ids)
  log('leden met inlogadres lezen', error)
  return data ?? []
}

/**
 * Een linkmail voor elk lid van deze sportschool met dit adres dat de app mag
 * gebruiken. Draait na het antwoord (after), zodat de tijd niets verraadt.
 * Best effort: gooit nooit.
 */
export async function planAanvraag(admin: SupabaseClient, org: Pick<Organisatie, 'id' | 'naam'>, email: string, aanvraagId: string, nu: Date): Promise<void> {
  try {
    const [{ data, error }, vest, inlog] = await Promise.all([
      admin.from('club_leden').select(LID_KOLOMMEN).eq('user_id', org.id).ilike('email', exactPatroon(email)).limit(10),
      admin.from('club_vestigingen').select('vestiging, naam, volgorde, standaard').eq('user_id', org.id),
      // Het lid koos bij het activeren misschien een ander inlogadres dan in de ledenlijst staat.
      admin.from('club_lid_toegang').select('lid_id').eq('user_id', org.id).eq('email', email).eq('actief', true).limit(MAX_LEDEN_PER_ADRES),
    ])
    log('leden zoeken', error ?? vest.error ?? inlog.error)
    const vestigingen = vestigingenUitRijen(vest.data ?? [])
    const metInlog = new Set(((inlog.data ?? []) as Array<{ lid_id?: unknown }>).map((r) => String(r.lid_id)))
    const extra = await ledenMetIds(admin, org.id, [...metInlog].filter((id) => !(data ?? []).some((r) => (r as { id?: unknown }).id === id)))
    const leden = [...(data ?? []), ...extra]
      .map(lidUitRij)
      .filter((l): l is Lid => lidMagApp(l, vestigingen) && !l.demo && (l.email?.trim().toLowerCase() === email || metInlog.has(l.id)))
      .slice(0, MAX_LEDEN_PER_ADRES)
    if (leden.length === 0) return
    const rijen = leden.map((lid) => {
      const tekst = linkTekst(lid.voornaam, org.naam)
      return {
        user_id: org.id, lid_id: lid.id, soort: 'app_link', kanaal: 'email', sleutel: aanvraagSleutel(lid.id, aanvraagId),
        onderwerp: tekst.onderwerp.slice(0, 200), inhoud: tekst.mail, status: 'gepland', gepland_op: nu.toISOString(),
      }
    })
    const { error: fout } = await admin.from(MELDINGEN).upsert(rijen, { onConflict: 'user_id,sleutel,kanaal', ignoreDuplicates: true })
    log('linkmail inplannen', fout)
  } catch (err) {
    console.error('[club/app-uitnodigen] aanvraag verwerken mislukt', err instanceof Error ? err.message : 'onbekend')
  }
}
