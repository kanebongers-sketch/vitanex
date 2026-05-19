'use client'

export const dynamic = 'force-dynamic'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'

type FitbitData = {
  stappen: number | null
  slaapMinuten: number | null
  slaapKwaliteit: number | null
  hartslag: number | null
  calorieën: number | null
}

type CalendarData = {
  aantalAfspraken: number
  totalMeetingMinuten: number
  vandaagAfspraken: string[]
  werkLast: 'laag' | 'gemiddeld' | 'hoog'
  balansScore: number
}

function StatusBadge({ connected }: { connected: boolean }) {
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
      connected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
    }`}>
      {connected ? '● Gekoppeld' : '○ Niet gekoppeld'}
    </span>
  )
}

function DataRij({ label, waarde, eenheid }: { label: string; waarde: string | number | null; eenheid?: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-semibold text-gray-900">
        {waarde !== null ? `${waarde}${eenheid ? ' ' + eenheid : ''}` : '—'}
      </span>
    </div>
  )
}

function KoppelingenInhoud() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [userId, setUserId] = useState<string | null>(null)
  const [laden, setLaden] = useState(true)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; tekst: string } | null>(null)

  const [fitbitData, setFitbitData] = useState<FitbitData | null>(null)
  const [fitbitVerbonden, setFitbitVerbonden] = useState(false)
  const [fitbitLaden, setFitbitLaden] = useState(false)

  const [calData, setCalData] = useState<CalendarData | null>(null)
  const [calVerbonden, setCalVerbonden] = useState(false)
  const [calLaden, setCalLaden] = useState(false)

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)

      const fitbitToken   = searchParams.get('fitbit_access_token')
      const googleToken   = searchParams.get('google_access_token')
      const fitbitConnected = searchParams.get('fitbit_connected')
      const googleConnected = searchParams.get('google_connected')
      const error         = searchParams.get('error')

      if (error) {
        setToast({ type: 'error', tekst: error === 'fitbit_denied' ? 'Fitbit koppeling geweigerd' : error === 'google_denied' ? 'Google koppeling geweigerd' : 'Koppeling mislukt' })
      }

      if (fitbitToken) {
        const expiresIn = Number(searchParams.get('fitbit_expires_in') ?? 28800)
        await supabase.from('wearable_tokens').upsert({
          user_id: user.id, provider: 'fitbit',
          access_token: fitbitToken,
          refresh_token: searchParams.get('fitbit_refresh_token') ?? null,
          expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
          bijgewerkt_op: new Date().toISOString(),
        }, { onConflict: 'user_id,provider' })
        setToast({ type: 'success', tekst: 'Fitbit succesvol gekoppeld!' })
      } else if (fitbitConnected) {
        setToast({ type: 'success', tekst: 'Fitbit succesvol gekoppeld!' })
      }

      if (googleToken) {
        const expiresIn = Number(searchParams.get('google_expires_in') ?? 3600)
        await supabase.from('wearable_tokens').upsert({
          user_id: user.id, provider: 'google_calendar',
          access_token: googleToken,
          refresh_token: searchParams.get('google_refresh_token') ?? null,
          expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
          bijgewerkt_op: new Date().toISOString(),
        }, { onConflict: 'user_id,provider' })
        setToast({ type: 'success', tekst: 'Google Agenda succesvol gekoppeld!' })
      } else if (googleConnected) {
        setToast({ type: 'success', tekst: 'Google Agenda succesvol gekoppeld!' })
      }

      setFitbitLaden(true)
      fetch('/api/fitbit/data')
        .then(r => r.json())
        .then(d => { if (!d.error) { setFitbitData(d); setFitbitVerbonden(true) } })
        .catch(() => {})
        .finally(() => setFitbitLaden(false))

      setCalLaden(true)
      fetch('/api/google-calendar/data')
        .then(r => r.json())
        .then(d => { if (!d.error) { setCalData(d); setCalVerbonden(true) } })
        .catch(() => {})
        .finally(() => setCalLaden(false))

      setLaden(false)
    }
    init()
  }, [router, searchParams])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

  async function ontkoppel(provider: 'fitbit' | 'google_calendar') {
    if (!userId) return
    await supabase.from('wearable_tokens').delete().eq('user_id', userId).eq('provider', provider)
    if (provider === 'fitbit') { setFitbitVerbonden(false); setFitbitData(null) }
    else { setCalVerbonden(false); setCalData(null) }
    setToast({ type: 'success', tekst: 'Koppeling verwijderd' })
  }

  const werkLastKleur = (wl: string) => wl === 'laag' ? '#1D9E75' : wl === 'gemiddeld' ? '#F59E0B' : '#EF4444'

  if (laden) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 rounded-full border-2 border-gray-200 animate-spin" style={{ borderTopColor: '#1D9E75' }} />
    </div>
  )

  return (
    <>
      {toast && (
        <div className={`fixed top-16 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-sm font-semibold shadow-lg ${
          toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-500 text-white'
        }`}>
          {toast.tekst}
        </div>
      )}

      <main className="max-w-5xl mx-auto px-6 py-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900">Koppelingen</h2>
          <p className="text-sm text-gray-400 mt-0.5">Verbind je wearables en agenda voor persoonlijke inzichten</p>
        </div>

        {/* Fitbit */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4" style={{ boxShadow: 'var(--shadow-sm)' }}>
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: '#00B0B9' }}>⌚</div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Fitbit</p>
                <StatusBadge connected={fitbitVerbonden} />
              </div>
            </div>
            {fitbitVerbonden ? (
              <button onClick={() => ontkoppel('fitbit')} className="text-xs text-red-400 hover:text-red-600 transition font-medium">Ontkoppelen</button>
            ) : (
              <a href="/api/fitbit/auth" className="text-xs font-semibold px-4 py-2 rounded-xl text-white" style={{ background: '#00B0B9' }}>Koppelen</a>
            )}
          </div>
          {fitbitLaden ? (
            <div className="flex items-center gap-2 py-2">
              <div className="w-4 h-4 rounded-full border-2 border-gray-200 animate-spin" style={{ borderTopColor: '#00B0B9' }} />
              <span className="text-xs text-gray-400">Data ophalen…</span>
            </div>
          ) : fitbitData ? (
            <div className="mt-3 pt-3 border-t border-gray-50">
              <DataRij label="Stappen vandaag" waarde={fitbitData.stappen?.toLocaleString('nl-BE') ?? null} />
              <DataRij label="Slaap" waarde={fitbitData.slaapMinuten !== null ? Math.round(fitbitData.slaapMinuten / 60 * 10) / 10 : null} eenheid="uur" />
              <DataRij label="Slaapkwaliteit" waarde={fitbitData.slaapKwaliteit} eenheid="%" />
              <DataRij label="Rusthartslag" waarde={fitbitData.hartslag} eenheid="bpm" />
            </div>
          ) : (
            <p className="text-xs text-gray-400 mt-2">Koppel je Fitbit om stappen, slaap en hartslag te zien.</p>
          )}
        </div>

        {/* Google Calendar */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4" style={{ boxShadow: 'var(--shadow-sm)' }}>
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: '#EA4335' }}>📅</div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Google Agenda</p>
                <StatusBadge connected={calVerbonden} />
              </div>
            </div>
            {calVerbonden ? (
              <button onClick={() => ontkoppel('google_calendar')} className="text-xs text-red-400 hover:text-red-600 transition font-medium">Ontkoppelen</button>
            ) : (
              <a href="/api/google-calendar/auth" className="text-xs font-semibold px-4 py-2 rounded-xl text-white" style={{ background: '#EA4335' }}>Koppelen</a>
            )}
          </div>
          {calLaden ? (
            <div className="flex items-center gap-2 py-2">
              <div className="w-4 h-4 rounded-full border-2 border-gray-200 animate-spin" style={{ borderTopColor: '#EA4335' }} />
              <span className="text-xs text-gray-400">Agenda ophalen…</span>
            </div>
          ) : calData ? (
            <div className="mt-3 pt-3 border-t border-gray-50">
              <DataRij label="Afspraken deze week" waarde={calData.aantalAfspraken} />
              <DataRij label="Vergadertijd" waarde={Math.round(calData.totalMeetingMinuten / 60 * 10) / 10} eenheid="uur" />
              <div className="flex justify-between items-center py-2 border-b border-gray-50">
                <span className="text-sm text-gray-500">Werkdruk indicator</span>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full text-white" style={{ background: werkLastKleur(calData.werkLast) }}>
                  {calData.werkLast.charAt(0).toUpperCase() + calData.werkLast.slice(1)}
                </span>
              </div>
              {calData.vandaagAfspraken.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-gray-400 mb-1">Vandaag:</p>
                  {calData.vandaagAfspraken.slice(0, 3).map((a, i) => (
                    <p key={i} className="text-xs text-gray-700 py-0.5">• {a}</p>
                  ))}
                  {calData.vandaagAfspraken.length > 3 && (
                    <p className="text-xs text-gray-400">+{calData.vandaagAfspraken.length - 3} meer</p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-gray-400 mt-2">Koppel je Google Agenda voor werk-privébalans inzichten.</p>
          )}
        </div>

        {/* Microsoft Outlook — binnenkort */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4 opacity-60" style={{ boxShadow: 'var(--shadow-sm)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: '#0078D4' }}>📧</div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">Microsoft Outlook</p>
              <span className="text-xs bg-blue-50 text-blue-500 font-semibold px-2 py-0.5 rounded-full">Binnenkort</span>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3">Outlook agenda-integratie via Microsoft Graph API — binnenkort beschikbaar.</p>
        </div>

        {/* Apple Health */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4 opacity-60" style={{ boxShadow: 'var(--shadow-sm)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: '#FF2D55' }}>🍎</div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">Apple Health</p>
              <span className="text-xs bg-pink-50 text-pink-500 font-semibold px-2 py-0.5 rounded-full">iOS app vereist</span>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3">Apple Health koppeling is beschikbaar via de MentaForce iOS-app (HealthKit).</p>
        </div>

        {/* Admin info */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 mt-2">
          <p className="text-xs font-semibold text-blue-700 mb-2">⚙️ Voor beheerders: API-sleutels instellen</p>
          <div className="space-y-1">
            {[
              'FITBIT_CLIENT_ID + FITBIT_CLIENT_SECRET → developer.fitbit.com',
              'GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET → console.cloud.google.com',
              'NEXT_PUBLIC_APP_URL=https://mentaforce.nl',
            ].map(t => (
              <p key={t} className="text-xs text-blue-600 font-mono">{t}</p>
            ))}
          </div>
        </div>
      </main>
    </>
  )
}

export default function KoppelingenPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-app)' }}>
      <Navbar />
      <Suspense fallback={
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-gray-200 animate-spin" style={{ borderTopColor: '#1D9E75' }} />
        </div>
      }>
        <KoppelingenInhoud />
      </Suspense>
    </div>
  )
}
