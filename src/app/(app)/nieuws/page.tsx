'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Megaphone,
  ClipboardList,
  PartyPopper,
  TrendingUp,
  MessageCircle,
  Newspaper,
  Zap,
  Plus,
  type LucideIcon,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/layout/Navbar'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import {
  DialogRoot,
  DialogContent,
  DialogTitle,
} from '@/components/ui/Dialog'
import { useToast } from '@/components/ui/Toast'


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

const TYPE_STIJL: Record<NieuwsType, { icon: LucideIcon; bg: string; color: string; label: string }> = {
  aankondiging: { icon: Megaphone,     bg: 'var(--mf-blue-light)', color: 'var(--mf-blue)', label: 'Aankondiging' },
  beleid:       { icon: ClipboardList, bg: 'var(--mf-amber-light)', color: 'var(--mf-amber-dark)', label: 'Beleid' },
  evenement:    { icon: PartyPopper,   bg: 'var(--mf-purple-light)', color: 'var(--mf-purple)', label: 'Evenement' },
  resultaten:   { icon: TrendingUp,    bg: 'var(--mf-green-light)', color: 'var(--mf-green-dark)', label: 'Resultaten' },
  overig:       { icon: MessageCircle, bg: 'var(--bg-subtle)', color: 'var(--text-2)', label: 'Overig' },
}

export default function NieuwsPage() {
  const router = useRouter()
  const { toast } = useToast()
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
    } else {
      toast({ title: 'Plaatsen mislukt', description: 'Het bericht kon niet worden gepubliceerd. Probeer het opnieuw.', variant: 'error' })
    }
    setOpslaan(false)
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-app)' }}>
      <Navbar />
      <main className="px-6 py-6 mf-safe-bottom" style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* Header */}
        <div className="flex items-center justify-between mb-5" style={{ gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>Bedrijfsnieuws</h1>
            <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>Updates van jouw organisatie</p>
          </div>
          {isHr && (
            <Button leftIcon={<Plus size={16} aria-hidden />} onClick={() => setFormulier(true)}>
              Plaatsen
            </Button>
          )}
        </div>

        {/* HR Formulier */}
        <DialogRoot open={formulier} onOpenChange={setFormulier}>
          <DialogContent closeLabel="Formulier sluiten">
            <DialogTitle>Bericht plaatsen</DialogTitle>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 20 }}>
              <div>
                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>Type</p>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(TYPE_STIJL) as NieuwsType[]).map(t => {
                    const s = TYPE_STIJL[t]
                    const Icon = s.icon
                    const actief = type === t
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setType(t)}
                        aria-pressed={actief}
                        className="mf-nieuws-type"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '6px 12px',
                          borderRadius: 100,
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                          background: actief ? s.bg : 'var(--bg-subtle)',
                          border: `1px solid ${actief ? s.color : 'var(--border-strong)'}`,
                          color: actief ? s.color : 'var(--text-3)',
                          transition: 'background 0.15s var(--ease), border-color 0.15s var(--ease), color 0.15s var(--ease)',
                        }}
                      >
                        <Icon size={14} aria-hidden /> {s.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <Field label="Titel" htmlFor="nieuws-titel">
                <Input
                  id="nieuws-titel"
                  type="text"
                  value={titel}
                  onChange={e => setTitel(e.target.value)}
                  placeholder="Geef een duidelijke titel..."
                />
              </Field>

              <Field label="Inhoud" htmlFor="nieuws-inhoud">
                <Textarea
                  id="nieuws-inhoud"
                  rows={5}
                  value={inhoud}
                  onChange={e => setInhoud(e.target.value)}
                  placeholder="Schrijf hier het bericht..."
                />
              </Field>

              <label className="flex items-center gap-3 cursor-pointer">
                <div className="relative">
                  <input type="checkbox" checked={belangrijk} onChange={e => setBelangrijk(e.target.checked)} className="sr-only" />
                  <div style={{ width: 40, height: 24, borderRadius: 999, transition: 'background 0.15s var(--ease)', background: belangrijk ? 'var(--mentaforce-primary)' : 'var(--border-strong)' }}>
                    <div style={{ position: 'absolute', top: 4, left: 4, width: 16, height: 16, borderRadius: '50%', background: 'var(--bg-card)', transition: 'transform 0.15s var(--ease)', transform: belangrijk ? 'translateX(16px)' : 'translateX(0)' }} />
                  </div>
                </div>
                <span style={{ fontSize: 14, color: 'var(--text-2)' }}>Markeren als belangrijk</span>
              </label>

              <Button onClick={publiceren} loading={opslaan} disabled={opslaan || !titel.trim() || !inhoud.trim()} style={{ width: '100%' }}>
                {opslaan ? 'Plaatsen...' : 'Publiceren'}
              </Button>
            </div>

            <style>{`
              .mf-nieuws-type:focus-visible {
                outline: 2px solid var(--mentaforce-primary);
                outline-offset: 2px;
              }
            `}</style>
          </DialogContent>
        </DialogRoot>

        {/* Berichten */}
        {laden ? (
          <div className="flex justify-center py-16">
            <div className="mf-spinner" />
          </div>
        ) : berichten.length === 0 ? (
          <Card>
            <EmptyState
              icon={Newspaper}
              title="Nog geen berichten geplaatst"
              description={isHr ? "Klik op 'Plaatsen' om een bericht toe te voegen." : 'Updates van jouw organisatie verschijnen hier.'}
            />
          </Card>
        ) : (
          <div className="flex flex-col gap-4">
            {berichten.map(b => {
              const stijl = TYPE_STIJL[b.type as NieuwsType] ?? TYPE_STIJL.overig
              const Icon = stijl.icon
              const isOpen = uitgevouwen === b.id
              return (
                <Card
                  key={b.id}
                  style={{
                    overflow: 'hidden',
                    borderLeft: b.belangrijk ? '4px solid var(--mentaforce-primary)' : '4px solid transparent',
                  }}
                >
                  {b.belangrijk && (
                    <div style={{ padding: '8px 16px', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, background: 'var(--mentaforce-primary-light)', color: 'var(--mentaforce-primary)' }}>
                      <Zap size={14} aria-hidden /> Belangrijk bericht
                    </div>
                  )}
                  <div style={{ padding: 16 }}>
                    <div className="flex items-start gap-3 mb-2">
                      <span style={{ flexShrink: 0, marginTop: 2, color: stijl.color }}>
                        <Icon size={22} aria-hidden />
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span style={{ fontSize: 12, fontWeight: 600, padding: '2px 10px', borderRadius: 100, background: stijl.bg, color: stijl.color }}>
                            {stijl.label}
                          </span>
                          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
                            {new Date(b.gepubliceerd_op).toLocaleDateString('nl-BE', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </span>
                        </div>
                        <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)', lineHeight: 1.4 }}>{b.titel}</h3>
                      </div>
                    </div>

                    <div className={`ml-9 ${isOpen ? '' : 'line-clamp-3'}`} style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.6 }}>
                      {b.inhoud}
                    </div>

                    {b.inhoud.length > 150 && (
                      <button
                        onClick={() => setUitgevouwen(isOpen ? null : b.id)}
                        className="mt-2 ml-9 mf-nieuws-meer"
                        style={{ fontSize: 12, fontWeight: 600, color: 'var(--mentaforce-primary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                        {isOpen ? 'Minder tonen' : 'Meer lezen'}
                      </button>
                    )}

                    <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 12, marginLeft: 36 }}>
                      Geplaatst door <span style={{ fontWeight: 600, color: 'var(--text-2)' }}>{b.auteur_naam}</span>
                    </p>
                  </div>
                </Card>
              )
            })}
            <style>{`
              .mf-nieuws-meer:focus-visible {
                outline: 2px solid var(--mentaforce-primary);
                outline-offset: 2px;
                border-radius: 4px;
              }
            `}</style>
          </div>
        )}
      </main>
    </div>
  )
}
