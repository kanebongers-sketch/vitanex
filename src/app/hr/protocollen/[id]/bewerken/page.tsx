'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/layout/Navbar'

const CATEGORIEEN = [
  { value: 'algemeen', label: 'Algemeen', icon: '📋' },
  { value: 'arbo', label: 'Arbo & Veiligheid', icon: '🦺' },
  { value: 'verzuim', label: 'Verzuim', icon: '🤒' },
  { value: 'it', label: 'IT & Systemen', icon: '💻' },
  { value: 'hr', label: 'HR & Onboarding', icon: '🚀' },
  { value: 'veiligheid', label: 'Veiligheid', icon: '🛡️' },
  { value: 'overig', label: 'Overig', icon: '🗂️' },
]

const ICONEN = ['📋', '🦺', '🤒', '💻', '🚀', '🛡️', '🗂️', '📌', '⚠️', '🔒', '📞', '🏥', '🚛', '🎓', '📱', '🔑', '📄', '✅']
const KLEUREN = ['var(--mf-green)', 'var(--mf-red)', 'var(--mf-blue)', 'var(--mf-purple)', 'var(--mf-amber-dark)', '#0369A1', 'var(--mf-rose)', 'var(--mf-green-dark)', 'var(--mf-amber-dark)', 'var(--text-2)']

export default function BewerkProtocolPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string

  const [laden, setLaden] = useState(true)
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState('')

  const [titel, setTitel] = useState('')
  const [beschrijving, setBeschrijving] = useState('')
  const [inhoud, setInhoud] = useState('')
  const [categorie, setCategorie] = useState('algemeen')
  const [icoon, setIcoon] = useState('📋')
  const [kleur, setKleur] = useState('var(--mf-green)')
  const [gepubliceerd, setGepubliceerd] = useState(true)

  useEffect(() => {
    async function laad() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: profiel } = await supabase
        .from('profiles').select('bedrijf_id, rol').eq('id', user.id).single()
      if (!profiel || !['hr', 'admin'].includes(profiel.rol ?? '')) {
        router.push('/home'); return
      }

      const { data } = await supabase.from('protocollen').select('id, titel, beschrijving, inhoud, gepubliceerd, bedrijf_id, categorie, icoon, kleur').eq('id', id).single()
      if (!data || data.bedrijf_id !== profiel.bedrijf_id) { router.push('/hr/protocollen'); return }

      setTitel(data.titel)
      setBeschrijving(data.beschrijving ?? '')
      setInhoud(data.inhoud)
      setCategorie(data.categorie)
      setIcoon(data.icoon)
      setKleur(data.kleur)
      setGepubliceerd(data.gepubliceerd)
      setLaden(false)
    }
    laad()
  }, [router, id])

  async function opslaan() {
    if (!titel.trim()) { setFout('Vul een titel in.'); return }
    setBezig(true); setFout('')
    const { error } = await supabase.from('protocollen').update({
      titel: titel.trim(), beschrijving: beschrijving.trim() || null,
      inhoud: inhoud.trim(), categorie, icoon, kleur, gepubliceerd,
      bijgewerkt_op: new Date().toISOString(),
    }).eq('id', id)
    if (error) { setFout('Opslaan mislukt: ' + error.message); setBezig(false); return }
    router.push('/hr/protocollen')
  }

  if (laden) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><div className="mf-spinner" /></div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <main style={{ padding: '32px 32px 48px' }}>
      <div style={{ maxWidth: 680 }}>

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Link href="/hr/protocollen" className="text-sm" style={{ color: 'var(--text-4)' }}>Protocollen</Link>
            <span style={{ color: 'var(--text-4)' }}>/</span>
            <span className="text-sm" style={{ color: 'var(--text-2)' }}>Bewerken</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-1)', letterSpacing: '-0.02em' }}>
            Protocol bewerken
          </h1>
        </div>

        <div className="flex flex-col gap-4">
          {/* Titel & beschrijving */}
          <div className="rounded-2xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <label className="text-xs font-bold uppercase tracking-wide block mb-2" style={{ color: 'var(--text-4)' }}>Titel *</label>
            <input value={titel} onChange={e => setTitel(e.target.value)}
              className="mf-input w-full" style={{ borderRadius: 12, fontSize: 15 }} />
            <label className="text-xs font-bold uppercase tracking-wide block mb-2 mt-4" style={{ color: 'var(--text-4)' }}>Korte beschrijving</label>
            <input value={beschrijving} onChange={e => setBeschrijving(e.target.value)}
              className="mf-input w-full" style={{ borderRadius: 12, fontSize: 14 }} />
          </div>

          {/* Categorie */}
          <div className="rounded-2xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <label className="text-xs font-bold uppercase tracking-wide block mb-3" style={{ color: 'var(--text-4)' }}>Categorie</label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIEEN.map(cat => (
                <button key={cat.value} onClick={() => setCategorie(cat.value)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm text-left transition"
                  style={{
                    background: categorie === cat.value ? kleur + '15' : 'var(--bg-subtle)',
                    borderColor: categorie === cat.value ? kleur : 'var(--border)',
                    color: categorie === cat.value ? kleur : 'var(--text-3)',
                    fontWeight: categorie === cat.value ? 600 : 400,
                  }}>
                  <span>{cat.icon}</span><span>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Icoon & kleur */}
          <div className="rounded-2xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <label className="text-xs font-bold uppercase tracking-wide block mb-3" style={{ color: 'var(--text-4)' }}>Icoon</label>
            <div className="flex flex-wrap gap-2 mb-5">
              {ICONEN.map(ic => (
                <button key={ic} onClick={() => setIcoon(ic)}
                  className="w-10 h-10 rounded-xl text-xl flex items-center justify-center transition"
                  style={{
                    background: icoon === ic ? kleur + '18' : 'var(--bg-subtle)',
                    border: icoon === ic ? `2px solid ${kleur}` : '1.5px solid var(--border)',
                  }}>{ic}</button>
              ))}
            </div>
            <label className="text-xs font-bold uppercase tracking-wide block mb-3" style={{ color: 'var(--text-4)' }}>Kleur</label>
            <div className="flex flex-wrap gap-2">
              {KLEUREN.map(k => (
                <button key={k} onClick={() => setKleur(k)}
                  className="w-9 h-9 rounded-full transition"
                  style={{
                    background: k,
                    border: kleur === k ? `3px solid ${k}` : '3px solid transparent',
                    outline: kleur === k ? `2px solid ${k}40` : 'none',
                    outlineOffset: 2,
                  }} />
              ))}
            </div>
          </div>

          {/* Inhoud */}
          <div className="rounded-2xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--text-4)' }}>Inhoud (Markdown)</label>
              <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: 'var(--bg-subtle)', color: 'var(--text-4)' }}>
                # H1 &nbsp;## H2 &nbsp;**vet** &nbsp;- lijst
              </span>
            </div>
            <textarea value={inhoud} onChange={e => setInhoud(e.target.value)}
              rows={16} className="mf-input resize-none w-full font-mono"
              style={{ borderRadius: 12, fontSize: 13, lineHeight: 1.6 }} />
          </div>

          {/* Publicatie toggle */}
          <div className="rounded-2xl p-5 flex items-center justify-between"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>Gepubliceerd</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
                {gepubliceerd ? 'Zichtbaar voor medewerkers' : 'Alleen zichtbaar voor HR'}
              </p>
            </div>
            <button onClick={() => setGepubliceerd(!gepubliceerd)}
              className="relative w-12 h-6 rounded-full transition-colors flex-shrink-0"
              style={{ background: gepubliceerd ? 'var(--mf-green)' : 'var(--text-4)' }}>
              <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform"
                style={{ transform: gepubliceerd ? 'translateX(26px)' : 'translateX(2px)' }} />
            </button>
          </div>

          {fout && (
            <div className="rounded-xl px-4 py-3" style={{ background: 'var(--mf-red-light)' }}>
              <p className="text-sm" style={{ color: 'var(--mf-red)' }}>{fout}</p>
            </div>
          )}

          <div className="flex gap-3">
            <Link href="/hr/protocollen" className="mf-btn flex-1 text-center"
              style={{ padding: '13px', background: 'var(--bg-subtle)', color: 'var(--text-2)', border: '1px solid var(--border)' }}>
              Annuleren
            </Link>
            <button onClick={opslaan} disabled={bezig} className="mf-btn mf-btn-primary flex-1"
              style={{ padding: '13px', fontSize: 15 }}>
              {bezig ? 'Opslaan...' : 'Wijzigingen opslaan'}
            </button>
          </div>
        </div>
      </div>
      </main>
    </div>
  )
}
