// ─── Vita — context-builder ─────────────────────────────────────────────────
// Bouwt het VOLATIELE contextblok over deze gebruiker op dit moment.
//
// BELANGRIJK (prompt-caching): dit blok verandert per gebruiker én per dag, en
// hoort dus NA de cache-breakpoint. De stabiele persona (BASIS_SYSTEEM in
// api/coach/route.ts) staat vóór de breakpoint en wordt door alle gebruikers
// gedeeld. Zet hier nooit iets stabiels in, en zet dit blok nooit vóór de
// breakpoint — dan invalideert elke request de cache.
//
// Scores komen SERVER-side uit het canonieke pijler-model — nooit uit de client
// (die kan liegen en rekende met het oude 12-metric-model).

import { createAdminClient } from '@/lib/supabase/supabase-admin'
import { berekenPijlerOverzicht } from '@/lib/pijlers/pijlers-server'
import { pijlerDef } from '@/lib/pijlers/pijlers'
import { scoreNiveau } from '@/lib/pijlers/score'

const DISC_LABELS: Record<string, string> = {
  D: 'Dominant (resultaatgericht, direct, besluitvaardig)',
  I: 'Invloedrijk (enthousiast, communicatief, overtuigend)',
  S: 'Stabiel (geduldig, betrouwbaar, teamgericht)',
  C: 'Consciëntieus (nauwkeurig, analytisch, kwaliteitsgericht)',
}

export interface GebruikerContext {
  naam: string
  discPrimair?: string
  actieveDoelen?: string[]
}

function trendTekst(deltaPct: number | null, richting: string): string {
  if (richting === 'op' && deltaPct !== null) return `, +${deltaPct}% t.o.v. vorige week`
  if (richting === 'neer' && deltaPct !== null) return `, ${deltaPct}% t.o.v. vorige week`
  if (richting === 'stabiel') return ', stabiel'
  return ''
}

/**
 * Het volatiele contextblok: wie is deze persoon, hoe staan de 6 pijlers er nu
 * voor, wat speelt er. Faalt nooit hard — ontbrekende bronnen worden overgeslagen.
 */
export async function buildGebruikerContextBlok(
  userId: string,
  client: GebruikerContext,
): Promise<string> {
  const admin = createAdminClient()
  let ctx = `════ WAT IK OVER DEZE PERSOON WEET ════\nNaam: ${client.naam}\n`

  if (client.discPrimair && DISC_LABELS[client.discPrimair]) {
    ctx += `DISC-profiel: ${client.discPrimair} — ${DISC_LABELS[client.discPrimair]}\n`
  }

  // ── De 6 canonieke pijlers (server-berekend) ───────────────────────────────
  try {
    const { pijlers, wellbeing } = await berekenPijlerOverzicht(admin, userId)

    if (wellbeing.score !== null) {
      ctx += `\nWellbeing nu: ${wellbeing.score}/100 (${wellbeing.gemeten} van ${wellbeing.totaal} pijlers gemeten)\n`
    } else {
      ctx += `\nWellbeing: nog geen meting — deze persoon is net begonnen of logt (nog) niet.\n`
    }

    ctx += `Pijlers (0-100, hoger is beter):\n`
    for (const p of pijlers) {
      const naam = pijlerDef(p.key)?.label ?? p.key
      if (p.score === null) {
        ctx += `  • ${naam}: geen data\n`
        continue
      }
      const niveau = scoreNiveau(p.score)
      ctx += `  • ${naam}: ${p.score} (${niveau.label.toLowerCase()})${trendTekst(p.trend.deltaPct, p.trend.richting)}\n`
    }

    // Prioriteit + grootste beweging — zodat Vita kan sturen i.p.v. opsommen.
    const metData = pijlers.filter((p) => p.score !== null)
    if (metData.length) {
      const laagste = metData.reduce((a, p) => ((p.score as number) < (a.score as number) ? p : a))
      ctx += `→ Vraagt de meeste aandacht: ${pijlerDef(laagste.key)?.label ?? laagste.key} (${laagste.score}).\n`
    }
    const stijgers = pijlers.filter((p) => p.trend.richting === 'op' && p.trend.deltaPct !== null)
    if (stijgers.length) {
      const beste = stijgers.reduce((a, p) => ((p.trend.deltaPct as number) > (a.trend.deltaPct as number) ? p : a))
      ctx += `→ Grootste vooruitgang: ${pijlerDef(beste.key)?.label ?? beste.key} (+${beste.trend.deltaPct}%) — dit mag je vieren.\n`
    }
    const dalers = pijlers.filter((p) => p.trend.richting === 'neer' && p.trend.deltaPct !== null)
    if (dalers.length) {
      const ergste = dalers.reduce((a, p) => ((p.trend.deltaPct as number) < (a.trend.deltaPct as number) ? p : a))
      ctx += `→ Zakt het hardst: ${pijlerDef(ergste.key)?.label ?? ergste.key} (${ergste.trend.deltaPct}%) — houd dit in de gaten.\n`
    }
  } catch {
    ctx += `\n(Pijler-scores zijn nu niet op te halen — praat zonder cijfers.)\n`
  }

  if (client.actieveDoelen?.length) {
    ctx += `\nActieve weekdoelen: ${client.actieveDoelen.join(', ')}\n`
  }

  // ── Burn-out signaal ───────────────────────────────────────────────────────
  try {
    const { data: burnout } = await admin
      .from('burnout_scans')
      .select('risico_niveau')
      .eq('user_id', userId)
      .order('aangemaakt_op', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (burnout?.risico_niveau) {
      ctx += `\nBurn-out risico (recente scan): ${burnout.risico_niveau}\n`
      if (burnout.risico_niveau === 'hoog' || burnout.risico_niveau === 'kritiek') {
        ctx += `Let extra op signalen van overbelasting in dit gesprek.\n`
      }
    }
  } catch { /* niet-kritiek */ }

  // ── Stemming vandaag ───────────────────────────────────────────────────────
  try {
    const vandaag = new Date().toISOString().split('T')[0]
    const { data: mood } = await admin
      .from('stemming_logs')
      .select('stemming, energie')
      .eq('user_id', userId)
      .eq('datum', vandaag)
      .order('aangemaakt_op', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (mood?.stemming != null) {
      ctx += `\nStemming vandaag: ${mood.stemming}/5${mood.energie != null ? `, energie ${mood.energie}/5` : ''}\n`
    }
  } catch { /* niet-kritiek */ }

  // ── Geheugen: wekelijkse samenvattingen van eerdere gesprekken ─────────────
  try {
    const { data: samenvattingen } = await admin
      .from('coach_samenvattingen')
      .select('samenvatting, week_start')
      .eq('user_id', userId)
      .order('week_start', { ascending: false })
      .limit(3)

    if (samenvattingen?.length) {
      ctx += `\nWat we eerder bespraken (jouw geheugen):\n`
      for (const s of samenvattingen) {
        ctx += `  [${s.week_start}] ${s.samenvatting}\n`
      }
    }
  } catch { /* niet-kritiek */ }

  ctx += `\n═══════════════════════════════════════\n`
  ctx += `Dit is wat je al over deze persoon weet — praat alsof je ze kent. `
  ctx += `Som de cijfers niet op; gebruik ze om te sturen naar één concrete volgende stap.\n`

  return ctx
}
