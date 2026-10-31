// ─── AI Your Gym: staffels per vestiging lezen en schrijven (SERVER-ONLY) ───
// Tabellen ayg_vestiging_abonnementen en ayg_staffel_log (migratie 486) en de
// telling van actieve leden uit club_leden. Alleen via de service role.
// Wat telt als actief lid staat op een plek: src/lib/club/leden/actief-tellen.ts.
// Zolang migratie 486 niet is uitgevoerd, geven de leesfuncties null of een
// lege lijst en gaat er niets mis: de pagina toont dan alleen de telling.

import type { SupabaseClient } from '@supabase/supabase-js'
import { TEL_KOLOMMEN, lidVoorTellingUitRij, telActieveLeden, type LidVoorTelling } from '@/lib/club/leden/actief-tellen'
import type { TelAbonnement, TelLog } from './staffel-telling'

const PAGINA = 1000
/** Ruim boven de grootste staffel; meer lezen we niet in een keer. */
const MAX_LEDEN = 50_000

/** De leden van een sportschool (of een vestiging) voor de telling, in pagina's. Null bij een databasefout. */
async function ledenVoorTelling(admin: SupabaseClient, organisatieId: string, vestiging: string | null): Promise<LidVoorTelling[] | null> {
  const uit: LidVoorTelling[] = []
  for (let van = 0; van < MAX_LEDEN; van += PAGINA) {
    const basis = admin.from('club_leden').select(TEL_KOLOMMEN).eq('user_id', organisatieId).eq('demo', false)
    const { data, error } = await (vestiging ? basis.eq('vestiging', vestiging) : basis).order('id').range(van, van + PAGINA - 1)
    if (error) {
      console.error('[aiyourgym] leden tellen mislukt', error.code ?? '')
      return null
    }
    const rijen = (data ?? []).map(lidVoorTellingUitRij).filter((l): l is LidVoorTelling => l !== null)
    uit.push(...rijen)
    if ((data ?? []).length < PAGINA) return uit
  }
  return uit
}

/** Het aantal actieve leden van een vestiging op een dag, of null bij een fout. */
export async function actieveLedenVan(admin: SupabaseClient, organisatieId: string, vestiging: string, dag: string): Promise<number | null> {
  const leden = await ledenVoorTelling(admin, organisatieId, vestiging)
  return leden ? (telActieveLeden(leden, dag)[vestiging] ?? 0) : null
}

/** Het aantal actieve leden per vestiging van een sportschool, of null bij een fout. */
export async function actieveLedenPerVestiging(admin: SupabaseClient, organisatieId: string, dag: string): Promise<Readonly<Record<string, number>> | null> {
  const leden = await ledenVoorTelling(admin, organisatieId, null)
  return leden ? telActieveLeden(leden, dag) : null
}

// ─── Abonnementen per vestiging ─────────────────────────────────────────────

export interface VestigingAbonnementRij {
  id: string
  organisatieId: string
  vestiging: string
  klantId: string | null
  abonnementId: string | null
  bron: 'hoofd' | 'vestiging'
  status: 'aanmaken' | 'actief' | 'opgezegd'
  hoeveelheid: number | null
  actieveLeden: number | null
  geteldOp: string | null
}

const RIJ_KOLOMMEN = 'id, organisatie_id, vestiging, stripe_customer_id, stripe_subscription_id, bron, status, hoeveelheid, actieve_leden, geteld_op'

function getal(v: unknown): number | null {
  return typeof v === 'number' && Number.isInteger(v) ? v : null
}

function tekst(v: unknown): string | null {
  return typeof v === 'string' && v ? v : null
}

export function vestigingAbonnementUitRij(rij: unknown): VestigingAbonnementRij | null {
  if (typeof rij !== 'object' || rij === null) return null
  const r = rij as Record<string, unknown>
  if (typeof r.id !== 'string' || typeof r.organisatie_id !== 'string' || typeof r.vestiging !== 'string') return null
  const status = r.status === 'actief' || r.status === 'opgezegd' ? r.status : 'aanmaken'
  return {
    id: r.id,
    organisatieId: r.organisatie_id,
    vestiging: r.vestiging,
    klantId: tekst(r.stripe_customer_id),
    abonnementId: tekst(r.stripe_subscription_id),
    bron: r.bron === 'hoofd' ? 'hoofd' : 'vestiging',
    status,
    hoeveelheid: getal(r.hoeveelheid),
    actieveLeden: getal(r.actieve_leden),
    geteldOp: tekst(r.geteld_op),
  }
}

/** De abonnementen per vestiging van een sportschool; null bij een fout (of zonder migratie 486). */
export async function vestigingAbonnementen(admin: SupabaseClient, organisatieId: string): Promise<VestigingAbonnementRij[] | null> {
  const { data, error } = await admin.from('ayg_vestiging_abonnementen').select(RIJ_KOLOMMEN).eq('organisatie_id', organisatieId)
  if (error) {
    if (error.code !== '42P01') console.error('[aiyourgym] vestigingsabonnementen lezen mislukt', error.code ?? '')
    return null
  }
  return (data ?? []).map(vestigingAbonnementUitRij).filter((r): r is VestigingAbonnementRij => r !== null)
}

/**
 * Een rij claimen voor een vestiging (uniek per sportschool en vestiging).
 * 'nieuw' = wij maken het abonnement; 'bestaat' = er is al een rij.
 */
export async function claimVestigingAbonnement(admin: SupabaseClient, rij: { organisatieId: string; vestiging: string; klantId: string; bron: 'hoofd' | 'vestiging'; abonnementId?: string; status?: 'aanmaken' | 'actief' }): Promise<'nieuw' | 'bestaat' | 'fout'> {
  const { error } = await admin.from('ayg_vestiging_abonnementen').insert({
    organisatie_id: rij.organisatieId,
    vestiging: rij.vestiging,
    stripe_customer_id: rij.klantId,
    stripe_subscription_id: rij.abonnementId ?? null,
    bron: rij.bron,
    status: rij.status ?? 'aanmaken',
  })
  if (!error) return 'nieuw'
  if (error.code === '23505') return 'bestaat'
  console.error('[aiyourgym] vestigingsabonnement claimen mislukt', error.code ?? '')
  return 'fout'
}

/** Het abonnement van Stripe vastleggen bij de geclaimde rij. */
export async function rondVestigingAbonnementAf(admin: SupabaseClient, organisatieId: string, rijId: string, abonnementId: string, hoeveelheid: number): Promise<boolean> {
  const { error } = await admin
    .from('ayg_vestiging_abonnementen')
    .update({ stripe_subscription_id: abonnementId, status: 'actief', hoeveelheid, bijgewerkt_op: new Date().toISOString() })
    .eq('organisatie_id', organisatieId)
    .eq('id', rijId)
  if (error) console.error('[aiyourgym] vestigingsabonnement vastleggen mislukt', error.code ?? '')
  return !error
}

// ─── Cron: over alle sportscholen ───────────────────────────────────────────

/** Alle lopende abonnementen per vestiging (cron). Null bij een databasefout. */
export async function telbareAbonnementen(admin: SupabaseClient): Promise<TelAbonnement[] | null> {
  const { data, error } = await admin.from('ayg_vestiging_abonnementen').select(RIJ_KOLOMMEN).eq('status', 'actief').not('stripe_subscription_id', 'is', null).order('organisatie_id').limit(5000)
  if (error) {
    console.error('[aiyourgym] telbare abonnementen lezen mislukt', error.code ?? '')
    return null
  }
  return (data ?? [])
    .map(vestigingAbonnementUitRij)
    .filter((r): r is VestigingAbonnementRij & { abonnementId: string } => r !== null && r.abonnementId !== null)
    .map((r) => ({ id: r.id, organisatieId: r.organisatieId, vestiging: r.vestiging, abonnementId: r.abonnementId }))
}

/** De sportscholen met een lopend hoofdabonnement bij Stripe (cron: koppelen en ontbrekende vestigingen). */
export async function sportscholenMetStripe(admin: SupabaseClient): Promise<string[] | null> {
  const { data, error } = await admin.from('ayg_aanmeldingen').select('organisatie_id').in('status', ['actief', 'betaling_mislukt']).not('stripe_subscription_id', 'is', null).not('organisatie_id', 'is', null).limit(5000)
  if (error) {
    console.error('[aiyourgym] sportscholen met Stripe lezen mislukt', error.code ?? '')
    return null
  }
  return [...new Set((data ?? []).map((r) => (r as { organisatie_id?: unknown }).organisatie_id).filter((id): id is string => typeof id === 'string'))]
}

/** Is er voor dit abonnement vandaag al een logregel die niet 'fout' is? */
export async function alGeteld(admin: SupabaseClient, abonnementId: string, dag: string): Promise<boolean | null> {
  const { data, error } = await admin.from('ayg_staffel_log').select('uitkomst').eq('stripe_subscription_id', abonnementId).eq('dag', dag).maybeSingle()
  if (error) return null
  return data !== null && (data as { uitkomst?: unknown }).uitkomst !== 'fout'
}

/** Was de laatste telling voor dit abonnement al prijs op maat? (Dan Kane niet elke dag opnieuw melden.) */
export async function vorigeWasOpMaat(admin: SupabaseClient, abonnementId: string, dag: string): Promise<boolean> {
  const { data } = await admin.from('ayg_staffel_log').select('uitkomst').eq('stripe_subscription_id', abonnementId).lt('dag', dag).order('dag', { ascending: false }).limit(1).maybeSingle()
  return (data as { uitkomst?: unknown } | null)?.uitkomst === 'op_maat'
}

export async function schrijfLog(admin: SupabaseClient, l: TelLog): Promise<boolean> {
  const { error } = await admin.from('ayg_staffel_log').upsert(
    {
      organisatie_id: l.organisatieId,
      vestiging: l.vestiging,
      stripe_subscription_id: l.abonnementId,
      dag: l.dag,
      actieve_leden: l.actieveLeden,
      hoeveelheid_oud: l.hoeveelheidOud,
      hoeveelheid_nieuw: l.hoeveelheidNieuw,
      staffel_oud: l.staffelOud,
      staffel_nieuw: l.staffelNieuw,
      uitkomst: l.uitkomst,
      gemaild: l.gemaild,
      bijgewerkt_op: new Date().toISOString(),
    },
    { onConflict: 'stripe_subscription_id,dag' },
  )
  if (error) console.error('[aiyourgym] staffellog schrijven mislukt', error.code ?? '')
  return !error
}

export async function werkTelRijBij(admin: SupabaseClient, rijId: string, velden: { hoeveelheid?: number; actieveLeden: number; status?: 'opgezegd' }): Promise<void> {
  const nu = new Date().toISOString()
  const { error } = await admin
    .from('ayg_vestiging_abonnementen')
    .update({ actieve_leden: velden.actieveLeden, geteld_op: nu, bijgewerkt_op: nu, ...(velden.hoeveelheid !== undefined ? { hoeveelheid: velden.hoeveelheid } : {}), ...(velden.status ? { status: velden.status } : {}) })
    .eq('id', rijId)
  if (error) console.error('[aiyourgym] vestigingsabonnement bijwerken mislukt', error.code ?? '')
}

// ─── Wijzigingen voor de abonnementspagina ──────────────────────────────────

export interface StaffelWijziging {
  vestiging: string
  dag: string
  staffelOud: number | null
  staffelNieuw: number | null
}

/** De laatste staffelwijzigingen van een sportschool (sinds een dag), nieuwste eerst. */
export async function staffelWijzigingen(admin: SupabaseClient, organisatieId: string, sinds: string): Promise<StaffelWijziging[]> {
  const { data, error } = await admin
    .from('ayg_staffel_log')
    .select('vestiging, dag, staffel_oud, staffel_nieuw, hoeveelheid_oud')
    .eq('organisatie_id', organisatieId)
    .eq('uitkomst', 'bijgewerkt')
    .gte('dag', sinds)
    .order('dag', { ascending: false })
    .limit(50)
  if (error) return []
  return (data ?? []).flatMap((ruw) => {
    const r = ruw as Record<string, unknown>
    const oud = getal(r.staffel_oud)
    const nieuw = getal(r.staffel_nieuw)
    // Alleen echte wissels van staffel (en niet de eerste telling zonder oude hoeveelheid).
    if (typeof r.vestiging !== 'string' || typeof r.dag !== 'string' || r.hoeveelheid_oud === null || oud === nieuw) return []
    return [{ vestiging: r.vestiging, dag: r.dag, staffelOud: oud, staffelNieuw: nieuw }]
  })
}
