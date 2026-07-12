'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ChevronDown } from 'lucide-react'
import { supabase } from '@/lib/supabase/supabase'
import Navbar from '@/components/layout/Navbar'
import { CollapsibleRoot, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/Collapsible'
import { useToast } from '@/components/ui/Toast'


interface CheckIn {
  id: string
  aangemaakt_op: string
  scores: Record<string, number>
}

const DOMEIN_CONFIG: Record<string, { label: string; kleur: string }> = {
  energie:  { label: 'Energie',   kleur: 'var(--mf-amber)' },
  slaap:    { label: 'Slaap',     kleur: 'var(--mf-purple)' },
  stress:   { label: 'Stress',    kleur: 'var(--mf-red)' },
  focus:    { label: 'Focus',     kleur: 'var(--mf-green)' },
  balans:   { label: 'Balans',    kleur: 'var(--mf-blue)' },
  motivatie:{ label: 'Motivatie', kleur: 'var(--mf-rose)' },
}

function scoreKleur(score: number) {
  if (score >= 14) return 'var(--mf-green)'
  if (score >= 9)  return 'var(--mf-amber)'
  return 'var(--mf-red)'
}

function vitaalScore(scores: Record<string, number>) {
  const vals = Object.values(scores).filter(v => v > 0)
  if (!vals.length) return 0
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length
  return Math.round(((avg - 4) / 16) * 100)
}

export default function CheckInGeschiedenisPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [laden, setLaden] = useState(true)
  const [checkIns, setCheckIns] = useState<CheckIn[]>([])
  const [uitgevouwen, setUitgevouwen] = useState<string | null>(null)

  useEffect(() => {
    async function laad() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data, error } = await supabase
        .from('checkin_analyses')
        .select('id, aangemaakt_op, scores')
        .eq('user_id', user.id)
        .order('aangemaakt_op', { ascending: false })
        .limit(52)
      if (error) {
        toast({
          variant: 'error',
          title: 'Geschiedenis laden mislukt',
          description: 'We konden je check-ins niet ophalen. Probeer het later opnieuw.',
        })
      }
      setCheckIns(data ?? [])
      setLaden(false)
    }
    laad()
  }, [router, toast])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <main style={{ padding: '36px 40px 72px', maxWidth: 800, margin: '0 auto' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <Link href="/checkin" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-3)', textDecoration: 'none', fontSize: 13 }}>
            <ArrowLeft size={14} aria-hidden="true" /> Check-in
          </Link>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.03em', marginBottom: 4 }}>Check-in geschiedenis</h1>
            <p style={{ fontSize: 13, color: 'var(--text-3)' }}>
              {laden ? 'Geschiedenis laden…' : `${checkIns.length} check-ins in de afgelopen tijd`}
            </p>
          </div>
          <Link href="/voortgang" style={{ fontSize: 13, fontWeight: 600, color: 'var(--mf-purple)', textDecoration: 'none', padding: '8px 16px', borderRadius: 10, background: 'var(--mf-purple-light)' }}>
            Voortgang →
          </Link>
        </div>

        {laden ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}><div className="mf-spinner" /></div>
        ) : checkIns.length === 0 ? (
          <div style={{ background: 'var(--bg-card)', borderRadius: 20, border: '1px solid var(--border)', padding: '56px 40px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 0, pointerEvents: 'none' }}>
              <div style={{ width: 160, height: 160, borderRadius: '50%', background: 'radial-gradient(circle, var(--mf-green-light) 0%, transparent 70%)' }} />
            </div>
            <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6, position: 'relative', zIndex: 1 }}>Nog geen check-ins</p>
            <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 20, position: 'relative', zIndex: 1, maxWidth: 320, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.5 }}>Je wekelijkse check-ins verschijnen hier als tijdlijn — zodat je je welzijn over de weken kunt volgen.</p>
            <Link href="/checkin" style={{ fontSize: 14, color: 'var(--bg-app)', background: 'var(--mentaforce-primary)', borderRadius: 12, padding: '10px 20px', textDecoration: 'none', fontWeight: 600, display: 'inline-block', position: 'relative', zIndex: 1 }}>
              Eerste check-in →
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {checkIns.map((ci, idx) => {
              const datum = new Date(ci.aangemaakt_op)
              const vscore = vitaalScore(ci.scores ?? {})
              const vkleur = vscore >= 70 ? 'var(--mf-green)' : vscore >= 40 ? 'var(--mf-amber)' : 'var(--mf-red)'
              const isOpen = uitgevouwen === ci.id
              const domeinen = Object.keys(DOMEIN_CONFIG).filter(d => ci.scores?.[d] !== undefined)
              const datumLabel = datum.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })

              return (
                <div key={ci.id} style={{ display: 'flex', gap: 0 }}>
                  {/* Tijdlijn lijn */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 36, flexShrink: 0 }}>
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: vkleur, border: '2px solid var(--bg-app)', boxShadow: `0 0 0 2px color-mix(in srgb, ${vkleur} 25%, transparent)`, flexShrink: 0, marginTop: 20 }} />
                    {idx < checkIns.length - 1 && (
                      <div style={{ width: 2, flex: 1, background: 'var(--bg-subtle)', minHeight: 16 }} />
                    )}
                  </div>

                  {/* Inhoud */}
                  <div style={{ flex: 1, paddingBottom: 12, paddingLeft: 12 }}>
                    <CollapsibleRoot
                      open={isOpen}
                      onOpenChange={(open) => setUitgevouwen(open ? ci.id : null)}
                    >
                      <div style={{ background: 'var(--bg-card)', borderRadius: 14, border: '1px solid var(--border)', padding: '14px 16px' }}>
                        <CollapsibleTrigger asChild>
                          <button
                            type="button"
                            aria-label={`Details ${datumLabel}, score ${vscore} van 100`}
                            className="mf-pressable"
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 12, background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}
                          >
                            <div>
                              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>
                                {datumLabel}
                              </p>
                              <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>
                                {datum.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })} · {domeinen.length} domeinen
                              </p>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ textAlign: 'right' }}>
                                <p style={{ fontSize: 20, fontWeight: 800, color: vkleur }}>{vscore}</p>
                                <p style={{ fontSize: 9, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase' }}>score</p>
                              </div>
                              <ChevronDown
                                size={16}
                                aria-hidden="true"
                                style={{
                                  color: 'var(--text-3)',
                                  transition: 'transform 0.24s var(--ease)',
                                  transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                                }}
                              />
                            </div>
                          </button>
                        </CollapsibleTrigger>

                        <CollapsibleContent>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 12 }}>
                            {domeinen.map(d => {
                              const cfg = DOMEIN_CONFIG[d]
                              const score = ci.scores[d]
                              const pct = Math.round(((score - 4) / 16) * 100)
                              const fractie = Math.min(Math.max(pct, 0), 100) / 100
                              return (
                                <div key={d} style={{ borderRadius: 10, padding: '10px 12px', background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
                                  <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: cfg.kleur, marginBottom: 4 }}>{cfg.label}</p>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <div
                                      role="progressbar"
                                      aria-valuenow={score}
                                      aria-valuemin={4}
                                      aria-valuemax={20}
                                      aria-valuetext={`${pct}%`}
                                      aria-label={`${cfg.label}: ${score} van 20`}
                                      style={{ flex: 1, height: 4, background: 'var(--border)', borderRadius: 100, overflow: 'hidden' }}
                                    >
                                      <div
                                        className="mf-hist-bar"
                                        style={{ height: '100%', width: '100%', transformOrigin: 'left center', transform: `scaleX(${fractie})`, background: scoreKleur(score), borderRadius: 100 }}
                                      />
                                    </div>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: scoreKleur(score), width: 28, textAlign: 'right' }}>{score}</span>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </CollapsibleContent>
                      </div>
                    </CollapsibleRoot>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
      <style>{`
        .mf-hist-bar { transition: transform 0.5s var(--ease, ease); will-change: transform; }
        @media (prefers-reduced-motion: reduce) {
          .mf-hist-bar { transition: none; will-change: auto; }
        }
      `}</style>
    </div>
  )
}

