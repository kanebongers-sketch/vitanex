'use client'

export const dynamic = 'force-dynamic'

import { useCallback, useEffect, useState, type CSSProperties } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/supabase'
import Navbar from '@/components/layout/Navbar'
import { ArrowLeft, Check, HeartPulse } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'

type CardioRij = {
  id: string
  datum: string
  soort: string
  duur_minuten: number | null
  afstand_meter: number | null
  gem_hartslag: number | null
}

const SOORTEN = ['Hardlopen', 'Fietsen', 'Roeien', 'Wandelen', 'Zwemmen', 'Overig']

export default function CardioPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [recent, setRecent] = useState<CardioRij[]>([])
  const [soort, setSoort] = useState('Hardlopen')
  const [duur, setDuur] = useState('')
  const [afstandKm, setAfstandKm] = useState('')
  const [hartslag, setHartslag] = useState('')
  const [rpe, setRpe] = useState('')
  const [opslaan, setOpslaan] = useState(false)

  const laad = useCallback((): Promise<void> => {
    return supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/login'); return }
      return supabase
        .from('cardio_sessies')
        .select('id, datum, soort, duur_minuten, afstand_meter, gem_hartslag')
        .order('datum', { ascending: false })
        .limit(20)
        .then(({ data: rows }) => { setRecent((rows as CardioRij[] | null) ?? []) })
    })
  }, [router])

  useEffect(() => { void laad() }, [laad])

  const bewaar = async () => {
    if (opslaan) return
    setOpslaan(true)
    const token = (await supabase.auth.getSession()).data.session?.access_token
    if (!token) { setOpslaan(false); return }
    const getal = (s: string) => (s.trim() === '' ? null : Number(s))
    const km = getal(afstandKm)
    const res = await fetch('/api/sport/cardio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        soort,
        duurMinuten: getal(duur),
        afstandMeter: km !== null && Number.isFinite(km) ? Math.round(km * 1000) : null,
        gemHartslag: getal(hartslag),
        rpe: getal(rpe),
      }),
    })
    setOpslaan(false)
    if (res.ok) {
      toast({ title: 'Cardio gelogd', variant: 'success' })
      setDuur(''); setAfstandKm(''); setHartslag(''); setRpe('')
      void laad()
    } else {
      toast({ title: 'Opslaan mislukt', variant: 'error' })
    }
  }

  return (
    <div className="mf-mesh-bg" style={{ background: 'var(--bg-app)', minHeight: '100vh' }}>
      <Navbar />
      <main style={{ maxWidth: 640, margin: '0 auto', padding: '20px 16px 60px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <button type="button" aria-label="Terug" onClick={() => router.push('/sport')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 0, minWidth: 44, minHeight: 44 }}><ArrowLeft size={22} /></button>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-1)', margin: 0 }}>Cardio loggen</h1>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 18, padding: 16, marginBottom: 24 }}>
          <div role="group" aria-label="Soort cardio" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
            {SOORTEN.map((s) => (
              <button key={s} type="button" onClick={() => setSoort(s)} aria-pressed={soort === s}
                style={{ padding: '7px 13px', borderRadius: 999, border: `1px solid ${soort === s ? 'var(--mentaforce-primary)' : 'var(--border)'}`, background: soort === s ? 'var(--mentaforce-primary)' : 'transparent', color: soort === s ? 'var(--bg-app)' : 'var(--text-3)', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>
                {s}
              </button>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            <VeldNum label="Duur (min)" value={duur} onChange={setDuur} />
            <VeldNum label="Afstand (km)" value={afstandKm} onChange={setAfstandKm} />
            <VeldNum label="Gem. hartslag" value={hartslag} onChange={setHartslag} />
            <VeldNum label="RPE (1-10)" value={rpe} onChange={setRpe} />
          </div>
          <button type="button" onClick={() => void bewaar()} disabled={opslaan}
            style={{ marginTop: 14, width: '100%', height: 48, borderRadius: 12, border: 'none', background: 'var(--mentaforce-primary)', color: 'var(--bg-app)', fontSize: 15, fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: opslaan ? 0.6 : 1 }}>
            <Check size={18} /> {opslaan ? 'Opslaan…' : 'Cardio loggen'}
          </button>
          <p style={{ fontSize: 11, color: 'var(--text-4)', margin: '10px 2px 0' }}>Later koppelbaar met Apple Health, Google Health en Strava.</p>
        </div>

        <p style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 8px' }}>Recent</p>
        {recent.length === 0 ? (
          <p style={{ color: 'var(--text-4)', fontSize: 14 }}>Nog geen cardio gelogd.</p>
        ) : (
          <div style={{ display: 'grid', gap: 6 }}>
            {recent.map((r) => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '11px 12px' }}>
                <HeartPulse size={16} aria-hidden style={{ color: 'var(--mf-red)', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)' }}>{r.soort}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-4)' }}>
                    {[r.duur_minuten ? `${r.duur_minuten} min` : null, r.afstand_meter ? `${(r.afstand_meter / 1000).toFixed(1)} km` : null, r.gem_hartslag ? `${r.gem_hartslag} bpm` : null].filter(Boolean).join(' · ') || '—'}
                  </div>
                </div>
                <span style={{ fontSize: 11, color: 'var(--text-4)', flexShrink: 0 }}>{r.datum.slice(5)}</span>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

function VeldNum({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label style={{ display: 'grid', gap: 4 }}>
      <span style={{ fontSize: 11, color: 'var(--text-4)' }}>{label}</span>
      <input inputMode="decimal" value={value} onChange={(e) => onChange(e.target.value)} aria-label={label} style={veld} />
    </label>
  )
}

const veld: CSSProperties = { width: '100%', height: 42, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-app)', color: 'var(--text-1)', fontSize: 15, textAlign: 'center', fontWeight: 700, boxSizing: 'border-box' }
