'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/layout/Navbar'
import { Avatar } from '@/components/Avatar'
import { Check, AlertCircle, Copy } from 'lucide-react'

type Token = {
  id: string
  email: string
  token: string
  gebruikt: boolean
  aangemaakt_op: string
}

type Lid = {
  id: string
  naam: string
  rol: string
  avatar_url: string | null
}

export default function Team() {
  const router = useRouter()
  const [tokens, setTokens] = useState<Token[]>([])
  const [leden, setLeden] = useState<Lid[]>([])
  const [email, setEmail] = useState('')
  const [laden, setLaden] = useState(false)
  const [bezig, setBezig] = useState(true)
  const [melding, setMelding] = useState<{ type: 'success' | 'error'; tekst: string } | null>(null)
  const [gekopieerd, setGekopieerd] = useState<string | null>(null)
  const [bedrijfId, setBedrijfId] = useState<string | null>(null)
  const [actieveTab, setActieveTab] = useState<'uitnodigingen' | 'leden'>('leden')
  const [zoekterm, setZoekterm] = useState('')
  const [verwijderBevestig, setVerwijderBevestig] = useState<string | null>(null)

  useEffect(() => {
    async function laad() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: profiel } = await supabase
        .from('profiles')
        .select('bedrijf_id, rol')
        .eq('id', user.id)
        .single()

      if (!profiel?.bedrijf_id) { setBezig(false); return }
      setBedrijfId(profiel.bedrijf_id)

      await Promise.all([
        laadTokens(profiel.bedrijf_id),
        laadLeden(profiel.bedrijf_id),
      ])
      setBezig(false)
    }
    laad()
  }, [router])

  async function laadTokens(bid: string) {
    const { data } = await supabase
      .from('uitnodiging_tokens')
      .select('id, token, email, aangemaakt_op, gebruikt')
      .eq('bedrijf_id', bid)
      .eq('gebruikt', false)
      .order('aangemaakt_op', { ascending: false })
      .limit(50)
    setTokens(data || [])
  }

  async function laadLeden(bid: string) {
    const { data } = await supabase
      .from('profiles')
      .select('id, naam, rol, avatar_url')
      .eq('bedrijf_id', bid)
      .order('naam', { ascending: true })
    setLeden(data || [])
  }

  async function uitnodigen() {
    if (!email || !bedrijfId) return
    setLaden(true)
    setMelding(null)

    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from('uitnodiging_tokens')
      .insert({
        email,
        bedrijf_id: bedrijfId,
        aangemaakt_door: user?.id,
      })
      .select()
      .single()

    if (error || !data) {
      setMelding({ type: 'error', tekst: 'Er ging iets mis bij het aanmaken van de uitnodiging.' })
      setLaden(false)
      return
    }

    setMelding({ type: 'success', tekst: `Uitnodigingslink aangemaakt voor ${email}` })
    setEmail('')
    setLaden(false)
    await laadTokens(bedrijfId)
    setActieveTab('uitnodigingen')
  }

  async function intrekkenToken(id: string) {
    if (!bedrijfId) return
    const { error } = await supabase
      .from('uitnodiging_tokens')
      .delete()
      .eq('id', id)

    if (!error) await laadTokens(bedrijfId)
  }

  async function verwijderLid(id: string) {
    if (!bedrijfId) return
    const { error } = await supabase
      .from('profiles')
      .update({ bedrijf_id: null })
      .eq('id', id)

    if (error) {
      setMelding({ type: 'error', tekst: 'Verwijderen mislukt.' })
    } else {
      setMelding({ type: 'success', tekst: 'Medewerker verwijderd uit het team.' })
      setVerwijderBevestig(null)
      await laadLeden(bedrijfId)
    }
  }

  function kopieerLink(token: string) {
    const link = `${window.location.origin}/uitnodiging?token=${token}`
    navigator.clipboard.writeText(link)
    setGekopieerd(token)
    setTimeout(() => setGekopieerd(null), 2000)
  }

  const gefilterdeLeden = leden.filter(l =>
    l.naam?.toLowerCase().includes(zoekterm.toLowerCase())
  )

  const gefilterdTokens = tokens.filter(t =>
    t.email.toLowerCase().includes(zoekterm.toLowerCase())
  )

  const rolBadge: Record<string, { label: string; bg: string; color: string }> = {
    hr: { label: 'HR', bg: 'var(--mf-green-light)', color: 'var(--mf-green-dark)' },
    admin: { label: 'Admin', bg: 'var(--mf-purple-light)', color: 'var(--mf-purple)' },
    medewerker: { label: 'Medewerker', bg: 'var(--mf-blue-light)', color: 'var(--mf-blue)' },
  }

  const tabs = [
    { key: 'leden', label: `Leden (${leden.length})` },
    { key: 'uitnodigingen', label: `Uitnodigingen (${tokens.length})` },
  ]

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-app)' }}>
      <Navbar />
      <main className="p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-medium" style={{ color: 'var(--text-1)' }}>Team beheren</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-3)' }}>Beheer leden en stuur uitnodigingen.</p>
        </div>

        {melding && (
          <div
            className="rounded-2xl border p-4 mb-6 text-sm flex items-center gap-2"
            style={{
              background: melding.type === 'success' ? 'var(--mf-green-light)' : 'var(--mf-red-light)',
              borderColor: melding.type === 'success' ? 'var(--mf-green)' : 'var(--mf-red)',
              color: melding.type === 'success' ? 'var(--mf-green-dark)' : 'var(--mf-red)',
            }}
          >
            {melding.type === 'success'
              ? <Check size={16} aria-hidden="true" className="shrink-0" />
              : <AlertCircle size={16} aria-hidden="true" className="shrink-0" />}
            <span>{melding.tekst}</span>
          </div>
        )}

        {/* Uitnodigen */}
        <div className="rounded-2xl border p-6 mb-6" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <p className="text-sm font-medium mb-3" style={{ color: 'var(--text-2)' }}>Medewerker uitnodigen</p>
          <div className="flex gap-3">
            <input
              type="email"
              placeholder="e-mailadres medewerker"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && uitnodigen()}
              className="flex-1 rounded-xl px-4 py-3 text-sm outline-none transition"
              style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', color: 'var(--text-1)' }}
              onFocus={e => { e.currentTarget.style.borderColor = 'var(--mentaforce-primary)' }}
              onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)' }}
            />
            <button
              onClick={uitnodigen}
              disabled={laden || !email}
              className="rounded-xl px-5 py-3 text-sm font-medium transition disabled:opacity-30"
              style={{ background: 'var(--mentaforce-primary)', color: 'var(--bg-app)' }}
            >
              {laden ? 'Bezig...' : 'Uitnodigen'}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 rounded-xl p-1 mb-4 w-fit" style={{ background: 'var(--bg-subtle)' }}>
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => { setActieveTab(t.key as typeof actieveTab); setZoekterm('') }}
              className="px-4 py-2 rounded-lg text-sm transition"
              style={{
                background: actieveTab === t.key ? 'var(--bg-card)' : 'transparent',
                color: actieveTab === t.key ? 'var(--text-1)' : 'var(--text-3)',
                fontWeight: actieveTab === t.key ? 500 : 400,
                boxShadow: actieveTab === t.key ? 'var(--shadow-card)' : 'none',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Zoekbalk */}
        <div className="mb-4">
          <input
            type="text"
            placeholder={actieveTab === 'leden' ? 'Zoek op naam...' : 'Zoek op e-mail...'}
            value={zoekterm}
            onChange={e => setZoekterm(e.target.value)}
            className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-1)' }}
            onFocus={e => { e.currentTarget.style.borderColor = 'var(--mentaforce-primary)' }}
            onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)' }}
          />
        </div>

        <div className="rounded-2xl border p-6" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          {bezig ? (
            <div className="flex justify-center py-4">
              <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--mentaforce-primary)' }} />
            </div>
          ) : actieveTab === 'leden' ? (
            <>
              <p className="text-sm font-medium mb-4" style={{ color: 'var(--text-2)' }}>Teamleden</p>
              {gefilterdeLeden.length === 0 ? (
                <p className="text-sm" style={{ color: 'var(--text-3)' }}>{zoekterm ? 'Geen resultaten.' : 'Nog geen leden. Nodig medewerkers uit via het formulier hierboven.'}</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {gefilterdeLeden.map(lid => {
                    const badge = rolBadge[lid.rol] ?? rolBadge.medewerker
                    return (
                      <div key={lid.id}>
                        <div className="flex justify-between items-center py-3 border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
                          <div className="flex items-center gap-3">
                            <Avatar naam={lid.naam || '?'} avatarUrl={lid.avatar_url} size={32} />
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium" style={{ color: 'var(--text-2)' }}>{lid.naam || 'Onbekend'}</p>
                                <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: badge.bg, color: badge.color }}>
                                  {badge.label}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/team/${lid.id}`}
                              className="text-xs rounded-lg px-3 py-1.5 transition"
                              style={{ border: '1px solid var(--border)', color: 'var(--text-2)' }}
                            >
                              Profiel
                            </Link>
                            {lid.rol === 'medewerker' && (
                              verwijderBevestig === lid.id ? (
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => verwijderLid(lid.id)}
                                    className="text-xs px-3 py-1.5 rounded-lg transition font-medium"
                                    style={{ background: 'var(--mf-red-light)', color: 'var(--mf-red)' }}
                                  >
                                    Bevestig
                                  </button>
                                  <button
                                    onClick={() => setVerwijderBevestig(null)}
                                    className="text-xs rounded-lg px-2 py-1.5 transition"
                                    style={{ border: '1px solid var(--border)', color: 'var(--text-3)' }}
                                  >
                                    Annuleer
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setVerwijderBevestig(lid.id)}
                                  className="text-xs rounded-lg px-3 py-1.5 transition"
                                  style={{ border: '1px solid var(--border)', color: 'var(--text-3)' }}
                                >
                                  Verwijder
                                </button>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          ) : (
            <>
              <p className="text-sm font-medium mb-4" style={{ color: 'var(--text-2)' }}>Uitnodigingen</p>
              {gefilterdTokens.length === 0 ? (
                <p className="text-sm" style={{ color: 'var(--text-3)' }}>{zoekterm ? 'Geen resultaten.' : 'Nog geen uitnodigingen verstuurd.'}</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {gefilterdTokens.map(t => (
                    <div key={t.id} className="flex justify-between items-center py-3 border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
                      <div>
                        <p className="text-sm" style={{ color: 'var(--text-2)' }}>{t.email}</p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
                          {new Date(t.aangemaakt_op).toLocaleDateString('nl-BE')} ·{' '}
                          {t.gebruikt
                            ? <span style={{ color: 'var(--mf-green)' }}>Geactiveerd</span>
                            : <span style={{ color: 'var(--mf-amber)' }}>Nog niet gebruikt</span>
                          }
                        </p>
                      </div>
                      {!t.gebruikt ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => kopieerLink(t.token)}
                            className="text-xs rounded-lg px-3 py-1.5 transition inline-flex items-center gap-1.5"
                            style={{ border: '1px solid var(--border)', color: 'var(--text-2)' }}
                          >
                            {gekopieerd === t.token
                              ? <><Check size={13} aria-hidden="true" /> Gekopieerd</>
                              : <><Copy size={13} aria-hidden="true" /> Kopieer link</>}
                          </button>
                          <button
                            onClick={() => intrekkenToken(t.id)}
                            className="text-xs rounded-lg px-3 py-1.5 transition"
                            style={{ border: '1px solid var(--border)', color: 'var(--text-3)' }}
                          >
                            Intrekken
                          </button>
                        </div>
                      ) : (
                        <Check size={16} aria-label="Geactiveerd" style={{ color: 'var(--mf-green)' }} />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}
