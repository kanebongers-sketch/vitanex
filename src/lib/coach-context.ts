import { createAdminClient } from '@/lib/supabase-admin'

const DOMEIN_LABELS: Record<string, string> = {
  slaap: 'Slaap', stress: 'Stress', energie: 'Energie',
  focus: 'Focus', balans: 'Werk-privé balans', motivatie: 'Motivatie',
}

const DISC_LABELS: Record<string, string> = {
  D: 'Dominant (resultaatgericht, direct, besluitvaardig)',
  I: 'Invloedrijk (enthousiast, communicatief, overtuigend)',
  S: 'Stabiel (geduldig, betrouwbaar, teamgericht)',
  C: 'Consciëntieus (nauwkeurig, analytisch, kwaliteitsgericht)',
}

export interface GebruikerContext {
  naam: string
  discPrimair?: string
  domeinScores?: Record<string, number>
  actieveDoelen?: string[]
}

function berekenVitaalScore(scores: Record<string, number>): number {
  const vals = Object.values(scores).filter(v => v > 0)
  if (!vals.length) return 0
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length
  return Math.round(((avg - 4) / 16) * 100)
}

function laagsteDomein(scores: Record<string, number>): string | null {
  let laagste: string | null = null
  let laagsteScore = Infinity
  for (const [domein, score] of Object.entries(scores)) {
    if (score > 0 && score < laagsteScore) {
      laagsteScore = score
      laagste = domein
    }
  }
  return laagste
}

export async function buildCoachSystemPrompt(
  basisPrompt: string,
  userId: string,
  clientContext: GebruikerContext,
): Promise<string> {
  const admin = createAdminClient()
  let context = basisPrompt

  // ── Gebruikersprofiel ──────────────────────────────────────────────────────
  context += `\n\n════ PERSOONLIJK PROFIEL VAN DEZE GEBRUIKER ════\n`
  context += `Naam: ${clientContext.naam}\n`

  if (clientContext.discPrimair && DISC_LABELS[clientContext.discPrimair]) {
    context += `DISC-profiel: ${clientContext.discPrimair} — ${DISC_LABELS[clientContext.discPrimair]}\n`
  }

  // ── Welzijnsscores uit laatste check-in ───────────────────────────────────
  if (clientContext.domeinScores && Object.values(clientContext.domeinScores).some(v => v > 0)) {
    const vitaal = berekenVitaalScore(clientContext.domeinScores)
    const laagste = laagsteDomein(clientContext.domeinScores)
    context += `\nLaatste vitaliteitsscore: ${vitaal}/100\n`
    context += `Scores per welzijnsdomein:\n`
    for (const [domein, score] of Object.entries(clientContext.domeinScores)) {
      if (score > 0) {
        const pct = Math.round(((score - 4) / 16) * 100)
        const niveau = pct >= 75 ? '✓ goed' : pct >= 50 ? '~ matig' : '⚠ laag'
        context += `  • ${DOMEIN_LABELS[domein] ?? domein}: ${pct}% (${niveau})\n`
      }
    }
    if (laagste) {
      context += `→ Aandachtspunt: ${DOMEIN_LABELS[laagste] ?? laagste} scoort het laagst.\n`
    }
  }

  // ── Actieve weekdoelen ─────────────────────────────────────────────────────
  if (clientContext.actieveDoelen?.length) {
    context += `\nActieve weekdoelen: ${clientContext.actieveDoelen.join(', ')}\n`
  }

  // ── Recente burnout scan ───────────────────────────────────────────────────
  try {
    const { data: burnout } = await admin
      .from('burnout_scans')
      .select('risico_niveau, uitputting, cynisme, efficaciteit, aangemaakt_op')
      .eq('user_id', userId)
      .order('aangemaakt_op', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (burnout?.risico_niveau) {
      const labels: Record<string, string> = {
        laag: '🟢 laag', matig: '🟡 matig', hoog: '🔴 hoog', kritiek: '🚨 kritiek',
      }
      context += `\nBurn-out risico (recente scan): ${labels[burnout.risico_niveau] ?? burnout.risico_niveau}\n`
      if (burnout.risico_niveau === 'hoog' || burnout.risico_niveau === 'kritiek') {
        context += `⚠️ Let extra op signalen van overbelasting in dit gesprek.\n`
      }
    }
  } catch { /* niet-kritiek */ }

  // ── Stemming vandaag ───────────────────────────────────────────────────────
  try {
    const vandaag = new Date().toISOString().split('T')[0]
    const { data: mood } = await admin
      .from('mood_logs')
      .select('stemming')
      .eq('user_id', userId)
      .eq('datum', vandaag)
      .maybeSingle()

    if (mood?.stemming) {
      const moodLabels: Record<string, string> = {
        moe: 'moe', gestrest: 'gestrest', ok: 'oké', blij: 'blij', energiek: 'energiek',
      }
      context += `\nStemming vandaag: ${moodLabels[mood.stemming] ?? mood.stemming}\n`
    }
  } catch { /* niet-kritiek */ }

  // ── Predictor trend ────────────────────────────────────────────────────────
  try {
    const { data: predictor } = await admin
      .from('burnout_predictor_scores')
      .select('risico_score, trending, dominante_factor')
      .eq('user_id', userId)
      .order('week_start', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (predictor?.trending && predictor.trending !== 'stabiel') {
      const trendLabel = predictor.trending === 'stijgend' ? 'verslechtert' : 'verbetert'
      context += `Welzijdstrend: scores ${trendLabel} ten opzichte van vorige weken\n`
    }
  } catch { /* niet-kritiek */ }

  // ── Coach geheugen (vorige week) ───────────────────────────────────────────
  try {
    const { data: samenvattingen } = await admin
      .from('coach_samenvattingen')
      .select('samenvatting, week_start')
      .eq('user_id', userId)
      .order('week_start', { ascending: false })
      .limit(2)

    if (samenvattingen?.length) {
      context += `\nEerdere coach-gesprekken — samenvatting:\n`
      for (const s of samenvattingen) {
        context += `  [${s.week_start}] ${s.samenvatting}\n`
      }
    }
  } catch { /* niet-kritiek */ }

  context += `\n════════════════════════════════════════════\n`
  context += `Gebruik bovenstaande context voor persoonlijke, relevante coaching.\n`
  context += `Verwijs NIET letterlijk naar getallen tenzij de gebruiker er zelf naar vraagt.\n`
  context += `Stel open vragen, wees empathisch, geef concrete tips gebaseerd op de scores.\n`

  return context
}
