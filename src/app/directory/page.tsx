'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import { Avatar } from '@/components/Avatar'

type Medewerker = {
  id: string
  naam: string
  email: string
  rol: string
  afdeling: string | null
  functie: string | null
  telefoon: string | null
  avatar_url: string | null
  locatie: string | null
}

const ROL_LABELS: Record<string, string> = {
  admin: 'Administrator',
  hr: 'HR Manager',
  medewerker: 'Medewerker',
}

const ROL_KLEUR: Record<string, { bg: string; color: string }> = {
  admin:      { bg: '#EDE9FE', color: '#5B21B6' },
  hr:         { bg: '#E6F1FB', color: '#185FA5' },
  medewerker: { bg: '#F3F4F6', color: '#4B5563' },
}

export default function DirectoryPage() {
  const router = useRouter()
  const [laden, setLaden] = useState(true)
  const [medewerkers, setMedewerkers] = useState<Medewerker[]>([])
  const [zoekterm, setZoekterm] = useState('')
  const [rolFilter, setRolFilter] = useState('alle')
  const [geselecteerd, setGeselecteerd] = useState<Medewerker | null>(null)
  const [mijnId, setMijnId] = useState('')

  useEffect(() => {
    async function laad() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setMijnId(user.id)

      const { data: profiel } = await supabase
        .from('profiles').select('bedrijf_id').eq('id', user.id).single()

      if (!profiel?.bedrijf_id) { setLaden(false); return }

      const { data } = await supabase
        .from('profiles')
        .select('id, naam, email, rol, afdeling, functie, telefoon, avatar_url, locatie')
        .eq('bedrijf_id', profiel.bedrijf_id)
        .order('naam')

      if (data) setMedewerkers(data as Medewerker[])
      setLaden(false)
    }
    laad()
  }, [router])

  const gefilterd = medewerkers
    .filter(m => {
      const s = zoekterm.toLowerCase()
      return (m.naam?.toLowerCase().includes(s) ||
        m.email?.toLowerCase().includes(s) ||
        m.functie?.toLowerCase().includes(s) ||
        m.afdeling?.toLowerCase().includes(s))
    })
    .filter(m => rolFilter === 'alle' || m.rol === rolFilter)

  const rollen = ['alle', ...Array.from(new Set(medewerkers.map(m => m.rol).filter(Boolean)))]

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-app)' }}>
      <Navbar />
      <main className="max-w-5xl mx-auto px-6 py-6 mf-safe-bottom">

        {/* Header */}
        <div className="mb-5">
          <h1 className="text-xl font-bold text-gray-900">Medewerkersgids</h1>
          <p className="text-sm text-gray-400 mt-0.5">{medewerkers.length} collega{medewerkers.length !== 1 ? "'s" : ''}</p>
        </div>

        {/* Zoekbalk */}
        <div className="relative mb-3">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input
            type="text"
            placeholder="Zoek op naam, functie of afdeling..."
            value={zoekterm}
            onChange={e => setZoekterm(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-gray-400"
            style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
          />
        </div>

        {/* Rol filter pills */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          {rollen.map(r => (
            <button
              key={r}
              onClick={() => setRolFilter(r)}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition"
              style={{
                background: rolFilter === r ? '#0F172A' : 'white',
                color: rolFilter === r ? 'white' : '#6b7280',
                borderColor: rolFilter === r ? '#0F172A' : '#e5e7eb',
              }}>
              {r === 'alle' ? 'Alle' : ROL_LABELS[r] ?? r}
            </button>
          ))}
        </div>

        {/* Profiel detail overlay */}
        {geselecteerd && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.4)' }}
            onClick={() => setGeselecteerd(null)}>
            <div className="bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl p-6 pb-10"
              style={{ boxShadow: '0 -4px 30px rgba(0,0,0,0.15)' }}
              onClick={e => e.stopPropagation()}>
              <div className="flex justify-end mb-2">
                <button onClick={() => setGeselecteerd(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
              </div>

              <div className="flex flex-col items-center mb-5">
                <Avatar naam={geselecteerd.naam || '?'} avatarUrl={geselecteerd.avatar_url} size={72} />
                <h2 className="text-xl font-bold text-gray-900 mt-3">{geselecteerd.naam}</h2>
                {geselecteerd.functie && <p className="text-sm text-gray-500 mt-0.5">{geselecteerd.functie}</p>}
                <span className="mt-2 text-xs font-semibold px-3 py-1 rounded-full"
                  style={ROL_KLEUR[geselecteerd.rol] ?? { bg: '#F3F4F6', color: '#6b7280' }}>
                  {ROL_LABELS[geselecteerd.rol] ?? geselecteerd.rol}
                </span>
              </div>

              <div className="flex flex-col gap-3">
                {geselecteerd.afdeling && (
                  <div className="flex items-center gap-3 py-2.5 border-b border-gray-100">
                    <span className="text-xl w-8">🏢</span>
                    <div>
                      <p className="text-xs text-gray-400">Afdeling</p>
                      <p className="text-sm font-medium text-gray-800">{geselecteerd.afdeling}</p>
                    </div>
                  </div>
                )}
                {geselecteerd.email && (
                  <a href={`mailto:${geselecteerd.email}`}
                    className="flex items-center gap-3 py-2.5 border-b border-gray-100 hover:bg-gray-50 rounded-xl transition">
                    <span className="text-xl w-8">✉️</span>
                    <div>
                      <p className="text-xs text-gray-400">E-mail</p>
                      <p className="text-sm font-medium text-blue-600">{geselecteerd.email}</p>
                    </div>
                  </a>
                )}
                {geselecteerd.telefoon && (
                  <a href={`tel:${geselecteerd.telefoon}`}
                    className="flex items-center gap-3 py-2.5 border-b border-gray-100 hover:bg-gray-50 rounded-xl transition">
                    <span className="text-xl w-8">📞</span>
                    <div>
                      <p className="text-xs text-gray-400">Telefoon</p>
                      <p className="text-sm font-medium text-blue-600">{geselecteerd.telefoon}</p>
                    </div>
                  </a>
                )}
                {geselecteerd.locatie && (
                  <div className="flex items-center gap-3 py-2.5">
                    <span className="text-xl w-8">📍</span>
                    <div>
                      <p className="text-xs text-gray-400">Locatie</p>
                      <p className="text-sm font-medium text-gray-800">{geselecteerd.locatie}</p>
                    </div>
                  </div>
                )}
              </div>

              {geselecteerd.id !== mijnId && (
                <a href={`mailto:${geselecteerd.email}`}
                  className="mt-5 w-full flex items-center justify-center py-3 rounded-xl text-white font-semibold text-sm"
                  style={{ background: '#1D9E75' }}>
                  ✉️ E-mail sturen
                </a>
              )}
            </div>
          </div>
        )}

        {/* Medewerkers lijst */}
        {laden ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 rounded-full border-2 border-gray-200 animate-spin" style={{ borderTopColor: '#1D9E75' }} />
          </div>
        ) : gefilterd.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center" style={{ boxShadow: 'var(--shadow-sm)' }}>
            <p className="text-3xl mb-3">👥</p>
            <p className="text-gray-500 text-sm">
              {zoekterm ? `Geen resultaten voor "${zoekterm}"` : 'Geen collega\'s gevonden.'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {gefilterd.map(m => {
              const rolStijl = ROL_KLEUR[m.rol] ?? { bg: '#F3F4F6', color: '#6b7280' }
              return (
                <button
                  key={m.id}
                  onClick={() => setGeselecteerd(m)}
                  className="bg-white rounded-2xl px-4 py-3 flex items-center gap-3 text-left w-full transition active:scale-[0.99]"
                  style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                  <Avatar naam={m.naam || '?'} avatarUrl={m.avatar_url} size={44} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-900">{m.naam || 'Onbekend'}</p>
                      {m.id === mijnId && (
                        <span className="text-xs px-1.5 py-0.5 rounded font-medium" style={{ background: '#E1F5EE', color: '#0F6E56' }}>
                          jij
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 truncate">
                      {m.functie ?? m.afdeling ?? m.email ?? '—'}
                    </p>
                  </div>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0"
                    style={rolStijl}>
                    {ROL_LABELS[m.rol] ?? m.rol}
                  </span>
                </button>
              )
            })}
            {(zoekterm || rolFilter !== 'alle') && (
              <p className="text-xs text-gray-400 text-center pt-2">{gefilterd.length} van {medewerkers.length} collega's</p>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
