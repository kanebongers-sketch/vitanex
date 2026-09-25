// ─── LifeOS — CRM-personen mét agenda-contact (SERVER-ONLY) ─────────────────
// De I/O-kant van `agenda-contact.ts`: leest je personen en de agenda-CACHE van de
// afgelopen weken (geen Google-call) en verrijkt elke persoon met zijn laatste
// voorbije afspraak. Best-effort: valt de agenda-cache om, dan de personen zonder
// verrijking — nooit een omgevallen CRM door de agenda.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Persoon } from './crm'
import type { Uitkomst } from './fout'
import { haalPersonen } from './opslag'
import { metAgendaContact } from './agenda-contact'
import { haalEventsUitCache } from '@/lib/lifeos/agenda/opslag'

/** Ruim boven de "koud"-drempel (30 dagen), zodat een recente afspraak altijd telt. */
const AGENDA_TERUG_DAGEN = 60

export async function haalPersonenMetAgenda(
  admin: SupabaseClient,
  userId: string,
  nu: Date,
): Promise<Uitkomst<Persoon[]>> {
  const van = new Date(nu.getTime() - AGENDA_TERUG_DAGEN * 24 * 60 * 60 * 1000)
  const [personen, afspraken] = await Promise.all([
    haalPersonen(admin, userId),
    haalEventsUitCache(admin, userId, van, nu).catch(() => ({ ok: false as const, reden: 'db' as const })),
  ])
  if (!personen.ok) return personen
  if (!afspraken.ok) {
    console.error('[crm] agenda-cache lezen mislukt; personen zonder agenda-contact')
    return personen
  }
  return { ok: true, waarde: metAgendaContact(personen.waarde, afspraken.waarde, nu) }
}
