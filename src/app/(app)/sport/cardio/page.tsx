'use client'

export const dynamic = 'force-dynamic'

import { useCallback, useEffect, useState, type CSSProperties } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/supabase'
import Navbar from '@/components/layout/Navbar'
import { ArrowLeft, Check, HeartPulse } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import { useVertaling } from '@/lib/i18n/TaalProvider'
import type { Params } from '@/lib/i18n/vertaal'

type CardioRij = {
  id: string
  datum: string
  soort: string
  duur_minuten: number | null
  afstand_meter: number | null
  gem_hartslag: number | null
}

/** Opgeslagen waarden (Nederlands, zo staan ze in de database); de weergave komt uit het woordenboek. */
const SOORTEN = ['Hardlopen', 'Fietsen', 'Roeien', 'Wandelen', 'Zwemmen', 'Overig']

function soortLabel(t: (sleutel: string, params?: Params) => string, soort: string): string {
  return SOORTEN.includes(soort) ? t(`lichaam.cardio.soort.${soort.toLowerCase()}`) : soort
}

export default function CardioPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { t } = useVertaling()
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
      toast({ title: t('lichaam.cardio.gelogd'), variant: 'success' })
      setDuur(''); setAfstandKm(''); setHartslag(''); setRpe('')
      void laad()
    } else {
      toast({ title: t('lichaam.voeding.opslaanMislukt'), variant: 'error' })
    }
  }

  return (
    <div className="mf-mesh-bg" style={{ background: 'var(--bg-app)', minHeight: '100vh' }}>
      <Navbar />
      <main style={{ maxWidth: 640, margin: '0 auto', padding: '20px 16px 60px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <button type="button" aria-label={t('lichaam.cardio.terug')} onClick={() => router.push('/sport')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 0, minWidth: 44, minHeight: 44 }}><ArrowLeft size={22} /></button>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-1)', margin: 0 }}>{t('lichaam.cardio.titel')}</h1>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 18, padding: 16, marginBottom: 24 }}>
          <div role="group" aria-label={t('lichaam.cardio.soortAria')} style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
            {SOORTEN.map((s) => (
              <button key={s} type="button" onClick={() => setSoort(s)} aria-pressed={soort === s}
                style={{ padding: '7px 13px', borderRadius: 999, border: `1px solid ${soort === s ? 'var(--mentaforce-primary)' : 'var(--border)'}`, background: soort === s ? 'var(--mentaforce-primary)' : 'transparent', color: soort === s ? 'var(--bg-app)' : 'var(--text-3)', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>
                {soortLabel(t, s)}
              </button>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            <VeldNum label={t('lichaam.cardio.duur')} value={duur} onChange={setDuur} />
            <VeldNum label={t('lichaam.cardio.afstand')} value={afstandKm} onChange={setAfstandKm} />
            <VeldNum label={t('lichaam.cardio.hartslag')} value={hartslag} onChange={setHartslag} />
            <VeldNum label={t('lichaam.cardio.rpe')} value={rpe} onChange={setRpe} />
          </div>
          <button type="button" onClick={() => void bewaar()} disabled={opslaan}
            style={{ marginTop: 14, width: '100%', height: 48, borderRadius: 12, border: 'none', background: 'var(--mentaforce-primary)', color: 'var(--bg-app)', fontSize: 15, fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: opslaan ? 0.6 : 1 }}>
            <Check size={18} /> {opslaan ? t('lichaam.slaap.opslaanBezig') : t('lichaam.cardio.titel')}
          </button>
          <p style={{ fontSize: 11, color: 'var(--text-4)', margin: '10px 2px 0' }}>{t('lichaam.cardio.later')}</p>
        </div>

        <p style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 8px' }}>{t('lichaam.cardio.recent')}</p>
        {recent.length === 0 ? (
          <p style={{ color: 'var(--text-4)', fontSize: 14 }}>{t('lichaam.cardio.leeg')}</p>
        ) : (
          <div style={{ display: 'grid', gap: 6 }}>
            {recent.map((r) => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '11px 12px' }}>
                <HeartPulse size={16} aria-hidden style={{ color: 'var(--mf-red)', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)' }}>{soortLabel(t, r.soort)}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-4)' }}>
                    {[r.duur_minuten ? t('lichaam.duur.min', { min: r.duur_minuten }) : null, r.afstand_meter ? t('lichaam.workout.km', { km: (r.afstand_meter / 1000).toFixed(1) }) : null, r.gem_hartslag ? t('lichaam.cardio.bpm', { bpm: r.gem_hartslag }) : null].filter(Boolean).join(' · ') || '-'}
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
