
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { effectieveDoelen } from '@/lib/health/gezondheid-berekeningen'

export const dynamic = 'force-dynamic'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// Fallback-doelen (EU RDI) wanneer het intake-profiel onvoldoende data heeft.
const RDI = { calorieen: 2000, eiwitten_g: 50, koolhydraten_g: 260, vetten_g: 70, vezels_g: 25 }

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const token = authHeader.slice(7)
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const vandaag = new Date().toISOString().split('T')[0]

  // Cache
  const { data: cached } = await supabaseAdmin
    .from('checkin_analyses').select('analyse_json').eq('user_id', user.id)
    .gte('aangemaakt_op', `${vandaag}T00:00:00Z`).not('analyse_json->voeding_coach', 'is', null)
    .order('aangemaakt_op', { ascending: false }).limit(1).maybeSingle()

  const cacheData = cached?.analyse_json as Record<string, unknown> | null
  if (cacheData?.voeding_coach) return NextResponse.json(cacheData.voeding_coach)

  const { data: logs } = await supabaseAdmin
    .from('voeding_logs').select('maaltijd_type, calorieen, eiwitten_g, koolhydraten_g, vetten_g, vezels_g, omschrijving')
    .eq('user_id', user.id).eq('datum', vandaag)

  if (!logs || logs.length === 0) {
    return NextResponse.json({ tip: 'Log je eerste maaltijd van vandaag om persoonlijke voedingscoaching te ontvangen!', score: null, maaltijden_gelogd: 0, status: 'leeg' })
  }

  // Persoonlijke doelen + dieetcontext uit het intake-profiel (gedeeld contract).
  const { data: profiel } = await supabaseAdmin
    .from('profiles')
    .select('gewicht_kg, lengte_cm, geboortedatum, geslacht, activiteitsniveau, fitness_doel, calorie_doel, dieetvoorkeur, allergieen')
    .eq('id', user.id)
    .maybeSingle()

  const doelen = effectieveDoelen({
    gewicht_kg: profiel?.gewicht_kg ?? null,
    lengte_cm: profiel?.lengte_cm ?? null,
    geboortedatum: profiel?.geboortedatum ?? null,
    geslacht: profiel?.geslacht ?? null,
    activiteitsniveau: profiel?.activiteitsniveau ?? null,
    fitness_doel: profiel?.fitness_doel ?? null,
    calorie_doel: profiel?.calorie_doel ?? null,
  })

  // Effectieve targets: persoonlijk waar beschikbaar, anders RDI-fallback.
  const doelCalorieen = doelen.calorie_doel ?? RDI.calorieen
  const doelEiwit = doelen.macros?.eiwit_g ?? RDI.eiwitten_g
  const doelKoolhydraten = doelen.macros?.koolhydraten_g ?? RDI.koolhydraten_g
  const doelVet = doelen.macros?.vet_g ?? RDI.vetten_g
  const doelVezels = RDI.vezels_g
  const dieetvoorkeur = profiel?.dieetvoorkeur && profiel.dieetvoorkeur !== 'geen' ? profiel.dieetvoorkeur : null
  const allergieen: string[] = Array.isArray(profiel?.allergieen) ? profiel.allergieen : []

  const totaal = logs.reduce((acc, l) => ({
    calorieen: acc.calorieen + (l.calorieen || 0),
    eiwitten_g: acc.eiwitten_g + (l.eiwitten_g || 0),
    koolhydraten_g: acc.koolhydraten_g + (l.koolhydraten_g || 0),
    vetten_g: acc.vetten_g + (l.vetten_g || 0),
    vezels_g: acc.vezels_g + (l.vezels_g || 0),
  }), { calorieen: 0, eiwitten_g: 0, koolhydraten_g: 0, vetten_g: 0, vezels_g: 0 })

  const maaltijdTypes = [...new Set(logs.map(l => l.maaltijd_type))]
  const heeftOntbijt = maaltijdTypes.includes('ontbijt')
  const uurNu = new Date().getHours()

  const calPct = Math.min(100, (totaal.calorieen / doelCalorieen) * 100)
  const eiPct  = Math.min(100, (totaal.eiwitten_g / doelEiwit) * 100)
  const vezPct = Math.min(100, (totaal.vezels_g / doelVezels) * 100)
  const score  = Math.round(calPct * 0.3 + eiPct * 0.4 + vezPct * 0.3)

  const tekort: string[] = []
  const goed: string[] = []
  if (eiPct < 60)  tekort.push(`eiwit (${totaal.eiwitten_g.toFixed(0)}g / ${doelEiwit}g)`)
  if (vezPct < 50) tekort.push(`vezels (${totaal.vezels_g.toFixed(0)}g / ${doelVezels}g)`)
  if (!heeftOntbijt && uurNu >= 10) tekort.push('ontbijt overgeslagen')
  if (eiPct >= 80)  goed.push('eiwitdoel bijna gehaald')
  if (vezPct >= 80) goed.push('goede vezelinname')

  const doelBron = doelen.calorie_doel != null
    ? (doelen.calorie_handmatig ? 'handmatig ingesteld' : 'berekend uit profiel')
    : 'standaard (intake nog niet afgerond)'

  const maaltijdNamen = logs.map(l => l.omschrijving).filter(Boolean).join(', ')
  const prompt = `Je bent een warme voedingscoach. Geef persoonlijke feedback op basis van de PERSOONLIJKE doelen van deze gebruiker.

Persoonlijke dagdoelen (${doelBron}):
- Calorieen: ${doelCalorieen} kcal
- Eiwit: ${doelEiwit}g, Koolhydraten: ${doelKoolhydraten}g, Vet: ${doelVet}g, Vezels: ${doelVezels}g
${dieetvoorkeur ? `Dieetvoorkeur: ${dieetvoorkeur} — geef alleen tips die hierbij passen.` : ''}
${allergieen.length > 0 ? `ALLERGIEËN (${allergieen.join(', ')}): adviseer NOOIT voedingsmiddelen die deze allergenen bevatten.` : ''}

Vandaag gelogd (${logs.length} maaltijden): ${maaltijdTypes.join(', ')}
Maaltijden: ${maaltijdNamen}
Calorieen: ${totaal.calorieen} / ${doelCalorieen} kcal (${Math.round(calPct)}%)
Eiwit: ${totaal.eiwitten_g.toFixed(0)}g / ${doelEiwit}g (${Math.round(eiPct)}%)
Koolhydraten: ${totaal.koolhydraten_g.toFixed(0)}g / ${doelKoolhydraten}g
Vet: ${totaal.vetten_g.toFixed(0)}g / ${doelVet}g
Vezels: ${totaal.vezels_g.toFixed(0)}g / ${doelVezels}g (${Math.round(vezPct)}%)
${tekort.length > 0 ? `Aandachtspunten: ${tekort.join(', ')}` : ''}
${goed.length > 0 ? `Goed: ${goed.join(', ')}` : ''}

Schrijf PRECIES 2 zinnen coaching:
1. Erken wat goed gaat (specifiek)
2. Geef één concrete haalbare tip voor vandaag${allergieen.length > 0 ? ' die de opgegeven allergenen vermijdt' : ''}${dieetvoorkeur ? ` en bij een ${dieetvoorkeur} dieet past` : ''}

Alleen het bericht, geen groet.`

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5', max_tokens: 180,
    messages: [{ role: 'user', content: prompt }],
  })

  const tip = (message.content[0] as { type: string; text: string }).text.trim()
  const resultaat = {
    tip, score, maaltijden_gelogd: logs.length,
    calorieen_pct: Math.round(calPct), eiwit_pct: Math.round(eiPct), vezels_pct: Math.round(vezPct),
    tekort, goed,
    calorie_doel: doelCalorieen,
    calorie_doel_persoonlijk: doelen.calorie_doel != null,
    dieetvoorkeur, allergieen,
    status: score >= 70 ? 'goed' : score >= 40 ? 'matig' : 'aandacht',
  }

  const { data: existingAnalyse } = await supabaseAdmin.from('checkin_analyses')
    .select('id, analyse_json').eq('user_id', user.id)
    .gte('aangemaakt_op', `${vandaag}T00:00:00Z`).order('aangemaakt_op', { ascending: false }).limit(1).maybeSingle()
  if (existingAnalyse) {
    const updated = { ...(existingAnalyse.analyse_json as object || {}), voeding_coach: resultaat }
    await supabaseAdmin.from('checkin_analyses').update({ analyse_json: updated }).eq('id', existingAnalyse.id)
  }

  return NextResponse.json(resultaat)
}
