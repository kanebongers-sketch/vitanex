'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/supabase'
import Navbar from '@/components/layout/Navbar'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Label } from '@/components/ui/Label'
import { Input } from '@/components/ui/Input'
import { EmptyState } from '@/components/ui/EmptyState'
import { FileText, Plus, Search, ChevronRight } from 'lucide-react'


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
      <main className="px-6 py-6 mf-safe-bottom" style={{ maxWidth: 900, margin: '0 auto' }}>

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
            <Button
              size="sm"
              onClick={() => router.push('/hr/protocollen/nieuw')}
              leftIcon={<Plus size={16} aria-hidden />}
            >
              Toevoegen
            </Button>
          )}
        </div>

        {/* Zoeken */}
        <div className="mb-4" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Label htmlFor="protocol-zoek">Zoek protocol</Label>
          <div style={{ position: 'relative' }}>
            <Search
              size={16}
              aria-hidden
              style={{
                position: 'absolute', left: 12, top: '50%',
                transform: 'translateY(-50%)', color: 'var(--text-4)', pointerEvents: 'none',
              }}
            />
            <Input
              id="protocol-zoek"
              type="text"
              placeholder="Zoek op titel of omschrijving..."
              value={zoek}
              onChange={e => setZoek(e.target.value)}
              style={{ paddingLeft: 38 }}
            />
          </div>
        </div>

        {/* Categorie filter */}
        {categorieen.length > 1 && (
          <div
            className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide"
            role="group"
            aria-label="Filter op categorie"
          >
            <button
              type="button"
              onClick={() => setFilter('alle')}
              aria-pressed={filter === 'alle'}
              className="mf-pressable flex-shrink-0 text-xs px-3 py-1.5 rounded-full font-medium"
              style={{
                background: filter === 'alle' ? 'var(--mentaforce-primary)' : 'var(--bg-card)',
                color: filter === 'alle' ? 'var(--bg-app)' : 'var(--text-3)',
                border: '1px solid var(--border)',
                transition: 'opacity 0.15s var(--ease)',
              }}
            >
              Alle
            </button>
            {categorieen.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setFilter(cat)}
                aria-pressed={filter === cat}
                className="mf-pressable flex-shrink-0 text-xs px-3 py-1.5 rounded-full font-medium"
                style={{
                  background: filter === cat ? 'var(--mentaforce-primary)' : 'var(--bg-card)',
                  color: filter === cat ? 'var(--bg-app)' : 'var(--text-3)',
                  border: '1px solid var(--border)',
                  transition: 'opacity 0.15s var(--ease)',
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
          <Card>
            <EmptyState
              icon={FileText}
              title={protocollen.length === 0
                ? isHr ? 'Nog geen protocollen' : 'Nog geen protocollen gepubliceerd'
                : 'Geen resultaten'}
              description={protocollen.length === 0
                ? isHr ? 'Klik op Toevoegen om je eerste protocol aan te maken.' : 'Er zijn nog geen protocollen gedeeld door je organisatie.'
                : 'Pas je zoekopdracht of filter aan om meer te zien.'}
            />
          </Card>
        ) : (
          <ul className="flex flex-col gap-3" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {gefilterd.map(p => (
              <li key={p.id}>
                <Link
                  href={`/protocollen/${p.id}`}
                  className="mf-lift block"
                  style={{
                    display: 'block',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-card)',
                    boxShadow: 'var(--shadow-card)',
                    padding: '16px',
                  }}
                >
                  <div className="flex items-start gap-4">
                    {/* Icoon */}
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'var(--mentaforce-primary-light)', color: 'var(--mentaforce-primary)' }}
                      aria-hidden
                    >
                      <FileText size={22} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold leading-snug" style={{ color: 'var(--text-1)' }}>
                          {p.titel}
                        </p>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {isHr && !p.gepubliceerd && (
                            <Badge variant="warning">Concept</Badge>
                          )}
                          <ChevronRight size={16} aria-hidden style={{ color: 'var(--text-4)' }} />
                        </div>
                      </div>
                      {p.beschrijving && (
                        <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--text-3)' }}>
                          {p.beschrijving}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="neutral">{CAT_LABELS[p.categorie] ?? p.categorie}</Badge>
                        <span className="text-[11px]" style={{ color: 'var(--text-4)' }}>
                          {new Date(p.bijgewerkt_op).toLocaleDateString('nl-BE', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {/* HR beheer link */}
        {isHr && protocollen.length > 0 && (
          <Card style={{ marginTop: 24, padding: '16px' }}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold" style={{ color: 'var(--text-2)' }}>HR Beheer</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-4)' }}>
                  Protocollen toevoegen, bewerken en verbergen
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => router.push('/hr/protocollen')}
              >
                Beheren
              </Button>
            </div>
          </Card>
        )}
      </main>
    </div>
  )
}
