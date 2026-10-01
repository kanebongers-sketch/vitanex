// ─── LifeOS — wat de blok- en mailautomatisering recent deed (SERVER-ONLY) ──
// Voor de ochtendmail ("AUTOMATISCH GEDAAN"): zo zie je elke dag wat LifeOS zelf
// op je lijst en in je agenda zette. Best-effort: een fout geeft een lege lijst.

import type { SupabaseClient } from '@supabase/supabase-js'

const MOMENT = new Intl.DateTimeFormat('nl-NL', {
  weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'Europe/Amsterdam',
})

export async function haalRecenteBlokkenEnMail(admin: SupabaseClient, userId: string, sinds: Date): Promise<string[]> {
  const iso = sinds.toISOString()
  const [blokken, mailNieuw, mailAf] = await Promise.all([
    admin.from('agenda_blokken').select('titel, start_op').eq('user_id', userId).gte('aangemaakt_op', iso).order('start_op'),
    admin.from('mail_taken').select('taken(titel)').eq('user_id', userId).gte('aangemaakt_op', iso).not('taak_id', 'is', null),
    admin.from('mail_taken').select('taken(titel)').eq('user_id', userId).gte('beantwoord_op', iso).not('taak_id', 'is', null),
  ])
  const titelVan = (r: unknown): string | null => {
    const t = (r as { taken?: { titel?: unknown } | null }).taken?.titel
    return typeof t === 'string' ? t : null
  }
  const uit: string[] = []
  for (const r of (Array.isArray(mailNieuw.data) ? mailNieuw.data : [])) {
    const t = titelVan(r)
    if (t) uit.push(`Uit je mail op je to-do: ${t}`)
  }
  for (const r of (Array.isArray(mailAf.data) ? mailAf.data : [])) {
    const t = titelVan(r)
    if (t) uit.push(`Afgevinkt (je hebt gereageerd): ${t}`)
  }
  for (const r of (Array.isArray(blokken.data) ? blokken.data : []) as { titel: string; start_op: string | null }[]) {
    uit.push(r.start_op ? `In je agenda gezet: ${r.titel} — ${MOMENT.format(new Date(r.start_op))}` : `In je agenda gezet: ${r.titel}`)
  }
  return uit
}
