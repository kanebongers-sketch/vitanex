'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'

type Protocol = {
  id: string
  titel: string
  beschrijving: string | null
  categorie: string
  icoon: string
  kleur: string
  gepubliceerd: boolean
  aangemaakt_op: string
  bijgewerkt_op: string
}

const CAT_LABELS: Record<string, string> = {
  algemeen: 'Algemeen', arbo: 'Arbo & Veiligheid', verzuim: 'Verzuim',
  it: 'IT & Systemen', hr: 'HR & Onboarding', veiligheid: 'Veiligheid', overig: 'Overig',
}

export default function HrProtokollenPage() {
  const router = useRouter()
  const [protocollen, setProtocollen] = useState<Protocol[]>([])
  const [laden, setLaden] = useState(true)
  const [bedrijfId, setBedrijfId] = useState('')
  const [verwijderModal, setVerwijderModal] = useState<string | null>(null)

  useEffect(() => {
    async function laad() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: profiel } = await supabase
        .from('profiles').select('bedrijf_id, rol').eq('id', user.id).single()
      if (!profiel || !['hr', 'admin'].includes(profiel.rol ?? '')) {
        router.push('/home'); return
      }
      setBedrijfId(profiel.bedrijf_id)
      const { data } = await supabase
        .from('protocollen').select('*').eq('bedrijf_id', profiel.bedrijf_id)
        .order('aangemaakt_op', { ascending: false })
      if (data) setProtocollen(data as Protocol[])
      setLaden(false)
    }
    laad()
  }, [router])

  async function togglePublicatie(id: string, huidig: boolean) {
    await supabase.from('protocollen').update({ gepubliceerd: !huidig }).eq('id', id)
    setProtocollen(prev => prev.map(p => p.id === id ? { ...p, gepubliceerd: !huidig } : p))
  }

  async function verwijder(id: string) {
    await supabase.from('protocollen').delete().eq('id', id)
    setProtocollen(prev => prev.filter(p => p.id !== id))
    setVerwijderModal(null)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <main style={{ padding: '32px 32px 48px' }}>
      <div style={{ maxWidth: 760 }}>

        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link href="/hr" className="text-sm" style={{ color: 'var(--text-4)' }}>HR</Link>
              <span style={{ color: 'var(--text-4)' }}>/</span>
              <span className="text-sm" style={{ color: 'var(--text-2)' }}>Protocollen</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-1)', letterSpacing: '-0.02em' }}>
              Protocollen beheren
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-3)' }}>
              {protocollen.length} protocol{protocollen.length !== 1 ? 'len' : ''}
            </p>
          </div>
          <Link href="/hr/protocollen/nieuw" className="mf-btn mf-btn-primary"
            style={{ padding: '8px 16px', fontSize: 13 }}>
            + Nieuw
          </Link>
        </div>

        {laden ? (
          <div className="flex justify-center py-16"><div className="mf-spinner" /></div>
        ) : protocollen.length === 0 ? (
          <div className="rounded-2xl p-10 text-center"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <p className="text-3xl mb-3">📋</p>
            <p className="text-sm font-medium mb-4" style={{ color: 'var(--text-2)' }}>Nog geen protocollen.</p>
            <Link href="/hr/protocollen/nieuw" className="mf-btn mf-btn-primary"
              style={{ fontSize: 13, padding: '10px 20px' }}>
              Eerste protocol aanmaken
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {protocollen.map(p => (
              <div key={p.id} className="rounded-2xl p-4"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-xs)' }}>
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ background: p.kleur + '18' }}>
                    {p.icoon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{p.titel}</p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-4)' }}>
                          {CAT_LABELS[p.categorie] ?? p.categorie} · {new Date(p.bijgewerkt_op).toLocaleDateString('nl-BE', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                      <span
                        className="text-[11px] px-2 py-0.5 rounded-full font-semibold flex-shrink-0"
                        style={{
                          background: p.gepubliceerd ? '#E1F5EE' : '#FEF3C7',
                          color: p.gepubliceerd ? '#0F6E56' : '#92400E',
                        }}
                      >
                        {p.gepubliceerd ? 'Gepubliceerd' : 'Concept'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      <Link href={`/hr/protocollen/${p.id}/bewerken`}
                        className="mf-btn text-xs"
                        style={{ padding: '5px 12px', fontSize: 12, background: 'var(--bg-subtle)', color: 'var(--text-2)', border: '1px solid var(--border)' }}>
                        Bewerken
                      </Link>
                      <button
                        onClick={() => togglePublicatie(p.id, p.gepubliceerd)}
                        className="mf-btn text-xs"
                        style={{
                          padding: '5px 12px', fontSize: 12,
                          background: p.gepubliceerd ? '#FEF3C7' : '#E1F5EE',
                          color: p.gepubliceerd ? '#92400E' : '#0F6E56',
                          border: 'none',
                        }}
                      >
                        {p.gepubliceerd ? 'Als concept opslaan' : 'Publiceren'}
                      </button>
                      <button
                        onClick={() => setVerwijderModal(p.id)}
                        className="mf-btn text-xs"
                        style={{ padding: '5px 12px', fontSize: 12, background: '#FEE2E2', color: '#DC2626', border: 'none' }}>
                        Verwijderen
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Verwijder bevestiging modal */}
      {verwijderModal && (
        <div className="mf-backdrop" onClick={() => setVerwijderModal(null)}>
          <div className="mf-modal p-6">
            <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-1)' }}>Protocol verwijderen?</h2>
            <p className="text-sm mb-6" style={{ color: 'var(--text-3)' }}>
              Dit kan niet ongedaan worden gemaakt.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setVerwijderModal(null)} className="mf-btn flex-1"
                style={{ background: 'var(--bg-subtle)', color: 'var(--text-2)', border: '1px solid var(--border)' }}>
                Annuleren
              </button>
              <button onClick={() => verwijder(verwijderModal)} className="mf-btn flex-1"
                style={{ background: '#DC2626', color: 'white' }}>
                Verwijderen
              </button>
            </div>
          </div>
        </div>
      )}
      </main>
    </div>
  )
}
