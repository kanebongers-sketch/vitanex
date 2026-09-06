'use client'

import { useRef, useState, type ReactNode, type CSSProperties } from 'react'
import Link from 'next/link'
import { ChevronRight, Sparkles, Camera } from 'lucide-react'
import { authFetch } from '@/lib/auth/auth-fetch'
import { supabase } from '@/lib/supabase/supabase'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { SheetRoot, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/Sheet'
import { pijlerDef, type PijlerKey } from '@/lib/pijlers/pijlers'

// Snel loggen vanaf de home: tik een pijler, log in twee tellen, score werkt bij.
// Elke pijler mapt op zijn minimale, eerlijke invoer — geen formulier-marathon.
// De volledige log-pagina blijft één tik weg voor wie meer kwijt wil.

interface SnelLogSheetProps {
  pijler: PijlerKey | null
  route: string
  onClose: () => void
  /** Aangeroepen na een geslaagde log, zodat de home de scores herlaadt. */
  onGelogd: () => void
}

function vandaagNL(): string {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Amsterdam' }).format(new Date())
}

/** De pijler bepaalt welk invoertype we tonen. */
const SOORT: Record<PijlerKey, 'gevoel' | 'stress' | 'slaap' | 'stappen' | 'voeding'> = {
  stemming: 'gevoel',
  energie: 'gevoel',
  stress: 'stress',
  slaap: 'slaap',
  beweging: 'stappen',
  voeding: 'voeding',
}

/** Maaltijdtype op basis van het tijdstip (NL-uur). */
function maaltijdNu(): string {
  const uur = parseInt(new Date().toLocaleString('nl-NL', { timeZone: 'Europe/Amsterdam', hour: '2-digit', hour12: false }), 10)
  if (uur < 11) return 'ontbijt'
  if (uur < 15) return 'lunch'
  if (uur < 21) return 'diner'
  return 'snack'
}

const TITEL: Record<PijlerKey, { titel: string; sub: string }> = {
  stemming: { titel: 'Hoe voel je je?', sub: 'Leg je stemming en energie van nu vast.' },
  energie: { titel: 'Hoe voel je je?', sub: 'Leg je stemming en energie van nu vast.' },
  stress: { titel: 'Hoeveel spanning?', sub: '1 is helemaal rustig, 10 is heel gespannen.' },
  slaap: { titel: 'Hoe lang sliep je?', sub: 'Het aantal uren van afgelopen nacht.' },
  beweging: { titel: 'Stappen vandaag', sub: 'Kies snel of vul je eigen aantal in.' },
  voeding: { titel: 'Voeding & water', sub: 'Log snel een maaltijd of tik een glas water erbij.' },
}

export function SnelLogSheet({ pijler, route, onClose, onGelogd }: SnelLogSheetProps) {
  const open = pijler !== null
  const kleur = pijler ? pijlerDef(pijler)?.kleur ?? 'var(--brand)' : 'var(--brand)'
  const soort = pijler ? SOORT[pijler] : null
  const kop = pijler ? TITEL[pijler] : null

  return (
    <SheetRoot open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <SheetContent side="bottom" style={{ maxWidth: 620, margin: '0 auto', gap: 18, paddingBottom: 'calc(24px + var(--safe-bottom, 0px))' }}>
        {kop && (
          <div>
            <SheetTitle>{kop.titel}</SheetTitle>
            <SheetDescription>{kop.sub}</SheetDescription>
          </div>
        )}

        {soort === 'gevoel' && <GevoelForm kleur={kleur} onKlaar={onGelogd} onClose={onClose} />}
        {soort === 'stress' && <StressForm kleur={kleur} onKlaar={onGelogd} onClose={onClose} />}
        {soort === 'slaap' && <SlaapForm kleur={kleur} onKlaar={onGelogd} onClose={onClose} />}
        {soort === 'stappen' && <StappenForm kleur={kleur} onKlaar={onGelogd} onClose={onClose} />}
        {soort === 'voeding' && <VoedingForm kleur={kleur} onKlaar={onGelogd} onClose={onClose} />}

        {pijler && (
          <Link href={route} onClick={onClose}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, alignSelf: 'flex-start', fontSize: 13, fontWeight: 700, color: 'var(--text-3)', textDecoration: 'none' }}>
            Volledig loggen <ChevronRight size={15} aria-hidden />
          </Link>
        )}
      </SheetContent>
    </SheetRoot>
  )
}

// ── Gedeelde bouwstenen ─────────────────────────────────────────────────────

interface FormProps { kleur: string; onKlaar: () => void; onClose: () => void }

/** Rij van keuze-chips (1..n). De gekozen chip krijgt de pijlerkleur. */
function KeuzeRij({ waarden, actief, kleur, onKies, labels }: {
  waarden: number[]; actief: number | null; kleur: string; onKies: (n: number) => void; labels?: Record<number, string>
}) {
  return (
    <div role="group" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {waarden.map((n) => {
        const aan = n === actief
        return (
          <button key={n} type="button" aria-pressed={aan} onClick={() => onKies(n)}
            style={{
              flex: '1 0 auto', minWidth: 44, minHeight: 44, padding: '8px 10px', borderRadius: 12, cursor: 'pointer',
              fontSize: labels ? 20 : 15, fontWeight: 800, lineHeight: 1,
              border: `1.5px solid ${aan ? kleur : 'var(--border)'}`,
              background: aan ? `color-mix(in srgb, ${kleur} 16%, transparent)` : 'var(--bg-app)',
              color: aan ? kleur : 'var(--text-2)',
              transition: 'border-color .15s var(--ease), background .15s var(--ease)',
            }}>
            {labels ? labels[n] : n}
          </button>
        )
      })}
    </div>
  )
}

function Veld({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <span style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
      {children}
    </div>
  )
}

/** Post + toast + afsluiten; geeft `bezig` terug voor de knop. */
function useOpslaan() {
  const { toast } = useToast()
  const [bezig, setBezig] = useState(false)
  const opslaan = async (url: string, body: unknown, klaar: () => void): Promise<boolean> => {
    setBezig(true)
    try {
      const res = await authFetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) {
        toast({ title: 'Opslaan mislukt', description: 'Probeer het zo nog eens.', variant: 'error' })
        return false
      }
      toast({ title: 'Opgeslagen', description: 'Je score is bijgewerkt.', variant: 'success' })
      klaar()
      return true
    } catch {
      toast({ title: 'Geen verbinding', description: 'Controleer je internet en probeer opnieuw.', variant: 'error' })
      return false
    } finally {
      setBezig(false)
    }
  }
  return { opslaan, bezig }
}

// ── Formulieren per pijler ──────────────────────────────────────────────────

const STEMMING_EMOJI: Record<number, string> = { 1: '😞', 2: '🙁', 3: '😐', 4: '🙂', 5: '😄' }

function GevoelForm({ kleur, onKlaar, onClose }: FormProps) {
  const { toast } = useToast()
  const { opslaan, bezig } = useOpslaan()
  const [stemming, setStemming] = useState<number | null>(null)
  const [energie, setEnergie] = useState<number | null>(null)

  async function bewaar() {
    if (stemming === null) { toast({ title: 'Kies je stemming', variant: 'warning' }); return }
    const body: { stemming: number; energie?: number } = { stemming }
    if (energie !== null) body.energie = energie
    if (await opslaan('/api/stemming', body, onKlaar)) onClose()
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <Veld label="Stemming">
        <KeuzeRij waarden={[1, 2, 3, 4, 5]} actief={stemming} kleur={kleur} onKies={setStemming} labels={STEMMING_EMOJI} />
      </Veld>
      <Veld label="Energie (optioneel)">
        <KeuzeRij waarden={[1, 2, 3, 4, 5]} actief={energie} kleur={kleur} onKies={setEnergie} />
      </Veld>
      <Button onClick={bewaar} loading={bezig} disabled={stemming === null} style={{ background: kleur, borderColor: kleur }}>Opslaan</Button>
    </div>
  )
}

function StressForm({ kleur, onKlaar, onClose }: FormProps) {
  const { toast } = useToast()
  const { opslaan, bezig } = useOpslaan()
  const [niveau, setNiveau] = useState<number | null>(null)

  async function bewaar() {
    if (niveau === null) { toast({ title: 'Kies een niveau', variant: 'warning' }); return }
    if (await opslaan('/api/stress', { stress_niveau: niveau }, onKlaar)) onClose()
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <KeuzeRij waarden={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]} actief={niveau} kleur={kleur} onKies={setNiveau} />
      <Button onClick={bewaar} loading={bezig} disabled={niveau === null} style={{ background: kleur, borderColor: kleur }}>Opslaan</Button>
    </div>
  )
}

function SlaapForm({ kleur, onKlaar, onClose }: FormProps) {
  const { opslaan, bezig } = useOpslaan()
  const [uren, setUren] = useState(7.5)
  const stap = (d: number) => setUren((u) => Math.max(0, Math.min(14, Math.round((u + d) * 2) / 2)))

  async function bewaar() {
    if (await opslaan('/api/slaap', { datum: vandaagNL(), uren_slaap: uren }, onKlaar)) onClose()
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
        <StepKnop label="Minder slaap" teken="−" onClick={() => stap(-0.5)} kleur={kleur} />
        <span style={{ minWidth: 96, textAlign: 'center', fontSize: 30, fontWeight: 900, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>
          {uren.toLocaleString('nl-NL', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}<span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-4)' }}> u</span>
        </span>
        <StepKnop label="Meer slaap" teken="+" onClick={() => stap(0.5)} kleur={kleur} />
      </div>
      <Button onClick={bewaar} loading={bezig} style={{ background: kleur, borderColor: kleur }}>Opslaan</Button>
    </div>
  )
}

function StepKnop({ teken, label, onClick, kleur }: { teken: string; label: string; onClick: () => void; kleur: string }) {
  return (
    <button type="button" aria-label={label} onClick={onClick}
      style={{ width: 48, height: 48, borderRadius: 999, border: `1.5px solid ${kleur}`, background: `color-mix(in srgb, ${kleur} 14%, transparent)`, color: kleur, fontSize: 24, fontWeight: 800, cursor: 'pointer', lineHeight: 1 }}>
      {teken}
    </button>
  )
}

function StappenForm({ kleur, onKlaar, onClose }: FormProps) {
  const { toast } = useToast()
  const { opslaan, bezig } = useOpslaan()
  const [aantal, setAantal] = useState<number | null>(null)
  const [eigen, setEigen] = useState('')
  const snel = [5000, 7500, 10000, 12500]

  async function bewaar() {
    const n = aantal ?? parseInt(eigen.replace(/\D/g, ''), 10)
    if (!Number.isFinite(n) || n <= 0) { toast({ title: 'Vul een aantal in', variant: 'warning' }); return }
    if (await opslaan('/api/stappen', { stappen: n }, onKlaar)) onClose()
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <KeuzeRij waarden={snel} actief={aantal} kleur={kleur}
        onKies={(n) => { setAantal(n); setEigen('') }}
        labels={Object.fromEntries(snel.map((n) => [n, `${(n / 1000).toLocaleString('nl-NL')}k`]))} />
      <input inputMode="numeric" placeholder="Eigen aantal, bijv. 8500" value={eigen}
        onChange={(e) => { setEigen(e.target.value); setAantal(null) }}
        style={{ height: 46, borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg-app)', color: 'var(--text-1)', padding: '0 14px', fontSize: 15 }} />
      <Button onClick={bewaar} loading={bezig} disabled={aantal === null && eigen.trim() === ''} style={{ background: kleur, borderColor: kleur }}>Opslaan</Button>
    </div>
  )
}

function VoedingForm({ kleur, onKlaar, onClose }: FormProps) {
  const { toast } = useToast()
  const { opslaan, bezig } = useOpslaan()
  const [wat, setWat] = useState('')
  const [kcal, setKcal] = useState('')
  const [eiwit, setEiwit] = useState('')
  const [schatBezig, setSchatBezig] = useState(false)
  const [fotoBezig, setFotoBezig] = useState(false)
  const [geschat, setGeschat] = useState<null | 'laag' | 'gemiddeld' | 'hoog'>(null)
  const fotoInput = useRef<HTMLInputElement>(null)

  const veldStijl: CSSProperties = { height: 46, borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg-app)', color: 'var(--text-1)', padding: '0 14px', fontSize: 15 }

  /** Vult de kcal/eiwit-velden met een schatting en markeert de betrouwbaarheid. */
  function toonSchatting(kcalNum: number, eiwitNum: number | undefined, betrouw: 'laag' | 'gemiddeld' | 'hoog' | undefined) {
    setKcal(String(Math.round(kcalNum)))
    if (typeof eiwitNum === 'number') setEiwit(String(Math.round(eiwitNum)))
    setGeschat(betrouw ?? 'gemiddeld')
  }

  async function schatMetVita() {
    const oms = wat.trim()
    if (oms === '') { toast({ title: 'Wat at je?', description: 'Typ eerst kort wat je at.', variant: 'warning' }); return }
    setSchatBezig(true)
    try {
      const res = await authFetch('/api/voeding/schat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ omschrijving: oms }) })
      const data = await res.json().catch(() => null) as { calorieen?: number; eiwitten_g?: number; betrouwbaarheid?: 'laag' | 'gemiddeld' | 'hoog'; error?: string } | null
      if (!res.ok || !data || typeof data.calorieen !== 'number') {
        toast({ title: 'Schatten lukte niet', description: data?.error ?? 'Vul de waarden zelf in.', variant: 'error' }); return
      }
      toonSchatting(data.calorieen, data.eiwitten_g, data.betrouwbaarheid)
    } catch {
      toast({ title: 'Geen verbinding', variant: 'error' })
    } finally {
      setSchatBezig(false)
    }
  }

  // Foto → Vita leest kcal/eiwit uit het beeld. Multipart mag géén JSON-Content-Type
  // hebben (browser zet de boundary), dus plain fetch met het Bearer-token — niet authFetch.
  async function analyseerFoto(file: File) {
    setFotoBezig(true)
    try {
      const tok = (await supabase.auth.getSession()).data.session?.access_token
      if (!tok) { toast({ title: 'Log opnieuw in', variant: 'error' }); return }
      const fd = new FormData()
      fd.append('foto', file)
      const res = await fetch('/api/voeding/analyseer', { method: 'POST', headers: { Authorization: `Bearer ${tok}` }, body: fd })
      const json = await res.json().catch(() => null) as { analyse?: { gerecht?: string; calorieen?: number; macros?: { eiwitten_g?: number }; betrouwbaarheid?: 'laag' | 'gemiddeld' | 'hoog' }; error?: string } | null
      const a = json?.analyse
      if (!res.ok || !a || typeof a.calorieen !== 'number') {
        toast({ title: 'Foto lezen lukte niet', description: json?.error ?? 'Probeer een duidelijkere foto.', variant: 'error' }); return
      }
      if (typeof a.gerecht === 'string' && a.gerecht.trim() !== '') setWat(a.gerecht.trim())
      toonSchatting(a.calorieen, a.macros?.eiwitten_g, a.betrouwbaarheid)
    } catch {
      toast({ title: 'Geen verbinding', variant: 'error' })
    } finally {
      setFotoBezig(false)
    }
  }

  function onFotoGekozen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) analyseerFoto(file)
    e.target.value = ''
  }

  async function bewaarMaaltijd() {
    const oms = wat.trim()
    if (oms === '') { toast({ title: 'Wat at je?', description: 'Vul kort in wat je at.', variant: 'warning' }); return }
    const kcalNum = parseInt(kcal.replace(/\D/g, ''), 10)
    const eiwitNum = parseInt(eiwit.replace(/\D/g, ''), 10)
    const body: Record<string, unknown> = { maaltijd_type: maaltijdNu(), omschrijving: oms, bron: 'snel' }
    if (Number.isFinite(kcalNum) && kcalNum > 0) body.calorieen = kcalNum
    if (Number.isFinite(eiwitNum) && eiwitNum > 0) body.eiwitten_g = eiwitNum
    if (await opslaan('/api/voeding', body, onKlaar)) onClose()
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <Veld label="Maaltijd loggen">
        <input value={wat} onChange={(e) => { setWat(e.target.value); setGeschat(null) }} placeholder="Wat at je? bijv. 2 boterhammen kaas" style={veldStijl} />
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={schatMetVita} disabled={schatBezig || fotoBezig || wat.trim() === ''}
            style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, minHeight: 42, borderRadius: 12, cursor: schatBezig || fotoBezig || wat.trim() === '' ? 'default' : 'pointer', fontSize: 13.5, fontWeight: 800, border: `1.5px solid ${kleur}`, background: 'transparent', color: kleur, opacity: schatBezig || fotoBezig || wat.trim() === '' ? 0.5 : 1 }}>
            <Sparkles size={15} aria-hidden /> {schatBezig ? 'Vita schat…' : 'Schat met Vita'}
          </button>
          <button type="button" onClick={() => fotoInput.current?.click()} disabled={schatBezig || fotoBezig} aria-label="Maak of kies een foto van je maaltijd"
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, minHeight: 42, padding: '0 14px', borderRadius: 12, cursor: schatBezig || fotoBezig ? 'default' : 'pointer', fontSize: 13.5, fontWeight: 800, border: `1.5px solid ${kleur}`, background: 'transparent', color: kleur, opacity: schatBezig || fotoBezig ? 0.5 : 1 }}>
            <Camera size={15} aria-hidden /> {fotoBezig ? 'Lezen…' : 'Foto'}
          </button>
        </div>
        <input ref={fotoInput} type="file" accept="image/*" capture="environment" onChange={onFotoGekozen} hidden />
        <div style={{ display: 'flex', gap: 10 }}>
          <input inputMode="numeric" value={kcal} onChange={(e) => setKcal(e.target.value)} placeholder="kcal" style={{ ...veldStijl, flex: 1, minWidth: 0 }} />
          <input inputMode="numeric" value={eiwit} onChange={(e) => setEiwit(e.target.value)} placeholder="eiwit (g)" style={{ ...veldStijl, flex: 1, minWidth: 0 }} />
        </div>
        {geschat && (
          <span style={{ fontSize: 12, color: 'var(--text-4)' }}>Geschat door Vita ({geschat} betrouwbaar) — pas gerust aan.</span>
        )}
        <Button onClick={bewaarMaaltijd} loading={bezig} disabled={wat.trim() === ''} style={{ background: kleur, borderColor: kleur }}>Maaltijd opslaan</Button>
      </Veld>

      <div aria-hidden style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-4)', fontSize: 12 }}>
        <span style={{ flex: 1, height: 1, background: 'var(--border)' }} /> of drink <span style={{ flex: 1, height: 1, background: 'var(--border)' }} />
      </div>

      <Veld label="Water">
        <WaterKnoppen kleur={kleur} onKlaar={onKlaar} />
      </Veld>
    </div>
  )
}

function WaterKnoppen({ kleur, onKlaar }: { kleur: string; onKlaar: () => void }) {
  const { toast } = useToast()
  const [bezig, setBezig] = useState(false)
  const [totaal, setTotaal] = useState<number | null>(null)

  async function voegToe(ml: number) {
    setBezig(true)
    try {
      const res = await authFetch('/api/water', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ml }) })
      if (!res.ok) { toast({ title: 'Opslaan mislukt', variant: 'error' }); return }
      const json = await res.json().catch(() => null) as { nieuw_totaal?: number } | null
      if (json && typeof json.nieuw_totaal === 'number') setTotaal(json.nieuw_totaal)
      onKlaar()
    } catch {
      toast({ title: 'Geen verbinding', variant: 'error' })
    } finally {
      setBezig(false)
    }
  }

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <div style={{ display: 'flex', gap: 10 }}>
        {[250, 500].map((ml) => (
          <button key={ml} type="button" disabled={bezig} onClick={() => voegToe(ml)}
            style={{ flex: 1, minHeight: 52, borderRadius: 14, border: `1.5px solid ${kleur}`, background: `color-mix(in srgb, ${kleur} 14%, transparent)`, color: kleur, fontSize: 16, fontWeight: 800, cursor: bezig ? 'default' : 'pointer' }}>
            +{ml} ml
          </button>
        ))}
      </div>
      {totaal !== null && (
        <p role="status" style={{ margin: 0, fontSize: 13, color: 'var(--text-3)', textAlign: 'center' }}>
          Vandaag: <strong style={{ color: 'var(--text-1)' }}>{(totaal / 1000).toLocaleString('nl-NL', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} l</strong> gedronken
        </p>
      )}
    </div>
  )
}
