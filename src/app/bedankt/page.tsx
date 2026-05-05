'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'

// ─── Pools voor gevarieerde berichten ─────────────────────────────────────

const TITELS_HOOG = [
  'Je straalt deze week!',
  'Wat een sterke week voor jou!',
  'Topweek — goed bezig!',
  'Indrukwekkend hoe goed je ervoor staat!',
  'Energie, focus en balans — alles op groen!',
]

const TITELS_MIDDEN = [
  'Goed gedaan — je check-in is binnen.',
  'Bedankt voor je eerlijke invulling.',
  'Je doet het goed — en er is ruimte om verder te groeien.',
  'Stap voor stap — je bent op de goede weg.',
  'Check-in gedaan! We kijken samen waar winst zit.',
]

const TITELS_LAAG = [
  'Fijn dat je eerlijk bent ingevuld.',
  'Je hebt de moed om eerlijk te zijn — dat telt.',
  'Bedankt voor je openheid. We nemen dit serieus.',
  'Het is goed dat je dit signaleert.',
  'Eerlijkheid is de eerste stap — goed gedaan.',
]

const SUBTEKSTEN_HOOG = [
  'Je scores wijzen op een gezonde balans tussen energie, werk en welzijn. Blijf dit vasthouden!',
  'Je vitaliteitsprofiel ziet er sterk uit. Jouw inzet voor je eigen welzijn is zichtbaar.',
  'Fantastisch resultaat. Je bevindt je in een goede flow — koester dat en deel het met je team.',
]

const SUBTEKSTEN_MIDDEN = [
  'Je antwoorden geven een gemengd beeld. Er zijn sterke punten, maar ook aandachtspunten. Jouw HR-team ziet dit.',
  'Sommige gebieden gaan goed, andere verdienen extra aandacht. Kleine aanpassingen kunnen een groot verschil maken.',
  'Je staat er redelijk voor — maar er is duidelijk ruimte voor verbetering op een aantal vlakken.',
]

const SUBTEKSTEN_LAAG = [
  'Je check-in toont dat het nu zwaarder is dan normaal. Dat is oké — de eerste stap is erkenning.',
  'Dit is een signaal dat je op dit moment extra ondersteuning kunt gebruiken. Praat erover met iemand die je vertrouwt.',
  'We zien dat je het momenteel moeilijk hebt. Je HR-team is op de hoogte en kan je ondersteunen.',
]

const QUOTES = [
  '"Goed voor jezelf zorgen is niet egoïstisch — het is de basis voor alles wat je doet."',
  '"Kleine stappen in de goede richting zijn ook stappen vooruit."',
  '"Je hoeft niet perfect te zijn om het goed te doen."',
  '"Rust is geen verspilling van tijd — het is een investering in je toekomst."',
  '"Erkennen dat het moeilijk is, is een teken van kracht, niet van zwakte."',
  '"De beste investering die je kunt doen, is in jezelf."',
  '"Elke week opnieuw beginnen is een kans, geen verplichting."',
  '"Jij bent meer dan je productiviteit."',
  '"Luister naar je lichaam — het spreekt de waarheid."',
  '"Verbinding met anderen is een van de krachtigste bronnen van vitaliteit."',
]

// ─── Tips per categorie ───────────────────────────────────────────────────

const TIPS: Record<string, string[][]> = {
  energie: [
    ['Beweeg dagelijks 20 minuten', 'Een korte wandeling na de lunch verbetert je energieniveau en focus significant.'],
    ['Slaaphygiëne verbeteren', 'Probeer op vaste tijden te slapen en vermijd schermen een uur voor bedtijd.'],
    ['Drink meer water', 'Uitdroging is een onderschatte oorzaak van vermoeidheid. Doel: 1,5–2 liter per dag.'],
    ['Pauzes inplannen', 'Neem elke 90 minuten een korte pauze van 5 minuten om je lichaam te resetten.'],
    ['Buitenlucht zoeken', 'Zelfs 10 minuten buiten in de frisse lucht kan je energieniveau merkbaar verbeteren.'],
  ],
  mentaal: [
    ['Doe één ding tegelijk', 'Multitasking verhoogt stress. Focus op één taak per keer voor meer rust en betere resultaten.'],
    ['Schrijf je gedachten op', 'Een korte dagelijkse braindump (3–5 minuten schrijven) vermindert piekeren en geeft mentale ruimte.'],
    ['Ademhalingsoefening', 'Probeer de 4-7-8 methode: inademen 4 sec, vasthouden 7 sec, uitademen 8 sec.'],
    ['Grenzen stellen', 'Zeg bewust "nee" of "later" wanneer je agenda vol zit — dat is geen zwakte, maar wijsheid.'],
    ['Digitale detox', 'Plan elke dag een moment zonder telefoon of scherm — ook al is het maar 15 minuten.'],
  ],
  werk: [
    ['Dag starten met prioriteiten', 'Schrijf elke ochtend je top 3 taken op. Alles wat je daarna doet, is bonus.'],
    ['Één vergadering minder', 'Vraag jezelf bij elk overleg: is mijn aanwezigheid echt nodig? Bescherm je focustijd.'],
    ['Kleine wins vieren', 'Noteer elke dag één ding dat je hebt afgerond of bereikt. Dit voedt motivatie.'],
    ['Hulp vragen', 'Als je vastloopt, vraag dan sneller om hulp. Dat is efficiënter dan lang worstelen.'],
    ['Aan het einde van de dag afsluiten', 'Schrijf voor je stopt je open taken op. Je hoofd kan dan echt loslaten.'],
  ],
  sociaal: [
    ['Verbinding zoeken', 'Neem eens de tijd voor een informeel gesprek met een collega — dat bouwt vertrouwen op.'],
    ['Feedback geven', 'Geef deze week één positieve, concrete opmerking aan een collega. Het versterkt de sfeer.'],
    ['Open communiceren', 'Als iets je dwarszit, spreek het aan — rechtstreeks en vriendelijk. Onuitgesproken frustraties groeien.'],
    ['Samen pauze nemen', 'Plan een gezamenlijke lunchpauze of koffiemoment. Sociale verbinding herstelt.'],
    ['Je leidinggevende aanspreken', 'Heb je een zorg of idee? Maak tijd om het te bespreken. Dat toont betrokkenheid.'],
  ],
  groei: [
    ['Één ding leren per week', 'Reserveer 30 minuten per week om iets nieuws te lezen, luisteren of oefenen.'],
    ['Feedback vragen', 'Vraag actief om feedback na een project of presentatie. Dat versnelt je groei.'],
    ['Je doelen opschrijven', 'Concrete, opgeschreven doelen worden 42% vaker bereikt dan ongeschreven doelen.'],
    ['Reflectiemoment plannen', 'Neem elke vrijdagmiddag 10 minuten om terug te blikken: wat leerde ik deze week?'],
    ['Mentor zoeken', 'Is er iemand in je organisatie of netwerk die je inspireert? Vraag om een gesprek.'],
  ],
}

// ─── Categorie labels ────────────────────────────────────────────────────

const CAT_LABELS: Record<string, string> = {
  e: 'Energie & Lichaam',
  m: 'Mentaal welzijn',
  w: 'Werk & Motivatie',
  s: 'Team & Samenwerking',
  g: 'Groei & Ontwikkeling',
}

const CAT_KLEUREN: Record<string, { kleur: string; licht: string }> = {
  e: { kleur: '#1D9E75', licht: '#E1F5EE' },
  m: { kleur: '#378ADD', licht: '#E6F1FB' },
  w: { kleur: '#8B5CF6', licht: '#EEEDFE' },
  s: { kleur: '#BA7517', licht: '#FAEEDA' },
  g: { kleur: '#059669', licht: '#D1FAE5' },
}

const CAT_TIPS_KEY: Record<string, string> = {
  e: 'energie', m: 'mentaal', w: 'werk', s: 'sociaal', g: 'groei',
}

// ─── Helpers ─────────────────────────────────────────────────────────────

function pick<T>(arr: T[], idx: number): T {
  return arr[Math.abs(idx) % arr.length]
}

function scoreKleur(s: number): string {
  if (s >= 4)   return '#1D9E75'
  if (s >= 3)   return '#BA7517'
  if (s >= 2)   return '#E26B4A'
  return '#E24B4A'
}

function scoreBalk(s: number): string {
  if (s >= 4)   return '#1D9E75'
  if (s >= 3)   return '#F59E0B'
  if (s >= 2)   return '#F97316'
  return '#EF4444'
}

function scoreLabel(s: number): string {
  if (s >= 4.5) return 'Uitstekend'
  if (s >= 4)   return 'Goed'
  if (s >= 3.5) return 'Redelijk goed'
  if (s >= 3)   return 'Matig'
  if (s >= 2)   return 'Aandacht nodig'
  return 'Zorgwekkend'
}

// ─── Inner component (uses useSearchParams) ───────────────────────────────

function BedanktInhoud() {
  const params = useSearchParams()

  const e    = parseFloat(params.get('e') || '0')
  const m    = parseFloat(params.get('m') || '0')
  const w    = parseFloat(params.get('w') || '0')
  const s    = parseFloat(params.get('s') || '0')
  const g    = parseFloat(params.get('g') || '0')
  const t    = parseFloat(params.get('t') || '0')
  const seed = parseInt(params.get('seed') || '0', 10)

  const heeftScores = t > 0

  // Niveau bepalen
  const niveau = t >= 3.8 ? 'hoog' : t >= 2.8 ? 'midden' : 'laag'

  const titel    = pick(niveau === 'hoog' ? TITELS_HOOG    : niveau === 'midden' ? TITELS_MIDDEN    : TITELS_LAAG,    seed)
  const subtekst = pick(niveau === 'hoog' ? SUBTEKSTEN_HOOG : niveau === 'midden' ? SUBTEKSTEN_MIDDEN : SUBTEKSTEN_LAAG, seed + 1)
  const quote    = pick(QUOTES, seed + 2)

  const hoofdKleur = niveau === 'hoog' ? '#1D9E75' : niveau === 'midden' ? '#BA7517' : '#E24B4A'
  const hoofdLicht = niveau === 'hoog' ? '#E1F5EE' : niveau === 'midden' ? '#FAEEDA' : '#FCEBEB'
  const checkIcon  = niveau === 'hoog' ? '★'       : niveau === 'midden' ? '✓'       : '♥'

  // Scores per categorie
  const catScores: Array<{ key: string; score: number }> = [
    { key: 'e', score: e },
    { key: 'm', score: m },
    { key: 'w', score: w },
    { key: 's', score: s },
    { key: 'g', score: g },
  ].filter(c => c.score > 0)

  // Laagste 2 categorieën → tips
  const gesorteerd  = [...catScores].sort((a, b) => a.score - b.score)
  const aandacht    = gesorteerd.slice(0, 2)
  const sterktes    = gesorteerd.filter(c => c.score >= 4).slice(-2).reverse()

  return (
    <main className="min-h-screen pb-16"
      style={{ background: 'linear-gradient(160deg, #F0FAF6 0%, #EBF4FB 50%, #F5F3FF 100%)' }}>

      <div className="max-w-xl mx-auto px-5 pt-10">

        {/* Hero kaart */}
        <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm mb-5 text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{ background: hoofdLicht }}>
            <span style={{ color: hoofdKleur, fontSize: 26 }}>{checkIcon}</span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">{titel}</h1>
          <p className="text-gray-500 text-sm leading-relaxed mb-5">{subtekst}</p>

          {heeftScores && (
            <>
              {/* Totaalscore */}
              <div className="rounded-2xl p-5 mb-4" style={{ background: hoofdLicht }}>
                <p className="text-xs text-gray-500 mb-1">Jouw vitaliteitsscore deze week</p>
                <div className="flex items-end justify-center gap-1">
                  <span className="text-5xl font-black" style={{ color: hoofdKleur }}>
                    {t.toFixed(1)}
                  </span>
                  <span className="text-xl font-medium text-gray-400 pb-1">/5</span>
                </div>
                <p className="text-sm font-medium mt-1" style={{ color: hoofdKleur }}>
                  {scoreLabel(t)}
                </p>
              </div>

              {/* Categorie balkjes */}
              <div className="space-y-3 text-left">
                {catScores.map(({ key, score }) => {
                  const { kleur, licht } = CAT_KLEUREN[key]
                  const pct = Math.round((score / 5) * 100)
                  return (
                    <div key={key}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium text-gray-700">{CAT_LABELS[key]}</span>
                        <span className="font-semibold" style={{ color: scoreKleur(score) }}>
                          {score.toFixed(1)}
                        </span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ background: licht }}>
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${pct}%`, background: scoreBalk(score) }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}

          {/* Quote */}
          <div className="mt-6 rounded-xl p-4 text-left" style={{ background: '#F9FAFB' }}>
            <p className="text-xs text-gray-500 italic leading-relaxed">{quote}</p>
          </div>
        </div>

        {/* Sterke punten */}
        {sterktes.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm mb-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Jouw sterke punten deze week</h2>
            <div className="space-y-3">
              {sterktes.map(({ key, score }) => {
                const { kleur, licht } = CAT_KLEUREN[key]
                return (
                  <div key={key} className="flex items-center gap-3 rounded-xl p-3"
                    style={{ background: licht }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                      style={{ background: kleur, color: 'white' }}>✓</div>
                    <div>
                      <p className="text-xs font-semibold" style={{ color: kleur }}>{CAT_LABELS[key]}</p>
                      <p className="text-xs text-gray-500">Score {score.toFixed(1)} / 5 — goed bezig!</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Aandachtspunten + tips */}
        {aandacht.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm mb-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-1">Aandachtspunten & tips</h2>
            <p className="text-xs text-gray-400 mb-4">
              Op basis van je laagste scores hebben we gerichte tips voor je.
            </p>

            {aandacht.map(({ key, score }, i) => {
              const { kleur, licht } = CAT_KLEUREN[key]
              const tipsVoorCat = TIPS[CAT_TIPS_KEY[key]] ?? []
              const tip = pick(tipsVoorCat, seed + 10 + i)
              return (
                <div key={key} className="rounded-2xl p-4 mb-3 last:mb-0"
                  style={{ background: licht, borderLeft: `3px solid ${kleur}` }}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold" style={{ color: kleur }}>{CAT_LABELS[key]}</p>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                      style={{ background: kleur + '20', color: kleur }}>
                      {score.toFixed(1)} / 5
                    </span>
                  </div>
                  {tip && (
                    <>
                      <p className="text-sm font-medium text-gray-900 mb-1">{tip[0]}</p>
                      <p className="text-xs text-gray-500 leading-relaxed">{tip[1]}</p>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Extra tip uit een andere categorie */}
        {catScores.length > 2 && (() => {
          const middenCat = catScores.find(c => c.score >= 2.5 && c.score < 3.8 && !aandacht.some(a => a.key === c.key))
          if (!middenCat) return null
          const { kleur, licht } = CAT_KLEUREN[middenCat.key]
          const tipsVoorCat = TIPS[CAT_TIPS_KEY[middenCat.key]] ?? []
          const tip = pick(tipsVoorCat, seed + 20)
          if (!tip) return null
          return (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm mb-5">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Bonustip voor deze week</h2>
              <div className="rounded-2xl p-4" style={{ background: licht, borderLeft: `3px solid ${kleur}` }}>
                <p className="text-xs font-semibold mb-1" style={{ color: kleur }}>{CAT_LABELS[middenCat.key]}</p>
                <p className="text-sm font-medium text-gray-900 mb-1">{tip[0]}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{tip[1]}</p>
              </div>
            </div>
          )
        })()}

        {/* Wat nu? */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm mb-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Wat nu?</h2>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{ background: '#E1F5EE', color: '#1D9E75' }}>1</span>
              <p>Je antwoorden zijn anoniem opgeslagen en zichtbaar voor je HR-team.</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{ background: '#E1F5EE', color: '#1D9E75' }}>2</span>
              <p>Volgende week krijg je andere vragen — zodat je meerdere aspecten van je welzijn belicht.</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{ background: '#E1F5EE', color: '#1D9E75' }}>3</span>
              <p>Bekijk je persoonlijk portaal voor inzichten en trends over de weken heen.</p>
            </div>
          </div>
        </div>

        {/* Actieknoppen */}
        <div className="flex flex-col gap-3">
          <Link
            href="/portaal"
            className="w-full inline-block text-center text-white rounded-xl py-3.5 text-sm font-semibold"
            style={{ background: '#1D9E75' }}>
            Mijn portaal bekijken
          </Link>
          <Link
            href="/journal"
            className="w-full inline-block text-center rounded-xl py-3.5 text-sm font-medium border"
            style={{ borderColor: '#378ADD', color: '#378ADD' }}>
            Schrijf een reflectie in je journal
          </Link>
          <Link
            href="/"
            className="w-full inline-block text-center border border-gray-200 text-gray-500 rounded-xl py-3 text-sm hover:bg-gray-50 transition">
            Terug naar home
          </Link>
        </div>

        <p className="text-xs text-gray-400 text-center mt-6 pb-4">
          Alle check-in antwoorden zijn anoniem en beveiligd opgeslagen.
        </p>
      </div>
    </main>
  )
}

// ─── Export met Suspense (vereist door useSearchParams in Next.js) ─────────

export default function Bedankt() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #E1F5EE 0%, #E6F1FB 100%)' }}>
        <div className="w-8 h-8 rounded-full border-2 border-gray-200 animate-spin"
          style={{ borderTopColor: '#1D9E75' }} />
      </main>
    }>
      <BedanktInhoud />
    </Suspense>
  )
}
