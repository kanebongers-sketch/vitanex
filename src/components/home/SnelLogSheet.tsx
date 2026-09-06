'use client'

import { useState, type ReactNode } from 'react'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { authFetch } from '@/lib/auth/auth-fetch'
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
const SOORT: Record<PijlerKey, 'gevoel' | 'stress' | 'slaap' | 'stappen' | 'water'> = {
  stemming: 'gevoel',
  energie: 'gevoel',
  stress: 'stress',
  slaap: 'slaap',
  beweging: 'stappen',
  voeding: 'water',
}

const TITEL: Record<PijlerKey, { titel: string; sub: string }> = {
  stemming: { titel: 'Hoe voel je je?', sub: 'Leg je stemming en energie van nu vast.' },
  energie: { titel: 'Hoe voel je je?', sub: 'Leg je stemming en energie van nu vast.' },
  stress: { titel: 'Hoeveel spanning?', sub: '1 is helemaal rustig, 10 is heel gespannen.' },
  slaap: { titel: 'Hoe lang sliep je?', sub: 'Het aantal uren van afgelopen nacht.' },
  beweging: { titel: 'Stappen vandaag', sub: 'Kies snel of vul je eigen aantal in.' },
  voeding: { titel: 'Water bijhouden', sub: 'Tik een glas of beker erbij.' },
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
        {soort === 'water' && <WaterForm kleur={kleur} onKlaar={onGelogd} />}

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

function WaterForm({ kleur, onKlaar }: { kleur: string; onKlaar: () => void }) {
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
    <div style={{ display: 'grid', gap: 14 }}>
      <div style={{ display: 'flex', gap: 10 }}>
        {[250, 500].map((ml) => (
          <button key={ml} type="button" disabled={bezig} onClick={() => voegToe(ml)}
            style={{ flex: 1, minHeight: 56, borderRadius: 14, border: `1.5px solid ${kleur}`, background: `color-mix(in srgb, ${kleur} 14%, transparent)`, color: kleur, fontSize: 16, fontWeight: 800, cursor: bezig ? 'default' : 'pointer' }}>
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
