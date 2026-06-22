'use client'

export const dynamic = 'force-dynamic'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { authFetch } from '@/lib/auth-fetch'
import Navbar from '@/components/layout/Navbar'
import nextDynamic from 'next/dynamic'

const GlowOrb = nextDynamic(() => import('@/components/three/GlowOrb'), { ssr: false })

import { isAndroidApp, leesHealthData, vraagPermissies, type HealthData } from '@/lib/health-connect'
import { isIosApp, vraagAppleHealthPermissies } from '@/lib/apple-health'
import { syncGezondheidsdata } from '@/lib/health-sync'

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

  const [isAndroid, setIsAndroid] = useState(false)
  const [isIos, setIsIos] = useState(false)
  const [ahVerbonden, setAhVerbonden] = useState(false)
  const [ahLaden, setAhLaden] = useState(false)
  const [fitSyncBezig, setFitSyncBezig] = useState(false)
  const [hcData, setHcData] = useState<HealthData | null>(null)
  const [hcVerbonden, setHcVerbonden] = useState(false)
  const [hcLaden, setHcLaden] = useState(false)

  const [fitbitData, setFitbitData] = useState<FitbitData | null>(null)
  const [fitbitVerbonden, setFitbitVerbonden] = useState(false)
  const [fitbitLaden, setFitbitLaden] = useState(false)

  const [calData, setCalData] = useState<CalendarData | null>(null)
  const [calVerbonden, setCalVerbonden] = useState(false)
  const [calLaden, setCalLaden] = useState(false)

  const [fitVerbonden, setFitVerbonden] = useState(false)
  const [fitLaden, setFitLaden] = useState(false)
  const [fitData, setFitData] = useState<{ stappen: number | null; slaapMinuten: number | null; hartslag: number | null } | null>(null)

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)

      const fitbitConnected = searchParams.get('fitbit_connected')
      const googleConnected = searchParams.get('google_connected')
      const fitConnected  = searchParams.get('fit_connected')
      const error         = searchParams.get('error')

      if (error) {
        const tekst = error === 'fitbit_denied' ? 'Fitbit koppeling geweigerd'
          : error === 'google_denied' ? 'Google koppeling geweigerd'
          : error === 'fit_denied' ? 'Google Fit koppeling geweigerd'
          : error.endsWith('_state') ? 'Koppeling verlopen — probeer opnieuw'
          : 'Koppeling mislukt'
        setToast({ type: 'error', tekst })
      }

      if (fitbitConnected) {
        setToast({ type: 'success', tekst: 'Fitbit succesvol gekoppeld!' })
      }

      if (googleConnected) {
        setToast({ type: 'success', tekst: 'Google Agenda succesvol gekoppeld!' })
      }

      if (fitConnected) {
        setFitVerbonden(true)
        setToast({ type: 'success', tekst: 'Google Fit succesvol gekoppeld!' })
      }

      // Check of Google Fit al gekoppeld is
      setFitLaden(true)
      supabase.from('wearable_tokens')
        .select('access_token')
        .eq('user_id', user.id)
        .eq('provider', 'google_fit')
        .maybeSingle()
        .then(({ data }) => {
          if (data?.access_token) setFitVerbonden(true)
          setFitLaden(false)
        })

      // Health Connect (alleen Android app)
      const android = isAndroidApp()
      setIsAndroid(android)
      setIsIos(isIosApp())
      try { setAhVerbonden(localStorage.getItem('mf-apple-health-verbonden') === '1') } catch { /* ok */ }
      if (android) {
        setHcLaden(true)
        leesHealthData()
          .then(d => {
            if (d.stappen !== null || d.slaapMinuten !== null || d.hartslag !== null) {
              setHcData(d)
              setHcVerbonden(true)
            }
          })
          .catch(() => {})
          .finally(() => setHcLaden(false))
      }

      setFitbitLaden(true)
      authFetch('/api/fitbit/data')
        .then(r => r.json())
        .then(d => { if (!d.error) { setFitbitData(d); setFitbitVerbonden(true) } })
        .catch(() => {})
        .finally(() => setFitbitLaden(false))

      setCalLaden(true)
      authFetch('/api/google-calendar/data')
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

  async function startKoppeling(provider: 'fitbit' | 'google-fit' | 'google-calendar') {
    try {
      const res = await authFetch(`/api/${provider}/auth`)
      const data = await res.json() as { url?: string; error?: string }
      if (!res.ok || !data.url) {
        setToast({ type: 'error', tekst: data.error ?? 'Koppeling starten mislukt' })
        return
      }
      window.location.href = data.url
    } catch {
      setToast({ type: 'error', tekst: 'Koppeling starten mislukt' })
    }
  }

  async function ontkoppel(provider: 'fitbit' | 'google_calendar' | 'google_fit') {
    if (!userId) return
    await supabase.from('wearable_tokens').delete().eq('user_id', userId).eq('provider', provider)
    if (provider === 'fitbit') { setFitbitVerbonden(false); setFitbitData(null) }
    else if (provider === 'google_fit') { setFitVerbonden(false); setFitData(null) }
    else { setCalVerbonden(false); setCalData(null) }
    setToast({ type: 'success', tekst: 'Koppeling verwijderd' })
  }

  const werkLastKleur = (wl: string) => wl === 'laag' ? 'var(--mf-green)' : wl === 'gemiddeld' ? 'var(--mf-amber)' : 'var(--mf-red)'

  if (laden) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 rounded-full border-2 border-gray-200 animate-spin" style={{ borderTopColor: 'var(--mf-green)' }} />
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

      <main className="px-6 py-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900">Koppelingen</h2>
          <p className="text-sm text-gray-400 mt-0.5">Verbind je wearables en agenda voor persoonlijke inzichten</p>
        </div>

        {/* Health Connect — alleen zichtbaar in Android app */}
        {isAndroid && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4" style={{ boxShadow: 'var(--shadow-sm)' }}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: '#4CAF50' }}>💚</div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Health Connect</p>
                  <p className="text-xs text-gray-400">Fitbit · Samsung Health · Google Fit</p>
                  <StatusBadge connected={hcVerbonden} />
                </div>
              </div>
              {!hcVerbonden && (
                <button
                  onClick={async () => {
                    setHcLaden(true)
                    const ok = await vraagPermissies()
                    if (ok) {
                      const d = await leesHealthData()
                      setHcData(d)
                      setHcVerbonden(true)
                      // Stuur direct 14 dagen historie naar je gezondheidslog
                      const uitkomst = await syncGezondheidsdata({ forceer: true })
                      if (uitkomst) setToast({ type: 'success', tekst: `${uitkomst.opgeslagen} dagen gesynchroniseerd!` })
                    }
                    setHcLaden(false)
                  }}
                  className="text-xs font-semibold px-4 py-2 rounded-xl text-white"
                  style={{ background: '#4CAF50' }}
                >
                  Koppelen
                </button>
              )}
            </div>
            {hcLaden ? (
              <div className="flex items-center gap-2 py-2">
                <div className="w-4 h-4 rounded-full border-2 border-gray-200 animate-spin" style={{ borderTopColor: '#4CAF50' }} />
                <span className="text-xs text-gray-400">Data ophalen…</span>
              </div>
            ) : hcData ? (
              <div className="mt-3 pt-3 border-t border-gray-50">
                <DataRij label="Stappen vandaag" waarde={hcData.stappen?.toLocaleString('nl-BE') ?? null} />
                <DataRij label="Slaap" waarde={hcData.slaapMinuten !== null ? Math.round(hcData.slaapMinuten / 60 * 10) / 10 : null} eenheid="uur" />
                <DataRij label="Gemiddelde hartslag" waarde={hcData.hartslag} eenheid="bpm" />
                <DataRij label="Verbrande calorieën" waarde={hcData.calorieën} eenheid="kcal" />
              </div>
            ) : (
              <p className="text-xs text-gray-400 mt-2">Koppel Health Connect om stappen, slaap en hartslag te zien van je Fitbit of Samsung Health.</p>
            )}
          </div>
        )}

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
              <button onClick={() => startKoppeling('fitbit')} className="text-xs font-semibold px-4 py-2 rounded-xl text-white" style={{ background: '#00B0B9' }}>Koppelen</button>
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

        {/* Google Fit */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4" style={{ boxShadow: 'var(--shadow-sm)' }}>
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#EA4335' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" fill="white"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Google Fit</p>
                <p className="text-xs text-gray-400">Stappen · Slaap · Hartslag</p>
                <StatusBadge connected={fitVerbonden} />
              </div>
            </div>
            {fitVerbonden ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setFitSyncBezig(true)
                    syncGezondheidsdata({ forceer: true })
                      .then(u => setToast(u
                        ? { type: 'success', tekst: `${u.opgeslagen} dagen gesynchroniseerd!` }
                        : { type: 'error', tekst: 'Synchroniseren mislukt' }))
                      .finally(() => setFitSyncBezig(false))
                  }}
                  disabled={fitSyncBezig}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white disabled:opacity-50"
                  style={{ background: 'var(--mf-green)' }}
                >{fitSyncBezig ? 'Bezig…' : '↻ Sync nu'}</button>
                <button onClick={() => ontkoppel('google_fit')} className="text-xs text-red-400 hover:text-red-600 transition font-medium">Ontkoppelen</button>
              </div>
            ) : (
              <button onClick={() => startKoppeling('google-fit')} className="text-xs font-semibold px-4 py-2 rounded-xl text-white" style={{ background: '#EA4335' }}>Koppelen</button>
            )}
          </div>
          {fitLaden ? (
            <div className="flex items-center gap-2 py-2">
              <div className="w-4 h-4 rounded-full border-2 border-gray-200 animate-spin" style={{ borderTopColor: '#EA4335' }} />
              <span className="text-xs text-gray-400">Status ophalen…</span>
            </div>
          ) : fitData ? (
            <div className="mt-3 pt-3 border-t border-gray-50">
              <DataRij label="Stappen vandaag" waarde={fitData.stappen?.toLocaleString('nl-BE') ?? null} />
              <DataRij label="Slaap" waarde={fitData.slaapMinuten !== null ? Math.round(fitData.slaapMinuten / 60 * 10) / 10 : null} eenheid="uur" />
              <DataRij label="Gemiddelde hartslag" waarde={fitData.hartslag} eenheid="bpm" />
            </div>
          ) : fitVerbonden ? (
            <p className="text-xs text-gray-400 mt-2">✓ Gekoppeld — data wordt opgehaald bij je volgende check-in.</p>
          ) : (
            <p className="text-xs text-gray-400 mt-2">Koppel Google Fit om je stappen, slaap en hartslag automatisch mee te nemen in je check-in.</p>
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
              <button onClick={() => startKoppeling('google-calendar')} className="text-xs font-semibold px-4 py-2 rounded-xl text-white" style={{ background: '#EA4335' }}>Koppelen</button>
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

        {/* Apple Health — actief in de iOS-app, informatief daarbuiten */}
        <div className={`bg-white rounded-2xl border border-gray-100 p-5 mb-4 ${isIos ? '' : 'opacity-60'}`} style={{ boxShadow: 'var(--shadow-sm)' }}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: '#FF2D55', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 0, pointerEvents: 'none' }}>
                  <GlowOrb color={[0.886, 0.294, 0.290]} intensity={0.4} size={60} />
                </div>
                <span style={{ position: 'relative', zIndex: 1 }}>🍎</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Apple Health</p>
                <p className="text-xs text-gray-400">Apple Watch · iPhone</p>
                {isIos ? (
                  <StatusBadge connected={ahVerbonden} />
                ) : (
                  <span className="text-xs bg-pink-50 text-pink-500 font-semibold px-2 py-0.5 rounded-full">iOS app vereist</span>
                )}
              </div>
            </div>
            {isIos && !ahVerbonden && (
              <button
                onClick={async () => {
                  setAhLaden(true)
                  const ok = await vraagAppleHealthPermissies()
                  if (ok) {
                    const uitkomst = await syncGezondheidsdata({ forceer: true })
                    setAhVerbonden(true)
                    try { localStorage.setItem('mf-apple-health-verbonden', '1') } catch { /* ok */ }
                    setToast({ type: 'success', tekst: uitkomst ? `Apple Health gekoppeld — ${uitkomst.opgeslagen} dagen gesynchroniseerd!` : 'Apple Health gekoppeld!' })
                  } else {
                    setToast({ type: 'error', tekst: 'Geen toegang tot Apple Health' })
                  }
                  setAhLaden(false)
                }}
                className="text-xs font-semibold px-4 py-2 rounded-xl text-white"
                style={{ background: '#FF2D55' }}
              >
                {ahLaden ? 'Bezig…' : 'Koppelen'}
              </button>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-3">
            {isIos
              ? ahVerbonden
                ? '✓ Stappen en verbranding van je Apple Watch worden automatisch gesynchroniseerd.'
                : 'Koppel Apple Health om stappen en verbranding van je Apple Watch automatisch mee te nemen.'
              : 'Apple Health koppeling is beschikbaar via de MentaForce iOS-app (HealthKit).'}
          </p>
        </div>

        {/* Admin info */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 mt-2">
          <p className="text-xs font-semibold text-blue-700 mb-2">⚙️ Voor beheerders: API-sleutels instellen</p>
          <div className="space-y-1">
            {[
              'FITBIT_CLIENT_ID + FITBIT_CLIENT_SECRET → developer.fitbit.com',
              'GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET → Supabase Google Login',
              'GOOGLE_FIT_CLIENT_ID + GOOGLE_FIT_CLIENT_SECRET → Google Fit OAuth',
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
          <div className="w-8 h-8 rounded-full border-2 border-gray-200 animate-spin" style={{ borderTopColor: 'var(--mf-green)' }} />
        </div>
      }>
        <KoppelingenInhoud />
      </Suspense>
    </div>
  )
}
