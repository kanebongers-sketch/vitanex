'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Home, MessageSquare, Users, CheckCircle2, HeartPulse,
  FileText, FolderOpen, Palmtree, Banknote, TrendingUp,
  GripVertical, X, LayoutGrid, ChevronRight, Check, CreditCard,
  type LucideIcon,
} from 'lucide-react'
import { supabase } from '@/lib/supabase/supabase'
import Navbar from '@/components/layout/Navbar'
import { ALLE_TILES, DEFAULT_TILES, type TileId } from '@/lib/navigatie/tiles'
import GesprekkenTab from '@/components/hr/GesprekkenTab'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { useToast } from '@/components/ui/Toast'
import { useVertaling } from '@/lib/i18n/TaalProvider'


type HrTab = 'portaal' | 'gesprekken'

// Contract van /api/hr/analytics (k-anoniem: gemiddelde is null onder de drempel).
interface TrendPunt {
  week: string
  gemiddelde: number | null
  aantal: number
}

interface HrAnalytics {
  stemming_trend: TrendPunt[]
  slaap_trend: TrendPunt[]
  stress_trend: TrendPunt[]
  checkin_trend: { week: string; unieke_users: number; participatie_pct: number }[]
  top_technieken?: { naam: string; count: number }[]
  totaal_medewerkers: number
  actief_deze_week: number
  drempel?: number
}

function trendGemiddelde(punten: TrendPunt[] | undefined): number | null {
  const vals = (punten ?? [])
    .map(p => p.gemiddelde)
    .filter((v): v is number => typeof v === 'number')
  if (!vals.length) return null
  return Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 10) / 10
}

// Woordenboek-sleutels (gedeeld met de analytics-pagina).
const TECHNIEK_LABELS: Record<string, string> = {
  box: 'werk.analytics.techniek.box',
  '478': 'werk.analytics.techniek.478',
  grounding: 'werk.analytics.techniek.grounding',
  pmr: 'werk.analytics.techniek.pmr',
  geen_techniek: 'werk.analytics.techniek.geen_techniek',
}

export default function HrDashboardPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { t } = useVertaling()
  const [naam, setNaam] = useState<string>('')
  const [bedrijfId, setBedrijfId] = useState<string | null>(null)
  const [hrUserId, setHrUserId] = useState<string | null>(null)
  const [geladen, setGeladen] = useState(false)
  const [actieveTab, setActieveTab] = useState<HrTab>('portaal')
  const [opgeslagen, setOpgeslagen] = useState(false)
  const [bezig, setBezig] = useState(false)
  const [actief, setActief] = useState<Set<TileId>>(new Set(DEFAULT_TILES))
  const [volgorde, setVolgorde] = useState<TileId[]>(DEFAULT_TILES)
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [overIdx, setOverIdx] = useState<number | null>(null)
  const [stats, setStats] = useState({ medewerkers: 0, checkins: 0, gemScore: 0 })
  const [discVerplicht, setDiscVerplicht] = useState(false)
  const [discBezig, setDiscBezig] = useState(false)
  const [analytics, setAnalytics] = useState<HrAnalytics | null>(null)

  useEffect(() => {
    async function laad() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: profiel } = await supabase
        .from('profiles').select('naam, rol, bedrijf_id').eq('id', user.id).single()
      if (!profiel || !['hr', 'admin'].includes(profiel.rol ?? '')) {
        router.push('/home'); return
      }
      setNaam(profiel.naam ?? t('werk.hr.naamTerugval'))
      setBedrijfId(profiel.bedrijf_id ?? null)
      setHrUserId(user.id)

      // Bedrijf instellingen
      if (profiel.bedrijf_id) {
        const { data: bedrijfData } = await supabase
          .from('bedrijven')
          .select('disc_verplicht')
          .eq('id', profiel.bedrijf_id)
          .single()
        if (bedrijfData) {
          setDiscVerplicht(bedrijfData.disc_verplicht ?? false)
        }
      }

      // Portaal config
      const { data: config } = await supabase
        .from('portaal_config').select('tiles').eq('bedrijf_id', profiel.bedrijf_id).single()
      if (config?.tiles && Array.isArray(config.tiles)) {
        const ids = config.tiles as TileId[]
        setVolgorde(ids); setActief(new Set(ids))
      }

      // Stats
      const { count: medCount } = await supabase
        .from('profiles').select('id', { count: 'exact', head: true })
        .eq('bedrijf_id', profiel.bedrijf_id).eq('rol', 'medewerker')
      const { count: ciCount } = await supabase
        .from('checkins').select('id', { count: 'exact', head: true })
        .eq('bedrijf_id', profiel.bedrijf_id)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      const { data: scores } = await supabase
        .from('checkins').select('energie, slaap, mentaal_focus, mentaal_balans, motivatie')
        .eq('bedrijf_id', profiel.bedrijf_id)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      const gemScore = scores?.length
        ? Math.round(scores.reduce((s, c) => s + (c.energie + c.slaap + c.mentaal_focus + c.mentaal_balans + c.motivatie) / 5, 0) / scores.length * 20)
        : 0
      setStats({ medewerkers: medCount ?? 0, checkins: ciCount ?? 0, gemScore })

      // Analytics (non-blocking)
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.access_token) {
          const res = await fetch('/api/hr/analytics', {
            headers: { authorization: `Bearer ${session.access_token}` },
          })
          if (res.ok) {
            setAnalytics(await res.json() as HrAnalytics)
          }
        }
      } catch { /* niet-kritiek */ }

      setGeladen(true)
    }
    laad()
  }, [router, t])

  function toggleTile(id: TileId) {
    setActief(prev => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id); setVolgorde(v => v.filter(tegelId => tegelId !== id)) }
      else { next.add(id); setVolgorde(v => [...v, id]) }
      return next
    })
    setOpgeslagen(false)
  }

  function onDragStart(idx: number) { setDragIdx(idx) }
  function onDragEnter(idx: number) { setOverIdx(idx) }
  function onDragEnd() {
    if (dragIdx !== null && overIdx !== null && dragIdx !== overIdx) {
      setVolgorde(prev => {
        const next = [...prev]
        const [moved] = next.splice(dragIdx, 1)
        next.splice(overIdx, 0, moved)
        return next
      })
    }
    setDragIdx(null); setOverIdx(null); setOpgeslagen(false)
  }

  async function opslaan() {
    setBezig(true)
    const { error } = await supabase.from('portaal_config').upsert(
      { bedrijf_id: bedrijfId, tiles: volgorde.filter(tegelId => actief.has(tegelId)), updated_at: new Date().toISOString() },
      { onConflict: 'bedrijf_id' }
    )
    if (error) {
      toast({ title: t('werk.hr.opslaanMislukt'), description: t('werk.hr.opnieuw'), variant: 'error' })
      setBezig(false)
      return
    }
    setOpgeslagen(true)
    setBezig(false)
    toast({ title: t('werk.hr.portaalOpgeslagen'), variant: 'success' })
  }

  const actiefTiles = volgorde.filter(id => actief.has(id)).map(id => ALLE_TILES.find(tegel => tegel.id === id)).filter((tegel): tegel is typeof ALLE_TILES[number] => tegel !== undefined)
  const inactiefTiles = ALLE_TILES.filter(tegel => !actief.has(tegel.id))

  const ACCENT = 'var(--mentaforce-primary)'

  // Afgeleide analytics-waarden — alleen kaarten tonen die echt data hebben.
  const gemStemming = trendGemiddelde(analytics?.stemming_trend)
  const gemSlaap = trendGemiddelde(analytics?.slaap_trend)
  const gemStress = trendGemiddelde(analytics?.stress_trend)
  const topTechnieken = analytics?.top_technieken ?? []
  const analyticsParticipatie = analytics && analytics.totaal_medewerkers > 0
    ? Math.round((analytics.actief_deze_week / analytics.totaal_medewerkers) * 100)
    : null
  const heeftAnalyse =
    gemStemming !== null || gemSlaap !== null || gemStress !== null ||
    analyticsParticipatie !== null || topTechnieken.length > 0

  if (!geladen) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <div className="mf-spinner" />
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <main style={{ padding: '32px 32px 48px' }}>

        {/* ── PAGE HEADER ── */}
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.02em', marginBottom: 4 }}>
            {t('werk.hr.groet', { naam: naam.split(' ')[0] })}
          </h1>
          <p style={{ color: 'var(--text-2)', fontSize: 14 }}>
            {t('werk.hr.intro')}
          </p>
        </div>

        {/* ── TABS ── */}
        <div role="tablist" aria-label={t('werk.hr.weergave')} style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)', marginBottom: 28 }}>
          {([['portaal', 'werk.hr.tabPortaal', Home], ['gesprekken', 'werk.hr.tabGesprekken', MessageSquare]] as const).map(([tab, label, Icon]) => {
            const isActief = actieveTab === tab
            return (
              <button key={tab} role="tab" aria-selected={isActief} onClick={() => setActieveTab(tab)}
                className="mf-hr-tab"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '10px 18px', fontSize: 13, fontWeight: 600, border: 'none',
                  background: 'transparent', cursor: 'pointer',
                  borderBottom: `2px solid ${isActief ? ACCENT : 'transparent'}`,
                  color: isActief ? ACCENT : 'var(--text-2)',
                  transition: 'color 0.15s var(--ease), border-color 0.15s var(--ease)',
                }}>
                <Icon size={15} aria-hidden />{t(label)}
              </button>
            )
          })}
        </div>

        {/* ── GESPREKKEN TAB ── */}
        {actieveTab === 'gesprekken' && bedrijfId && hrUserId && (
          <GesprekkenTab bedrijfId={bedrijfId} hrUserId={hrUserId} />
        )}

        {actieveTab !== 'portaal' ? null : (<>

        {/* ── STATS ROW ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
          {([
            { label: t('werk.hr.medewerkers'), value: stats.medewerkers, icon: Users, iconBg: 'var(--mf-blue-light)', iconColor: 'var(--mf-blue)' },
            { label: t('werk.hr.checkins7'), value: stats.checkins,    icon: CheckCircle2, iconBg: 'var(--mentaforce-primary-light)', iconColor: 'var(--mentaforce-primary)' },
            { label: t('werk.hr.gemVitaal'), value: stats.gemScore ? `${stats.gemScore}/100` : '—', icon: HeartPulse, iconBg: 'var(--mf-purple-light)', iconColor: 'var(--mf-purple)' },
          ] as const).map(s => {
            const Icon = s.icon
            return (
              <Card key={s.label} interactive aria-label={t('werk.hr.statLabel', { label: s.label, waarde: s.value })} style={{ padding: '18px 20px', cursor: 'default' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <p style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</p>
                  <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-sm)', background: s.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={17} aria-hidden style={{ color: s.iconColor }} />
                  </div>
                </div>
                <p style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-1)' }}>{s.value}</p>
              </Card>
            )
          })}
        </div>

        {/* ── ANALYTICS SECTIE ── */}
        {analytics && heeftAnalyse && (
          <div style={{ marginBottom: 32 }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', marginBottom: 12 }}>
              {t('werk.hr.teamWelzijn')}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>

              {/* Gem. stemming */}
              {gemStemming !== null && (
                <Card style={{ padding: 16 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>{t('werk.hr.gemStemming')}</p>
                  <p style={{ fontSize: 32, fontWeight: 800, color: gemStemming >= 3.5 ? 'var(--mf-green)' : 'var(--mf-amber)', lineHeight: 1, marginBottom: 4 }}>
                    {gemStemming}/5
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--text-3)' }}>{t('werk.hr.weekgemiddelden')}</p>
                </Card>
              )}

              {/* Gem. slaap */}
              {gemSlaap !== null && (
                <Card style={{ padding: 16 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>{t('werk.hr.gemSlaap')}</p>
                  <p style={{ fontSize: 32, fontWeight: 800, color: gemSlaap >= 7 ? 'var(--mf-green)' : 'var(--mf-amber)', lineHeight: 1, marginBottom: 4 }}>
                    {t('werk.hr.uur', { waarde: gemSlaap })}
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--text-3)' }}>{t('werk.hr.urenPerNacht')}</p>
                </Card>
              )}

              {/* Gem. stress */}
              {gemStress !== null && (
                <Card style={{ padding: 16 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>{t('werk.hr.gemStress')}</p>
                  <p style={{ fontSize: 32, fontWeight: 800, color: gemStress >= 7 ? 'var(--mf-red)' : gemStress >= 5 ? 'var(--mf-amber)' : 'var(--mf-green)', lineHeight: 1, marginBottom: 4 }}>
                    {gemStress}/10
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--text-3)' }}>{t('werk.hr.lagerBeter')}</p>
                </Card>
              )}

              {/* Participatie deze week */}
              {analyticsParticipatie !== null && (
                <Card style={{ padding: 16 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>{t('werk.hr.actiefDezeWeek')}</p>
                  <p style={{ fontSize: 32, fontWeight: 800, color: analyticsParticipatie >= 70 ? 'var(--mf-green)' : analyticsParticipatie >= 40 ? 'var(--mf-amber)' : 'var(--mf-red)', lineHeight: 1, marginBottom: 4 }}>
                    {analyticsParticipatie}%
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--text-3)' }}>
                    {t('werk.hr.vanMedewerkers', { actief: analytics.actief_deze_week, totaal: analytics.totaal_medewerkers })}
                  </p>
                </Card>
              )}

              {/* Technieken bij hoge stress */}
              {topTechnieken.length > 0 && (
                <Card style={{ padding: 16 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>{t('werk.hr.technieken')}</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {topTechnieken.map((tech, i) => (
                      <div key={tech.naam} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-3)', minWidth: 16 }}>{i + 1}.</span>
                        <span style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 600 }}>{TECHNIEK_LABELS[tech.naam] ? t(TECHNIEK_LABELS[tech.naam]) : tech.naam}</span>
                        <span style={{ fontSize: 10, color: 'var(--text-3)', marginLeft: 'auto' }}>{tech.count}×</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

            </div>
            <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 10 }}>
              {t('werk.hr.geanonimiseerd', { drempel: analytics.drempel ?? 5 })}
            </p>
          </div>
        )}

        {/* ── PORTAAL INRICHTEN ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }}>

          {/* Left: tile configuratie */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)' }}>{t('werk.hr.portaalInrichten')}</h2>
                <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 2 }}>{t('werk.hr.sleep')}</p>
              </div>
              <Button
                onClick={opslaan}
                loading={bezig}
                variant={opgeslagen ? 'secondary' : 'primary'}
                size="sm"
                leftIcon={opgeslagen && !bezig ? <Check size={15} aria-hidden /> : undefined}
              >
                {bezig ? t('werk.hr.opslaanBezig') : opgeslagen ? t('werk.hr.opgeslagen') : t('werk.hr.opslaan')}
              </Button>
            </div>

            {/* Actieve tegels */}
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', marginBottom: 10 }}>
              {t('werk.hr.actief', { aantal: actiefTiles.length })}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
              {actiefTiles.length === 0 && (
                <Card style={{ border: '1px dashed var(--border-strong)' }}>
                  <EmptyState
                    icon={LayoutGrid}
                    title={t('werk.hr.geenTegels')}
                    description={t('werk.hr.geenTegelsTekst')}
                  />
                </Card>
              )}
              {actiefTiles.map((tile, idx) => {
                const isDropTarget = overIdx === idx && dragIdx !== idx
                return (
                  <div key={tile.id} draggable
                    onDragStart={() => onDragStart(idx)} onDragEnter={() => onDragEnter(idx)}
                    onDragEnd={onDragEnd} onDragOver={e => e.preventDefault()}
                    style={{
                      background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', padding: '12px 14px',
                      display: 'flex', alignItems: 'center', gap: 12,
                      border: `1.5px solid ${isDropTarget ? ACCENT : 'var(--border)'}`,
                      boxShadow: dragIdx === idx ? 'var(--shadow-md)' : 'var(--shadow-card)',
                      cursor: 'grab', opacity: dragIdx === idx ? 0.5 : 1,
                      transform: isDropTarget ? 'scale(1.01)' : 'scale(1)',
                      transition: 'border-color 0.15s var(--ease), box-shadow 0.15s var(--ease), transform 0.15s var(--ease)',
                    }}
                  >
                    <GripVertical size={16} aria-hidden style={{ color: 'var(--text-4)', flexShrink: 0 }} />
                    <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-xs)', flexShrink: 0, background: 'var(--bg-subtle)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'var(--mentaforce-primary)' }}>{tile.icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>{tile.label}</p>
                      <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tile.sublabel}</p>
                    </div>
                    <span style={{
                      minWidth: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                      background: 'var(--mentaforce-primary-light)', color: 'var(--mentaforce-primary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, fontWeight: 700, fontVariantNumeric: 'tabular-nums',
                    }}>{idx + 1}</span>
                    <button onClick={() => toggleTile(tile.id)}
                      aria-label={t('werk.hr.uitschakelen', { label: tile.label })}
                      className="mf-hr-tile-remove"
                      style={{
                        width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                        background: 'var(--mf-red-light)', border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--mf-red)',
                      }}>
                      <X size={12} aria-hidden />
                    </button>
                  </div>
                )
              })}
            </div>

            {/* Uitgeschakeld */}
            {inactiefTiles.length > 0 && (
              <>
                <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', marginBottom: 10 }}>
                  {t('werk.hr.uitgeschakeld', { aantal: inactiefTiles.length })}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {inactiefTiles.map(tile => (
                    <div key={tile.id} style={{
                      background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', padding: '10px 14px',
                      display: 'flex', alignItems: 'center', gap: 12,
                      border: '1px solid var(--border)', opacity: 0.75,
                    }}>
                      <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-xs)', flexShrink: 0, background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'var(--text-3)' }}>{tile.icon}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-2)' }}>{tile.label}</p>
                        <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>{tile.sublabel}</p>
                      </div>
                      <Button onClick={() => toggleTile(tile.id)} variant="secondary" size="sm" aria-label={t('werk.hr.inschakelenLabel', { label: tile.label })}>
                        {t('werk.hr.inschakelen')}
                      </Button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Right: quick links */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)', marginBottom: 6 }}>{t('werk.hr.snelleActies')}</h2>
            {([
              { href: '/hr/protocollen/nieuw', label: 'werk.hr.actie.nieuwProtocol', icon: FileText },
              { href: '/hr/protocollen',       label: 'werk.hr.actie.protocollen', icon: FolderOpen },
              { href: '/team',                 label: 'werk.hr.actie.team', icon: Users },
              { href: '/dashboard',            label: 'werk.hr.actie.verlof', icon: Palmtree },
              { href: '/loonstroken',          label: 'werk.hr.actie.loonstroken', icon: Banknote },
              { href: '/rapport',              label: 'werk.hr.actie.rapporten', icon: TrendingUp },
              { href: '/hr/abonnement',        label: 'werk.hr.actie.abonnement', icon: CreditCard },
            ] as const).map(item => {
              const Icon = item.icon
              return (
                <Link key={item.href} href={item.href} className="mf-hr-quicklink" style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', padding: '12px 14px',
                  border: '1px solid var(--border)', textDecoration: 'none',
                  boxShadow: 'var(--shadow-card)',
                  transition: 'box-shadow 0.15s var(--ease), border-color 0.15s var(--ease), transform 0.1s var(--ease)',
                }}>
                  <div style={{ width: 34, height: 34, borderRadius: 'var(--radius-xs)', flexShrink: 0, background: 'var(--mentaforce-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={16} aria-hidden style={{ color: 'var(--mentaforce-primary)' }} />
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-2)', flex: 1 }}>{t(item.label)}</p>
                  <ChevronRight size={14} aria-hidden style={{ color: 'var(--text-4)', flexShrink: 0 }} />
                </Link>
              )
            })}
          </div>
        </div>

        {/* ── INSTELLINGEN ── */}
        <Card style={{ marginTop: 32, padding: '20px 24px' }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)', marginBottom: 16 }}>{t('werk.hr.instellingen')}</h2>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', marginBottom: 2 }}>{t('werk.hr.discVerplicht')}</p>
              <p style={{ fontSize: 12, color: 'var(--text-3)' }}>{t('werk.hr.discUitleg')}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={discVerplicht}
              aria-label={t('werk.hr.discVerplicht')}
              onClick={async () => {
                if (!bedrijfId || discBezig) return
                setDiscBezig(true)
                const nieuweWaarde = !discVerplicht
                const { error } = await supabase
                  .from('bedrijven')
                  .update({ disc_verplicht: nieuweWaarde })
                  .eq('id', bedrijfId)
                if (error) {
                  toast({ title: t('werk.hr.wijzigingMislukt'), description: t('werk.hr.nietOpgeslagen'), variant: 'error' })
                } else {
                  setDiscVerplicht(nieuweWaarde)
                }
                setDiscBezig(false)
              }}
              disabled={discBezig}
              className="mf-hr-switch"
              style={{
                flexShrink: 0,
                width: 48, height: 26, borderRadius: 13, border: '1px solid var(--border-strong)',
                cursor: discBezig ? 'default' : 'pointer',
                background: discVerplicht ? ACCENT : 'var(--bg-subtle)',
                position: 'relative', transition: 'background 0.2s var(--ease)',
                opacity: discBezig ? 0.6 : 1,
                padding: 0,
              }}
            >
              <span aria-hidden className="mf-hr-switch-knob" style={{
                position: 'absolute', top: 2, left: 2,
                width: 20, height: 20, borderRadius: '50%',
                background: discVerplicht ? 'var(--bg-app)' : 'var(--text-3)',
                transform: discVerplicht ? 'translateX(22px)' : 'translateX(0)',
                transition: 'transform 0.2s var(--ease)',
              }} />
            </button>
          </div>
        </Card>

        </>)}
      </main>

      <style>{`
        .mf-hr-tab:focus-visible,
        .mf-hr-tile-remove:focus-visible,
        .mf-hr-quicklink:focus-visible,
        .mf-hr-switch:focus-visible {
          outline: 2px solid var(--mentaforce-primary);
          outline-offset: 2px;
        }
        .mf-hr-tab:hover { color: var(--text-1); }
        .mf-hr-tile-remove { transition: opacity 0.15s var(--ease); }
        .mf-hr-tile-remove:hover { opacity: 0.8; }
        .mf-hr-quicklink:hover {
          box-shadow: var(--shadow-md);
          border-color: var(--border-strong);
          transform: translateY(-1px);
        }
        @media (prefers-reduced-motion: reduce) {
          .mf-hr-quicklink:hover { transform: none; }
          .mf-hr-switch-knob { transition: none; }
        }
      `}</style>
    </div>
  )
}
