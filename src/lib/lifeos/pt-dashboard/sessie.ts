// ─── LifeOS — PT-dashboard: wie kijkt er (SERVER-ONLY, voor pagina's) ───────
// Layout en pagina's van /[pt] vragen allebei "welke PT'er, en is dit toestel
// ingelogd?" — `cache` zorgt dat dat per request één keer naar de database gaat.

import { cache } from 'react'
import { cookies } from 'next/headers'
import { createLifeosAdminClient } from '@/lib/lifeos/admin'
import { CODE_PATROON, dagSleutelNl } from '@/lib/lifeos/leads/leads'
import { sessieGeldig, vindLink } from '@/lib/lifeos/leads/links'
import { sessieCookieNaam } from '@/lib/lifeos/leads/pin'
import { haalLeadsVan } from '@/lib/lifeos/leads/opslag'
import { haalKlantenVan } from './klanten-opslag'
import { haalDoelenVoor } from './doelen-opslag'

export const ptSessie = cache(async (code: string) => {
  if (!CODE_PATROON.test(code)) return null
  const admin = createLifeosAdminClient()
  const link = await vindLink(admin, code)
  if (!link) return null
  const token = (await cookies()).get(sessieCookieNaam(link.code))?.value
  const ingelogd = await sessieGeldig(admin, link, token, new Date())
  return { admin, link, ingelogd }
})

/** Alles van één ingelogde PT'er: leads + klanten + doelen + vandaag. Null = niet ingelogd. */
export const ptGegevens = cache(async (code: string) => {
  const s = await ptSessie(code)
  if (!s?.ingelogd) return null
  const [leads, klanten, doelen] = await Promise.all([
    haalLeadsVan(s.admin, s.link),
    haalKlantenVan(s.admin, s.link),
    haalDoelenVoor(s.admin, s.link.userId, [s.link.persoonId]),
  ])
  return {
    link: s.link,
    leads: leads.ok ? leads.waarde : null,
    klanten: klanten.ok ? klanten.waarde : null,
    // Doelen zijn optioneel: niet gezet of niet leesbaar → geen doelensectie.
    doelen: doelen.ok ? (doelen.waarde.get(s.link.persoonId) ?? null) : null,
    vandaag: dagSleutelNl(new Date()),
  }
})
