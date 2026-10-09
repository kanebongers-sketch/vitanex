'use client'

// /vandaag/plan: je weekplan in zeven regels. Per dag: rust of training (naam, zwaar of
// licht, optioneel een tijd). De kaart buigt alleen mee met wat hier staat.

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { authFetch } from '@/lib/auth/auth-fetch'
import { useToast } from '@/components/ui/Toast'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import type { Intensiteit } from '@/lib/vandaag/types'
import { VandaagKader } from './VandaagKader'

interface PlanRegel {
  weekdag: number
  actief: boolean
  soort: string
  intensiteit: Intensiteit
  tijd: string
}

// Maandag eerst, zoals een Nederlandse week; weekdag 0 = zondag (getUTCDay).
const DAGEN: ReadonlyArray<{ weekdag: number; naam: string }> = [
  { weekdag: 1, naam: 'Maandag' }, { weekdag: 2, naam: 'Dinsdag' }, { weekdag: 3, naam: 'Woensdag' },
  { weekdag: 4, naam: 'Donderdag' }, { weekdag: 5, naam: 'Vrijdag' }, { weekdag: 6, naam: 'Zaterdag' },
  { weekdag: 0, naam: 'Zondag' },
]

function leegPlan(): PlanRegel[] {
  return DAGEN.map((d) => ({ weekdag: d.weekdag, actief: false, soort: '', intensiteit: 'zwaar', tijd: '' }))
}

interface OpgeslagenDag { weekdag: number; soort: string; intensiteit: Intensiteit; tijd: string | null }

async function haalPlan(): Promise<PlanRegel[] | 'uitgelogd' | 'fout'> {
  try {
    const res = await authFetch('/api/v1/plan')
    if (res.status === 401) return 'uitgelogd'
    if (!res.ok) return 'fout'
    const { dagen } = (await res.json()) as { dagen: OpgeslagenDag[] }
    return leegPlan().map((r) => {
      const d = dagen.find((x) => x.weekdag === r.weekdag)
      return d ? { ...r, actief: true, soort: d.soort, intensiteit: d.intensiteit, tijd: d.tijd ?? '' } : r
    })
  } catch {
    return 'fout'
  }
}

const veld: React.CSSProperties = {
  minHeight: 44, padding: '0 12px', borderRadius: 10, fontSize: 15, fontFamily: 'inherit', width: '100%',
  color: 'var(--text-1)', background: 'var(--bg-subtle)', border: '1px solid var(--border-strong)',
  // Anders tekent de browser het klok-icoon en de keuzelijst licht: onzichtbaar op navy.
  colorScheme: 'dark',
}

const veldLabel: React.CSSProperties = { display: 'grid', gap: 6, fontSize: 13, color: 'var(--text-3)' }

interface DagRegelProps {
  dag: { weekdag: number; naam: string }
  regel: PlanRegel
  fout: boolean
  onWijzig: (deel: Partial<PlanRegel>) => void
}

function DagRegel({ dag, regel: r, fout, onWijzig }: DagRegelProps) {
  const id = `dag-${dag.weekdag}`
  const naam = dag.naam.toLowerCase()
  return (
    <li style={{ padding: '16px 0', borderTop: '1px solid var(--border)', display: 'grid', gap: 12 }}>
      <label htmlFor={id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, cursor: 'pointer', minHeight: 32 }}>
        <span style={{ fontSize: 17, fontWeight: 600 }}>{dag.naam}</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontSize: 14, color: r.actief ? 'var(--brand)' : 'var(--text-3)' }}>
          <span aria-hidden>{r.actief ? 'Training' : 'Rust'}</span>
          <input id={id} type="checkbox" role="switch" aria-label={`Training op ${naam}`} checked={r.actief} onChange={(e) => onWijzig({ actief: e.target.checked })} style={{ width: 20, height: 20, accentColor: 'var(--brand)' }} />
        </span>
      </label>
      {r.actief && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 10 }}>
          <label style={{ ...veldLabel, gridColumn: '1 / -1' }}>
            Wat train je
            <input
              id={`soort-${dag.weekdag}`} placeholder="Bijv. Benen" maxLength={40} value={r.soort}
              aria-invalid={fout || undefined} aria-describedby={fout ? `fout-${dag.weekdag}` : undefined}
              onChange={(e) => onWijzig({ soort: e.target.value })}
              style={{ ...veld, borderColor: fout ? 'var(--text-1)' : 'var(--border-strong)' }}
            />
          </label>
          {fout && (
            <p id={`fout-${dag.weekdag}`} style={{ gridColumn: '1 / -1', margin: 0, fontSize: 13, color: 'var(--text-1)' }}>
              Geef deze trainingsdag een naam, bijvoorbeeld &quot;Benen&quot;.
            </p>
          )}
          <label style={veldLabel}>
            Zwaarte
            <select value={r.intensiteit} onChange={(e) => onWijzig({ intensiteit: e.target.value as Intensiteit })} style={veld}>
              <option value="zwaar">Zwaar</option>
              <option value="licht">Licht</option>
            </select>
          </label>
          <label style={veldLabel}>
            Tijd (optioneel)
            <input type="time" value={r.tijd} onChange={(e) => onWijzig({ tijd: e.target.value })} style={veld} />
          </label>
        </div>
      )}
    </li>
  )
}

export function PlanEditor() {
  const router = useRouter()
  const { toast } = useToast()
  const [regels, setRegels] = useState<PlanRegel[] | null>(null)
  const [opslaan, setOpslaan] = useState(false)
  const [fouten, setFouten] = useState<ReadonlySet<number>>(new Set())

  const [laadFout, setLaadFout] = useState(false)

  // Mislukt het laden, dan tonen we bewust géén leeg plan: opslaan zou dan je
  // echte plan wissen.
  useEffect(() => {
    let actief = true
    void haalPlan().then((uit) => {
      if (!actief) return
      if (uit === 'uitgelogd') router.replace('/login?next=/vandaag/plan')
      else if (uit === 'fout') setLaadFout(true)
      else setRegels(uit)
    })
    return () => { actief = false }
  }, [router])

  function wijzig(weekdag: number, deel: Partial<PlanRegel>) {
    setRegels((rs) => rs && rs.map((r) => (r.weekdag === weekdag ? { ...r, ...deel } : r)))
    if (deel.soort?.trim() || deel.actief === false) {
      setFouten((f) => (f.has(weekdag) ? new Set([...f].filter((w) => w !== weekdag)) : f))
    }
  }

  async function bewaar() {
    if (!regels) return
    const leeg = DAGEN.map((d) => regels.find((r) => r.weekdag === d.weekdag))
      .filter((r): r is PlanRegel => !!r && r.actief && r.soort.trim() === '')
    setFouten(new Set(leeg.map((r) => r.weekdag)))
    if (leeg.length > 0) {
      requestAnimationFrame(() => document.getElementById(`soort-${leeg[0].weekdag}`)?.focus())
      return
    }
    setOpslaan(true)
    try {
      const dagen = regels.filter((r) => r.actief).map((r) => ({
        weekdag: r.weekdag, soort: r.soort.trim(), intensiteit: r.intensiteit, tijd: r.tijd || null,
      }))
      const res = await authFetch('/api/v1/plan', { method: 'PUT', body: JSON.stringify({ dagen }) })
      const body: unknown = await res.json().catch(() => null)
      if (!res.ok) {
        const fout = body && typeof body === 'object' && 'fout' in body && typeof body.fout === 'string' ? body.fout : 'Opslaan lukte niet.'
        toast({ title: fout, variant: 'error' })
        return
      }
      toast({ title: 'Plan opgeslagen.', variant: 'success' })
      router.push('/vandaag')
    } catch {
      toast({ title: 'Geen verbinding. Je plan is niet opgeslagen.', variant: 'error' })
    } finally {
      setOpslaan(false)
    }
  }

  return (
    <VandaagKader
      rechts={
        <Link href="/vandaag" className="mf-vandaag-link" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, color: 'var(--text-2)', textDecoration: 'none', minHeight: 40 }}>
          <ArrowLeft size={16} aria-hidden /> Vandaag
        </Link>
      }
    >
      <h1 style={{ margin: 0, fontSize: 'clamp(30px, 7vw, 40px)', lineHeight: 1.1, letterSpacing: '-0.02em', fontWeight: 600 }}>Je weekplan</h1>
      <p style={{ margin: '12px 0 32px', fontSize: 15, color: 'var(--text-2)', lineHeight: 1.5 }}>
        Zet aan op welke dagen je traint. De Vandaag-kaart past je training aan als je slecht sliep of laag zit — nooit andersom.
      </p>

      {laadFout ? (
        <p role="alert" style={{ margin: 0, fontSize: 16, color: 'var(--text-1)' }}>
          Je plan kon niet worden geladen. Ververs de pagina om het opnieuw te proberen.
        </p>
      ) : !regels ? (
        <div role="status" aria-busy="true" style={{ display: 'grid', gap: 12 }}>
          <span className="sr-only">Je plan wordt geladen…</span>
          {DAGEN.map((d) => <Skeleton key={d.weekdag} height={52} />)}
        </div>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); void bewaar() }} style={{ display: 'grid', gap: 32 }}>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {DAGEN.map((d) => {
              const r = regels.find((x) => x.weekdag === d.weekdag)
              return r ? (
                <DagRegel key={d.weekdag} dag={d} regel={r} fout={fouten.has(d.weekdag)} onWijzig={(deel) => wijzig(d.weekdag, deel)} />
              ) : null
            })}
          </ul>
          <Button type="submit" size="lg" loading={opslaan}>Plan opslaan</Button>
        </form>
      )}
    </VandaagKader>
  )
}
