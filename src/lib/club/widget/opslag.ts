// ─── Club, boekingswidget: lezen en schrijven (SERVER-ONLY) ─────────────────
// Elke query filtert op de sportschool (user_id). Fouten worden gelogd en als
// null of een lege lijst teruggegeven; de widget toont dan een nette melding.

import type { SupabaseClient } from '@supabase/supabase-js'
import { ORGANISATIE_KOLOMMEN, organisatieUitRij, type Organisatie } from '@/lib/club/kern/organisatie'
import { leesSlug } from '@/lib/club/kern/subdomein'
import { isVestigingSlug } from '@/lib/club/kern/vestigingen'
import { telPerLes } from '@/lib/club/leads/lessen'
import { WIDGET_KOLOMMEN, widgetInstellingenUitRij, type WidgetInstellingen, type WidgetInstellingenInvoer } from './invoer'
import { WIDGET_DAGEN, widgetLesUitRij, type WidgetLes } from './rooster'

function log(wat: string, bericht: string): void {
  console.error(`[club/widget] ${wat} mislukt`, bericht)
}

export interface WidgetContext {
  organisatie: Organisatie
  vestiging: string
  vestigingNaam: string
  instellingen: WidgetInstellingen
}

/** De sportschool, vestiging en instellingen achter een widget-adres, of null (onbekend). */
export async function haalWidgetContext(admin: SupabaseClient, slug: string, vestiging: string): Promise<WidgetContext | null> {
  if (!leesSlug(slug).ok || !isVestigingSlug(vestiging)) return null
  const org = await admin.from('club_organisaties').select(ORGANISATIE_KOLOMMEN).eq('slug', slug).maybeSingle()
  if (org.error) log('sportschool lezen', org.error.message)
  const organisatie = org.error ? null : organisatieUitRij(org.data)
  if (!organisatie) return null
  const [v, w] = await Promise.all([
    admin.from('club_vestigingen').select('vestiging, naam').eq('user_id', organisatie.id).eq('vestiging', vestiging).maybeSingle(),
    haalWidgetInstellingen(admin, organisatie.id, vestiging),
  ])
  if (v.error) log('vestiging lezen', v.error.message)
  if (v.error || !v.data || !w) return null
  const naam = typeof v.data.naam === 'string' && v.data.naam.trim() ? v.data.naam : vestiging
  return { organisatie, vestiging, vestigingNaam: naam, instellingen: w }
}

/** De instellingen van een vestiging (de standaard als er nog niets is), of null bij een leesfout. */
export async function haalWidgetInstellingen(admin: SupabaseClient, userId: string, vestiging: string): Promise<WidgetInstellingen | null> {
  const { data, error } = await admin.from('club_widget_instellingen').select(WIDGET_KOLOMMEN).eq('user_id', userId).eq('vestiging', vestiging).maybeSingle()
  if (error) {
    log('instellingen lezen', error.message)
    return null
  }
  return widgetInstellingenUitRij(data)
}

export async function bewaarWidgetInstellingen(admin: SupabaseClient, userId: string, i: WidgetInstellingenInvoer): Promise<boolean> {
  const { error } = await admin.from('club_widget_instellingen').upsert(
    {
      vestiging: i.vestiging,
      user_id: userId,
      aan: i.aan,
      domeinen: i.domeinen,
      lestype_ids: i.lestypeIds,
      kleurmodus: i.kleurmodus,
      privacy_url: i.privacyUrl,
      bijgewerkt_op: new Date().toISOString(),
    },
    { onConflict: 'vestiging' },
  )
  if (error) log('instellingen opslaan', error.message)
  return !error
}

/** De actieve lestypen van een sportschool, voor de keuze in Club. */
export async function haalLestypen(admin: SupabaseClient, userId: string): Promise<{ id: string; naam: string }[]> {
  const { data, error } = await admin.from('club_lestypen').select('id, naam').eq('user_id', userId).eq('actief', true).order('naam').limit(200)
  if (error) log('lestypen lezen', error.message)
  return (data ?? []).flatMap((r) => (typeof r.id === 'string' && typeof r.naam === 'string' ? [{ id: r.id, naam: r.naam }] : []))
}

/**
 * De geplande lessen van de komende 7 dagen. De bezetting telt alleen hoeveel
 * plekken er weg zijn (reserveringen en proeflessen), nooit wie.
 */
export async function haalWidgetLessen(
  admin: SupabaseClient,
  userId: string,
  vestiging: string,
  lestypeIds: readonly string[],
  nu: Date,
): Promise<WidgetLes[] | null> {
  const tot = new Date(nu.getTime() + (WIDGET_DAGEN + 1) * 86_400_000).toISOString()
  const { data, error } = await admin
    .from('club_lessen')
    .select('id, lestype_id, start_op, eind_op, capaciteit, status, lestype:club_lestypen(naam, actief), zaal:club_zalen(naam), instructeur:club_medewerkers(naam)')
    .eq('user_id', userId)
    .eq('vestiging', vestiging)
    .eq('status', 'gepland')
    .gt('start_op', nu.toISOString())
    .lte('start_op', tot)
    .order('start_op')
    .limit(400)
  if (error) {
    log('lessen lezen', error.message)
    return null
  }
  const rijen = data ?? []
  const ids = rijen.map((r) => r.id).filter((id): id is string => typeof id === 'string')
  if (ids.length === 0) return []
  const [res, leads] = await Promise.all([
    admin.from('club_reserveringen').select('les_id').eq('user_id', userId).in('les_id', ids).in('status', ['geboekt', 'aanwezig']),
    admin.from('club_leads').select('proefles_les_id').eq('user_id', userId).eq('status', 'proefles').in('proefles_les_id', ids),
  ])
  if (res.error || leads.error) {
    log('bezetting lezen', res.error?.message ?? leads.error?.message ?? '')
    return null
  }
  const bezet = telPerLes([...(res.data ?? []).map((r) => r.les_id), ...(leads.data ?? []).map((r) => r.proefles_les_id)])
  const toegestaan = new Set(lestypeIds)
  return rijen
    .map((r) => widgetLesUitRij(r, typeof r.id === 'string' ? (bezet.get(r.id) ?? 0) : 0, toegestaan))
    .filter((l): l is WidgetLes => l !== null)
}
