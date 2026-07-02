'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Send, BatteryLow, Moon, AlertTriangle, Scale, Lightbulb, Target, Wind, Frown,
  MessageCircleMore, ListChecks, Compass, RotateCcw,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { authFetch } from '@/lib/auth-fetch'
import Navbar from '@/components/layout/Navbar'
import VitaChatHeader from '@/components/vita/VitaChatHeader'
import VitaChatBubble, { type ChatBericht } from '@/components/vita/VitaChatBubble'
import type { EmotionState } from '@/components/vita/PandaFace'

const WELKOM = `Hoi, ik ben Vita.

Ik ben er voor alles rondom je welzijn op het werk — stress, energie, werk-privébalans, motivatie, slaap, of gewoon even je hoofd leegmaken.

Wat je hier deelt blijft tussen ons. Geen manager, geen HR die meeleest.

Waar zal ik je vandaag mee helpen?`

// Wanneer de gebruiker via een proactieve nudge binnenkomt (/coach?start=<type>),
// opent Vita zelf het gesprek over wat ze opmerkte — i.p.v. het generieke welkom.
const NUDGE_OPENERS: Record<string, string> = {
  burnout_stijgend: 'Hey, fijn dat je er bent. Ik zag dat je scores de laatste weken wat teruglopen. Geen zorgen — vertel eens, hoe gaat het op dit moment écht met je?',
  stemming_omlaag: 'Fijn dat je er bent. Ik merkte dat je stemming deze week wat lager lag dan je gewend bent. Wil je vertellen wat er speelt?',
  slaap_omlaag: 'Goed dat je er bent. Je sliep deze week wat minder dan normaal. Zullen we samen kijken wat je nachtrust in de weg zit?',
  streak_mijlpaal: 'Wat een mooie reeks — je hebt een flink aantal dagen op rij ingecheckt! Hoe voelt het om hier zo bewust mee bezig te zijn?',
  slaap_omhoog: 'Goed nieuws: je slaap zit duidelijk in de lift deze week. Wil je weten hoe je dit ritme vasthoudt?',
  stemming_omhoog: 'Mooi om te zien dat je beter in je vel zit deze week! Wat denk je dat het verschil maakte?',
  burnout_dalend: 'Goed nieuws — je welzijnsscores gaan de laatste weken vooruit. Zullen we kijken wat daaraan bijdraagt, zodat je het kunt vasthouden?',
  dankbaarheid_gap: 'Fijn dat je er bent. Je hield een tijdje dagelijks bij waar je dankbaar voor was. Zullen we dat samen weer oppakken?',
  heractivatie: 'Hey, fijn dat je er weer bent. Geen druk — vertel eens, hoe gaat het op dit moment met je?',
}

const SUGGESTIES: { icon: LucideIcon; tekst: string }[] = [
  { icon: Frown, tekst: 'Ik voel me gestrest' },
  { icon: BatteryLow, tekst: 'Mijn energie is op' },
  { icon: Moon, tekst: 'Ik slaap slecht' },
  { icon: AlertTriangle, tekst: 'Ik wil tips tegen burn-out' },
  { icon: Scale, tekst: 'Werk en privé in balans' },
  { icon: Lightbulb, tekst: 'Ik mis motivatie' },
  { icon: Target, tekst: 'Hoe blijf ik gemotiveerd?' },
  { icon: Wind, tekst: 'Ik wil rustiger worden' },
]

const FOUT_FALLBACK = 'Sorry, ik kan je nu even niet bereiken. Probeer het zo opnieuw.'

const VERVOLGVRAGEN: { icon: LucideIcon; tekst: string }[] = [
  { icon: MessageCircleMore, tekst: 'Vertel me meer' },
  { icon: ListChecks, tekst: 'Wat kan ik vandaag doen?' },
  { icon: Compass, tekst: 'Hoe pak ik dit het beste aan?' },
]

type GebruikerContext = {
  naam: string
  discPrimair?: string
  domeinScores?: Record<string, number>
  actieveDoelen?: string[]
}

const DOMEIN_CODES: Record<string, string[]> = {
  slaap:    ['slaap_kwaliteit', 'slaap_fris'],
  stress:   ['stress_niveau',   'stress_controle'],
  energie:  ['energie_niveau',  'energie_beweging'],
  focus:    ['focus_concentratie', 'focus_helderheid'],
  balans:   ['balans_werk_prive',  'balans_herstel'],
  motivatie:['motivatie_werk', 'motivatie_zinvol'],
}

export default function CoachPagina() {
  const router = useRouter()
  const [berichten, setBerichten] = useState<ChatBericht[]>([
    { id: 'welkom', role: 'assistant', content: WELKOM },
  ])
  const [input, setInput] = useState('')
  const [laden, setLaden] = useState(false)
  const [klaar, setKlaar] = useState(false)
  const [gebruikerContext, setGebruikerContext] = useState<GebruikerContext | null>(null)
  const [herstelTekst, setHerstelTekst] = useState<string | null>(null)
  const onderRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Hydration-veilig: de ?start-param wordt pas ná mount gelezen (server en
  // client renderen beide eerst het welkom). Komt de gebruiker via een nudge
  // binnen, dan vervangt Vita's eigen opener het welkom vóór de eerste interactie.
  useEffect(() => {
    const start = new URLSearchParams(window.location.search).get('start')
    const opener = start ? NUDGE_OPENERS[start] : undefined
    if (!opener) return
    setBerichten(prev =>
      prev.length === 1 && prev[0].id === 'welkom'
        ? [{ id: 'opener', role: 'assistant', content: opener }]
        : prev,
    )
  }, [])

  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      // Laad context voor Vita (non-blocking)
      try {
        const ctx: GebruikerContext = { naam: 'je' }

        const { data: profiel } = await supabase
          .from('profiles').select('naam').eq('id', user.id).single()
        if (profiel?.naam) ctx.naam = profiel.naam as string

        const { data: disc } = await supabase
          .from('disc_inzendingen').select('primair_profiel').eq('user_id', user.id)
          .order('aangemaakt_op', { ascending: false }).limit(1).maybeSingle()
        if (disc?.primair_profiel) ctx.discPrimair = disc.primair_profiel as string

        const { data: sessie } = await supabase
          .from('checkin_sessies').select('id')
          .eq('user_id', user.id).order('aangemaakt_op', { ascending: false })
          .limit(1).maybeSingle()

        if (sessie?.id) {
          const { data: antwoorden } = await supabase
            .from('checkin_antwoorden').select('vraag_code, waarde_schaal')
            .eq('sessie_id', sessie.id)
          if (antwoorden?.length) {
            const codeMap: Record<string, number> = {}
            for (const r of antwoorden) {
              if (r.waarde_schaal != null) codeMap[r.vraag_code] = Number(r.waarde_schaal)
            }
            const scores: Record<string, number> = {}
            for (const [domein, codes] of Object.entries(DOMEIN_CODES)) {
              scores[domein] = codes.reduce((acc, c) => acc + (codeMap[c] ?? 0), 0)
            }
            ctx.domeinScores = scores
          }
        }

        setGebruikerContext(ctx)
      } catch { /* niet-kritiek */ }

      setKlaar(true)
    }
    check()
  }, [router])

  useEffect(() => {
    onderRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [berichten])

  async function verstuur(tekst?: string, basis?: ChatBericht[]) {
    const invoer = (tekst ?? input).trim()
    if (!invoer || laden) return

    setInput('')
    setHerstelTekst(null)
    if (inputRef.current) inputRef.current.style.height = 'auto'

    const huidige = basis ?? berichten
    const gebruikerBericht: ChatBericht = { id: `u-${huidige.length}`, role: 'user', content: invoer }
    const assistentId = `a-${huidige.length + 1}`
    const nieuweLijst: ChatBericht[] = [
      ...huidige,
      gebruikerBericht,
      { id: assistentId, role: 'assistant', content: '' },
    ]
    setBerichten(nieuweLijst)
    setLaden(true)

    // Alleen het generieke welkom en de lege assistent-placeholder blijven lokaal.
    // Een nudge-opener (id 'opener') gaat wél mee, zodat het model weet waarover
    // Vita zelf het gesprek begon.
    const api = nieuweLijst
      .filter(b => b.id !== 'welkom' && b.id !== assistentId)
      .map(b => ({ role: b.role, content: b.content }))

    let volledigAntwoord = ''
    let mislukt = false

    function toonFout(melding: string) {
      mislukt = true
      setBerichten(prev => prev.map(b => b.id === assistentId ? { ...b, content: melding } : b))
      setHerstelTekst(invoer)
    }

    try {
      const res = await authFetch('/api/coach', {
        method: 'POST',
        body: JSON.stringify({
          berichten: api,
          ...(gebruikerContext ? { gebruiker_context: gebruikerContext } : {}),
        }),
      })

      if (!res.ok || !res.body) {
        let foutmelding = FOUT_FALLBACK
        try {
          const json = await res.json()
          if (json.error) foutmelding = json.error
        } catch { /* geen JSON-body beschikbaar */ }
        toonFout(foutmelding)
      } else {
        // Vita streamt platte tekst-tokens; lees ze incrementeel en laat het
        // antwoord live "typen" in de bestaande bubbel.
        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          volledigAntwoord += decoder.decode(value, { stream: true })
          setBerichten(prev => prev.map(b => b.id === assistentId ? { ...b, content: volledigAntwoord } : b))
        }
        // Lege stream (bv. verbinding halverwege weggevallen) → eerlijke melding
        // in plaats van een lege bubbel.
        if (!volledigAntwoord.trim()) {
          volledigAntwoord = ''
          toonFout('Er ging iets mis bij het antwoorden. Probeer het opnieuw.')
        }
      }
    } catch {
      toonFout(FOUT_FALLBACK)
    }

    setLaden(false)
    if (!mislukt) inputRef.current?.focus()

    // Sla na elk voltooid antwoord een weeksamenvatting op zodra het gesprek
    // inhoud heeft (upsert per week maakt dubbele calls onschadelijk).
    if (volledigAntwoord) {
      const voltooid = [...api, { role: 'assistant' as const, content: volledigAntwoord }]
      if (voltooid.length >= 4) {
        authFetch('/api/coach/samenvatting', {
          method: 'POST',
          body: JSON.stringify({ berichten: voltooid }),
        }).catch(() => { /* stil falen */ })
      }
    }
  }

  // Herstelt een mislukte beurt: verwijder het gestrande user+assistent-paar
  // en verstuur hetzelfde bericht opnieuw op basis van de lijst dáárvoor.
  function opnieuwProberen() {
    if (!herstelTekst || laden) return
    verstuur(herstelTekst, berichten.slice(0, -2))
  }

  const laatsteBericht = berichten[berichten.length - 1]
  const toonVervolgvragen = !laden && !herstelTekst && berichten.length > 1 && laatsteBericht?.role === 'assistant' && laatsteBericht.content.length > 0
  const heeftGeheugen = Boolean(gebruikerContext?.discPrimair || gebruikerContext?.domeinScores)

  // Vita's gezicht beweegt mee met het gesprek: 'focused' terwijl ze antwoordt,
  // 'curious' vlak nadat de gebruiker iets stuurde, en 'supportive' in rust.
  const wachtOpAntwoord = laden && laatsteBericht?.role === 'assistant' && laatsteBericht.content.length === 0
  const vitaEmotion: EmotionState = laden
    ? (wachtOpAntwoord ? 'curious' : 'focused')
    : 'supportive'

  if (!klaar) return (
    <div className="mf-mesh-bg" style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
        <div className="mf-spinner" />
      </div>
    </div>
  )

  return (
    <div className="mf-mesh-bg" style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-app)' }}>
      <Navbar />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', width: '100%', overflow: 'hidden' }}>

        <VitaChatHeader emotion={vitaEmotion} kentProfiel={heeftGeheugen} aanHetTypen={laden} />

        {/* Berichten */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px' }}>
          <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {berichten.map((b) => {
            const isLaatste = b.id === laatsteBericht?.id
            const toonDenken = laden && isLaatste && b.role === 'assistant' && b.content.length === 0
            const toonCursor = laden && isLaatste && b.role === 'assistant' && b.content.length > 0
            return (
              <VitaChatBubble
                key={b.id}
                bericht={b}
                avatarEmotion={vitaEmotion}
                toonCursor={toonCursor}
                toonDenken={toonDenken}
              />
            )
          })}

          {/* Suggesties — alleen vóór het eerste bericht */}
          {berichten.length === 1 && !laden && (
            <div style={{ marginTop: 8 }}>
              <p style={{ fontSize: 12, color: 'var(--text-4)', marginBottom: 8, textAlign: 'center' }}>Kies een onderwerp om te beginnen</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                {SUGGESTIES.map(s => (
                  <button
                    key={s.tekst}
                    onClick={() => verstuur(s.tekst)}
                    className="mf-pressable mf-suggestie-chip"
                    style={{
                      fontSize: 12, border: '1px solid var(--border)', borderRadius: 999,
                      padding: '6px 14px', color: 'var(--text-2)', background: 'var(--bg-card)',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                    }}
                  >
                    <s.icon size={13} strokeWidth={1.75} aria-hidden />{s.tekst}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Opnieuw proberen — na een mislukt antwoord */}
          {herstelTekst && !laden && (
            <div style={{ marginTop: 4, display: 'flex', justifyContent: 'flex-start', paddingLeft: 44 }}>
              <button
                onClick={opnieuwProberen}
                className="mf-pressable mf-suggestie-chip"
                style={{
                  fontSize: 12, border: '1px solid var(--border)', borderRadius: 999,
                  padding: '6px 14px', color: 'var(--text-2)', background: 'var(--bg-card)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                <RotateCcw size={13} strokeWidth={1.75} aria-hidden />Opnieuw proberen
              </button>
            </div>
          )}

          {/* Vervolgvragen — na elk antwoord van Vita */}
          {toonVervolgvragen && (
            <div style={{ marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-start', paddingLeft: 44 }}>
              {VERVOLGVRAGEN.map(s => (
                <button
                  key={s.tekst}
                  onClick={() => verstuur(s.tekst)}
                  className="mf-pressable mf-suggestie-chip"
                  style={{
                    fontSize: 12, border: '1px solid var(--border)', borderRadius: 999,
                    padding: '6px 14px', color: 'var(--text-2)', background: 'var(--bg-card)',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                  }}
                >
                  <s.icon size={13} strokeWidth={1.75} aria-hidden />{s.tekst}
                </button>
              ))}
            </div>
          )}

          <div ref={onderRef} />
          </div>
        </div>

        {/* Privacy-notitie */}
        <div style={{ padding: '4px 16px', textAlign: 'center', flexShrink: 0 }}>
          <p style={{ fontSize: 12, color: 'var(--text-4)' }}>
            Vita onthoudt context tussen gesprekken om je beter te helpen · Nooit zichtbaar voor manager of HR
          </p>
        </div>

        {/* Invoer */}
        <div style={{
          padding: '12px 16px', background: 'var(--bg-card)',
          borderTop: '1px solid var(--border)', flexShrink: 0,
        }}>
          <div style={{
            display: 'flex', alignItems: 'flex-end', gap: 8,
            borderRadius: 20, border: '1px solid var(--border)',
            padding: '8px 12px', background: 'var(--bg-subtle)',
            maxWidth: 760, margin: '0 auto',
          }}>
            <label htmlFor="vita-invoer" className="mf-sr-only">Bericht aan Vita</label>
            <textarea
              id="vita-invoer"
              ref={inputRef}
              rows={1}
              value={input}
              onChange={e => {
                setInput(e.target.value)
                e.target.style.height = 'auto'
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
              }}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); verstuur() }
              }}
              placeholder="Typ je bericht aan Vita"
              disabled={laden}
              style={{
                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                fontSize: 14, resize: 'none', lineHeight: 1.5,
                minHeight: 24, maxHeight: 120, color: 'var(--text-1)',
                opacity: laden ? 0.5 : 1,
              }}
            />
            <button
              onClick={() => verstuur()}
              disabled={!input.trim() || laden}
              className="mf-vita-verstuur"
              aria-label="Verstuur bericht aan Vita"
              style={{
                flexShrink: 0, width: 32, height: 32, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: 'none', cursor: input.trim() && !laden ? 'pointer' : 'default',
                background: input.trim() && !laden ? 'var(--mentaforce-primary)' : 'var(--border)',
                opacity: !input.trim() || laden ? 0.4 : 1,
                transition: 'background 0.15s ease, opacity 0.15s ease',
              }}
            >
              <Send
                size={14}
                strokeWidth={2.5}
                color={input.trim() && !laden ? 'var(--bg-app)' : 'var(--text-4)'}
                aria-hidden
              />
            </button>
          </div>
        </div>

      </main>
      <style>{`
        .mf-sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }
        .mf-coach-cursor {
          display: inline-block;
          width: 2px;
          height: 14px;
          margin-left: 2px;
          vertical-align: text-bottom;
          background: var(--mentaforce-primary);
          animation: mf-coach-blink 0.9s step-end infinite;
        }
        @keyframes mf-coach-blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .mf-coach-cursor { animation: none; opacity: 0.6; }
        }
        .mf-suggestie-chip {
          transition: border-color 0.15s var(--ease), color 0.15s var(--ease), background 0.15s var(--ease);
        }
        .mf-suggestie-chip:hover {
          border-color: var(--mentaforce-primary);
          color: var(--text-1);
          background: var(--mentaforce-primary-light);
        }
        .mf-suggestie-chip:focus-visible {
          outline: 2px solid var(--mentaforce-primary);
          outline-offset: 2px;
        }
        .mf-vita-verstuur:focus-visible {
          outline: 2px solid var(--mentaforce-primary);
          outline-offset: 2px;
        }
        #vita-invoer:focus-visible {
          outline: none;
        }
      `}</style>
    </div>
  )
}
