'use client'

export const dynamic = 'force-dynamic'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { RefreshCw, Settings, HeartPulse, Watch, Activity, Calendar, Mail, Heart, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase/supabase'
import { authFetch } from '@/lib/auth/auth-fetch'
import Navbar from '@/components/layout/Navbar'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useToast } from '@/components/ui/Toast'


import { isAndroidApp, leesHealthData, vraagPermissies, type HealthData } from '@/lib/health/health-connect'
import { isIosApp, vraagAppleHealthPermissies } from '@/lib/health/apple-health'
import { syncGezondheidsdata } from '@/lib/health/health-sync'

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
    <Badge variant={connected ? 'success' : 'neutral'}>
      {connected ? '● Gekoppeld' : '○ Niet gekoppeld'}
    </Badge>
  )
}

function DataRij({ label, waarde, eenheid }: { label: string; waarde: string | number | null; eenheid?: string }) {
  return (
    <div
      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}
      className="mf-datarij"
    >
      <span style={{ fontSize: 13, color: 'var(--text-3)' }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>
        {waarde !== null ? `${waarde}${eenheid ? ' ' + eenheid : ''}` : '—'}
      </span>
    </div>
  )
}

/** Neutrale logo-tegel (navy surface, cyaan accent) — strikt navy/cyan, geen externe merkkleuren in de UI. */
function ProviderLogo({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        width: 40, height: 40, borderRadius: 'var(--radius-sm)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
        background: 'var(--bg-subtle)',
        border: '1px solid var(--border)',
        color: 'var(--mentaforce-primary)',
      }}
    >
      {children}
    </div>
  )
}

function KoppelingenInhoud() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [userId, setUserId] = useState<string | null>(null)
  const [laden, setLaden] = useState(true)

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
        toast({ title: tekst, variant: 'error' })
      }

      if (fitbitConnected) {
        toast({ title: 'Fitbit succesvol gekoppeld!', variant: 'success' })
      }

      if (googleConnected) {
        toast({ title: 'Google Agenda succesvol gekoppeld!', variant: 'success' })
      }

      if (fitConnected) {
        setFitVerbonden(true)
        toast({ title: 'Google Fit succesvol gekoppeld!', variant: 'success' })
      }

      // Check of Google Fit al gekoppeld is. Dit was een directe query op
      // wearable_tokens die het access_token ophaalde om er een booleaan van te
      // maken — het token stond daarmee in elke tab. De server antwoordt nu met
      // alleen die booleaan. Zie migratie 046.
      setFitLaden(true)
      authFetch('/api/koppelingen/status')
        .then(r => (r.ok ? r.json() : null))
        .then((status: { google_fit?: boolean } | null) => {
          if (status?.google_fit) setFitVerbonden(true)
        })
        .catch(() => {})
        .finally(() => setFitLaden(false))

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

  async function startKoppeling(provider: 'fitbit' | 'google-fit' | 'google-calendar') {
    try {
      const res = await authFetch(`/api/${provider}/auth`)
      const data = await res.json() as { url?: string; error?: string }
      if (!res.ok || !data.url) {
        toast({ title: data.error ?? 'Koppeling starten mislukt', variant: 'error' })
        return
      }
      window.location.href = data.url
    } catch {
      toast({ title: 'Koppeling starten mislukt', variant: 'error' })
    }
  }

  async function ontkoppel(provider: 'fitbit' | 'google_calendar' | 'google_fit') {
    if (!userId) return

    // Ging vroeger rechtstreeks naar de tabel. Dat faalde stil voor iedereen die
    // geen admin was — er was nooit een DELETE-policy, de fout werd niet gelezen
    // en deze toast beloofde toch succes. Zie migratie 046.
    const res = await authFetch('/api/koppelingen/ontkoppel', {
      method: 'POST',
      body: JSON.stringify({ provider }),
    }).catch(() => null)

    if (!res?.ok) {
      toast({ title: 'Ontkoppelen mislukt. Probeer opnieuw.', variant: 'error' })
      return
    }

    if (provider === 'fitbit') { setFitbitVerbonden(false); setFitbitData(null) }
    else if (provider === 'google_fit') { setFitVerbonden(false); setFitData(null) }
    else { setCalVerbonden(false); setCalData(null) }
    toast({ title: 'Koppeling verwijderd', variant: 'success' })
  }

  const werkLastVariant = (wl: string): 'success' | 'warning' | 'danger' =>
    wl === 'laag' ? 'success' : wl === 'gemiddeld' ? 'warning' : 'danger'

  if (laden) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
      <div className="mf-spinner" />
    </div>
  )

  return (
    <main style={{ padding: '24px', maxWidth: 900, margin: '0 auto' }}>
      <style>{`.mf-datarij:last-child { border-bottom: none; }`}</style>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>Koppelingen</h1>
        <p style={{ fontSize: 14, color: 'var(--text-3)', marginTop: 2 }}>Verbind je wearables en agenda voor persoonlijke inzichten</p>
      </div>

      {/* Health Connect — alleen zichtbaar in Android app */}
      {isAndroid && (
        <Card style={{ padding: 20, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <ProviderLogo><HeartPulse size={20} aria-hidden /></ProviderLogo>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)' }}>Health Connect</p>
                <p style={{ fontSize: 12, color: 'var(--text-4)' }}>Fitbit · Samsung Health · Google Fit</p>
                <div style={{ marginTop: 4 }}><StatusBadge connected={hcVerbonden} /></div>
              </div>
            </div>
            {!hcVerbonden && (
              <Button
                size="sm"
                loading={hcLaden}
                onClick={async () => {
                  setHcLaden(true)
                  const ok = await vraagPermissies()
                  if (ok) {
                    const d = await leesHealthData()
                    setHcData(d)
                    setHcVerbonden(true)
                    // Stuur direct 14 dagen historie naar je gezondheidslog
                    const uitkomst = await syncGezondheidsdata({ forceer: true })
                    if (uitkomst) toast({ title: `${uitkomst.opgeslagen} dagen gesynchroniseerd!`, variant: 'success' })
                  }
                  setHcLaden(false)
                }}
              >
                Koppelen
              </Button>
            )}
          </div>
          {hcLaden ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0' }}>
              <div className="mf-spinner" style={{ width: 16, height: 16 }} />
              <span style={{ fontSize: 12, color: 'var(--text-4)' }}>Data ophalen…</span>
            </div>
          ) : hcData ? (
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
              <DataRij label="Stappen vandaag" waarde={hcData.stappen?.toLocaleString('nl-BE') ?? null} />
              <DataRij label="Slaap" waarde={hcData.slaapMinuten !== null ? Math.round(hcData.slaapMinuten / 60 * 10) / 10 : null} eenheid="uur" />
              <DataRij label="Gemiddelde hartslag" waarde={hcData.hartslag} eenheid="bpm" />
              <DataRij label="Verbrande calorieën" waarde={hcData.calorieën} eenheid="kcal" />
            </div>
          ) : (
            <p style={{ fontSize: 12, color: 'var(--text-4)', marginTop: 8 }}>Koppel Health Connect om stappen, slaap en hartslag te zien van je Fitbit of Samsung Health.</p>
          )}
        </Card>
      )}

      {/* Fitbit */}
      <Card style={{ padding: 20, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <ProviderLogo><Watch size={20} aria-hidden /></ProviderLogo>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)' }}>Fitbit</p>
              <div style={{ marginTop: 4 }}><StatusBadge connected={fitbitVerbonden} /></div>
            </div>
          </div>
          {fitbitVerbonden ? (
            <Button variant="ghost" size="sm" onClick={() => ontkoppel('fitbit')} style={{ color: 'var(--mf-red)' }}>Ontkoppelen</Button>
          ) : (
            <Button size="sm" onClick={() => startKoppeling('fitbit')}>Koppelen</Button>
          )}
        </div>
        {fitbitLaden ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0' }}>
            <div className="mf-spinner" style={{ width: 16, height: 16 }} />
            <span style={{ fontSize: 12, color: 'var(--text-4)' }}>Data ophalen…</span>
          </div>
        ) : fitbitData ? (
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
            <DataRij label="Stappen vandaag" waarde={fitbitData.stappen?.toLocaleString('nl-BE') ?? null} />
            <DataRij label="Slaap" waarde={fitbitData.slaapMinuten !== null ? Math.round(fitbitData.slaapMinuten / 60 * 10) / 10 : null} eenheid="uur" />
            <DataRij label="Slaapkwaliteit" waarde={fitbitData.slaapKwaliteit} eenheid="%" />
            <DataRij label="Rusthartslag" waarde={fitbitData.hartslag} eenheid="bpm" />
          </div>
        ) : (
          <p style={{ fontSize: 12, color: 'var(--text-4)', marginTop: 8 }}>Koppel je Fitbit om stappen, slaap en hartslag te zien.</p>
        )}
      </Card>

      {/* Google Fit */}
      <Card style={{ padding: 20, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <ProviderLogo><Activity size={20} aria-hidden /></ProviderLogo>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)' }}>Google Fit</p>
              <p style={{ fontSize: 12, color: 'var(--text-4)' }}>Stappen · Slaap · Hartslag</p>
              <div style={{ marginTop: 4 }}><StatusBadge connected={fitVerbonden} /></div>
            </div>
          </div>
          {fitVerbonden ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Button
                size="sm"
                loading={fitSyncBezig}
                leftIcon={<RefreshCw size={14} aria-hidden />}
                onClick={() => {
                  setFitSyncBezig(true)
                  syncGezondheidsdata({ forceer: true })
                    .then(u => toast(u
                      ? { title: `${u.opgeslagen} dagen gesynchroniseerd!`, variant: 'success' }
                      : { title: 'Synchroniseren mislukt', variant: 'error' }))
                    .finally(() => setFitSyncBezig(false))
                }}
              >{fitSyncBezig ? 'Bezig…' : 'Sync nu'}</Button>
              <Button variant="ghost" size="sm" onClick={() => ontkoppel('google_fit')} style={{ color: 'var(--mf-red)' }}>Ontkoppelen</Button>
            </div>
          ) : (
            <Button size="sm" onClick={() => startKoppeling('google-fit')}>Koppelen</Button>
          )}
        </div>
        {fitLaden ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0' }}>
            <div className="mf-spinner" style={{ width: 16, height: 16 }} />
            <span style={{ fontSize: 12, color: 'var(--text-4)' }}>Status ophalen…</span>
          </div>
        ) : fitData ? (
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
            <DataRij label="Stappen vandaag" waarde={fitData.stappen?.toLocaleString('nl-BE') ?? null} />
            <DataRij label="Slaap" waarde={fitData.slaapMinuten !== null ? Math.round(fitData.slaapMinuten / 60 * 10) / 10 : null} eenheid="uur" />
            <DataRij label="Gemiddelde hartslag" waarde={fitData.hartslag} eenheid="bpm" />
          </div>
        ) : fitVerbonden ? (
          <p style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-4)', marginTop: 8 }}><Check size={13} aria-hidden style={{ color: 'var(--mentaforce-primary)' }} /> Gekoppeld — data wordt opgehaald bij je volgende check-in.</p>
        ) : (
          <p style={{ fontSize: 12, color: 'var(--text-4)', marginTop: 8 }}>Koppel Google Fit om je stappen, slaap en hartslag automatisch mee te nemen in je check-in.</p>
        )}
      </Card>

      {/* Google Calendar */}
      <Card style={{ padding: 20, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <ProviderLogo><Calendar size={20} aria-hidden /></ProviderLogo>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)' }}>Google Agenda</p>
              <div style={{ marginTop: 4 }}><StatusBadge connected={calVerbonden} /></div>
            </div>
          </div>
          {calVerbonden ? (
            <Button variant="ghost" size="sm" onClick={() => ontkoppel('google_calendar')} style={{ color: 'var(--mf-red)' }}>Ontkoppelen</Button>
          ) : (
            <Button size="sm" onClick={() => startKoppeling('google-calendar')}>Koppelen</Button>
          )}
        </div>
        {calLaden ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0' }}>
            <div className="mf-spinner" style={{ width: 16, height: 16 }} />
            <span style={{ fontSize: 12, color: 'var(--text-4)' }}>Agenda ophalen…</span>
          </div>
        ) : calData ? (
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
            <DataRij label="Afspraken deze week" waarde={calData.aantalAfspraken} />
            <DataRij label="Vergadertijd" waarde={Math.round(calData.totalMeetingMinuten / 60 * 10) / 10} eenheid="uur" />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 13, color: 'var(--text-3)' }}>Werkdruk indicator</span>
              <Badge variant={werkLastVariant(calData.werkLast)}>
                {calData.werkLast.charAt(0).toUpperCase() + calData.werkLast.slice(1)}
              </Badge>
            </div>
            {calData.vandaagAfspraken.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <p style={{ fontSize: 12, color: 'var(--text-4)', marginBottom: 4 }}>Vandaag:</p>
                {calData.vandaagAfspraken.slice(0, 3).map((a, i) => (
                  <p key={i} style={{ fontSize: 12, color: 'var(--text-2)', padding: '2px 0' }}>• {a}</p>
                ))}
                {calData.vandaagAfspraken.length > 3 && (
                  <p style={{ fontSize: 12, color: 'var(--text-4)' }}>+{calData.vandaagAfspraken.length - 3} meer</p>
                )}
              </div>
            )}
          </div>
        ) : (
          <p style={{ fontSize: 12, color: 'var(--text-4)', marginTop: 8 }}>Koppel je Google Agenda voor werk-privébalans inzichten.</p>
        )}
      </Card>

      {/* Microsoft Outlook — binnenkort */}
      <Card style={{ padding: 20, marginBottom: 16, opacity: 0.6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <ProviderLogo><Mail size={20} aria-hidden /></ProviderLogo>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)' }}>Microsoft Outlook</p>
            <div style={{ marginTop: 4 }}><Badge variant="accent">Binnenkort</Badge></div>
          </div>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-4)', marginTop: 12 }}>Outlook agenda-integratie via Microsoft Graph API — binnenkort beschikbaar.</p>
      </Card>

      {/* Apple Health — actief in de iOS-app, informatief daarbuiten */}
      <Card style={{ padding: 20, marginBottom: 16, opacity: isIos ? 1 : 0.6 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <ProviderLogo><Heart size={20} aria-hidden /></ProviderLogo>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)' }}>Apple Health</p>
              <p style={{ fontSize: 12, color: 'var(--text-4)' }}>Apple Watch · iPhone</p>
              <div style={{ marginTop: 4 }}>
                {isIos ? (
                  <StatusBadge connected={ahVerbonden} />
                ) : (
                  <Badge variant="accent">iOS app vereist</Badge>
                )}
              </div>
            </div>
          </div>
          {isIos && !ahVerbonden && (
            <Button
              size="sm"
              loading={ahLaden}
              onClick={async () => {
                setAhLaden(true)
                const ok = await vraagAppleHealthPermissies()
                if (ok) {
                  const uitkomst = await syncGezondheidsdata({ forceer: true })
                  setAhVerbonden(true)
                  try { localStorage.setItem('mf-apple-health-verbonden', '1') } catch { /* ok */ }
                  toast({ title: uitkomst ? `Apple Health gekoppeld — ${uitkomst.opgeslagen} dagen gesynchroniseerd!` : 'Apple Health gekoppeld!', variant: 'success' })
                } else {
                  toast({ title: 'Geen toegang tot Apple Health', variant: 'error' })
                }
                setAhLaden(false)
              }}
            >
              Koppelen
            </Button>
          )}
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-4)', marginTop: 12 }}>
          {isIos
            ? ahVerbonden
              ? 'Stappen en verbranding van je Apple Watch worden automatisch gesynchroniseerd.'
              : 'Koppel Apple Health om stappen en verbranding van je Apple Watch automatisch mee te nemen.'
            : 'Apple Health koppeling is beschikbaar via de MentaForce iOS-app (HealthKit).'}
        </p>
      </Card>

      {/* Admin info */}
      <div style={{ background: 'var(--mentaforce-primary-light)', border: '1px solid color-mix(in srgb, var(--mentaforce-primary) 35%, transparent)', borderRadius: 'var(--radius-card)', padding: 20, marginTop: 8 }}>
        <p style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--text-1)', marginBottom: 8 }}>
          <Settings size={14} aria-hidden style={{ color: 'var(--mentaforce-primary)' }} />
          Voor beheerders: API-sleutels instellen
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {[
            'FITBIT_CLIENT_ID + FITBIT_CLIENT_SECRET → developer.fitbit.com',
            'GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET → Supabase Google Login',
            'GOOGLE_FIT_CLIENT_ID + GOOGLE_FIT_CLIENT_SECRET → Google Fit OAuth',
            'NEXT_PUBLIC_APP_URL=https://mentaforce.nl',
          ].map(t => (
            <p key={t} style={{ fontSize: 12, color: 'var(--text-2)', fontFamily: 'monospace' }}>{t}</p>
          ))}
        </div>
      </div>
    </main>
  )
}

export default function KoppelingenPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <Suspense fallback={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
          <div className="mf-spinner" />
        </div>
      }>
        <KoppelingenInhoud />
      </Suspense>
    </div>
  )
}
