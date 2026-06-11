'use client'

export const dynamic = 'force-dynamic'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/layout/Navbar'

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

const SPIERGROEP_EMOJI: Record<string, string> = {
  borst: '💪', rug: '🏋️', schouders: '🔼', armen: '💪', benen: '🦵', core: '⭕', cardio: '❤️'
}

const SPIERGROEP_KLEUR: Record<string, string> = {
  borst: '#fee2e2', rug: '#dbeafe', schouders: '#fef3c7', armen: '#f3e8ff',
  benen: '#dcfce7', core: '#fff7ed', cardio: '#fce7f3'
}

const MOEILIJKHEID_KLEUR: Record<string, { bg: string; text: string }> = {
  beginner: { bg: '#f0fdf4', text: '#1D9E75' },
  gemiddeld: { bg: '#fff7ed', text: '#F97316' },
  gevorderd: { bg: '#fef2f2', text: '#ef4444' },
}

function spierSleutel(spiergroep: string) {
  return spiergroep.toLowerCase()
}

function OefeningPlaceholder({ spiergroep }: { spiergroep: string }) {
  const sleutel = spierSleutel(spiergroep)
  const emoji = SPIERGROEP_EMOJI[sleutel] || '🏃'
  const achtergrond = SPIERGROEP_KLEUR[sleutel] || '#f3f4f6'
  return (
    <div style={{ height: 160, background: achtergrond, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px 12px 0 0', fontSize: 48 }}>
      {emoji}
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
      <div style={{ minHeight: '100vh', background: 'var(--bg-app)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Navbar />
        <p style={{ color: '#6b7280', marginTop: 80 }}>Laden...</p>
      </div>
    )
  }

  const moeilSleutel = (m: string) => m.toLowerCase() as keyof typeof MOEILIJKHEID_KLEUR
  const moeilKleur = (m: string) => MOEILIJKHEID_KLEUR[moeilSleutel(m)] || { bg: '#f3f4f6', text: '#6b7280' }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)', paddingBottom: 48 }}>
      <Navbar />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 16px 0' }}>

        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>
            Oefeningen bibliotheek
          </h1>
          <p style={{ color: '#6b7280', fontSize: 15 }}>Bekijk uitvoering, spiergroepen en moeilijkheidsgraad per oefening</p>
        </div>

        <div style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', marginBottom: 28, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
          <input
            type="text"
            placeholder="Zoek een oefening..."
            value={zoekterm}
            onChange={e => setZoekterm(e.target.value)}
            style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 15, outline: 'none', marginBottom: 16, boxSizing: 'border-box' }}
          />

          <div style={{ marginBottom: 12 }}>
            <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 8, fontWeight: 600 }}>SPIERGROEP</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {SPIERGROEPEN.map(s => (
                <button
                  key={s}
                  onClick={() => setSpiergroepFilter(s)}
                  style={{
                    padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                    background: spiergroepFilter === s ? '#1D9E75' : '#f3f4f6',
                    color: spiergroepFilter === s ? '#fff' : '#374151',
                    transition: 'background 0.15s'
                  }}
                >{s}</button>
              ))}
            </div>
          </div>

          <div>
            <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 8, fontWeight: 600 }}>MOEILIJKHEID</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {MOEILIJKHEDEN.map(m => (
                <button
                  key={m}
                  onClick={() => setMoeilijkheidFilter(m)}
                  style={{
                    padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                    background: moeilijkheidFilter === m ? '#185FA5' : '#f3f4f6',
                    color: moeilijkheidFilter === m ? '#fff' : '#374151',
                    transition: 'background 0.15s'
                  }}
                >{m}</button>
              ))}
            </div>
          </div>
        </div>

        {oefeningen.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 12, padding: 48, textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
            <p style={{ fontSize: 40, marginBottom: 16 }}>📚</p>
            <p style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 8 }}>Bibliotheek nog leeg</p>
            <p style={{ color: '#6b7280', fontSize: 15, maxWidth: 400, margin: '0 auto' }}>
              De bibliotheek wordt gevuld naarmate je schema&apos;s genereert. Genereer je eerste schema om oefeningen toe te voegen.
            </p>
          </div>
        ) : gefilterd.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 12, padding: 40, textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
            <p style={{ color: '#6b7280' }}>Geen oefeningen gevonden voor deze filters.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
            {gefilterd.map(oefening => {
              const mk = moeilKleur(oefening.moeilijkheid)
              const spierSleutelStr = spierSleutel(oefening.spiergroep)
              const spierAchtergrond = SPIERGROEP_KLEUR[spierSleutelStr] || '#f3f4f6'
              return (
                <div
                  key={oefening.id}
                  onClick={() => setGeselecteerd(oefening)}
                  style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', cursor: 'pointer', overflow: 'hidden', transition: 'transform 0.15s, box-shadow 0.15s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'none'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.07)' }}
                >
                  {oefening.image_url ? (
                    <img src={oefening.image_url} alt={oefening.naam} style={{ width: '100%', height: 160, objectFit: 'cover' }} />
                  ) : (
                    <OefeningPlaceholder spiergroep={oefening.spiergroep} />
                  )}
                  <div style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
                      <span style={{ background: spierAchtergrond, color: '#374151', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>
                        {oefening.spiergroep}
                      </span>
                      <span style={{ background: mk.bg, color: mk.text, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>
                        {oefening.moeilijkheid}
                      </span>
                    </div>
                    <p style={{ fontWeight: 700, color: '#111827', fontSize: 15, marginBottom: 6 }}>{oefening.naam}</p>
                    {oefening.beschrijving && (
                      <p style={{ color: '#6b7280', fontSize: 13, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {oefening.beschrijving}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {geselecteerd && (
        <div
          onClick={() => setGeselecteerd(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: '#fff', borderRadius: 16, maxWidth: 560, width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }}
          >
            {geselecteerd.image_url ? (
              <img src={geselecteerd.image_url} alt={geselecteerd.naam} style={{ width: '100%', height: 220, objectFit: 'cover', borderRadius: '16px 16px 0 0' }} />
            ) : (
              <div style={{ borderRadius: '16px 16px 0 0', overflow: 'hidden' }}>
                <OefeningPlaceholder spiergroep={geselecteerd.spiergroep} />
              </div>
            )}

            <div style={{ padding: '20px 24px 28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: '#111827', flex: 1, marginRight: 16 }}>{geselecteerd.naam}</h2>
                <button
                  onClick={() => setGeselecteerd(null)}
                  style={{ background: '#f3f4f6', border: 'none', borderRadius: 8, width: 36, height: 36, fontSize: 18, cursor: 'pointer', color: '#374151', flexShrink: 0 }}
                >✕</button>
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                <span style={{ background: SPIERGROEP_KLEUR[spierSleutel(geselecteerd.spiergroep)] || '#f3f4f6', color: '#374151', borderRadius: 20, padding: '4px 12px', fontSize: 13, fontWeight: 600 }}>
                  {geselecteerd.spiergroep}
                </span>
                <span style={{ background: moeilKleur(geselecteerd.moeilijkheid).bg, color: moeilKleur(geselecteerd.moeilijkheid).text, borderRadius: 20, padding: '4px 12px', fontSize: 13, fontWeight: 600 }}>
                  {geselecteerd.moeilijkheid}
                </span>
              </div>

              {geselecteerd.beschrijving && (
                <p style={{ color: '#374151', fontSize: 15, lineHeight: 1.6, marginBottom: 20 }}>{geselecteerd.beschrijving}</p>
              )}

              {geselecteerd.uitvoering_stappen && geselecteerd.uitvoering_stappen.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 10 }}>Uitvoering</h3>
                  <ol style={{ paddingLeft: 20, margin: 0 }}>
                    {geselecteerd.uitvoering_stappen.map((stap, i) => (
                      <li key={i} style={{ color: '#374151', fontSize: 14, lineHeight: 1.6, marginBottom: 6 }}>{stap}</li>
                    ))}
                  </ol>
                </div>
              )}

              {geselecteerd.benodigdheden && geselecteerd.benodigdheden.length > 0 && (
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 10 }}>Benodigdheden</h3>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {geselecteerd.benodigdheden.map((item, i) => (
                      <span key={i} style={{ background: '#f3f4f6', color: '#374151', borderRadius: 20, padding: '4px 12px', fontSize: 13 }}>{item}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
