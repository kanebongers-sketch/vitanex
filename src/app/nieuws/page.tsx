'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/layout/Navbar'

type NieuwsType = 'aankondiging' | 'beleid' | 'evenement' | 'resultaten' | 'overig'
type NieuwsBericht = {
  id: string
  titel: string
  inhoud: string
  type: NieuwsType
  gepubliceerd_op: string
  auteur_naam: string
  belangrijk: boolean
}

const TYPE_STIJL: Record<NieuwsType, { emoji: string; bg: string; color: string; label: string }> = {
  aankondiging: { emoji: '📣', bg: 'var(--mf-blue-light)', color: 'var(--mf-blue)', label: 'Aankondiging' },
  beleid:       { emoji: '📋', bg: 'var(--mf-amber-light)', color: 'var(--mf-amber-dark)', label: 'Beleid' },
  evenement:    { emoji: '🎉', bg: '#EDE9FE', color: '#5B21B6', label: 'Evenement' },
  resultaten:   { emoji: '📈', bg: 'var(--mf-green-light)', color: 'var(--mf-green-dark)', label: 'Resultaten' },
  overig:       { emoji: '💬', bg: 'var(--bg-subtle)', color: 'var(--text-2)', label: 'Overig' },
}

export default function NieuwsPage() {
  const router = useRouter()
  const [laden, setLaden] = useState(true)
  const [berichten, setBerichten] = useState<NieuwsBericht[]>([])
  const [isHr, setIsHr] = useState(false)
  const [bedrijfId, setBedrijfId] = useState<string | null>(null)
  const [userId, setUserId] = useState('')
  const [formulier, setFormulier] = useState(false)
  const [opslaan, setOpslaan] = useState(false)
  const [uitgevouwen, setUitgevouwen] = useState<string | null>(null)

  const [titel, setTitel] = useState('')
  const [inhoud, setInhoud] = useState('')
  const [type, setType] = useState<NieuwsType>('aankondiging')
  const [belangrijk, setBelangrijk] = useState(false)

  useEffect(() => {
    async function laad() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)

      const { data: profiel } = await supabase
        .from('profiles').select('bedrijf_id, rol').eq('id', user.id).single()
      setBedrijfId(profiel?.bedrijf_id ?? null)
      setIsHr(profiel?.rol === 'hr' || profiel?.rol === 'admin')

      if (!profiel?.bedrijf_id) { setLaden(false); return }

      const { data } = await supabase
        .from('bedrijf_nieuws')
        .select('*, profiles!auteur_id(naam)')
        .eq('bedrijf_id', profiel.bedrijf_id)
        .order('gepubliceerd_op', { ascending: false })

      if (data) {
        setBerichten((data as unknown as (NieuwsBericht & { profiles: { naam: string } | null })[]).map(b => ({
          ...b,
          auteur_naam: b.profiles?.naam ?? 'HR',
        })))
      }
      setLaden(false)
    }
    laad()
  }, [router])

  async function publiceren() {
    if (!titel.trim() || !inhoud.trim()) return
    setOpslaan(true)

    const { data, error } = await supabase.from('bedrijf_nieuws').insert({
      bedrijf_id: bedrijfId,
      auteur_id: userId,
      titel: titel.trim(),
      inhoud: inhoud.trim(),
      type,
      belangrijk,
      gepubliceerd_op: new Date().toISOString(),
    }).select('*, profiles!auteur_id(naam)').single()

    if (!error && data) {
      const d = data as unknown as NieuwsBericht & { profiles: { naam: string } | null }
      const nieuw: NieuwsBericht = { ...d, auteur_naam: d.profiles?.naam ?? 'HR' }
      setBerichten(prev => [nieuw, ...prev])
      setFormulier(false)
      setTitel(''); setInhoud(''); setType('aankondiging'); setBelangrijk(false)
    }
    setOpslaan(false)
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-app)' }}>
      <Navbar />
      <main className="px-6 py-6 mf-safe-bottom">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Bedrijfsnieuws</h1>
            <p className="text-sm text-gray-400 mt-0.5">Updates van jouw organisatie</p>
          </div>
          {isHr && (
            <button onClick={() => setFormulier(true)}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ background: 'var(--mf-blue)' }}>
              + Plaatsen
            </button>
          )}
        </div>

        {/* HR Formulier */}
        {formulier && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.4)' }}>
            <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl p-6 pb-10 max-h-[90vh] overflow-y-auto"
              style={{ boxShadow: '0 -4px 30px rgba(0,0,0,0.15)' }}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold text-gray-900">Bericht plaatsen</h2>
                <button onClick={() => setFormulier(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
              </div>

              <div className="mb-4">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Type</label>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(TYPE_STIJL) as NieuwsType[]).map(t => {
                    const s = TYPE_STIJL[t]
                    return (
                      <button key={t} onClick={() => setType(t)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition"
                        style={{
                          background: type === t ? s.bg : 'white',
                          borderColor: type === t ? s.color : 'var(--border)',
                          color: type === t ? s.color : 'var(--text-3)',
                        }}>
                        {s.emoji} {s.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="mb-4">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Titel</label>
                <input type="text" value={titel} onChange={e => setTitel(e.target.value)}
                  placeholder="Geef een duidelijke titel..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400" />
              </div>

              <div className="mb-4">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Inhoud</label>
                <textarea rows={5} value={inhoud} onChange={e => setInhoud(e.target.value)}
                  placeholder="Schrijf hier het bericht..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none resize-none focus:border-blue-400" />
              </div>

              <label className="flex items-center gap-3 mb-5 cursor-pointer">
                <div className="relative">
                  <input type="checkbox" checked={belangrijk} onChange={e => setBelangrijk(e.target.checked)} className="sr-only" />
                  <div className="w-10 h-6 rounded-full transition"
                    style={{ background: belangrijk ? 'var(--mf-blue)' : 'var(--text-4)' }}>
                    <div className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform"
                      style={{ transform: belangrijk ? 'translateX(16px)' : 'translateX(0)' }} />
                  </div>
                </div>
                <span className="text-sm text-gray-700">Markeren als belangrijk</span>
              </label>

              <button onClick={publiceren} disabled={opslaan || !titel.trim() || !inhoud.trim()}
                className="w-full py-3 rounded-xl text-white font-semibold text-sm disabled:opacity-40 transition"
                style={{ background: 'var(--mf-blue)' }}>
                {opslaan ? 'Plaatsen...' : 'Publiceren'}
              </button>
            </div>
          </div>
        )}

        {/* Berichten */}
        {laden ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 rounded-full border-2 border-gray-200 animate-spin" style={{ borderTopColor: 'var(--mf-blue)' }} />
          </div>
        ) : berichten.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center" style={{ boxShadow: 'var(--shadow-sm)' }}>
            <p className="text-4xl mb-3">📰</p>
            <p className="text-gray-500 text-sm">Nog geen berichten geplaatst.</p>
            {isHr && <p className="text-gray-400 text-xs mt-1">Klik op &apos;+ Plaatsen&apos; om een bericht toe te voegen.</p>}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {berichten.map(b => {
              const stijl = TYPE_STIJL[b.type as NieuwsType] ?? TYPE_STIJL.overig
              const isOpen = uitgevouwen === b.id
              return (
                <div key={b.id}
                  className="bg-white rounded-2xl overflow-hidden"
                  style={{
                    boxShadow: 'var(--shadow-sm)',
                    borderLeft: b.belangrijk ? '4px solid #185FA5' : '4px solid transparent',
                  }}>
                  {b.belangrijk && (
                    <div className="px-4 py-2 text-xs font-bold flex items-center gap-1.5"
                      style={{ background: 'var(--mf-blue-light)', color: 'var(--mf-blue)' }}>
                      ⚡ Belangrijk bericht
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-start gap-3 mb-2">
                      <span className="text-2xl flex-shrink-0 mt-0.5">{stijl.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                            style={{ background: stijl.bg, color: stijl.color }}>
                            {stijl.label}
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(b.gepubliceerd_op).toLocaleDateString('nl-BE', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </span>
                        </div>
                        <h3 className="text-sm font-semibold text-gray-900 leading-snug">{b.titel}</h3>
                      </div>
                    </div>

                    <div className={`text-sm text-gray-600 leading-relaxed ml-9 ${isOpen ? '' : 'line-clamp-3'}`}>
                      {b.inhoud}
                    </div>

                    {b.inhoud.length > 150 && (
                      <button
                        onClick={() => setUitgevouwen(isOpen ? null : b.id)}
                        className="mt-2 ml-9 text-xs font-medium"
                        style={{ color: 'var(--mf-blue)' }}>
                        {isOpen ? 'Minder tonen ↑' : 'Meer lezen →'}
                      </button>
                    )}

                    <p className="text-xs text-gray-400 mt-3 ml-9">
                      Geplaatst door <span className="font-medium text-gray-600">{b.auteur_naam}</span>
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
