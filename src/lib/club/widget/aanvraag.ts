// ─── Club, boekingswidget: een aanvraag wordt een lead (SERVER-ONLY) ────────
// Een bezoeker (nog geen lid) vraagt een proefles of kennismaking aan. Dat
// wordt een lead in Club (bron Website), met de gekozen les als interesse en
// een regel in de historie. Geen echte reservering: de sportschool belt of
// mailt en plant de proefles zelf in. Loopt er al een lead met dit
// e-mailadres in deze vestiging, dan komt de aanvraag daarbij als notitie.

import { createHash } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import { LEAD_KOLOMMEN, leadUitRij } from '@/lib/club/leads/model'
import { schrijfHistorie } from '@/lib/club/leads/data'
import type { WidgetAanvraag } from './invoer'
import { WIDGET_DAGEN, interesseTekst, widgetLesUitRij, type WidgetLes } from './rooster'

export const WIDGET_AUTEUR = 'Website-widget'

function log(wat: string, bericht: string): void {
  console.error(`[club/widget] ${wat} mislukt`, bericht)
}

export function hashVoorRem(soort: 'ip' | 'email', waarde: string): string {
  return createHash('sha256').update(`club-widget|${soort}|${waarde}`).digest('hex')
}

/** De rem in de database (migratie 448): true = mag door. Bij een fout liever dicht. */
export async function remToestaan(admin: SupabaseClient, userId: string, ip: string, email: string): Promise<boolean> {
  const { data, error } = await admin.rpc('club_widget_rem', { p_user: userId, p_ip: hashVoorRem('ip', ip), p_email: hashVoorRem('email', email) })
  if (error) log('rem', error.message)
  return !error && data === true
}

/** De gekozen les, alleen als hij in deze vestiging gepland staat, nog komt en zichtbaar is in de widget. */
export async function haalGekozenLes(
  admin: SupabaseClient,
  userId: string,
  vestiging: string,
  lesId: string,
  lestypeIds: readonly string[],
  nu: Date,
): Promise<WidgetLes | null> {
  const { data, error } = await admin
    .from('club_lessen')
    .select('id, lestype_id, start_op, eind_op, capaciteit, status, lestype:club_lestypen(naam, actief)')
    .eq('user_id', userId)
    .eq('vestiging', vestiging)
    .eq('id', lesId)
    .maybeSingle()
  if (error) log('les lezen', error.message)
  if (error || !data) return null
  const les = widgetLesUitRij(data, 0, new Set(lestypeIds))
  if (!les) return null
  const start = new Date(les.startOp).getTime()
  return start > nu.getTime() && start <= nu.getTime() + (WIDGET_DAGEN + 1) * 86_400_000 ? les : null
}

/** Een lopende lead (niet lid, niet verloren) met dit e-mailadres in deze vestiging. */
async function lopendeLead(admin: SupabaseClient, userId: string, vestiging: string, email: string): Promise<string | null> {
  const { data, error } = await admin
    .from('club_leads')
    .select('id')
    .eq('user_id', userId)
    .eq('vestiging', vestiging)
    .eq('email', email)
    .not('status', 'in', '(lid,verloren)')
    .order('aangemaakt_op', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) log('lopende lead zoeken', error.message)
  return !error && data && typeof data.id === 'string' ? data.id : null
}

function notitie(a: WidgetAanvraag, les: WidgetLes | null): string {
  const wat = les ? `Proefles aangevraagd: ${interesseTekst(les)}.` : 'Kennismaking aangevraagd via de website.'
  return `${wat} Telefoon ${a.telefoon}, e-mail ${a.email}. Toestemming voor contact gegeven in de boekingswidget. Nog geen plek gereserveerd: neem contact op en plan de proefles in.`
}

export interface AanvraagContext {
  admin: SupabaseClient
  userId: string
  vestiging: string
}

/** Maak de lead (of vul een lopende aan). false = opslaan mislukt. */
export async function verwerkAanvraag(c: AanvraagContext, a: WidgetAanvraag, les: WidgetLes | null): Promise<boolean> {
  const bestaand = await lopendeLead(c.admin, c.userId, c.vestiging, a.email)
  if (bestaand) {
    return schrijfHistorie(c.admin, c.userId, bestaand, { soort: 'notitie', tekst: `Nieuwe aanvraag via de website. ${notitie(a, les)}`, auteur: WIDGET_AUTEUR })
  }
  const { data, error } = await c.admin
    .from('club_leads')
    .insert({
      user_id: c.userId,
      vestiging: c.vestiging,
      naam: a.naam,
      email: a.email,
      telefoon: a.telefoon,
      bron: 'website',
      interesse: interesseTekst(les),
      toestemming_contact: true,
      status: 'nieuw',
    })
    .select(LEAD_KOLOMMEN)
    .single()
  const lead = error ? null : leadUitRij(data)
  if (!lead) {
    log('lead aanmaken', error?.message ?? 'onleesbare rij')
    return false
  }
  await schrijfHistorie(c.admin, c.userId, lead.id, { soort: 'status', tekst: 'Lead aangemaakt via de boekingswidget op de website. Toestemming voor contact gegeven.', auteur: WIDGET_AUTEUR })
  await schrijfHistorie(c.admin, c.userId, lead.id, { soort: 'notitie', tekst: notitie(a, les), auteur: WIDGET_AUTEUR })
  const { error: logFout } = await c.admin.from('club_logboek').insert({ user_id: c.userId, wie: WIDGET_AUTEUR, actie: 'lead aangemaakt', onderwerp: lead.naam.slice(0, 200), vestiging: c.vestiging })
  if (logFout) log('logboek', logFout.message)
  return true
}
