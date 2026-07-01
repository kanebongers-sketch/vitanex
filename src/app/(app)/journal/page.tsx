'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useId, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  BookOpen,
  Plus,
  Trash2,
  RefreshCw,
  Sparkles,
  PenLine,
  Frown,
  Meh,
  Smile,
  Laugh,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/layout/Navbar'
import { authFetch } from '@/lib/auth-fetch'
import { useToast } from '@/components/ui/Toast'
import { Field } from '@/components/ui/Field'
import { Textarea } from '@/components/ui/Textarea'
import { vitaEvent } from '@/lib/vita/events'
import VitaLeegScherm from '@/components/vita/VitaLeegScherm'

const STEMMING_GLOW: Record<number, string> = {
  1: 'var(--mf-red-light)',
  2: 'var(--mf-amber-light)',
  3: 'var(--bg-subtle)',
  4: 'var(--mf-green-light)',
  5: 'var(--mf-purple-light)',
}

type Entry = {
  id: string
  inhoud: string
  stemming: number | null
  aangemaakt_op: string
}

interface Stemming {
  waarde: number
  kleur: string
  bg: string
  label: string
  icoon: LucideIcon
}

const STEMMINGEN: Stemming[] = [
  { waarde: 1, kleur: 'var(--mf-red)', bg: 'var(--mf-red-light)', label: 'Slecht', icoon: Frown },
  { waarde: 2, kleur: 'var(--mf-amber-dark)', bg: 'var(--mf-amber-light)', label: 'Matig', icoon: Meh },
  { waarde: 3, kleur: 'var(--text-2)', bg: 'var(--bg-subtle)', label: 'Oké', icoon: Meh },
  { waarde: 4, kleur: 'var(--mf-green)', bg: 'var(--mf-green-light)', label: 'Goed', icoon: Smile },
  { waarde: 5, kleur: 'var(--mf-purple)', bg: 'var(--mf-purple-light)', label: 'Super', icoon: Laugh },
]

const PROMPTS = [
  'Hoe was mijn dag werkelijk?',
  'Waar maak ik me zorgen over?',
  'Wat gaf me energie vandaag?',
  'Wat nam energie weg?',
  'Wat ben ik dankbaar voor?',
  'Wat wil ik morgen anders doen?',
]

function formatDatum(iso: string) {
  return new Date(iso).toLocaleDateString('nl-BE', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
}

function StemmingDot({ waarde }: { waarde: number }) {
  const s = STEMMINGEN.find(m => m.waarde === waarde)
  if (!s) return null
  const Icoon = s.icoon
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: 11, fontWeight: 600, color: s.kleur,
      background: s.bg, borderRadius: 100, padding: '2px 9px',
    }}>
      <Icoon size={12} aria-hidden style={{ flexShrink: 0 }} />
      {s.label}
    </span>
  )
}

export default function JournalPagina() {
  const router = useRouter()
  const { toast } = useToast()
  const tekstId = useId()
  const [entries, setEntries] = useState<Entry[]>([])
  const [laden, setLaden] = useState(true)
  const [nieuwTonen, setNieuwTonen] = useState(false)
  const [tekst, setTekst] = useState('')
  const [stemming, setStemming] = useState<number | null>(null)
  const [opslaan, setOpslaan] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [uitgevouwen, setUitgevouwen] = useState<string | null>(null)
  const [aiPrompt, setAiPrompt] = useState<string | null>(null)
  const [aiPromptLaden, setAiPromptLaden] = useState(false)

  useEffect(() => {
    async function laad() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
      const { data, error } = await supabase
        .from('journal_entries')
        .select('id, inhoud, stemming, aangemaakt_op')
        .eq('user_id', user.id)
        .order('aangemaakt_op', { ascending: false })
        .limit(50)
      if (error) {
        toast({ title: 'Laden mislukt', description: 'Je aantekeningen konden niet worden opgehaald.', variant: 'error' })
      }
      setEntries(data || [])
      setLaden(false)
    }
    laad()
  }, [router, toast])

  async function slaOp() {
    if (!tekst.trim() || !userId) return
    setOpslaan(true)
    const { data, error } = await supabase
      .from('journal_entries')
      .insert({ user_id: userId, inhoud: tekst.trim(), stemming })
      .select('id, inhoud, stemming, aangemaakt_op')
      .single()
    if (!error && data) {
      setEntries(prev => [data, ...prev])
      setTekst('')
      setStemming(null)
      setNieuwTonen(false)
      vitaEvent('data_logged', { kind: 'journal' })
    } else {
      toast({ title: 'Opslaan mislukt', description: 'Je aantekening kon niet worden opgeslagen. Probeer het opnieuw.', variant: 'error' })
    }
    setOpslaan(false)
  }

  async function verwijder(id: string) {
    if (!confirm('Aantekening verwijderen?')) return
    const { error } = await supabase.from('journal_entries').delete().eq('id', id)
    if (!error) {
      setEntries(prev => prev.filter(e => e.id !== id))
    } else {
      toast({ title: 'Verwijderen mislukt', description: 'De aantekening kon niet worden verwijderd.', variant: 'error' })
    }
  }

  async function genereerPrompt() {
    setAiPromptLaden(true)
    try {
      const res = await authFetch('/api/journal/ai-prompt')
      if (res.ok) {
        const d = await res.json() as { prompt: string | null }
        setAiPrompt(d.prompt)
      } else {
        toast({ title: 'Geen reflectievraag', description: 'De AI-reflectievraag kon niet worden geladen.', variant: 'warning' })
      }
    } catch {
      toast({ title: 'Geen verbinding', description: 'De AI-reflectievraag kon niet worden geladen.', variant: 'warning' })
    } finally {
      setAiPromptLaden(false)
    }
  }

  return (
    <div className="mf-mesh-bg" style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <style>{`
        .mf-journal-del:hover { color: var(--mf-red); background: var(--mf-red-light); }
        .mf-journal-del:focus-visible { outline: 2px solid var(--mentaforce-primary); outline-offset: 2px; }
      `}</style>
      <main style={{ padding: '24px 20px 88px', maxWidth: 800, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ position: 'relative', width: 44, height: 44, flexShrink: 0 }}>
              <div aria-hidden style={{
                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                width: 72, height: 72, borderRadius: '50%',
                background: `radial-gradient(circle, ${stemming ? (STEMMING_GLOW[stemming] ?? 'var(--mf-purple-light)') : 'var(--mf-purple-light)'} 0%, transparent 70%)`,
                zIndex: 0,
              }} />
              <div style={{ width: 44, height: 44, borderRadius: 14, background: 'var(--mf-purple-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1, color: 'var(--mf-purple)' }}>
                <BookOpen size={22} aria-hidden />
              </div>
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.03em', marginBottom: 2 }}>Journal</h1>
              <p style={{ color: 'var(--text-4)', fontSize: 13 }}>Schrijf vrij — alleen zichtbaar voor jou.</p>
            </div>
          </div>
          {!nieuwTonen && (
            <button
              onClick={() => setNieuwTonen(true)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'linear-gradient(135deg, var(--mf-green) 0%, var(--mf-green-dark) 100%)', color: 'var(--bg-app)',
                borderRadius: 12, padding: '10px 18px',
                fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer',
              }}
            >
              <Plus size={14} strokeWidth={2.5} aria-hidden />
              Nieuwe aantekening
            </button>
          )}
        </div>

        {/* Nieuw entry form */}
        {nieuwTonen && (
          <div style={{ background: 'var(--bg-card)', borderRadius: 20, border: '1px solid var(--border)', padding: '24px', marginBottom: 20 }}>

            {/* AI Prompt */}
            <div style={{ background: 'var(--mf-purple-light)', borderRadius: 12, padding: '12px 16px', marginBottom: 18, border: '1px solid var(--border-strong)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: aiPrompt ? 8 : 0 }}>
                <p style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--mf-purple)' }}>
                  <Sparkles size={13} aria-hidden />
                  AI reflectievraag
                </p>
                <button
                  onClick={genereerPrompt}
                  disabled={aiPromptLaden}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: 'var(--mf-purple)', background: 'none', border: 'none', cursor: aiPromptLaden ? 'default' : 'pointer', opacity: aiPromptLaden ? 0.5 : 1 }}
                >
                  {aiPromptLaden ? 'Laden...' : aiPrompt ? <><RefreshCw size={12} aria-hidden /> Nieuw</> : 'Genereer →'}
                </button>
              </div>
              {aiPrompt && (
                <button
                  onClick={() => setTekst(prev => prev ? `${prev}\n\n${aiPrompt}\n` : `${aiPrompt}\n`)}
                  style={{ fontSize: 13, color: 'var(--mf-purple)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left', lineHeight: 1.5, fontStyle: 'italic' }}
                >
                  &ldquo;{aiPrompt}&rdquo; →
                </button>
              )}
            </div>

            {/* Stemming picker */}
            <p id={`${tekstId}-stemming-label`} style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Hoe voel je je?</p>
            <div role="group" aria-labelledby={`${tekstId}-stemming-label`} style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
              {STEMMINGEN.map(s => {
                const actief = stemming === s.waarde
                const Icoon = s.icoon
                return (
                  <button
                    key={s.waarde}
                    type="button"
                    aria-pressed={actief}
                    onClick={() => setStemming(actief ? null : s.waarde)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '7px 14px', borderRadius: 100, border: `2px solid ${actief ? s.kleur : 'var(--border)'}`,
                      background: actief ? s.bg : 'var(--bg-subtle)', cursor: 'pointer',
                      fontSize: 12, fontWeight: 700, color: actief ? s.kleur : 'var(--text-3)',
                      transition: 'border-color 0.15s var(--ease), color 0.15s var(--ease)',
                    }}
                  >
                    <Icoon size={14} aria-hidden />
                    {s.label}
                  </button>
                )
              })}
            </div>

            {/* Prompt chips */}
            <p id={`${tekstId}-schrijftip-label`} style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Schrijftip</p>
            <div role="group" aria-labelledby={`${tekstId}-schrijftip-label`} style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
              {PROMPTS.map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setTekst(prev => prev ? `${prev}\n\n${p}\n` : `${p}\n`)}
                  style={{
                    fontSize: 12, border: '1px solid var(--border)', borderRadius: 8,
                    padding: '5px 12px', color: 'var(--text-3)', background: 'var(--bg-subtle)', cursor: 'pointer',
                  }}
                >
                  {p}
                </button>
              ))}
            </div>

            <Field label="Je aantekening" htmlFor={tekstId}>
              <Textarea
                autoFocus
                rows={6}
                value={tekst}
                onChange={e => setTekst(e.target.value)}
                placeholder="Begin te schrijven..."
                style={{ lineHeight: 1.7 }}
              />
            </Field>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
              <button
                onClick={() => { setNieuwTonen(false); setTekst(''); setStemming(null) }}
                style={{ fontSize: 13, border: '1px solid var(--border-strong)', borderRadius: 10, padding: '9px 16px', color: 'var(--text-2)', background: 'var(--bg-subtle)', cursor: 'pointer' }}
              >
                Annuleer
              </button>
              <button
                onClick={slaOp}
                disabled={!tekst.trim() || opslaan}
                style={{
                  fontSize: 13, borderRadius: 10, padding: '9px 18px',
                  color: 'var(--bg-app)', fontWeight: 700, border: 'none', cursor: tekst.trim() && !opslaan ? 'pointer' : 'default',
                  background: tekst.trim() ? 'linear-gradient(135deg, var(--mf-green) 0%, var(--mf-green-dark) 100%)' : 'var(--border-strong)',
                  opacity: opslaan ? 0.7 : 1,
                }}
              >
                {opslaan ? 'Opslaan...' : 'Opslaan'}
              </button>
            </div>
          </div>
        )}

        {/* 7-daags activiteitstrip */}
        {!laden && entries.length > 0 && !nieuwTonen && (() => {
          const vandaag = new Date()
          const vandaagStr = vandaag.toISOString().split('T')[0]
          const datumSet = new Set(entries.map(e => e.aangemaakt_op.split('T')[0]))
          const strip = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(vandaag)
            d.setDate(d.getDate() - (6 - i))
            const ds = d.toISOString().split('T')[0]
            return { ds, dag: d.toLocaleDateString('nl-NL', { weekday: 'short' }).slice(0, 2), actief: datumSet.has(ds), isVandaag: ds === vandaagStr }
          })
          const streak = (() => {
            let n = 0
            for (let i = 6; i >= 0; i--) {
              const d = new Date(vandaag); d.setDate(d.getDate() - i)
              if (datumSet.has(d.toISOString().split('T')[0])) n++; else break
            }
            return n
          })()
          return (
            <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: '14px 16px', marginBottom: 20, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ flex: 1, display: 'flex', gap: 6 }}>
                {strip.map(({ ds, dag, actief, isVandaag }) => (
                  <div key={ds} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{
                      width: '100%', height: 28, borderRadius: 6,
                      background: actief ? 'var(--mf-green)' : 'var(--bg-subtle)',
                      opacity: actief ? 0.85 : 0.5,
                      outline: isVandaag ? '2px solid var(--mf-green)' : 'none',
                      outlineOffset: 2,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {actief && <PenLine size={12} aria-label="Geschreven op deze dag" style={{ color: 'var(--bg-app)' }} />}
                    </div>
                    <span style={{ fontSize: 8, color: isVandaag ? 'var(--text-2)' : 'var(--text-4)', fontWeight: isVandaag ? 800 : 400, textTransform: 'capitalize' }}>{dag}</span>
                  </div>
                ))}
              </div>
              {streak > 0 && (
                <div style={{ textAlign: 'center', paddingLeft: 12, borderLeft: '1px solid var(--border)', flexShrink: 0 }}>
                  <p style={{ fontSize: 20, fontWeight: 900, color: 'var(--mf-green)', margin: 0, lineHeight: 1 }}>{streak}</p>
                  <p style={{ fontSize: 9, color: 'var(--text-4)', margin: '2px 0 0', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>daagse<br />streak</p>
                </div>
              )}
            </div>
          )
        })()}

        {/* Entries */}
        {laden ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
            <div className="mf-spinner" />
          </div>
        ) : entries.length === 0 ? (
          <VitaLeegScherm
            emotion="curious"
            titel="Je eerste paar regels"
            boodschap="Schrijf gewoon op wat er in je opkomt — een gedachte, je dag, waar je mee zit. Alleen jij leest dit terug."
          >
            <button
              onClick={() => setNieuwTonen(true)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'var(--mentaforce-primary)', color: 'var(--bg-app)',
                border: 'none', borderRadius: 12, padding: '11px 20px',
                fontSize: 14, fontWeight: 700, cursor: 'pointer',
                transition: 'transform 0.15s var(--ease), opacity 0.15s var(--ease)',
              }}
            >
              <Plus size={15} strokeWidth={2.5} aria-hidden />
              Begin nu
            </button>
          </VitaLeegScherm>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {entries.map(e => {
              const s = STEMMINGEN.find(m => m.waarde === e.stemming)
              const isOpen = uitgevouwen === e.id
              const preview = e.inhoud.length > 160 ? e.inhoud.slice(0, 160) + '...' : e.inhoud
              return (
                <div key={e.id} style={{ background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border)', padding: '18px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {s && <StemmingDot waarde={s.waarde} />}
                      <p style={{ fontSize: 12, color: 'var(--text-4)', textTransform: 'capitalize' }}>{formatDatum(e.aangemaakt_op)}</p>
                    </div>
                    <button
                      onClick={() => verwijder(e.id)}
                      className="mf-journal-del"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-4)', padding: 9, margin: -5, display: 'flex', borderRadius: 8, transition: 'color 0.15s var(--ease), background 0.15s var(--ease)' }}
                      aria-label="Aantekening verwijderen"
                      title="Verwijder"
                    >
                      <Trash2 size={14} aria-hidden />
                    </button>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                    {isOpen ? e.inhoud : preview}
                  </p>
                  {e.inhoud.length > 160 && (
                    <button
                      onClick={() => setUitgevouwen(isOpen ? null : e.id)}
                      style={{ fontSize: 12, marginTop: 8, fontWeight: 600, color: 'var(--mf-green)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    >
                      {isOpen ? 'Minder tonen' : 'Meer tonen'}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
