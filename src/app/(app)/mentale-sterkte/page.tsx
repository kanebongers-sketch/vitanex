'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/supabase'
import Navbar from '@/components/layout/Navbar'
import { authFetch } from '@/lib/auth/auth-fetch'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Progress } from '@/components/ui/Progress'
import { useToast } from '@/components/ui/Toast'
import { Sparkles, MessageCircle, RotateCcw } from 'lucide-react'
import { useVertaling } from '@/lib/i18n/TaalProvider'


// Teksten in het woordenboek: mentaal.mentaleSterkte.vraag.<sleutel> en
// mentaal.mentaleSterkte.schaal.<sleutel>. Volgorde gelijk aan de API.
const VRAGEN = ['tegenslag', 'onzekerheid', 'prioriteiten', 'grenzen', 'motivatie', 'steun', 'slaap', 'gedachten'] as const

const SCHAAL = [
  { waarde: 1, sleutel: 'nooit' },
  { waarde: 2, sleutel: 'zelden' },
  { waarde: 3, sleutel: 'soms' },
  { waarde: 4, sleutel: 'vaak' },
  { waarde: 5, sleutel: 'altijd' },
]

interface Resultaat {
  score: number
  niveau: string
  analyse: string
  per_vraag: { vraag: string; score: number }[]
}

// Niveau → token-kleur. Kleur is een aanvulling, nooit de enige drager: het
// niveau staat ook altijd als tekst naast de score.
const NIVEAU_KLEUR: Record<string, string> = {
  'Sterk': 'var(--mf-green)',
  'Gemiddeld': 'var(--mf-amber)',
  'Kwetsbaar': 'var(--mf-orange)',
  'Aandacht nodig': 'var(--mf-red)',
}

// Het niveau komt als Nederlands label van de API; toon het vertaald.
const NIVEAU_SLEUTEL: Record<string, string> = {
  'Sterk': 'sterk',
  'Gemiddeld': 'gemiddeld',
  'Kwetsbaar': 'kwetsbaar',
  'Aandacht nodig': 'aandacht',
}

function scoreKleur(score: number): string {
  if (score >= 4) return 'var(--mf-green)'
  if (score >= 3) return 'var(--mf-amber)'
  return 'var(--mf-red)'
}

export default function MentaleSterktePagina() {
  const router = useRouter()
  const { toast } = useToast()
  const { t } = useVertaling()
  const [antwoorden, setAntwoorden] = useState<number[]>(new Array(VRAGEN.length).fill(0))
  const [laden, setLaden] = useState(true)
  const [bezig, setBezig] = useState(false)
  const [resultaat, setResultaat] = useState<Resultaat | null>(null)
  const [huidigVraag, setHuidigVraag] = useState(0)
  // Stuurt de auto-advance aan: index van de zojuist beantwoorde vraag, of null.
  const [zojuistBeantwoord, setZojuistBeantwoord] = useState<number | null>(null)

  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setLaden(false)
    }
    check()
  }, [router])

  // Auto-advance naar de volgende vraag, 300ms na een antwoord. Via een effect
  // met cleanup zodat de timer netjes wordt opgeruimd bij snel klikken/unmount.
  useEffect(() => {
    if (zojuistBeantwoord === null) return
    if (zojuistBeantwoord >= VRAGEN.length - 1) return
    const timer = setTimeout(() => {
      setHuidigVraag(zojuistBeantwoord + 1)
      setZojuistBeantwoord(null)
    }, 300)
    return () => clearTimeout(timer)
  }, [zojuistBeantwoord])

  function stelAntwoord(vraagIdx: number, waarde: number) {
    setAntwoorden(prev => prev.map((v, i) => i === vraagIdx ? waarde : v))
    setZojuistBeantwoord(vraagIdx)
  }

  async function verstuur() {
    if (antwoorden.some(a => a === 0)) return
    setBezig(true)
    try {
      const res = await authFetch('/api/quiz/mentale-sterkte', {
        method: 'POST',
        body: JSON.stringify({ antwoorden }),
      })
      if (!res.ok) throw new Error(t('mentaal.mentaleSterkte.analyseNietOpgehaald'))
      const json = await res.json() as Resultaat
      setResultaat(json)
    } catch (e) {
      toast({
        title: t('mentaal.mentaleSterkte.analyseMislukt'),
        description: e instanceof Error ? e.message : t('mentaal.mentaleSterkte.probeerLater'),
        variant: 'error',
      })
    } finally {
      setBezig(false)
    }
  }

  function opnieuw() {
    setResultaat(null)
    setAntwoorden(new Array(VRAGEN.length).fill(0))
    setHuidigVraag(0)
    setZojuistBeantwoord(null)
  }

  const klaarVoorVerstuur = antwoorden.every(a => a > 0)
  const beantwoord = antwoorden.filter(a => a > 0).length
  const niveauLabel = (niveau: string) => NIVEAU_SLEUTEL[niveau] ? t(`mentaal.mentaleSterkte.niveau.${NIVEAU_SLEUTEL[niveau]}`) : niveau

  if (laden) return (
    <div className="mf-mesh-bg" style={{ minHeight: '100vh' }}>
      <Navbar />
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
        <div className="mf-spinner" />
      </div>
    </div>
  )

  return (
    <div className="mf-mesh-bg" style={{ minHeight: '100vh' }}>
      <Navbar />
      <main style={{ padding: '24px 20px 88px', maxWidth: 800, margin: '0 auto' }}>

        {!resultaat ? (
          <>
            <header style={{ marginBottom: 24 }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.03em', marginBottom: 4 }}>
                {t('mentaal.mentaleSterkte.titel')}
              </h1>
              <p style={{ fontSize: 13, color: 'var(--text-3)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Sparkles size={13} aria-hidden style={{ color: 'var(--mentaforce-primary)' }} />
                {t('mentaal.mentaleSterkte.sub', { aantal: VRAGEN.length })}
              </p>
              {/* Voortgangsbalk */}
              <Progress
                value={beantwoord}
                max={VRAGEN.length}
                ariaLabel={t('mentaal.mentaleSterkte.voortgang')}
                thickness={6}
                style={{ marginTop: 14 }}
              />
              <p style={{ fontSize: 10, color: 'var(--text-4)', marginTop: 4, textAlign: 'right' }}>
                {t('mentaal.mentaleSterkte.beantwoord', { aantal: beantwoord, totaal: VRAGEN.length })}
              </p>
            </header>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {VRAGEN.map((sleutel, i) => {
                const vraag = t(`mentaal.mentaleSterkte.vraag.${sleutel}`)
                const actief = huidigVraag === i
                const ingevuld = antwoorden[i] > 0
                return (
                  <Card
                    key={i}
                    style={{
                      padding: '16px 18px',
                      border: `1px solid ${actief || ingevuld ? 'var(--mentaforce-primary)' : 'var(--border)'}`,
                      transition: 'border-color 0.2s var(--ease)',
                    }}
                  >
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', marginBottom: 12, lineHeight: 1.5 }}>
                      <span style={{ color: 'var(--text-3)', fontWeight: 700, marginRight: 6 }}>{i + 1}.</span>
                      {vraag}
                    </p>
                    <div role="radiogroup" aria-label={vraag} style={{ display: 'flex', gap: 6 }}>
                      {SCHAAL.map(s => {
                        const gekozen = antwoorden[i] === s.waarde
                        const label = t(`mentaal.mentaleSterkte.schaal.${s.sleutel}`)
                        return (
                          <button
                            key={s.waarde}
                            type="button"
                            role="radio"
                            aria-checked={gekozen}
                            aria-label={t('mentaal.mentaleSterkte.schaalLabel', { waarde: s.waarde, label })}
                            onClick={() => stelAntwoord(i, s.waarde)}
                            className="mf-likert-btn"
                            style={{
                              flex: 1,
                              minHeight: 48,
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 2,
                              borderRadius: 'var(--radius-sm)',
                              border: `1px solid ${gekozen ? 'var(--mentaforce-primary)' : 'var(--border)'}`,
                              cursor: 'pointer',
                              background: gekozen ? 'var(--mentaforce-primary)' : 'var(--bg-subtle)',
                              color: gekozen ? 'var(--bg-app)' : 'var(--text-2)',
                              fontWeight: 700,
                              transition: 'background 0.12s var(--ease), border-color 0.12s var(--ease)',
                            }}
                          >
                            <span style={{ fontSize: 13 }}>{s.waarde}</span>
                            <span style={{ fontSize: 9, fontWeight: 600, lineHeight: 1.1 }}>{label}</span>
                          </button>
                        )
                      })}
                    </div>
                  </Card>
                )
              })}
            </div>

            {klaarVoorVerstuur && (
              <Button
                onClick={verstuur}
                loading={bezig}
                size="lg"
                style={{ width: '100%', marginTop: 20 }}
                rightIcon={!bezig ? <Sparkles size={18} aria-hidden /> : undefined}
              >
                {bezig ? t('mentaal.mentaleSterkte.analyseert') : t('mentaal.mentaleSterkte.bekijk')}
              </Button>
            )}

            <style>{`
              .mf-likert-btn:focus-visible {
                outline: 2px solid var(--mentaforce-primary);
                outline-offset: 2px;
              }
            `}</style>
          </>
        ) : (
          <>
            <header style={{ marginBottom: 24, textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 96, height: 96, borderRadius: '50%',
                  background: 'var(--mentaforce-primary-light)',
                  border: '1px solid var(--border-strong)',
                }}>
                  <Sparkles size={40} strokeWidth={1.5} aria-hidden style={{ color: NIVEAU_KLEUR[resultaat.niveau] ?? 'var(--mentaforce-primary)' }} />
                </span>
              </div>
              <h1 style={{ fontSize: 28, fontWeight: 800, color: NIVEAU_KLEUR[resultaat.niveau] ?? 'var(--text-1)', marginBottom: 4 }}>
                {niveauLabel(resultaat.niveau)}
              </h1>
              <p style={{ fontSize: 14, color: 'var(--text-3)' }}>{t('mentaal.mentaleSterkte.score', { score: resultaat.score })}</p>

              <Progress
                value={resultaat.score}
                max={100}
                ariaLabel={t('mentaal.mentaleSterkte.scoreLabel', { score: resultaat.score, niveau: niveauLabel(resultaat.niveau) })}
                color={NIVEAU_KLEUR[resultaat.niveau] ?? 'var(--mentaforce-primary)'}
                style={{ maxWidth: 280, margin: '16px auto 0' }}
              />
            </header>

            <Card style={{ padding: 20, marginBottom: 20 }}>
              <p className="mf-overline" style={{ marginBottom: 12, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Sparkles size={13} aria-hidden style={{ color: 'var(--mentaforce-primary)' }} />
                {t('mentaal.mentaleSterkte.aiAnalyse')}
              </p>
              <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.65 }}>{resultaat.analyse}</p>
            </Card>

            <Card style={{ padding: 16, marginBottom: 20 }}>
              <p className="mf-overline" style={{ marginBottom: 12 }}>
                {t('mentaal.mentaleSterkte.perVraag')}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {resultaat.per_vraag.map((pv, i) => (
                  <Progress
                    key={i}
                    value={pv.score}
                    max={5}
                    color={scoreKleur(pv.score)}
                    thickness={4}
                    label={
                      <span style={{ display: 'flex', justifyContent: 'space-between', width: '100%', gap: 8 }}>
                        <span style={{ fontSize: 11, color: 'var(--text-2)' }}>{VRAGEN[i] ? t(`mentaal.mentaleSterkte.vraag.${VRAGEN[i]}`) : pv.vraag}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: scoreKleur(pv.score), flexShrink: 0 }}>{pv.score}/5</span>
                      </span>
                    }
                  />
                ))}
              </div>
            </Card>

            <div style={{ display: 'flex', gap: 10 }}>
              <Button
                variant="secondary"
                onClick={opnieuw}
                style={{ flex: 1 }}
                leftIcon={<RotateCcw size={15} aria-hidden />}
              >
                {t('mentaal.mentaleSterkte.opnieuw')}
              </Button>
              <Button
                onClick={() => router.push('/coach')}
                style={{ flex: 1 }}
                leftIcon={<MessageCircle size={15} aria-hidden />}
              >
                {t('mentaal.mentaleSterkte.bespreek')}
              </Button>
            </div>
          </>
        )}

      </main>
    </div>
  )
}
