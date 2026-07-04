'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Check, History, BookOpen } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { vitaEvent } from '@/lib/vita/events'
import Navbar from '@/components/layout/Navbar'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import VitaReflectieBegeleider from '@/components/vita/VitaReflectieBegeleider'
import ReflectieHistorie from './ReflectieHistorie'
import ReflectieVraagStap from './ReflectieVraagStap'
import {
  REFLECTIE_VRAGEN,
  bepaalWeekStart,
  berekenWekenOpRij,
  eersteOpenVraag,
  type ReflectieEntry,
} from './reflectieVragen'

export default function ReflectiePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [laden, setLaden] = useState(true)
  const [antwoorden, setAntwoorden] = useState<Record<string, string>>({})
  const [opslaan, setOpslaan] = useState(false)
  const [opgeslagen, setOpgeslagen] = useState(false)
  const [eerdere, setEerdere] = useState<ReflectieEntry[]>([])
  const [toonHistorie, setToonHistorie] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [actieveVraag, setActieveVraag] = useState(0)
  const [weekStart] = useState(() => bepaalWeekStart(new Date()))

  const vraagVeldRef = useRef<HTMLTextAreaElement | null>(null)
  const heeftInitieleFocus = useRef(false)

  useEffect(() => {
    async function laad() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)

      const [{ data: huidig }, { data: historie }] = await Promise.all([
        supabase.from('reflectie_entries').select('antwoorden')
          .eq('user_id', user.id).eq('week_start', weekStart).maybeSingle(),
        supabase.from('reflectie_entries').select('id, week_start, antwoorden, aangemaakt_op')
          .eq('user_id', user.id).order('week_start', { ascending: false }).limit(8),
      ])

      const bestaandeAntwoorden = huidig?.antwoorden ?? {}
      setAntwoorden(bestaandeAntwoorden)
      // Open bij de eerste nog lege vraag: direct verder waar je gebleven was.
      setActieveVraag(eersteOpenVraag(bestaandeAntwoorden))
      setEerdere(historie ?? [])
      setLaden(false)
    }
    laad()
  }, [router, weekStart])

  // Direct kunnen typen: focus het tekstveld bij binnenkomst (alleen op brede
  // schermen — geen toetsenbord-pop op mobiel) en bij elke vraagwissel.
  useEffect(() => {
    if (laden || toonHistorie) return
    const veld = vraagVeldRef.current
    if (!veld) return
    if (!heeftInitieleFocus.current) {
      heeftInitieleFocus.current = true
      if (window.innerWidth >= 768) veld.focus({ preventScroll: true })
      return
    }
    veld.focus({ preventScroll: true })
  }, [laden, toonHistorie, actieveVraag])

  async function slaOp() {
    if (!userId || Object.values(antwoorden).every(v => !v.trim())) return
    setOpslaan(true)

    const { error } = await supabase.from('reflectie_entries').upsert({
      user_id: userId,
      week_start: weekStart,
      antwoorden,
    }, { onConflict: 'user_id,week_start' })

    setOpslaan(false)
    if (error) {
      toast({
        variant: 'error',
        title: 'Opslaan mislukt',
        description: 'Je reflectie kon niet worden opgeslagen. Probeer het opnieuw — je antwoorden staan er nog.',
      })
      return
    }

    setOpgeslagen(true)
    vitaEvent('data_logged', { kind: 'reflectie' })

    // Lokale patch: werk de historie-lijst in-place bij i.p.v. een re-fetch,
    // zodat de huidige week meteen bovenaan verschijnt of wordt vervangen.
    setEerdere(prev => {
      const zonderHuidig = prev.filter(e => e.week_start !== weekStart)
      const bestaand = prev.find(e => e.week_start === weekStart)
      const bijgewerkt: ReflectieEntry = {
        id: bestaand?.id ?? `local-${weekStart}`,
        week_start: weekStart,
        antwoorden,
        aangemaakt_op: bestaand?.aangemaakt_op ?? new Date().toISOString(),
      }
      return [bijgewerkt, ...zonderHuidig].slice(0, 8)
    })
  }

  function wijzigAntwoord(waarde: string) {
    // Nieuwe wijziging → 'Opgeslagen'-staat is niet meer waar.
    setOpgeslagen(false)
    const vraagId = REFLECTIE_VRAGEN[actieveVraag].id
    setAntwoorden(prev => ({ ...prev, [vraagId]: waarde }))
  }

  const weekLabel = new Date(weekStart).toLocaleDateString('nl-BE', { day: 'numeric', month: 'long' })
  const beantwoord = REFLECTIE_VRAGEN.map(v => Boolean(antwoorden[v.id]?.trim()))
  const ingevuld = beantwoord.filter(Boolean).length
  const heeftIets = ingevuld > 0
  // Ritme uit al opgehaalde data (max 8 weken historie) — bij de kaap eerlijk '8+'.
  const wekenOpRij = berekenWekenOpRij(eerdere.map(e => e.week_start), weekStart)
  const ritmeLabel = wekenOpRij >= 2 ? ` · ${wekenOpRij >= 8 ? '8+' : wekenOpRij} weken op rij` : ''

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <main style={{ padding: '36px 40px 72px', maxWidth: 900, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 88, height: 88, borderRadius: '50%', background: 'radial-gradient(circle, color-mix(in srgb, var(--mentaforce-primary) 18%, transparent) 0%, transparent 70%)' }} />
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.03em', marginBottom: 4 }}>Wekelijkse reflectie</h1>
              <p style={{ fontSize: 13, color: 'var(--text-3)' }}>
                Week van {weekLabel} · {ingevuld} van {REFLECTIE_VRAGEN.length} beantwoord{ritmeLabel}
              </p>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<History size={15} aria-hidden />}
            onClick={() => setToonHistorie(v => !v)}
          >
            {toonHistorie ? 'Huidige week' : `Historie (${eerdere.length})`}
          </Button>
        </div>

        {laden ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 40 }}><div className="mf-spinner" /></div>
        ) : toonHistorie ? (
          <ReflectieHistorie entries={eerdere} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Vita opent het reflectiemoment — of erkent de afronding. De key
                laat de wissel zacht binnenfaden (mf-fade-in, 250ms). Geen
                automatische redirect: de gebruiker kiest zelf wanneer die verder gaat. */}
            <div key={opgeslagen ? 'afronden' : 'opening'} className="mf-fade-in">
              <VitaReflectieBegeleider fase={opgeslagen ? 'afronden' : 'opening'} />
            </div>

            <ReflectieVraagStap
              index={actieveVraag}
              waarde={antwoorden[REFLECTIE_VRAGEN[actieveVraag].id] ?? ''}
              beantwoord={beantwoord}
              veldRef={vraagVeldRef}
              onWijzig={wijzigAntwoord}
              onKies={setActieveVraag}
            />

            <div style={{ display: 'flex', gap: 10 }}>
              <Button
                onClick={slaOp}
                loading={opslaan}
                disabled={opslaan || !heeftIets}
                leftIcon={opgeslagen ? <Check size={16} aria-hidden /> : undefined}
                style={{ flex: 1 }}
              >
                {opslaan ? 'Opslaan...' : opgeslagen ? 'Opgeslagen' : 'Reflectie opslaan'}
              </Button>
              <Link
                href="/journal"
                className="mf-reflectie-link"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '13px 22px',
                  borderRadius: 'var(--radius-btn)',
                  fontSize: 14,
                  fontWeight: 600,
                  color: 'var(--text-1)',
                  border: '1px solid var(--border-strong)',
                  background: 'var(--bg-subtle)',
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                <BookOpen size={16} aria-hidden />
                Naar journal
              </Link>
            </div>

            {/* Gereserveerde regel (vaste hoogte → geen layout-shift): na het
                opslaan verschijnt hier zacht de bevestiging + de weg naar huis. */}
            <div aria-live="polite" style={{ minHeight: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              {opgeslagen && (
                <>
                  <span className="mf-fade-in" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-2)' }}>
                    <Check size={14} aria-hidden style={{ color: 'var(--mentaforce-primary)', flexShrink: 0 }} />
                    Opgeslagen — je kunt altijd nog aanvullen.
                  </span>
                  <Link
                    href="/home"
                    className="mf-reflectie-link mf-fade-in"
                    style={{ fontSize: 13, fontWeight: 600, color: 'var(--mentaforce-primary)', textDecoration: 'none', whiteSpace: 'nowrap' }}
                  >
                    Naar home →
                  </Link>
                </>
              )}
            </div>

            <style>{`
              .mf-reflectie-link:hover { opacity: 0.88; }
              .mf-reflectie-link:focus-visible {
                outline: 2px solid var(--mentaforce-primary);
                outline-offset: 2px;
              }
            `}</style>
          </div>
        )}
      </main>
    </div>
  )
}
