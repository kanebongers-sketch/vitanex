'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/supabase'
import Navbar from '@/components/layout/Navbar'
import { ArrowLeft, Plus, X, Search, Dumbbell, Check } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'

type Oefening = { id: string; naam: string; spiergroep: string | null }
type Gekozen = { id: string; naam: string; spiergroep: string | null; sets: string; herhalingen: string; heeft_gewicht: boolean }

const SPIERGROEPEN = ['Alle', 'Borst', 'Rug', 'Schouders', 'Armen', 'Benen', 'Core', 'Cardio']

export default function WorkoutBouwenPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [laden, setLaden] = useState(true)
  const [bibliotheek, setBibliotheek] = useState<Oefening[]>([])
  const [zoek, setZoek] = useState('')
  const [filter, setFilter] = useState('Alle')
  const [naam, setNaam] = useState('')
  const [gekozen, setGekozen] = useState<Gekozen[]>([])
  const [opslaan, setOpslaan] = useState(false)

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data } = await supabase.from('fitness_oefeningen').select('id, naam, spiergroep').order('naam')
      setBibliotheek((data as Oefening[] | null) ?? [])
      setLaden(false)
    }
    void init()
  }, [router])

  const zichtbaar = useMemo(() => {
    const q = zoek.trim().toLowerCase()
    const gekozenIds = new Set(gekozen.map((g) => g.id))
    return bibliotheek.filter((o) =>
      !gekozenIds.has(o.id) &&
      (filter === 'Alle' || o.spiergroep === filter) &&
      (q === '' || o.naam.toLowerCase().includes(q)),
    ).slice(0, 40)
  }, [bibliotheek, zoek, filter, gekozen])

  const voegToe = (o: Oefening) =>
    setGekozen((g) => [...g, { id: o.id, naam: o.naam, spiergroep: o.spiergroep, sets: '3', herhalingen: '8-12', heeft_gewicht: o.spiergroep !== 'Cardio' }])
  const verwijder = (id: string) => setGekozen((g) => g.filter((x) => x.id !== id))
  const zet = (id: string, veld: 'sets' | 'herhalingen', val: string) =>
    setGekozen((g) => g.map((x) => (x.id === id ? { ...x, [veld]: val } : x)))

  const bewaar = async () => {
    if (gekozen.length === 0 || opslaan) return
    setOpslaan(true)
    const token = (await supabase.auth.getSession()).data.session?.access_token
    if (!token) { setOpslaan(false); return }
    const res = await fetch('/api/sport/eigen-workout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        naam,
        oefeningen: gekozen.map((g) => ({ naam: g.naam, spiergroep: g.spiergroep, sets: parseInt(g.sets) || 3, herhalingen: g.herhalingen, heeft_gewicht: g.heeft_gewicht })),
      }),
    })
    setOpslaan(false)
    if (res.ok) {
      toast({ title: 'Workout opgeslagen', variant: 'success' })
      router.push('/sport/training')
    } else {
      toast({ title: 'Opslaan mislukt', variant: 'error' })
    }
  }

  return (
    <div className="mf-mesh-bg" style={{ background: 'var(--bg-app)', minHeight: '100vh' }}>
      <Navbar />
      <main style={{ maxWidth: 640, margin: '0 auto', padding: '20px 16px 120px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <button type="button" aria-label="Terug" onClick={() => router.push('/sport')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 0, minWidth: 44, minHeight: 44 }}><ArrowLeft size={22} /></button>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-1)', margin: 0 }}>Eigen workout</h1>
        </div>

        <label style={{ display: 'block', marginBottom: 18 }}>
          <span style={{ fontSize: 12, color: 'var(--text-4)' }}>Naam</span>
          <input value={naam} onChange={(e) => setNaam(e.target.value)} placeholder="Bijv. Push A"
            style={{ width: '100%', height: 44, marginTop: 4, borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-1)', fontSize: 15, padding: '0 12px', boxSizing: 'border-box' }} />
        </label>

        {/* Gekozen oefeningen */}
        {gekozen.length > 0 && (
          <div style={{ marginBottom: 22 }}>
            <p style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 8px' }}>Jouw workout ({gekozen.length})</p>
            <div style={{ display: 'grid', gap: 8 }}>
              {gekozen.map((g) => (
                <div key={g.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: 8, alignItems: 'center', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '10px 12px' }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.naam}</span>
                  <input inputMode="numeric" value={g.sets} onChange={(e) => zet(g.id, 'sets', e.target.value)} aria-label={`Sets voor ${g.naam}`} style={veld(46)} />
                  <input value={g.herhalingen} onChange={(e) => zet(g.id, 'herhalingen', e.target.value)} aria-label={`Herhalingen voor ${g.naam}`} style={veld(64)} />
                  <button type="button" onClick={() => verwijder(g.id)} aria-label={`Verwijder ${g.naam}`} style={{ background: 'none', border: 'none', color: 'var(--text-4)', cursor: 'pointer', padding: 4 }}><X size={16} /></button>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-4)', margin: '6px 2px 0' }}>sets · herhalingen (bijv. 8-12)</p>
          </div>
        )}

        {/* Bibliotheek */}
        <div style={{ position: 'relative', marginBottom: 10 }}>
          <Search size={16} aria-hidden style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-4)' }} />
          <input value={zoek} onChange={(e) => setZoek(e.target.value)} placeholder="Zoek een oefening…"
            style={{ width: '100%', height: 44, borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-1)', fontSize: 15, padding: '0 12px 0 36px', boxSizing: 'border-box' }} />
        </div>
        <div role="group" aria-label="Filter op spiergroep" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
          {SPIERGROEPEN.map((s) => (
            <button key={s} type="button" onClick={() => setFilter(s)} aria-pressed={filter === s}
              style={{ padding: '6px 12px', borderRadius: 999, border: `1px solid ${filter === s ? 'var(--mentaforce-primary)' : 'var(--border)'}`, background: filter === s ? 'var(--mentaforce-primary)' : 'transparent', color: filter === s ? 'var(--bg-app)' : 'var(--text-3)', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>
              {s}
            </button>
          ))}
        </div>

        {laden ? (
          <p style={{ color: 'var(--text-4)', fontSize: 14 }}>Laden…</p>
        ) : (
          <div style={{ display: 'grid', gap: 6 }}>
            {zichtbaar.map((o) => (
              <button key={o.id} type="button" onClick={() => voegToe(o)} aria-label={`Voeg ${o.naam} toe`}
                style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '11px 12px', cursor: 'pointer', textAlign: 'left' }}>
                <Dumbbell size={16} aria-hidden style={{ color: 'var(--text-4)', flexShrink: 0 }} />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 14, fontWeight: 700, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.naam}</span>
                  {o.spiergroep && <span style={{ fontSize: 11, color: 'var(--text-4)' }}>{o.spiergroep}</span>}
                </span>
                <Plus size={18} aria-hidden style={{ color: 'var(--mentaforce-primary)', flexShrink: 0 }} />
              </button>
            ))}
            {zichtbaar.length === 0 && <p style={{ color: 'var(--text-4)', fontSize: 14 }}>Geen oefeningen gevonden.</p>}
          </div>
        )}
      </main>

      {/* Opslaan-balk */}
      {gekozen.length > 0 && (
        <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 50, background: 'var(--bg-card)', borderTop: '1px solid var(--border)', padding: '12px 16px calc(12px + env(safe-area-inset-bottom))' }}>
          <button type="button" onClick={() => void bewaar()} disabled={opslaan}
            style={{ maxWidth: 640, margin: '0 auto', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 50, borderRadius: 14, border: 'none', background: 'var(--mentaforce-primary)', color: 'var(--bg-app)', fontSize: 15, fontWeight: 800, cursor: 'pointer', opacity: opslaan ? 0.6 : 1 }}>
            <Check size={18} /> {opslaan ? 'Opslaan…' : `Opslaan & starten (${gekozen.length})`}
          </button>
        </div>
      )}
    </div>
  )
}

function veld(w: number): CSSProperties {
  return { width: w, height: 34, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-app)', color: 'var(--text-1)', fontSize: 14, textAlign: 'center', fontWeight: 700, boxSizing: 'border-box' }
}
