'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useId, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  BookOpen,
  Check,
  Pencil,
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
import { supabase } from '@/lib/supabase/supabase'
import Navbar from '@/components/layout/Navbar'
import { authFetch } from '@/lib/auth/auth-fetch'
import { useToast } from '@/components/ui/Toast'
import { Field } from '@/components/ui/Field'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import {
  DialogRoot, DialogContent, DialogTitle, DialogDescription,
} from '@/components/ui/Dialog'
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

/** Lokale dag-sleutel (YYYY-MM-DD) — bewust lokaal, niet UTC: een aantekening
 *  om 00:30 hoort bij de dag waarop je 'm schreef. */
function dagKey(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dag = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${dag}`
}

/** Maandag (lokale tijd) van de week waarin `d` valt. */
function maandagVan(d: Date): Date {
  const kopie = new Date(d)
  kopie.setDate(kopie.getDate() - ((kopie.getDay() + 6) % 7))
  return kopie
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

/** 7-daagse schrijfstrip + streak, uit de al opgehaalde entries (max 50).
 *  Reikt de reeks tot aan de oudst geladen entry, dan kan ze in werkelijkheid
 *  langer zijn — dat tonen we eerlijk als "N+". */
function ActiviteitStrip({ entries }: { entries: Entry[] }) {
  const vandaag = new Date()
  const vandaagKey = dagKey(vandaag)
  const datumSet = new Set(entries.map(e => dagKey(new Date(e.aangemaakt_op))))
  const strip = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(vandaag)
    d.setDate(d.getDate() - (6 - i))
    const ds = dagKey(d)
    return {
      ds,
      dag: d.toLocaleDateString('nl-NL', { weekday: 'short' }).slice(0, 2),
      actief: datumSet.has(ds),
      isVandaag: ds === vandaagKey,
    }
  })

  let streak = 0
  const loper = new Date(vandaag)
  while (datumSet.has(dagKey(loper))) {
    streak++
    loper.setDate(loper.getDate() - 1)
  }
  const oudsteGeladen = entries.length > 0
    ? dagKey(new Date(entries[entries.length - 1].aangemaakt_op))
    : undefined
  const oudsteInStreak = new Date(vandaag)
  oudsteInStreak.setDate(oudsteInStreak.getDate() - (streak - 1))
  const afgekapt = streak > 0 && entries.length >= 50 && oudsteGeladen !== undefined
    && dagKey(oudsteInStreak) <= oudsteGeladen

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
          <p style={{ fontSize: 20, fontWeight: 900, color: 'var(--mf-green)', margin: 0, lineHeight: 1 }}>{afgekapt ? `${Math.min(streak, 30)}+` : streak}</p>
          <p style={{ fontSize: 9, color: 'var(--text-4)', margin: '2px 0 0', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>daagse<br />streak</p>
        </div>
      )}
    </div>
  )
}

interface EntryKaartProps {
  entry: Entry
  open: boolean
  onToggle: () => void
  onBewerk: () => void
  onVerwijderVraag: () => void
}

function EntryKaart({ entry, open, onToggle, onBewerk, onVerwijderVraag }: EntryKaartProps) {
  const preview = entry.inhoud.length > 160 ? entry.inhoud.slice(0, 160) + '...' : entry.inhoud
  const knopStijl = {
    background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-4)',
    padding: 9, display: 'flex', borderRadius: 8,
    transition: 'color 0.15s var(--ease), background 0.15s var(--ease)',
  } as const
  return (
    <article style={{ background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border)', padding: '18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {entry.stemming !== null && <StemmingDot waarde={entry.stemming} />}
          <p style={{ fontSize: 12, color: 'var(--text-4)', textTransform: 'capitalize' }}>{formatDatum(entry.aangemaakt_op)}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, margin: '-5px -5px -5px 0' }}>
          <button
            onClick={onBewerk}
            className="mf-journal-edit"
            style={knopStijl}
            aria-label="Bewerken"
            title="Bewerk"
          >
            <Pencil size={14} aria-hidden />
          </button>
          <button
            onClick={onVerwijderVraag}
            className="mf-journal-del"
            style={knopStijl}
            aria-label="Aantekening verwijderen"
            title="Verwijder"
          >
            <Trash2 size={14} aria-hidden />
          </button>
        </div>
      </div>
      <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
        {open ? entry.inhoud : preview}
      </p>
      {entry.inhoud.length > 160 && (
        <button
          onClick={onToggle}
          className="mf-journal-meer"
          style={{ fontSize: 12, marginTop: 8, fontWeight: 600, color: 'var(--mf-green)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          {open ? 'Minder tonen' : 'Meer tonen'}
        </button>
      )}
    </article>
  )
}

export default function JournalPagina() {
  const router = useRouter()
  const { toast } = useToast()
  const tekstId = useId()
  const veldRef = useRef<HTMLTextAreaElement | null>(null)
  const schrijfkaartRef = useRef<HTMLElement | null>(null)
  const [entries, setEntries] = useState<Entry[]>([])
  const [laden, setLaden] = useState(true)
  const [tekst, setTekst] = useState('')
  const [stemming, setStemming] = useState<number | null>(null)
  const [opslaan, setOpslaan] = useState(false)
  // Onderscheid nieuw vs. bewerkt: een edit is geen nieuwe aantekening en telt
  // dus niet mee in de consistentie-regel ("je 3e aantekening deze week").
  const [opgeslagen, setOpgeslagen] = useState<'nieuw' | 'bewerkt' | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  // Entry die in de schrijfkaart wordt bewerkt; het lopende concept parkeren we
  // zolang in een ref, zodat annuleren nooit onverwacht tekst weggooit.
  const [bewerkId, setBewerkId] = useState<string | null>(null)
  const conceptRef = useRef<{ tekst: string; stemming: number | null }>({ tekst: '', stemming: null })
  const [uitgevouwen, setUitgevouwen] = useState<string | null>(null)
  const [aiPrompt, setAiPrompt] = useState<string | null>(null)
  const [aiPromptLaden, setAiPromptLaden] = useState(false)
  // Aantekening die om verwijder-bevestiging vraagt (toegankelijke dialog i.p.v. confirm()).
  const [verwijderId, setVerwijderId] = useState<string | null>(null)

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

  // Direct kunnen typen: focus het veld zodra de pagina er staat — alleen op
  // brede schermen, zodat op mobiel het toetsenbord niet ongevraagd opent.
  useEffect(() => {
    if (laden) return
    if (window.innerWidth >= 768) veldRef.current?.focus({ preventScroll: true })
  }, [laden])

  function wijzigTekst(waarde: string) {
    // Nieuwe wijziging → 'Opgeslagen'-staat is niet meer waar.
    setOpgeslagen(null)
    setTekst(waarde)
  }

  /** Terug naar nieuw-schrijven, met het geparkeerde concept weer in het veld. */
  function herstelConcept() {
    setBewerkId(null)
    setTekst(conceptRef.current.tekst)
    setStemming(conceptRef.current.stemming)
    conceptRef.current = { tekst: '', stemming: null }
  }

  function startBewerken(entry: Entry) {
    // Alleen bij de overgang vanaf nieuw-schrijven het concept parkeren; wissel
    // je van de ene naar de andere entry, dan blijft het oorspronkelijke concept staan.
    if (!bewerkId) conceptRef.current = { tekst, stemming }
    setBewerkId(entry.id)
    setTekst(entry.inhoud)
    setStemming(entry.stemming)
    setOpgeslagen(null)
    const rustig = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    schrijfkaartRef.current?.scrollIntoView({ behavior: rustig ? 'auto' : 'smooth', block: 'start' })
    veldRef.current?.focus({ preventScroll: true })
  }

  function annuleerBewerken() {
    // Bewust geen confirm-dialog: annuleren ís de expliciete keuze om de
    // wijziging los te laten. Het eerdere concept komt gewoon terug.
    herstelConcept()
    setOpgeslagen(null)
    veldRef.current?.focus({ preventScroll: true })
  }

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
      setOpgeslagen('nieuw')
      vitaEvent('data_logged', { kind: 'journal' })
    } else {
      toast({ title: 'Opslaan mislukt', description: 'Je aantekening kon niet worden opgeslagen. Probeer het opnieuw — je tekst staat er nog.', variant: 'error' })
    }
    setOpslaan(false)
  }

  async function slaWijzigingOp() {
    if (!tekst.trim() || !userId || !bewerkId) return
    const origineel = entries.find(e => e.id === bewerkId)
    if (!origineel) { herstelConcept(); return }
    const inhoud = tekst.trim()
    setOpslaan(true)
    // Optimistisch: de kaart toont de wijziging direct; bij een fout rollen we terug.
    setEntries(prev => prev.map(e => (e.id === bewerkId ? { ...e, inhoud, stemming } : e)))
    const { error } = await supabase
      .from('journal_entries')
      .update({ inhoud, stemming })
      .eq('id', bewerkId)
      .eq('user_id', userId)
    if (!error) {
      herstelConcept()
      setOpgeslagen('bewerkt')
    } else {
      setEntries(prev => prev.map(e => (e.id === origineel.id ? origineel : e)))
      toast({ title: 'Opslaan mislukt', description: 'Je wijziging kon niet worden opgeslagen. Probeer het opnieuw — je tekst staat er nog.', variant: 'error' })
    }
    setOpslaan(false)
  }

  async function verwijder(id: string) {
    const { error } = await supabase.from('journal_entries').delete().eq('id', id)
    if (!error) {
      setEntries(prev => prev.filter(e => e.id !== id))
      // Werd precies deze entry bewerkt? Dan terug naar nieuw-schrijven.
      if (id === bewerkId) herstelConcept()
    } else {
      toast({ title: 'Verwijderen mislukt', description: 'De aantekening kon niet worden verwijderd.', variant: 'error' })
    }
    setVerwijderId(null)
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

  // Schrijf-consistentie uit echte, al opgehaalde data: aantal entries in de
  // huidige week (ma t/m nu, lokale tijd). Geen aparte fetch, geen schatting.
  const maandagKey = dagKey(maandagVan(new Date()))
  const vandaagKey = dagKey(new Date())
  const dezeWeekAantal = entries.filter(e => dagKey(new Date(e.aangemaakt_op)) >= maandagKey).length
  // Een bewerking is geen nieuwe aantekening: geen weektelling, gewoon neutraal.
  const bevestiging = opgeslagen === 'bewerkt'
    ? 'Opgeslagen.'
    : dezeWeekAantal >= 2
      ? `Opgeslagen — je ${dezeWeekAantal}e aantekening deze week.`
      : 'Opgeslagen — alleen zichtbaar voor jou.'

  // Historie scanbaar per dag/week: vandaag / eerder deze week / eerder.
  const groepen = [
    { label: 'Vandaag', items: entries.filter(e => dagKey(new Date(e.aangemaakt_op)) === vandaagKey) },
    { label: 'Eerder deze week', items: entries.filter(e => { const k = dagKey(new Date(e.aangemaakt_op)); return k >= maandagKey && k !== vandaagKey }) },
    { label: 'Eerder', items: entries.filter(e => dagKey(new Date(e.aangemaakt_op)) < maandagKey) },
  ].filter(g => g.items.length > 0)

  return (
    <div className="mf-mesh-bg" style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <style>{`
        .mf-journal-del:hover { color: var(--mf-red); background: var(--mf-red-light); }
        .mf-journal-edit:hover { color: var(--mentaforce-primary); background: var(--bg-subtle); }
        .mf-journal-del:focus-visible,
        .mf-journal-edit:focus-visible { outline: 2px solid var(--mentaforce-primary); outline-offset: 2px; }
        .mf-journal-annuleer { transition: color 0.15s var(--ease); }
        .mf-journal-annuleer:hover { color: var(--text-1); }
        .mf-journal-annuleer:focus-visible { outline: 2px solid var(--mentaforce-primary); outline-offset: 2px; border-radius: 8px; }
        .mf-journal-chip { transition: border-color 0.15s var(--ease), color 0.15s var(--ease), background 0.15s var(--ease); }
        .mf-journal-chip:hover { border-color: var(--border-strong); color: var(--text-2); }
        .mf-journal-chip:focus-visible,
        .mf-journal-meer:focus-visible,
        .mf-journal-ai:focus-visible { outline: 2px solid var(--mentaforce-primary); outline-offset: 2px; border-radius: 8px; }
      `}</style>
      <main style={{ padding: '24px 20px 88px', maxWidth: 800, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
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

        {/* Schrijven vandaag — het hoofdmoment, altijd open en klaar. Dezelfde
            kaart is ook de bewerkplek: rustiger dan een tweede formulier.
            scrollMarginTop houdt de kaart onder de vaste mobiele topbar. */}
        <section
          ref={schrijfkaartRef}
          aria-label={bewerkId ? 'Aantekening bewerken' : 'Nieuwe aantekening'}
          style={{ background: 'var(--bg-card)', borderRadius: 20, border: '1px solid var(--border)', padding: '24px', marginBottom: 20, scrollMarginTop: 64 }}
        >

          <Field label={bewerkId ? 'Aantekening bewerken' : 'Vandaag'} htmlFor={tekstId} hint="Eén of twee zinnen is genoeg — het hoeft nergens heen.">
            <Textarea
              ref={veldRef}
              rows={5}
              value={tekst}
              onChange={e => wijzigTekst(e.target.value)}
              placeholder="Begin te schrijven..."
              style={{ lineHeight: 1.7 }}
            />
          </Field>

          {/* Stemming (optioneel) */}
          <p id={`${tekstId}-stemming-label`} style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', margin: '18px 0 10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Hoe voel je je?</p>
          <div role="group" aria-labelledby={`${tekstId}-stemming-label`} style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {STEMMINGEN.map(s => {
              const actief = stemming === s.waarde
              const Icoon = s.icoon
              return (
                <button
                  key={s.waarde}
                  type="button"
                  aria-pressed={actief}
                  onClick={() => setStemming(actief ? null : s.waarde)}
                  className="mf-journal-chip"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '7px 14px', borderRadius: 100, border: `2px solid ${actief ? s.kleur : 'var(--border)'}`,
                    background: actief ? s.bg : 'var(--bg-subtle)', cursor: 'pointer',
                    fontSize: 12, fontWeight: 700, color: actief ? s.kleur : 'var(--text-3)',
                  }}
                >
                  <Icoon size={14} aria-hidden />
                  {s.label}
                </button>
              )
            })}
          </div>

          {/* Schrijftips — rustige hulp, onder het hoofdmoment */}
          <p id={`${tekstId}-schrijftip-label`} style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', margin: '18px 0 8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Even geen idee?</p>
          <div role="group" aria-labelledby={`${tekstId}-schrijftip-label`} style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            <button
              type="button"
              onClick={genereerPrompt}
              disabled={aiPromptLaden}
              className="mf-journal-chip"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                fontSize: 12, fontWeight: 600, border: '1px solid var(--border)', borderRadius: 8,
                padding: '5px 12px', color: 'var(--mf-purple)', background: 'var(--mf-purple-light)',
                cursor: aiPromptLaden ? 'default' : 'pointer', opacity: aiPromptLaden ? 0.5 : 1,
              }}
            >
              {aiPrompt ? <RefreshCw size={12} aria-hidden /> : <Sparkles size={13} aria-hidden />}
              {aiPromptLaden ? 'Laden...' : aiPrompt ? 'Nieuwe AI-vraag' : 'AI-reflectievraag'}
            </button>
            {PROMPTS.map(p => (
              <button
                key={p}
                type="button"
                onClick={() => wijzigTekst(tekst ? `${tekst}\n\n${p}\n` : `${p}\n`)}
                className="mf-journal-chip"
                style={{
                  fontSize: 12, border: '1px solid var(--border)', borderRadius: 8,
                  padding: '5px 12px', color: 'var(--text-3)', background: 'var(--bg-subtle)', cursor: 'pointer',
                }}
              >
                {p}
              </button>
            ))}
          </div>
          {aiPrompt && (
            <button
              type="button"
              onClick={() => wijzigTekst(tekst ? `${tekst}\n\n${aiPrompt}\n` : `${aiPrompt}\n`)}
              className="mf-journal-ai mf-fade-in"
              style={{ display: 'block', fontSize: 13, marginTop: 10, color: 'var(--mf-purple)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left', lineHeight: 1.5, fontStyle: 'italic' }}
            >
              &ldquo;{aiPrompt}&rdquo; →
            </button>
          )}

          {/* Opslaan + kalm opslagmoment. De bevestigingsregel deelt de rij met
              de knop (vaste hoogte) → geen layout-shift. */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 20 }}>
            <div aria-live="polite" style={{ flex: 1, minHeight: 20, display: 'flex', alignItems: 'center' }}>
              {opgeslagen !== null && (
                <span className="mf-fade-in" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-2)' }}>
                  <Check size={14} aria-hidden style={{ color: 'var(--mentaforce-primary)', flexShrink: 0 }} />
                  {bevestiging}
                </span>
              )}
            </div>
            {bewerkId !== null && (
              <button
                type="button"
                onClick={annuleerBewerken}
                disabled={opslaan}
                className="mf-journal-annuleer"
                style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-3)', background: 'none', border: 'none', cursor: opslaan ? 'default' : 'pointer', padding: '4px 8px', opacity: opslaan ? 0.5 : 1 }}
              >
                Annuleren
              </button>
            )}
            <Button
              onClick={bewerkId !== null ? slaWijzigingOp : slaOp}
              loading={opslaan}
              disabled={!tekst.trim() || opslaan}
            >
              {opslaan ? 'Opslaan...' : bewerkId !== null ? 'Wijzigingen opslaan' : 'Opslaan'}
            </Button>
          </div>
        </section>

        {/* Historie — rustig onder het schrijfmoment */}
        {laden ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
            <div className="mf-spinner" />
          </div>
        ) : entries.length === 0 ? (
          <VitaLeegScherm
            emotion="curious"
            titel="Je eerste paar regels"
            boodschap="Begin hierboven met wat er nu in je opkomt — een gedachte, je dag, waar je mee zit. Alleen jij leest dit terug."
          />
        ) : (
          <>
            <ActiviteitStrip entries={entries} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {groepen.map(groep => (
                <section key={groep.label} aria-label={groep.label}>
                  <h2 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 10px 2px' }}>
                    {groep.label}
                  </h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {groep.items.map(e => (
                      <EntryKaart
                        key={e.id}
                        entry={e}
                        open={uitgevouwen === e.id}
                        onToggle={() => setUitgevouwen(uitgevouwen === e.id ? null : e.id)}
                        onBewerk={() => startBewerken(e)}
                        onVerwijderVraag={() => setVerwijderId(e.id)}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </>
        )}
      </main>

      {/* Verwijder-bevestiging — toegankelijke dialog i.p.v. native confirm() */}
      <DialogRoot open={!!verwijderId} onOpenChange={(open) => { if (!open) setVerwijderId(null) }}>
        <DialogContent>
          <DialogTitle>Aantekening verwijderen?</DialogTitle>
          <DialogDescription>Dit kan niet ongedaan worden gemaakt.</DialogDescription>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
            <Button variant="secondary" onClick={() => setVerwijderId(null)}>
              Behouden
            </Button>
            <Button variant="danger" onClick={() => { if (verwijderId) verwijder(verwijderId) }}>
              Verwijderen
            </Button>
          </div>
        </DialogContent>
      </DialogRoot>
    </div>
  )
}
