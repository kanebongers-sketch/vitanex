'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Building2, Mail, Phone, MapPin, Users } from 'lucide-react'
import { supabase } from '@/lib/supabase/supabase'
import Navbar from '@/components/layout/Navbar'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { DialogRoot, DialogContent, DialogTitle } from '@/components/ui/Dialog'
import { Avatar } from '@/components/ui/Avatar'

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

type BadgeVariant = 'neutral' | 'accent' | 'success' | 'warning' | 'danger'

const ROL_VARIANT: Record<string, BadgeVariant> = {
  admin: 'accent',
  hr: 'accent',
  medewerker: 'neutral',
}

function rolVariant(rol: string): BadgeVariant {
  return ROL_VARIANT[rol] ?? 'neutral'
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
      <main className="px-6 py-6 mf-safe-bottom" style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* Header */}
        <div className="mb-5">
          <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-1)', letterSpacing: '-0.02em' }}>Medewerkersgids</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-3)' }}>{medewerkers.length} collega{medewerkers.length !== 1 ? "'s" : ''}</p>
        </div>

        {/* Zoekbalk */}
        <div className="relative mb-3">
          <label htmlFor="directory-zoek" className="sr-only">Zoek collega</label>
          <Search size={17} aria-hidden style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-4)', pointerEvents: 'none' }} />
          <input
            id="directory-zoek"
            type="search"
            placeholder="Zoek op naam, functie of afdeling..."
            value={zoekterm}
            onChange={e => setZoekterm(e.target.value)}
            className="mf-ui-control w-full"
            style={{
              padding: '10px 14px 10px 40px',
              fontSize: 16,
              lineHeight: 1.4,
              color: 'var(--text-1)',
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-strong)',
              borderRadius: 'var(--radius-md)',
              outline: 'none',
            }}
          />
        </div>

        {/* Rol filter pills */}
        <div role="group" aria-label="Filter op rol" className="flex gap-2 mb-5 overflow-x-auto pb-1">
          {rollen.map(r => {
            const actief = rolFilter === r
            return (
              <button
                key={r}
                type="button"
                onClick={() => setRolFilter(r)}
                aria-pressed={actief}
                className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition"
                style={{
                  background: actief ? 'var(--mentaforce-primary)' : 'var(--bg-subtle)',
                  color: actief ? 'var(--bg-app)' : 'var(--text-2)',
                  border: `1px solid ${actief ? 'var(--mentaforce-primary)' : 'var(--border-strong)'}`,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}>
                {r === 'alle' ? 'Alle' : ROL_LABELS[r] ?? r}
              </button>
            )
          })}
        </div>

        {/* Profiel detail overlay */}
        <DialogRoot open={!!geselecteerd} onOpenChange={(open) => { if (!open) setGeselecteerd(null) }}>
          <DialogContent>
            {geselecteerd && (
              <>
                <DialogTitle className="sr-only">{geselecteerd.naam}</DialogTitle>
                <div className="flex flex-col items-center mb-5">
                  <Avatar naam={geselecteerd.naam || '?'} avatarUrl={geselecteerd.avatar_url} size={72} />
                  <p className="text-xl font-bold mt-3" style={{ color: 'var(--text-1)' }}>{geselecteerd.naam}</p>
                  {geselecteerd.functie && <p className="text-sm mt-0.5" style={{ color: 'var(--text-3)' }}>{geselecteerd.functie}</p>}
                  <div className="mt-2">
                    <Badge variant={rolVariant(geselecteerd.rol)}>{ROL_LABELS[geselecteerd.rol] ?? geselecteerd.rol}</Badge>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  {geselecteerd.afdeling && (
                    <div className="flex items-center gap-3 py-2.5" style={{ borderBottom: '1px solid var(--border)' }}>
                      <Building2 size={18} aria-hidden style={{ color: 'var(--text-3)', flexShrink: 0 }} />
                      <div>
                        <p className="text-xs" style={{ color: 'var(--text-4)' }}>Afdeling</p>
                        <p className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>{geselecteerd.afdeling}</p>
                      </div>
                    </div>
                  )}
                  {geselecteerd.email && (
                    <a href={`mailto:${geselecteerd.email}`}
                      className="flex items-center gap-3 py-2.5"
                      style={{ borderBottom: '1px solid var(--border)' }}>
                      <Mail size={18} aria-hidden style={{ color: 'var(--text-3)', flexShrink: 0 }} />
                      <div>
                        <p className="text-xs" style={{ color: 'var(--text-4)' }}>E-mail</p>
                        <p className="text-sm font-medium" style={{ color: 'var(--mentaforce-primary)' }}>{geselecteerd.email}</p>
                      </div>
                    </a>
                  )}
                  {geselecteerd.telefoon && (
                    <a href={`tel:${geselecteerd.telefoon}`}
                      className="flex items-center gap-3 py-2.5"
                      style={{ borderBottom: '1px solid var(--border)' }}>
                      <Phone size={18} aria-hidden style={{ color: 'var(--text-3)', flexShrink: 0 }} />
                      <div>
                        <p className="text-xs" style={{ color: 'var(--text-4)' }}>Telefoon</p>
                        <p className="text-sm font-medium" style={{ color: 'var(--mentaforce-primary)' }}>{geselecteerd.telefoon}</p>
                      </div>
                    </a>
                  )}
                  {geselecteerd.locatie && (
                    <div className="flex items-center gap-3 py-2.5">
                      <MapPin size={18} aria-hidden style={{ color: 'var(--text-3)', flexShrink: 0 }} />
                      <div>
                        <p className="text-xs" style={{ color: 'var(--text-4)' }}>Locatie</p>
                        <p className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>{geselecteerd.locatie}</p>
                      </div>
                    </div>
                  )}
                </div>

                {geselecteerd.id !== mijnId && geselecteerd.email && (
                  <a href={`mailto:${geselecteerd.email}`}
                    className="mf-pressable mt-5 w-full flex items-center justify-center gap-2"
                    style={{
                      padding: '12px',
                      borderRadius: 'var(--radius-btn)',
                      background: 'var(--mentaforce-primary)',
                      color: 'var(--bg-app)',
                      fontWeight: 600,
                      fontSize: 14,
                    }}>
                    <Mail size={16} aria-hidden /> E-mail sturen
                  </a>
                )}
              </>
            )}
          </DialogContent>
        </DialogRoot>

        {/* Medewerkers lijst */}
        {laden ? (
          <div className="flex justify-center py-16">
            <div className="mf-spinner" />
          </div>
        ) : gefilterd.length === 0 ? (
          <Card>
            <EmptyState
              icon={Users}
              title={zoekterm ? `Geen resultaten voor "${zoekterm}"` : 'Geen collega\'s gevonden'}
              description={zoekterm ? 'Probeer een andere zoekterm.' : undefined}
            />
          </Card>
        ) : (
          <ul className="flex flex-col gap-2" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {gefilterd.map(m => (
              <li key={m.id}>
                <Card
                  interactive
                  role="button"
                  aria-label={`Bekijk profiel van ${m.naam || 'collega'}`}
                  onClick={() => setGeselecteerd(m)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setGeselecteerd(m) } }}
                  className="flex items-center gap-3"
                  style={{ padding: '12px 16px', width: '100%' }}
                >
                  <Avatar naam={m.naam || '?'} avatarUrl={m.avatar_url} size={44} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{m.naam || 'Onbekend'}</p>
                      {m.id === mijnId && <Badge variant="accent">jij</Badge>}
                    </div>
                    <p className="text-xs truncate" style={{ color: 'var(--text-4)' }}>
                      {m.functie ?? m.afdeling ?? m.email ?? '—'}
                    </p>
                  </div>
                  <Badge variant={rolVariant(m.rol)}>{ROL_LABELS[m.rol] ?? m.rol}</Badge>
                </Card>
              </li>
            ))}
            {(zoekterm || rolFilter !== 'alle') && (
              <p className="text-xs text-center pt-2" style={{ color: 'var(--text-4)' }}>{gefilterd.length} van {medewerkers.length} collega&apos;s</p>
            )}
          </ul>
        )}
      </main>
    </div>
  )
}
