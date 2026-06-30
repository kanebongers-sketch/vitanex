'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Footprints,
  CheckCircle2,
  Dumbbell,
  Salad,
  Brain,
  Timer,
  Target,
  Trophy,
  Check,
  ArrowRight,
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
import { EmptyState } from '@/components/ui/EmptyState'
import { useToast } from '@/components/ui/Toast'

interface UitdagingLog { user_id: string; datum: string; waarde: number | null }

interface Uitdaging {
  id: string
  naam: string
  beschrijving: string | null
  type: string
  doel_waarde: number | null
  eenheid: string | null
  start_datum: string
  eind_datum: string
  team_uitdaging_logs: UitdagingLog[]
}

// Type krijgt label + icoon (nooit kleur-alleen). lucide i.p.v. emoji.
const TYPE_CONFIG: Record<string, { label: string; icon: LucideIcon }> = {
  stappen:   { label: 'Stappen',   icon: Footprints },
  checkin:   { label: 'Check-ins', icon: CheckCircle2 },
  sport:     { label: 'Sport',     icon: Dumbbell },
  voeding:   { label: 'Voeding',   icon: Salad },
  meditatie: { label: 'Meditatie', icon: Brain },
  focus:     { label: 'Focus',     icon: Timer },
  custom:    { label: 'Overig',    icon: Target },
}

function dagsTot(datum: string): number {
  const nu = new Date()
  const d = new Date(datum)
  return Math.max(0, Math.ceil((d.getTime() - nu.getTime()) / 86400000))
}

function voortgangPct(logs: UitdagingLog[], doelWaarde: number | null, userId: string | null): number {
  if (!userId) return 0
  const mijnLogs = logs.filter(l => l.user_id === userId)
  if (!mijnLogs.length) return 0
  if (!doelWaarde) return mijnLogs.length > 0 ? 100 : 0
  const totaal = mijnLogs.reduce((s, l) => s + (l.waarde ?? 1), 0)
  return Math.min(100, Math.round((totaal / doelWaarde) * 100))
}

export default function TeamUitdagingenPagina() {
  const router = useRouter()
  const { toast } = useToast()
  const [uitdagingen, setUitdagingen] = useState<Uitdaging[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [laden, setLaden] = useState(true)
  const [loggen, setLoggen] = useState<string | null>(null)
  const [logWaarde, setLogWaarde] = useState('')

  useEffect(() => {
    async function laad() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)

      try {
        const res = await authFetch('/api/team-uitdagingen')
        if (res.ok) {
          const json = await res.json() as { uitdagingen: Uitdaging[] }
          setUitdagingen(json.uitdagingen ?? [])
        }
      } catch { /* niet-kritiek: lege lijst tonen */ }
      setLaden(false)
    }
    laad()
  }, [router])

  async function logVoortgang(uitdagingId: string) {
    setLoggen(uitdagingId)
    try {
      const res = await authFetch(`/api/team-uitdagingen/${uitdagingId}/log`, {
        method: 'POST',
        body: JSON.stringify({ waarde: logWaarde ? Number(logWaarde) : undefined }),
      })
      if (res.ok) {
        const json = await res.json() as { log: UitdagingLog }
        setUitdagingen(prev => prev.map(u =>
          u.id === uitdagingId
            ? { ...u, team_uitdaging_logs: [...u.team_uitdaging_logs, json.log] }
            : u,
        ))
        setLogWaarde('')
        vitaEvent('habit_completed', { kind: 'challenge' })
      } else {
        toast({ title: 'Loggen mislukt', description: 'Probeer het later opnieuw.', variant: 'error' })
      }
    } catch {
      toast({ title: 'Geen verbinding', description: 'Controleer je internet en probeer opnieuw.', variant: 'error' })
    }
    setLoggen(null)
  }

  if (laden) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
        <div className="mf-spinner" />
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <main style={{ padding: '24px 20px 88px', maxWidth: 800, margin: '0 auto' }}>

        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.03em', marginBottom: 4 }}>
              Team uitdagingen
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-3)' }}>
              Doe mee met collectieve uitdagingen en boost je teamwelzijn
            </p>
          </div>
          <Link
            href="/uitdagingen"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5, flexShrink: 0,
              fontSize: 12, color: 'var(--mentaforce-primary)', fontWeight: 600, textDecoration: 'none',
            }}
          >
            Alle uitdagingen <ArrowRight size={14} aria-hidden />
          </Link>
        </header>

        {uitdagingen.length === 0 ? (
          <Card>
            <EmptyState
              icon={Trophy}
              title="Geen actieve uitdagingen"
              description="Je HR-team kan uitdagingen aanmaken via het HR-portaal."
            />
          </Card>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {uitdagingen.map(u => {
              const pct = voortgangPct(u.team_uitdaging_logs, u.doel_waarde, userId)
              const dagen = dagsTot(u.eind_datum)
              const deelnemers = new Set(u.team_uitdaging_logs.map(l => l.user_id)).size
              const heeftVandaag = u.team_uitdaging_logs.some(
                l => l.user_id === userId && l.datum === new Date().toISOString().split('T')[0],
              )
              const cfg = TYPE_CONFIG[u.type] ?? { label: u.type, icon: Target }
              const TypeIcon = cfg.icon
              const voltooid = pct >= 100

              return (
                <Card key={u.id} style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-3)', fontWeight: 600 }}>
                          <TypeIcon size={13} aria-hidden /> {cfg.label}
                        </span>
                        {heeftVandaag && (
                          <Badge variant="success">
                            <Check size={11} aria-hidden /> vandaag gelogd
                          </Badge>
                        )}
                      </div>
                      <h2 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-1)', marginBottom: 4 }}>{u.naam}</h2>
                      {u.beschrijving && (
                        <p style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.4 }}>{u.beschrijving}</p>
                      )}
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-1)', lineHeight: 1 }}>{pct}%</p>
                      <p style={{ fontSize: 10, color: 'var(--text-3)' }}>jouw voortgang</p>
                    </div>
                  </div>

                  {/* Voortgangsbalk */}
                  <Progress
                    value={pct}
                    ariaLabel={`Jouw voortgang voor ${u.naam}`}
                    thickness={6}
                    color={voltooid ? 'var(--mf-green)' : 'var(--mentaforce-primary)'}
                    style={{ marginBottom: 12 }}
                  />

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
                      {deelnemers} deelnemer{deelnemers !== 1 ? 's' : ''}
                    </span>
                    <span style={{ fontSize: 11, color: dagen <= 3 ? 'var(--mf-red)' : 'var(--text-3)', fontWeight: dagen <= 3 ? 700 : 400 }}>
                      {dagen === 0 ? 'Vandaag laatste dag!' : `${dagen} dag${dagen !== 1 ? 'en' : ''} resterend`}
                    </span>
                  </div>

                  {/* Log sectie */}
                  {u.doel_waarde ? (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                      <div style={{ flex: 1 }}>
                        <Field label={`Waarde (${u.eenheid ?? 'aantal'})`}>
                          <Input
                            type="number"
                            value={logWaarde}
                            onChange={e => setLogWaarde(e.target.value)}
                            placeholder={`Voer ${u.eenheid ?? 'waarde'} in`}
                            min={0}
                          />
                        </Field>
                      </div>
                      <Button
                        onClick={() => logVoortgang(u.id)}
                        loading={loggen === u.id}
                        disabled={loggen === u.id || !logWaarde}
                        variant="secondary"
                      >
                        Log
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={() => logVoortgang(u.id)}
                      loading={loggen === u.id}
                      disabled={loggen === u.id || heeftVandaag}
                      variant={heeftVandaag ? 'secondary' : 'primary'}
                      leftIcon={heeftVandaag ? <Check size={16} aria-hidden /> : undefined}
                      style={{ width: '100%' }}
                    >
                      {heeftVandaag ? 'Vandaag geregistreerd' : 'Deelnemen vandaag'}
                    </Button>
                  )}
                </Card>
              )
            })}
          </div>
        )}

      </main>
    </div>
  )
}
