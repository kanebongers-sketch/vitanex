'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import {
  Footprints,
  Moon,
  Brain,
  Droplets,
  Activity,
  Target,
  Check,
  ArrowLeft,
  type LucideIcon,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/layout/Navbar'
import { authFetch } from '@/lib/auth-fetch'
import { vitaEvent } from '@/lib/vita/events'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Progress } from '@/components/ui/Progress'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'

interface UitdagingData {
  uitdaging: {
    id: string
    titel: string
    type: string
    doel_waarde: number
    eenheid: string
    start_datum: string
    eind_datum: string
  }
  mijn_bijdrage: number
  team_totaal: number
  doel_bereikt_pct: number
  aantal_deelnemers: number
  dagen_resterend: number
  mijn_logs: { waarde: number; aangemaakt_op: string }[]
}

// Type krijgt label + icoon + token-accent (nooit kleur-alleen). lucide i.p.v. emoji.
const TYPE_CONFIG: Record<string, { label: string; kleur: string; icon: LucideIcon }> = {
  stappen:   { label: 'Stappen',   kleur: 'var(--mf-green)',  icon: Footprints },
  slaap:     { label: 'Slaap',     kleur: 'var(--mf-purple)', icon: Moon },
  meditatie: { label: 'Meditatie', kleur: 'var(--mf-purple)', icon: Brain },
  water:     { label: 'Water',     kleur: 'var(--mf-blue)',   icon: Droplets },
  beweging:  { label: 'Beweging',  kleur: 'var(--mf-amber)',  icon: Activity },
  focus:     { label: 'Focus',     kleur: 'var(--mf-red)',    icon: Target },
}

function softBg(token: string): string {
  // Token + alpha zonder hardcoded hex-suffix: color-mix i.p.v. `${kleur}15`.
  return `color-mix(in srgb, ${token} 14%, transparent)`
}

export default function UitdagingDetailPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { id } = useParams<{ id: string }>()
  const [laden, setLaden] = useState(true)
  const [data, setData] = useState<UitdagingData | null>(null)
  const [bijdrage, setBijdrage] = useState('')
  const [notitie, setNotitie] = useState('')
  const [verzenden, setVerzenden] = useState(false)
  const [success, setSuccess] = useState(false)

  async function laadData() {
    const res = await authFetch(`/api/team-uitdagingen/${id}/voortgang`)
    if (res.ok) setData(await res.json() as UitdagingData)
    setLaden(false)
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push('/login')
      else laadData()
    })
  }, [id, router])

  // Reset de "Gelogd!"-bevestiging na 2s, met opruiming zodat er geen timer
  // achterblijft bij unmount of een nieuwe log binnen het venster.
  useEffect(() => {
    if (!success) return
    const t = setTimeout(() => setSuccess(false), 2000)
    return () => clearTimeout(t)
  }, [success])

  async function logBijdrage() {
    const waarde = parseFloat(bijdrage)
    if (!waarde || waarde <= 0) return
    setVerzenden(true)
    try {
      const res = await authFetch(`/api/team-uitdagingen/${id}/voortgang`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ waarde, notitie: notitie.trim() || undefined }),
      })
      if (res.ok) {
        setBijdrage('')
        setNotitie('')
        setSuccess(true)
        vitaEvent('habit_completed', { kind: 'challenge' })
        await laadData()
      } else {
        toast({ title: 'Loggen mislukt', description: 'Probeer het later opnieuw.', variant: 'error' })
      }
    } catch {
      toast({ title: 'Geen verbinding', description: 'Controleer je internet en probeer opnieuw.', variant: 'error' })
    }
    setVerzenden(false)
  }

  if (laden) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }} role="status" aria-label="Uitdaging laden"><div className="mf-spinner" /></div>
    </div>
  )

  if (!data) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <main style={{ padding: '36px 40px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-3)' }}>Uitdaging niet gevonden.</p>
        <Link
          href="/team-uitdagingen"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--mentaforce-primary)', marginTop: 12, textDecoration: 'none' }}
        >
          <ArrowLeft size={15} aria-hidden /> Terug
        </Link>
      </main>
    </div>
  )

  const cfg = TYPE_CONFIG[data.uitdaging.type] ?? { label: data.uitdaging.type, kleur: 'var(--mentaforce-primary)', icon: Target }
  const TypeIcon = cfg.icon
  const pct = data.doel_bereikt_pct
  const kanLoggen = !bijdrage || parseFloat(bijdrage) <= 0 || verzenden

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <main style={{ padding: '36px 40px 72px', maxWidth: 680, margin: '0 auto' }}>

        <Link
          href="/team-uitdagingen"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-3)', textDecoration: 'none', fontSize: 13, marginBottom: 20 }}
        >
          <ArrowLeft size={15} aria-hidden /> Alle uitdagingen
        </Link>

        {/* Header */}
        <Card style={{ padding: '24px', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16 }}>
            <span
              aria-hidden
              style={{
                width: 48, height: 48, borderRadius: 14, background: softBg(cfg.kleur),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: cfg.kleur, flexShrink: 0,
              }}
            >
              <TypeIcon size={22} />
            </span>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.02em', marginBottom: 6 }}>{data.uitdaging.titel}</h1>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                <Badge variant="neutral" style={{ color: cfg.kleur, background: softBg(cfg.kleur), border: `1px solid ${cfg.kleur}` }}>
                  <TypeIcon size={12} aria-hidden /> {cfg.label}
                </Badge>
                <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{data.dagen_resterend} dagen resterend</span>
                <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{data.aantal_deelnemers} deelnemers</span>
              </div>
            </div>
          </div>

          {/* Voortgangsbalk */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>Team voortgang</p>
              <p style={{ fontSize: 13, fontWeight: 800, color: cfg.kleur }}>{pct}%</p>
            </div>
            <Progress
              value={pct}
              ariaLabel={`Team voortgang voor ${data.uitdaging.titel}`}
              thickness={12}
              color={cfg.kleur}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
              <p style={{ fontSize: 11, color: 'var(--text-3)' }}>{data.team_totaal} {data.uitdaging.eenheid} behaald</p>
              <p style={{ fontSize: 11, color: 'var(--text-3)' }}>Doel: {data.uitdaging.doel_waarde} {data.uitdaging.eenheid}</p>
            </div>
          </div>

          {/* Stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(120px, 100%), 1fr))', gap: 10 }}>
            {[
              { label: 'Mijn bijdrage', waarde: `${data.mijn_bijdrage} ${data.uitdaging.eenheid}` },
              { label: 'Team totaal', waarde: `${data.team_totaal} ${data.uitdaging.eenheid}` },
              { label: 'Deelnemers', waarde: `${data.aantal_deelnemers}` },
            ].map(s => (
              <div key={s.label} style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px', textAlign: 'center' }}>
                <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-1)' }}>{s.waarde}</p>
                <p style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2, fontWeight: 600, textTransform: 'uppercase' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Log bijdrage */}
        <Card style={{ padding: '20px 22px', marginBottom: 16 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)', marginBottom: 14 }}>Mijn bijdrage loggen</p>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <Field label={`Waarde (${data.uitdaging.eenheid})`}>
                <Input
                  type="number"
                  placeholder={`0 ${data.uitdaging.eenheid}`}
                  value={bijdrage}
                  onChange={e => setBijdrage(e.target.value)}
                  min="0"
                />
              </Field>
            </div>
            <div style={{ flex: 2 }}>
              <Field label="Notitie (optioneel)">
                <Input
                  type="text"
                  placeholder="Korte omschrijving..."
                  value={notitie}
                  onChange={e => setNotitie(e.target.value)}
                />
              </Field>
            </div>
          </div>
          <Button
            onClick={logBijdrage}
            loading={verzenden}
            disabled={kanLoggen}
            leftIcon={success ? <Check size={16} aria-hidden /> : undefined}
            style={{ width: '100%', marginTop: 12, background: cfg.kleur, color: 'var(--bg-app)' }}
          >
            {success ? 'Gelogd!' : 'Bijdrage loggen'}
          </Button>
        </Card>

        {/* Mijn recente logs */}
        {data.mijn_logs.length > 0 && (
          <Card style={{ padding: '18px 20px' }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-3)', marginBottom: 12 }}>Mijn recente bijdragen</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {data.mijn_logs.map((log, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    paddingBottom: 8,
                    borderBottom: i < data.mijn_logs.length - 1 ? '1px solid var(--border)' : 'none',
                  }}
                >
                  <span style={{ fontSize: 12, color: 'var(--text-2)' }}>
                    {new Date(log.aangemaakt_op).toLocaleDateString('nl-BE', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: cfg.kleur }}>{log.waarde} {data.uitdaging.eenheid}</span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </main>
    </div>
  )
}
