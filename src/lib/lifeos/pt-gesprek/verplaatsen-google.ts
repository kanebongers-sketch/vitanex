// ─── LifeOS | coachgesprekken verplaatsen: Google en uitvoeren (SERVER-ONLY) ─
// Leest de gekozen agenda en "Coachgesprekken PT", maakt het plan (de regels staan
// puur en getest in `verplaatsen.ts`) en voert het per afspraak uit:
//   verplaatsen  events.move (zelfde afspraak, zelfde id, ook een hele reeks);
//   hernoemen    eerst de vaste titel (patch), dan verplaatsen. Mislukt het
//                verplaatsen, dan ziet de volgende ronde de vaste titel en pakt hem alsnog;
//   splitsen     de helften aanmaken in "Coachgesprekken PT", pas daarna het origineel weg;
//   dubbel       verwijderen, maar niet als het verplaatsen van de bewaarde mislukte.
// Elke afspraak heeft een eigen try: een fout stopt de rest niet en komt in de lijst.
// Alleen de bestaande scope calendar.events; sendUpdates=none, dus niemand krijgt mail.

import type { SupabaseClient } from '@supabase/supabase-js'
import { eventsEndpoint, haalKalenders } from '@/lib/lifeos/agenda/google'
import { geldigToken, leesGekozenKalender } from '@/lib/lifeos/agenda/koppeling'
import { leesKalenders } from '@/lib/lifeos/agenda/kalenders'
import { AgendaSchrijfFout, googleFetchMetVernieuwing } from '@/lib/lifeos/agenda/schrijven'
import { haalCoachAgenda } from './coach-agenda-ophalen'
import { COACH_AGENDA_NAAM, extraCoachAgenda, vindCoachAgenda } from './coach-agenda'
import {
  leesAgendaItem,
  maakPlan,
  uitvoerVolgorde,
  verplaatsVenster,
  type AgendaItem,
  type Resultaat,
  type VerplaatsPlan,
  type Voorstel,
  type Voorvertoning,
} from './verplaatsen'

const MAX_PAGINAS = 20
const GOOGLE_CALENDAR = 'google_calendar'

/** Een fout die de hele actie tegenhoudt, met een melding voor Kane. */
export class VerplaatsFout extends Error {
  readonly status: number
  constructor(status: number, melding: string) {
    super(melding)
    this.name = 'VerplaatsFout'
    this.status = status
  }
}

export interface VerplaatsContext {
  gekozen: string | null
  coachId: string
  vanAgenda: string
}

/** De agenda's controleren: gekoppeld, coachagenda bestaat, is anders en beschrijfbaar. */
export async function bepaalContext(admin: SupabaseClient, userId: string): Promise<VerplaatsContext> {
  const token = await geldigToken(admin, userId)
  if (token.staat === 'niet_gekoppeld') throw new VerplaatsFout(409, 'Je Google Agenda is niet gekoppeld. Koppel hem eerst.')
  if (token.staat === 'fout') throw new VerplaatsFout(502, 'Google is nu niet bereikbaar. Probeer het straks opnieuw.')

  const gekozen = await leesGekozenKalender(admin, userId)
  // Vers uit Google (niet uit de cache van tien minuten): net aangemaakt telt meteen.
  const live = await haalKalenders(token.toegangstoken)
  const coach = live.staat === 'ok' ? vindCoachAgenda(live.kalenders) : await haalCoachAgenda(admin, userId, token.toegangstoken)
  if (!coach) {
    throw new VerplaatsFout(409, `De agenda "${COACH_AGENDA_NAAM}" bestaat niet in je Google Agenda. Maak hem eerst aan met precies die naam.`)
  }
  if (extraCoachAgenda(gekozen, coach) === null) {
    throw new VerplaatsFout(409, `Je gekozen agenda is al "${COACH_AGENDA_NAAM}". Er valt niets te verplaatsen.`)
  }
  if (!coach.schrijfbaar) throw new VerplaatsFout(409, `LifeOS mag niet schrijven in "${COACH_AGENDA_NAAM}".`)

  return { gekozen, coachId: coach.id, vanAgenda: await agendaNaam(admin, userId, gekozen, live.staat === 'ok' ? live.kalenders : null) }
}

async function agendaNaam(
  admin: SupabaseClient,
  userId: string,
  gekozen: string | null,
  live: readonly { id: string; naam: string; primair: boolean }[] | null,
): Promise<string> {
  const uitLive = live?.find((k) => (gekozen === null ? k.primair : k.id === gekozen))?.naam
  if (uitLive) return uitLive
  const lijst = gekozen !== null ? await leesKalenders(admin, userId) : null
  const opgeslagen = lijst?.ok ? lijst.waarde.find((k) => k.kalenderId === gekozen)?.naam : undefined
  return opgeslagen ?? (gekozen === null ? 'je hoofdagenda' : 'je gekozen agenda')
}

/** Alle afspraken in het venster, reeksen als een afspraak (singleEvents=false). */
async function haalItems(admin: SupabaseClient, userId: string, kalenderId: string | null, van: Date, tot: Date): Promise<AgendaItem[]> {
  const items: AgendaItem[] = []
  let paginaToken: string | null = null
  for (let pagina = 0; pagina < MAX_PAGINAS; pagina++) {
    const params = new URLSearchParams({
      timeMin: van.toISOString(),
      timeMax: tot.toISOString(),
      singleEvents: 'false',
      showDeleted: 'false',
      maxResults: '2500',
    })
    if (paginaToken) params.set('pageToken', paginaToken)
    const antwoord = await googleFetchMetVernieuwing(admin, userId, 'GET', `${eventsEndpoint(kalenderId)}?${params.toString()}`)
    if (!antwoord.ok) throw new VerplaatsFout(502, `Kon je agenda niet lezen (Google gaf ${antwoord.status}).`)
    const ruw: unknown = await antwoord.json().catch(() => null)
    if (typeof ruw !== 'object' || ruw === null) throw new VerplaatsFout(502, 'Google gaf een onbegrijpelijk antwoord.')
    const r = ruw as { items?: unknown; nextPageToken?: unknown }
    for (const ruwItem of Array.isArray(r.items) ? r.items : []) {
      const gelezen = leesAgendaItem(ruwItem)
      if (gelezen) items.push(gelezen)
    }
    paginaToken = typeof r.nextPageToken === 'string' ? r.nextPageToken : null
    if (!paginaToken) return items
  }
  // Niet stil afkappen: dan zou een deel van de afspraken ontbreken.
  throw new VerplaatsFout(502, 'Te veel afspraken om in een keer te lezen.')
}

async function haalPtNamen(admin: SupabaseClient, userId: string): Promise<string[]> {
  const { data, error } = await admin
    .from('pt_lead_links')
    .select('persoon:crm_personen(naam, status, user_id)')
    .eq('user_id', userId)
    .eq('rol', 'pt')
    .eq('actief', true)
  if (error || !Array.isArray(data)) throw new VerplaatsFout(502, 'Kon je PT-team niet lezen.')
  return (data as unknown[]).flatMap((rij) => {
    const ruw = (rij as { persoon?: unknown }).persoon
    const p = (Array.isArray(ruw) ? ruw[0] : ruw) as { naam?: unknown; status?: unknown; user_id?: unknown } | null | undefined
    return p && typeof p.naam === 'string' && p.status !== 'inactief' && p.user_id === userId ? [p.naam] : []
  })
}

/** Stap 1, altijd eerst: het plan op basis van wat er nu in beide agenda's staat. */
export async function maakVoorvertoning(
  admin: SupabaseClient,
  userId: string,
  nu: Date,
): Promise<{ context: VerplaatsContext; voorvertoning: Voorvertoning }> {
  const context = await bepaalContext(admin, userId)
  const { van, tot } = verplaatsVenster(nu)
  const [gekozen, coach, namen] = await Promise.all([
    haalItems(admin, userId, context.gekozen, van, tot),
    haalItems(admin, userId, context.coachId, van, tot),
    haalPtNamen(admin, userId),
  ])
  const plan: VerplaatsPlan = maakPlan(gekozen, coach, namen)
  return { context, voorvertoning: { vanAgenda: context.vanAgenda, ...plan } }
}

// ─── Uitvoeren ──────────────────────────────────────────────────────────────

function redenVan(fout: unknown): string {
  if (fout instanceof AgendaSchrijfFout) {
    if (fout.soort === 'niet_gekoppeld') return 'De koppeling met Google is verlopen.'
    if (fout.soort === 'geen_schrijfrecht') return 'Google weigert dit: geen rechten op deze afspraak.'
    if (fout.soort === 'niet_gevonden') return 'De afspraak bestaat niet meer.'
    return fout.message.startsWith('Google') ? fout.message : 'Google is niet bereikbaar.'
  }
  return 'Onbekende fout.'
}

async function googleMelding(antwoord: Response): Promise<string> {
  const ruw: unknown = await antwoord.json().catch(() => null)
  const melding = (ruw as { error?: { message?: unknown } } | null)?.error?.message
  return typeof melding === 'string' && melding.length > 0 ? `Google (${antwoord.status}): ${melding}` : `Google gaf ${antwoord.status}.`
}

async function roep(admin: SupabaseClient, userId: string, method: 'POST' | 'PATCH' | 'DELETE', url: string, body?: Record<string, unknown>): Promise<void> {
  const antwoord = await googleFetchMetVernieuwing(admin, userId, method, url, body)
  if (method === 'DELETE' && antwoord.status === 410) return
  if (!antwoord.ok) throw new AgendaSchrijfFout('google', await googleMelding(antwoord))
}

function eventUrl(kalenderId: string | null, eventId: string, extra = ''): string {
  return `${eventsEndpoint(kalenderId)}/${encodeURIComponent(eventId)}${extra}`
}

async function voerVoorstelUit(admin: SupabaseClient, userId: string, ctx: VerplaatsContext, v: Voorstel): Promise<void> {
  const geen = '?sendUpdates=none'
  if (v.actie === 'hernoemen' && v.nieuweTitel) {
    await roep(admin, userId, 'PATCH', eventUrl(ctx.gekozen, v.eventId, geen), { summary: v.nieuweTitel })
  }
  if (v.actie === 'verplaatsen' || v.actie === 'hernoemen') {
    const doel = `?destination=${encodeURIComponent(ctx.coachId)}&sendUpdates=none`
    await roep(admin, userId, 'POST', eventUrl(ctx.gekozen, v.eventId, `/move${doel}`))
    return
  }
  if (v.actie === 'splitsen') {
    for (const n of v.nieuw) {
      await roep(admin, userId, 'POST', `${eventsEndpoint(ctx.coachId)}${geen}`, {
        summary: n.titel,
        start: { dateTime: n.startOp },
        end: { dateTime: n.eindOp },
      })
    }
  }
  // Splitsen (na het aanmaken) en dubbel: het origineel uit de gekozen agenda.
  await roep(admin, userId, 'DELETE', eventUrl(ctx.gekozen, v.eventId, geen))
  const { error } = await admin.from('agenda_events').delete().eq('user_id', userId).eq('bron', GOOGLE_CALENDAR).eq('extern_id', v.eventId)
  if (error) console.error('[verplaatsen] cache opruimen mislukt:', error.message)
}

/**
 * Stap 2: het plan opnieuw maken (de agenda kan sinds de voorvertoning veranderd
 * zijn) en alleen de aangevinkte voorstellen uitvoeren die nog in dat plan staan.
 * Twee keer draaien doet niets dubbel: wat verplaatst is, staat niet meer in de
 * gekozen agenda, en wat al in "Coachgesprekken PT" staat wordt niet opnieuw gemaakt.
 */
export async function voerVerplaatsenUit(admin: SupabaseClient, userId: string, aangevinkt: ReadonlySet<string>, nu: Date): Promise<Resultaat[]> {
  const { context, voorvertoning } = await maakVoorvertoning(admin, userId, nu)
  const mislukt = new Set<string>()
  const resultaten: Resultaat[] = []
  for (const v of uitvoerVolgorde(voorvertoning, aangevinkt)) {
    const basis = { sleutel: v.sleutel, actie: v.actie, oudeTitel: v.oudeTitel, startOp: v.startOp }
    if (v.actie === 'dubbel' && v.bewaardDoor !== null && mislukt.has(v.bewaardDoor)) {
      resultaten.push({ ...basis, gelukt: false, reden: 'Niet verwijderd: het verplaatsen van de andere afspraak lukte niet.' })
      continue
    }
    try {
      await voerVoorstelUit(admin, userId, context, v)
      resultaten.push({ ...basis, gelukt: true, reden: null })
    } catch (fout) {
      console.error(`[verplaatsen] ${v.actie} mislukt`, fout instanceof Error ? fout.message : fout)
      mislukt.add(v.sleutel)
      resultaten.push({ ...basis, gelukt: false, reden: redenVan(fout) })
    }
  }
  // Aangevinkt maar niet meer in het plan: zeggen, niet verzwijgen.
  const inPlan = new Set(voorvertoning.voorstellen.map((v) => v.sleutel))
  for (const sleutel of aangevinkt) {
    if (inPlan.has(sleutel)) continue
    resultaten.push({ sleutel, actie: actieUit(sleutel), oudeTitel: '', startOp: nu.toISOString(), gelukt: false, reden: 'Niet meer gevonden: de agenda is sinds de voorvertoning veranderd of dit is al gedaan.' })
  }
  return resultaten
}

function actieUit(sleutel: string): Resultaat['actie'] {
  const soort = sleutel.split(':')[0]
  return soort === 'hernoemen' || soort === 'splitsen' || soort === 'dubbel' ? soort : 'verplaatsen'
}
