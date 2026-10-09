'use client'

// /1/plan: je weekplan in zeven regels. Per dag: rust of training (naam, zwaar of
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
  minHeight: 44, padding: '0 12px', borderRadius: 10, fontSize: 15, fontFamily: 'inherit',
  color: 'var(--text-1)', background: 'var(--bg-subtle)', border: '1px solid var(--border-strong)',
}

export function PlanEditor() {
  const router = useRouter()
  const { toast } = useToast()
  const [regels, setRegels] = useState<PlanRegel[] | null>(null)
  const [opslaan, setOpslaan] = useState(false)

  const [laadFout, setLaadFout] = useState(false)

  // Mislukt het laden, dan tonen we bewust géén leeg plan: opslaan zou dan je
  // echte plan wissen.
  useEffect(() => {
    let actief = true
    void haalPlan().then((uit) => {
      if (!actief) return
      if (uit === 'uitgelogd') router.replace('/login?next=/1/plan')
      else if (uit === 'fout') setLaadFout(true)
      else setRegels(uit)
    })
    return () => { actief = false }
  }, [router])

  function wijzig(weekdag: number, deel: Partial<PlanRegel>) {
    setRegels((rs) => rs && rs.map((r) => (r.weekdag === weekdag ? { ...r, ...deel } : r)))
  }

  async function bewaar() {
    if (!regels) return
    const leeg = regels.find((r) => r.actief && r.soort.trim() === '')
    if (leeg) {
      toast({ title: 'Geef elke trainingsdag een naam.', description: 'Bijvoorbeeld "Benen" of "Hardlopen".', variant: 'warning' })
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
      router.push('/1')
    } catch {
      toast({ title: 'Geen verbinding. Je plan is niet opgeslagen.', variant: 'error' })
    } finally {
      setOpslaan(false)
    }
  }

  return (
    <VandaagKader
      rechts={
        <Link href="/1" className="mf-vandaag-link" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, color: 'var(--text-2)', textDecoration: 'none', minHeight: 40 }}>
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
        <div aria-busy="true" aria-label="Plan laden" style={{ display: 'grid', gap: 12 }}>
          {DAGEN.map((d) => <Skeleton key={d.weekdag} height={52} />)}
        </div>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); void bewaar() }} style={{ display: 'grid', gap: 32 }}>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {DAGEN.map((d) => {
              const r = regels.find((x) => x.weekdag === d.weekdag)
              if (!r) return null
              const id = `dag-${d.weekdag}`
              return (
                <li key={d.weekdag} style={{ padding: '16px 0', borderTop: '1px solid var(--border)', display: 'grid', gap: 12 }}>
                  <label htmlFor={id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, cursor: 'pointer', minHeight: 32 }}>
                    <span style={{ fontSize: 17, fontWeight: 600 }}>{d.naam}</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontSize: 14, color: r.actief ? 'var(--brand)' : 'var(--text-3)' }}>
                      {r.actief ? 'Training' : 'Rust'}
                      <input id={id} type="checkbox" checked={r.actief} onChange={(e) => wijzig(d.weekdag, { actief: e.target.checked })} style={{ width: 20, height: 20, accentColor: 'var(--brand)' }} />
                    </span>
                  </label>
                  {r.actief && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 8 }}>
                      <input aria-label={`Training op ${d.naam.toLowerCase()}`} placeholder="Bijv. Benen" maxLength={40} value={r.soort} onChange={(e) => wijzig(d.weekdag, { soort: e.target.value })} style={{ ...veld, gridColumn: '1 / -1' }} />
                      <select aria-label={`Zwaarte op ${d.naam.toLowerCase()}`} value={r.intensiteit} onChange={(e) => wijzig(d.weekdag, { intensiteit: e.target.value as Intensiteit })} style={veld}>
                        <option value="zwaar">Zwaar</option>
                        <option value="licht">Licht</option>
                      </select>
                      <input aria-label={`Tijd op ${d.naam.toLowerCase()} (optioneel)`} type="time" value={r.tijd} onChange={(e) => wijzig(d.weekdag, { tijd: e.target.value })} style={veld} />
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
          <Button type="submit" size="lg" loading={opslaan}>Plan opslaan</Button>
        </form>
      )}
    </VandaagKader>
  )
}
