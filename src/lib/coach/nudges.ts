/**
 * Proactieve coach-nudges.
 *
 * Detecteert het ENE meest relevante signaal in de eigen data van een gebruiker
 * en formuleert daar een warme, eerlijke boodschap bij. Geen verzonnen cijfers —
 * elke nudge is gebaseerd op echt gelogde data, met de echte getallen erin.
 *
 * Bewust "pull-on-open": deze functie draait wanneer de gebruiker de app opent,
 * niet via een cron. Op web is er (nog) geen push, dus een nudge is toch alleen
 * zichtbaar bij openen — zo is er geen extra infrastructuur nodig en betalen we
 * niets voor inactieve gebruikers.
 */
import { createAdminClient } from '@/lib/supabase-admin'
import { datumMinusDagenNL } from '@/lib/date-nl'

export type NudgeType =
  | 'burnout_stijgend'
  | 'stemming_omlaag'
  | 'slaap_omlaag'
  | 'streak_mijlpaal'
  | 'slaap_omhoog'
  | 'stemming_omhoog'
  | 'burnout_dalend'
  | 'dankbaarheid_gap'
  | 'heractivatie'

export type NudgeToon = 'zorg' | 'viering' | 'aanmoediging'

export interface CoachNudge {
  type: NudgeType
  toon: NudgeToon
  titel: string
  bericht: string
  cta: string
}

const DOMEIN_LABELS: Record<string, string> = {
  stress: 'stress', slaap: 'slaap', energie: 'energie',
  balans: 'werk-privébalans', focus: 'focus', motivatie: 'motivatie',
}

// Prioriteit: zorgsignalen eerst (dat is de kern van het product), dan vieringen
// (dopamine), dan zachte aanmoedigingen. Eén nudge tegelijk — nooit overweldigen.
const PRIORITEIT: Record<NudgeType, number> = {
  burnout_stijgend: 100,
  stemming_omlaag: 90,
  slaap_omlaag: 80,
  streak_mijlpaal: 75,
  slaap_omhoog: 70,
  stemming_omhoog: 68,
  burnout_dalend: 65,
  dankbaarheid_gap: 50,
  heractivatie: 40,
}

function gemiddelde(arr: number[]): number | null {
  if (!arr.length) return null
  return Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10
}

type Rij = Record<string, unknown>

/** Veilige extractie van .data uit een settled Supabase-promise. */
function rijenVan(settled: PromiseSettledResult<unknown>, label: string): Rij[] {
  if (settled.status !== 'fulfilled') {
    console.error(`[coach/nudges] query "${label}" faalde:`, settled.reason)
    return []
  }
  const v = settled.value as { data?: unknown[] | null }
  return (v?.data as Rij[] | null) ?? []
}

/** Telt aaneengesloten dagen (eindigend vandaag/gisteren) met een mood-log. */
function streakLengte(datums: Set<string>): number {
  let streak = 0
  for (let i = 0; i < 60; i++) {
    if (datums.has(datumMinusDagenNL(i))) streak++
    else if (i === 0) continue // vandaag nog niet gelogd telt niet als breuk
    else break
  }
  return streak
}

export async function detectNudge(userId: string): Promise<CoachNudge | null> {
  const admin = createAdminClient()

  const grens7 = datumMinusDagenNL(6)    // laatste 7 dagen (incl. vandaag)
  const grens14 = datumMinusDagenNL(13)  // 7 dagen daarvoor
  const grens37 = datumMinusDagenNL(36)  // voor dankbaarheid-gap

  const settled = await Promise.allSettled([
    // 0 — burnout predictor (meest recente week)
    admin.from('burnout_predictor_scores')
      .select('risico_score, trending, dominante_factor, week_start')
      .eq('user_id', userId).order('week_start', { ascending: false }).limit(1),
    // 1 — slaap laatste 14 dagen (datum, uren)
    admin.from('slaap_logs')
      .select('datum, uren_slaap')
      .eq('user_id', userId).gte('datum', grens14).order('datum', { ascending: true }),
    // 2 — stemming laatste 60 dagen (datum, numerieke stemming) voor trend + streak
    admin.from('stemming_logs')
      .select('datum, stemming')
      .eq('user_id', userId).gte('datum', datumMinusDagenNL(59)).order('datum', { ascending: true }),
    // 3 — dankbaarheid laatste 37 dagen (datum)
    admin.from('dankbaarheid_logs')
      .select('datum')
      .eq('user_id', userId).gte('datum', grens37),
  ])

  const predictor = rijenVan(settled[0], 'burnout_predictor')[0]
  const slaap = rijenVan(settled[1], 'slaap_logs')
  const stemming = rijenVan(settled[2], 'stemming_logs')
  const dankbaarheid = rijenVan(settled[3], 'dankbaarheid_logs')

  const kandidaten: CoachNudge[] = []

  // ── Burnout-trend ──────────────────────────────────────────────────────────
  if (predictor?.trending === 'stijgend') {
    const factor = DOMEIN_LABELS[String(predictor.dominante_factor)] ?? 'je welzijn'
    kandidaten.push({
      type: 'burnout_stijgend',
      toon: 'zorg',
      titel: 'Even bij je inchecken',
      bericht: `Je scores lopen de laatste weken wat terug — vooral op ${factor}. Geen alarm, wél een goed moment om er even bij stil te staan.`,
      cta: 'Praat erover met je coach',
    })
  } else if (predictor?.trending === 'dalend') {
    kandidaten.push({
      type: 'burnout_dalend',
      toon: 'viering',
      titel: 'Het gaat de goede kant op',
      bericht: 'Je welzijnsscores zijn de laatste weken verbeterd. Mooi — wil je weten wat daaraan bijdraagt en hoe je het vasthoudt?',
      cta: 'Vier het met je coach',
    })
  }

  // ── Slaap: laatste 7 vs. 7 dagen daarvoor ────────────────────────────────────
  const slaapRecent = slaap.filter(r => String(r.datum) >= grens7)
    .map(r => Number(r.uren_slaap)).filter(n => Number.isFinite(n) && n > 0)
  const slaapVorig = slaap.filter(r => String(r.datum) < grens7)
    .map(r => Number(r.uren_slaap)).filter(n => Number.isFinite(n) && n > 0)
  const slaapNu = gemiddelde(slaapRecent)
  const slaapEerder = gemiddelde(slaapVorig)
  if (slaapNu !== null && slaapEerder !== null && slaapRecent.length >= 2 && slaapVorig.length >= 2) {
    const delta = Math.round((slaapNu - slaapEerder) * 10) / 10
    if (delta <= -0.7) {
      kandidaten.push({
        type: 'slaap_omlaag',
        toon: 'aanmoediging',
        titel: 'Je slaapt minder dan normaal',
        bericht: `Deze week sliep je gemiddeld ${slaapNu}u, tegen ${slaapEerder}u de week ervoor. Zullen we kijken wat je nachtrust in de weg zit?`,
        cta: 'Vraag je coach om tips',
      })
    } else if (delta >= 0.7) {
      kandidaten.push({
        type: 'slaap_omhoog',
        toon: 'viering',
        titel: 'Je slaap zit in de lift',
        bericht: `Deze week sliep je gemiddeld ${slaapNu}u — ${delta}u meer dan de week ervoor. Goed bezig. Wil je dit ritme vasthouden?`,
        cta: 'Hou het vast met je coach',
      })
    }
  }

  // ── Stemming: laatste 7 vs. 7 dagen daarvoor ─────────────────────────────────
  const stemRecent = stemming.filter(r => String(r.datum) >= grens7)
    .map(r => Number(r.stemming)).filter(n => Number.isFinite(n) && n > 0)
  const stemVorig = stemming.filter(r => String(r.datum) >= grens14 && String(r.datum) < grens7)
    .map(r => Number(r.stemming)).filter(n => Number.isFinite(n) && n > 0)
  const stemNu = gemiddelde(stemRecent)
  const stemEerder = gemiddelde(stemVorig)
  if (stemNu !== null && stemEerder !== null && stemRecent.length >= 2 && stemVorig.length >= 2) {
    const delta = Math.round((stemNu - stemEerder) * 10) / 10
    if (delta <= -0.5) {
      kandidaten.push({
        type: 'stemming_omlaag',
        toon: 'zorg',
        titel: 'Je stemming zakt wat',
        bericht: `Je stemming was deze week gemiddeld ${stemNu}/5, tegen ${stemEerder}/5 de week ervoor. Wil je er even over praten?`,
        cta: 'Praat erover met je coach',
      })
    } else if (delta >= 0.5) {
      kandidaten.push({
        type: 'stemming_omhoog',
        toon: 'viering',
        titel: 'Je zit lekkerder in je vel',
        bericht: `Je stemming klom deze week naar gemiddeld ${stemNu}/5, van ${stemEerder}/5. Wil je weten wat het verschil maakte?`,
        cta: 'Vier het met je coach',
      })
    }
  }

  // ── Streak-mijlpaal (op basis van dagelijkse mood-logs) ──────────────────────
  const moodDatums = new Set(stemming.map(r => String(r.datum)))
  const streak = streakLengte(moodDatums)
  if ([7, 14, 30, 50, 100].includes(streak)) {
    kandidaten.push({
      type: 'streak_mijlpaal',
      toon: 'viering',
      titel: `${streak} dagen op rij!`,
      bericht: `Je hebt ${streak} dagen achter elkaar ingecheckt. Dat is precies hoe inzicht ontstaat. Trots op je — wil je je voortgang bespreken?`,
      cta: 'Bekijk je voortgang met de coach',
    })
  }

  // ── Dankbaarheid-gap: had een gewoonte, maar nu ≥7 dagen stil ────────────────
  const dankRecent = dankbaarheid.filter(r => String(r.datum) >= grens7).length
  const dankEerder = dankbaarheid.filter(r => String(r.datum) < grens7).length
  if (dankRecent === 0 && dankEerder >= 3) {
    kandidaten.push({
      type: 'dankbaarheid_gap',
      toon: 'aanmoediging',
      titel: 'Je dankbaarheidsmoment gemist?',
      bericht: 'Je hield een tijdje dagelijks bij waar je dankbaar voor was, maar de laatste week even niet. Zo’n klein moment doet vaak meer dan je denkt.',
      cta: 'Pak het weer op met je coach',
    })
  }

  // ── Heractivatie: al een paar dagen niets gelogd ─────────────────────────────
  if (!kandidaten.length) {
    const laatsteMood = stemming.length ? String(stemming[stemming.length - 1].datum) : null
    if (!laatsteMood || laatsteMood < datumMinusDagenNL(3)) {
      kandidaten.push({
        type: 'heractivatie',
        toon: 'aanmoediging',
        titel: 'Hoe gaat het echt met je?',
        bericht: 'Het is even geleden dat je iets logde. Geen druk — één eerlijk moment voor jezelf is al genoeg. Ik denk graag met je mee.',
        cta: 'Begin een gesprek',
      })
    }
  }

  if (!kandidaten.length) return null
  kandidaten.sort((a, b) => PRIORITEIT[b.type] - PRIORITEIT[a.type])
  return kandidaten[0]
}
