import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createAdminClient } from '@/lib/supabase-admin'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const VRAAG_LABELS: Record<string, string> = {
  energie: 'Energieniveau', slaap: 'Slaapkwaliteit', slaap_duur: 'Slaapsduur',
  fysiek_pijn: 'Lichamelijke klachten', fysiek_beweging: 'Fysieke activiteit',
  voeding: 'Voeding & hydratatie', herstel: 'Herstel na werk',
  hydratatie: 'Hydratatie', ochtendenergie: 'Ochtendenergie', middagdip: 'Middagdip',
  mentaal_stress: 'Stressniveau', mentaal_focus: 'Concentratie & focus',
  mentaal_balans: 'Werk-privébalans', piekeren: 'Piekeren over werk',
  emotioneel_uitgeput: 'Emotionele uitputting', controle: 'Gevoel van controle',
  stemming: 'Stemming', veerkracht: 'Veerkracht', zelfvertrouwen: 'Zelfvertrouwen',
  werkdruk: 'Werkdruk', motivatie: 'Motivatie', zingeving: 'Zinvolheid werk',
  autonomie: 'Autonomie', waardering: 'Waardering', taakafronding: 'Taakafronding',
  werk_plezier: 'Werkplezier', flow: 'Flow-momenten', baantevredenheid: 'Baantevredenheid',
  sociaal_team: 'Samenwerking collega\'s', sociaal_steun: 'Sociale ondersteuning',
  veiligheid: 'Psychologische veiligheid', communicatie: 'Teamcommunicatie',
  teamsfeer: 'Teamsfeer', leidinggevende: 'Leidinggevende', vertrouwen: 'Vertrouwen in team',
  feedback_kwaliteit: 'Kwaliteit feedback', leren: 'Leer- & groeikansen',
  loopbaan: 'Loopbaanperspectief', erkenning: 'Herkenning sterke punten',
  doelen_voortgang: 'Voortgang doelen', vaardigheidsgroei: 'Vaardigheidsontwikkeling',
  algemeen_welzijn: 'Algemeen welzijn', intentie_blijven: 'Intentie om te blijven',
  aanbeveling: 'Aanbeveling als werkgever',
}

const CAT_LABELS: Record<string, string> = {
  energie: 'Energie & Lichaam',
  mentaal: 'Mentaal welzijn',
  werk: 'Werk & Motivatie',
  sociaal: 'Team & Samenwerking',
  groei: 'Groei & Ontwikkeling',
  afsluiting: 'Afsluiting',
}

export async function POST(req: NextRequest) {
  try {
    const { sessie_id } = await req.json()
    if (!sessie_id) return NextResponse.json({ error: 'sessie_id verplicht' }, { status: 400 })

    const admin = createAdminClient()

    const { data: antwoorden } = await admin
      .from('checkin_antwoorden')
      .select('vraag_code, categorie, waarde_schaal, waarde_tekst')
      .eq('sessie_id', sessie_id)

    if (!antwoorden?.length) {
      return NextResponse.json({ error: 'Geen antwoorden gevonden' }, { status: 404 })
    }

    // Group by category
    const perCat: Record<string, {
      schaal: { code: string; score: number }[]
      tekst: { code: string; tekst: string }[]
    }> = {}

    for (const a of antwoorden) {
      const cat = a.categorie ?? 'overig'
      if (!perCat[cat]) perCat[cat] = { schaal: [], tekst: [] }
      if (a.waarde_schaal != null) perCat[cat].schaal.push({ code: a.vraag_code, score: a.waarde_schaal })
      if (a.waarde_tekst) perCat[cat].tekst.push({ code: a.vraag_code, tekst: a.waarde_tekst })
    }

    // Category averages
    const catAvgs: Record<string, number> = {}
    for (const [cat, data] of Object.entries(perCat)) {
      if (!data.schaal.length) continue
      catAvgs[cat] = +(data.schaal.reduce((s, a) => s + a.score, 0) / data.schaal.length).toFixed(1)
    }

    const hoofdCats = ['energie', 'mentaal', 'werk', 'sociaal', 'groei']
    const totaalScores = hoofdCats.flatMap(c => (perCat[c]?.schaal ?? []).map(a => a.score))
    const totaal = totaalScores.length
      ? +(totaalScores.reduce((a, b) => a + b, 0) / totaalScores.length).toFixed(1)
      : 0

    // Build data block for the prompt
    let dataBlok = ''
    for (const cat of [...hoofdCats, 'afsluiting']) {
      const data = perCat[cat]
      if (!data) continue
      dataBlok += `\n${CAT_LABELS[cat] ?? cat}:\n`
      for (const s of data.schaal) {
        dataBlok += `  - ${VRAAG_LABELS[s.code] ?? s.code}: ${s.score}/5\n`
      }
      for (const t of data.tekst) {
        dataBlok += `  - ${VRAAG_LABELS[t.code] ?? t.code} (toelichting): "${t.tekst}"\n`
      }
    }

    const catSamenvatting = hoofdCats
      .filter(c => catAvgs[c] !== undefined)
      .map(c => `${CAT_LABELS[c]}: ${catAvgs[c]}/5`)
      .join('\n')

    const prompt = `Je bent een empathische welzijnscoach bij MentaForce. Schrijf een persoonlijk welzijnsrapport in het Nederlands (nederlands), warm en direct (je/jij).

SCORES (1=slecht, 5=uitstekend):
Totaal: ${totaal}/5
${catSamenvatting}

ANTWOORDEN:
${dataBlok}

Gebruik EXACT dit formaat met de markers — schrijf de inhoud gewoon als lopende tekst, geen JSON of speciale tekens:

<<<SAMENVATTING>>>
2-3 zinnen die de week samenvatten, verwijzend naar concrete scores.

<<<STERKE_PUNTEN>>>
1-2 alinea's over wat goed gaat, met specifieke score-referenties, motiverend.

<<<AANDACHTSPUNTEN>>>
1-2 alinea's over wat aandacht verdient, empathisch en constructief.

<<<TIP1_TITEL>>>
Korte actietitel (max 6 woorden)

<<<TIP1_TEKST>>>
Concrete tip van 2-3 zinnen.

<<<TIP2_TITEL>>>
Korte actietitel (max 6 woorden)

<<<TIP2_TEKST>>>
Concrete tip van 2-3 zinnen.

<<<TIP3_TITEL>>>
Korte actietitel (max 6 woorden)

<<<TIP3_TEKST>>>
Concrete tip van 2-3 zinnen.`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = response.content[0].type === 'text' ? response.content[0].text : ''

    function extract(marker: string): string {
      const re = new RegExp(`<<<${marker}>>>\\s*([\\s\\S]*?)(?=<<<|$)`)
      return raw.match(re)?.[1]?.trim() ?? ''
    }

    const rapportData = {
      samenvatting:    extract('SAMENVATTING'),
      sterkePunten:    extract('STERKE_PUNTEN'),
      aandachtspunten: extract('AANDACHTSPUNTEN'),
      tips: [
        { titel: extract('TIP1_TITEL'), beschrijving: extract('TIP1_TEKST') },
        { titel: extract('TIP2_TITEL'), beschrijving: extract('TIP2_TEKST') },
        { titel: extract('TIP3_TITEL'), beschrijving: extract('TIP3_TEKST') },
      ].filter(t => t.titel || t.beschrijving),
    }

    return NextResponse.json({ rapport: rapportData, totaal, catAvgs })
  } catch (err) {
    console.error('[rapport-checkin]', err)
    return NextResponse.json({ error: 'Rapport kon niet worden gegenereerd.' }, { status: 500 })
  }
}
