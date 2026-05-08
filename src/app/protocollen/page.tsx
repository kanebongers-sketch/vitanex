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
  auteur_id: string | null
  aangemaakt_op: string
  bijgewerkt_op: string
}

const CAT_LABELS: Record<string, string> = {
  algemeen: 'Algemeen',
  arbo: 'Arbo & Veiligheid',
  verzuim: 'Verzuim',
  it: 'IT & Systemen',
  hr: 'HR & Onboarding',
  veiligheid: 'Veiligheid',
  overig: 'Overig',
}

const CAT_KLEUREN: Record<string, { bg: string; color: string }> = {
  algemeen:  { bg: '#F3F4F6', color: '#374151' },
  arbo:      { bg: '#FEF3C7', color: '#92400E' },
  verzuim:   { bg: '#FEE2E2', color: '#991B1B' },
  it:        { bg: '#EFF6FF', color: '#1D4ED8' },
  hr:        { bg: '#ECFDF5', color: '#065F46' },
  veiligheid:{ bg: '#FEF3C7', color: '#B45309' },
  overig:    { bg: '#F5F3FF', color: '#6D28D9' },
}

export default function ProtokollenPage() {
  const router = useRouter()
  const [protocollen, setProtocollen] = useState<Protocol[]>([])
  const [laden, setLaden] = useState(true)
  const [isHr, setIsHr] = useState(false)
  const [zoek, setZoek] = useState('')
  const [filter, setFilter] = useState<string>('alle')

  useEffect(() => {
    async function laad() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: profiel } = await supabase
        .from('profiles').select('bedrijf_id, rol').eq('id', user.id).single()

      const hr = profiel?.rol === 'hr' || profiel?.rol === 'admin'
      setIsHr(hr)

      const query = supabase
        .from('protocollen')
        .select('*')
        .eq('bedrijf_id', profiel?.bedrijf_id)
        .order('aangemaakt_op', { ascending: false })

      if (!hr) query.eq('gepubliceerd', true)

      const { data } = await query
      if (data) setProtocollen(data as Protocol[])
      setLaden(false)
    }
    laad()
  }, [router])

  const gefilterd = protocollen.filter(p => {
    const matchZoek = zoek === '' ||
      p.titel.toLowerCase().includes(zoek.toLowerCase()) ||
      (p.beschrijving ?? '').toLowerCase().includes(zoek.toLowerCase())
    const matchCat = filter === 'alle' || p.categorie === filter
    return matchZoek && matchCat
  })

  const categorieen = [...new Set(protocollen.map(p => p.categorie))]

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-app)' }}>
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-6 mf-safe-bottom">

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-1)', letterSpacing: '-0.02em' }}>
              Protocollen
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-3)' }}>
              Beleid, procedures en richtlijnen
            </p>
          </div>
          {isHr && (
            <Link
              href="/hr/protocollen/nieuw"
              className="mf-btn mf-btn-primary"
              style={{ padding: '8px 16px', fontSize: 13 }}
            >
              + Toevoegen
            </Link>
          )}
        </div>

        {/* Zoeken */}
        <div className="relative mb-4">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="16" height="16" viewBox="0 0 24 24"
            fill="none" stroke="var(--text-4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Zoek protocol..."
            value={zoek}
            onChange={e => setZoek(e.target.value)}
            className="mf-input w-full"
            style={{ paddingLeft: 38, borderRadius: 14, fontSize: 14 }}
          />
        </div>

        {/* Categorie filter */}
        {categorieen.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide">
            <button
              onClick={() => setFilter('alle')}
              className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition"
              style={{
                background: filter === 'alle' ? 'var(--mf-green)' : 'var(--bg-card)',
                color: filter === 'alle' ? 'white' : 'var(--text-3)',
                border: '1px solid var(--border)',
              }}
            >
              Alle
            </button>
            {categorieen.map(cat => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition"
                style={{
                  background: filter === cat ? CAT_KLEUREN[cat]?.color ?? '#374151' : 'var(--bg-card)',
                  color: filter === cat ? 'white' : 'var(--text-3)',
                  border: '1px solid var(--border)',
                }}
              >
                {CAT_LABELS[cat] ?? cat}
              </button>
            ))}
          </div>
        )}

        {/* Lijst */}
        {laden ? (
          <div className="flex justify-center py-16">
            <div className="mf-spinner" />
          </div>
        ) : gefilterd.length === 0 ? (
          <div className="rounded-2xl p-10 text-center"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <p className="text-3xl mb-3">📋</p>
            <p className="text-sm font-medium" style={{ color: 'var(--text-2)' }}>
              {protocollen.length === 0
                ? isHr ? 'Nog geen protocollen. Klik op + Toevoegen.' : 'Nog geen protocollen gepubliceerd.'
                : 'Geen resultaten voor deze zoekopdracht.'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {gefilterd.map(p => {
              const cat = CAT_KLEUREN[p.categorie] ?? CAT_KLEUREN.algemeen
              return (
                <Link
                  key={p.id}
                  href={`/protocollen/${p.id}`}
                  className="block rounded-2xl p-4 transition active:scale-[0.99]"
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    boxShadow: 'var(--shadow-xs)',
                  }}
                >
                  <div className="flex items-start gap-4">
                    {/* Icoon */}
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl"
                      style={{ background: p.kleur + '18' }}
                    >
                      {p.icoon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold leading-snug" style={{ color: 'var(--text-1)' }}>
                          {p.titel}
                        </p>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {isHr && !p.gepubliceerd && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                              style={{ background: '#FEF3C7', color: '#92400E' }}>
                              Concept
                            </span>
                          )}
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                            stroke="var(--text-4)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="9 18 15 12 9 6" />
                          </svg>
                        </div>
                      </div>
                      {p.beschrijving && (
                        <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--text-3)' }}>
                          {p.beschrijving}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                          style={{ background: cat.bg, color: cat.color }}>
                          {CAT_LABELS[p.categorie] ?? p.categorie}
                        </span>
                        <span className="text-[11px]" style={{ color: 'var(--text-4)' }}>
                          {new Date(p.bijgewerkt_op).toLocaleDateString('nl-BE', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {/* HR beheer link */}
        {isHr && protocollen.length > 0 && (
          <div className="mt-6 rounded-2xl p-4 flex items-center justify-between"
            style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
            <div>
              <p className="text-xs font-semibold" style={{ color: 'var(--text-2)' }}>HR Beheer</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-4)' }}>
                Protocollen toevoegen, bewerken en verbergen
              </p>
            </div>
            <Link href="/hr/protocollen" className="mf-btn text-xs"
              style={{ padding: '7px 14px', background: 'var(--bg-card)', color: 'var(--text-2)', border: '1px solid var(--border)' }}>
              Beheren
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
