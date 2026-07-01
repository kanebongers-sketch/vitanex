'use client'

export const dynamic = 'force-dynamic'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/layout/Navbar'
import { Dumbbell, Search, BookOpen } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { EmptyState } from '@/components/ui/EmptyState'
import {
  DialogRoot, DialogContent, DialogTitle, DialogDescription,
} from '@/components/ui/Dialog'


type Oefening = {
  id: string
  naam: string
  spiergroep: string
  beschrijving: string | null
  uitvoering_stappen: string[] | null
  image_url: string | null
  moeilijkheid: string
  benodigdheden: string[] | null
}

const SPIERGROEPEN = ['Alle', 'Borst', 'Rug', 'Schouders', 'Armen', 'Benen', 'Core', 'Cardio']
const MOEILIJKHEDEN = ['Alle', 'Beginner', 'Gemiddeld', 'Gevorderd']

type MoeilijkheidTone = 'success' | 'warning' | 'danger' | 'neutral'
const MOEILIJKHEID_TONE: Record<string, MoeilijkheidTone> = {
  beginner: 'success',
  gemiddeld: 'warning',
  gevorderd: 'danger',
}

function spierSleutel(spiergroep: string) {
  return spiergroep.toLowerCase()
}

function moeilijkheidTone(m: string): MoeilijkheidTone {
  return MOEILIJKHEID_TONE[m.toLowerCase()] ?? 'neutral'
}

function OefeningPlaceholder({ rounded }: { rounded?: boolean }) {
  return (
    <div
      aria-hidden
      style={{
        height: 160,
        background: 'var(--bg-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: rounded ? 'var(--radius-card) var(--radius-card) 0 0' : 0,
        borderBottom: '1px solid var(--border)',
      }}
    >
      <Dumbbell size={40} strokeWidth={1.2} style={{ color: 'var(--text-4)' }} />
    </div>
  )
}

export default function OefeningenPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [oefeningen, setOefeningen] = useState<Oefening[]>([])
  const [spiergroepFilter, setSpiergroepFilter] = useState('Alle')
  const [moeilijkheidFilter, setMoeilijkheidFilter] = useState('Alle')
  const [zoekterm, setZoekterm] = useState('')
  const [geselecteerd, setGeselecteerd] = useState<Oefening | null>(null)

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data } = await supabase
        .from('fitness_oefeningen')
        .select('*')
        .order('naam')

      if (data) setOefeningen(data as Oefening[])
      setLoading(false)
    }
    init()
  }, [router])

  const gefilterd = oefeningen.filter(o => {
    const spierMatch = spiergroepFilter === 'Alle' || o.spiergroep.toLowerCase() === spiergroepFilter.toLowerCase()
    const moeilMatch = moeilijkheidFilter === 'Alle' || o.moeilijkheid.toLowerCase() === moeilijkheidFilter.toLowerCase()
    const zoekMatch = !zoekterm || o.naam.toLowerCase().includes(zoekterm.toLowerCase())
    return spierMatch && moeilMatch && zoekMatch
  })

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
        <Navbar />
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 96 }}>
          <div className="mf-spinner" role="status" aria-label="Oefeningen laden" />
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)', paddingBottom: 48 }}>
      <Navbar />
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 16px 0' }}>

        <header style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-1)', margin: '0 0 4px', letterSpacing: '-0.03em' }}>
            Oefeningen bibliotheek
          </h1>
          <p style={{ color: 'var(--text-3)', fontSize: 15 }}>Bekijk uitvoering, spiergroepen en moeilijkheidsgraad per oefening</p>
        </header>

        <Card style={{ padding: '16px 20px', marginBottom: 28 }}>
          <label htmlFor="oefening-zoek" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>
            Zoek een oefening
          </label>
          <div style={{ position: 'relative', marginBottom: 16 }}>
            <Search size={16} aria-hidden style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-4)', pointerEvents: 'none' }} />
            <Input
              id="oefening-zoek"
              type="search"
              placeholder="bijv. bankdrukken"
              value={zoekterm}
              onChange={e => setZoekterm(e.target.value)}
              style={{ paddingLeft: 36 }}
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <p id="filter-spiergroep" style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 8, fontWeight: 700, letterSpacing: '0.04em' }}>SPIERGROEP</p>
            <div role="group" aria-labelledby="filter-spiergroep" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {SPIERGROEPEN.map(s => {
                const actief = spiergroepFilter === s
                return (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={actief}
                    onClick={() => setSpiergroepFilter(s)}
                    className="mf-pressable"
                    style={{
                      padding: '6px 14px', borderRadius: 20, cursor: 'pointer', fontSize: 13, fontWeight: 600,
                      background: actief ? 'var(--mentaforce-primary)' : 'var(--bg-subtle)',
                      color: actief ? 'var(--bg-app)' : 'var(--text-2)',
                      border: `1px solid ${actief ? 'var(--mentaforce-primary)' : 'var(--border-strong)'}`,
                      transition: 'background 0.15s var(--ease)',
                    }}
                  >{s}</button>
                )
              })}
            </div>
          </div>

          <div>
            <p id="filter-moeilijkheid" style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 8, fontWeight: 700, letterSpacing: '0.04em' }}>MOEILIJKHEID</p>
            <div role="group" aria-labelledby="filter-moeilijkheid" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {MOEILIJKHEDEN.map(m => {
                const actief = moeilijkheidFilter === m
                return (
                  <button
                    key={m}
                    type="button"
                    aria-pressed={actief}
                    onClick={() => setMoeilijkheidFilter(m)}
                    className="mf-pressable"
                    style={{
                      padding: '6px 14px', borderRadius: 20, cursor: 'pointer', fontSize: 13, fontWeight: 600,
                      background: actief ? 'var(--mentaforce-primary)' : 'var(--bg-subtle)',
                      color: actief ? 'var(--bg-app)' : 'var(--text-2)',
                      border: `1px solid ${actief ? 'var(--mentaforce-primary)' : 'var(--border-strong)'}`,
                      transition: 'background 0.15s var(--ease)',
                    }}
                  >{m}</button>
                )
              })}
            </div>
          </div>
        </Card>

        {oefeningen.length === 0 ? (
          <Card>
            <EmptyState
              icon={BookOpen}
              title="Bibliotheek nog leeg"
              description="De bibliotheek wordt gevuld naarmate je schema's genereert. Genereer je eerste schema om oefeningen toe te voegen."
            />
          </Card>
        ) : gefilterd.length === 0 ? (
          <Card>
            <EmptyState
              icon={Search}
              title="Geen oefeningen gevonden"
              description="Geen oefeningen gevonden voor deze filters."
            />
          </Card>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
            {gefilterd.map(oefening => (
              <Card
                key={oefening.id}
                interactive
                onClick={() => setGeselecteerd(oefening)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setGeselecteerd(oefening) } }}
                role="button"
                aria-label={`Bekijk oefening ${oefening.naam}`}
                style={{ overflow: 'hidden' }}
              >
                {oefening.image_url ? (
                  <img src={oefening.image_url} alt="" style={{ width: '100%', height: 160, objectFit: 'cover' }} />
                ) : (
                  <OefeningPlaceholder rounded />
                )}
                <div style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
                    <Badge variant="neutral">{oefening.spiergroep}</Badge>
                    <Badge variant={moeilijkheidTone(oefening.moeilijkheid)}>{oefening.moeilijkheid}</Badge>
                  </div>
                  <p style={{ fontWeight: 700, color: 'var(--text-1)', fontSize: 15, marginBottom: 6 }}>{oefening.naam}</p>
                  {oefening.beschrijving && (
                    <p style={{ color: 'var(--text-3)', fontSize: 13, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {oefening.beschrijving}
                    </p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      <DialogRoot open={geselecteerd !== null} onOpenChange={(open) => { if (!open) setGeselecteerd(null) }}>
        {geselecteerd && (
          <DialogContent closeLabel="Sluiten" style={{ width: 'min(92vw, 560px)', padding: 0 }}>
            {geselecteerd.image_url ? (
              <img src={geselecteerd.image_url} alt="" style={{ width: '100%', height: 220, objectFit: 'cover', borderRadius: 'var(--radius-card) var(--radius-card) 0 0' }} />
            ) : (
              <div style={{ borderRadius: 'var(--radius-card) var(--radius-card) 0 0', overflow: 'hidden' }}>
                <OefeningPlaceholder />
              </div>
            )}

            <div style={{ padding: '20px 24px 28px' }}>
              <DialogTitle style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>
                {geselecteerd.naam}
              </DialogTitle>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '12px 0 16px' }}>
                <Badge variant="neutral">{geselecteerd.spiergroep}</Badge>
                <Badge variant={moeilijkheidTone(geselecteerd.moeilijkheid)}>{geselecteerd.moeilijkheid}</Badge>
              </div>

              {geselecteerd.beschrijving && (
                <DialogDescription style={{ color: 'var(--text-2)', fontSize: 15, lineHeight: 1.6, margin: '0 0 20px' }}>
                  {geselecteerd.beschrijving}
                </DialogDescription>
              )}

              {geselecteerd.uitvoering_stappen && geselecteerd.uitvoering_stappen.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)', marginBottom: 10 }}>Uitvoering</h3>
                  <ol style={{ paddingLeft: 20, margin: 0 }}>
                    {geselecteerd.uitvoering_stappen.map((stap, i) => (
                      <li key={i} style={{ color: 'var(--text-2)', fontSize: 14, lineHeight: 1.6, marginBottom: 6 }}>{stap}</li>
                    ))}
                  </ol>
                </div>
              )}

              {geselecteerd.benodigdheden && geselecteerd.benodigdheden.length > 0 && (
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)', marginBottom: 10 }}>Benodigdheden</h3>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {geselecteerd.benodigdheden.map((item, i) => (
                      <Badge key={i} variant="neutral">{item}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        )}
      </DialogRoot>
    </div>
  )
}
