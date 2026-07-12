'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/supabase'
import Navbar from '@/components/layout/Navbar'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import {
  DialogRoot, DialogContent, DialogTitle, DialogDescription,
} from '@/components/ui/Dialog'
import { useToast } from '@/components/ui/Toast'
import { FileText, Plus, Pencil, Eye, EyeOff, Trash2 } from 'lucide-react'


type Protocol = {
  id: string
  titel: string
  beschrijving: string | null
  categorie: string
  icoon: string
  kleur: string
  gepubliceerd: boolean
  aangemaakt_op: string
  bijgewerkt_op: string
}

const CAT_LABELS: Record<string, string> = {
  algemeen: 'Algemeen', arbo: 'Arbo & Veiligheid', verzuim: 'Verzuim',
  it: 'IT & Systemen', hr: 'HR & Onboarding', veiligheid: 'Veiligheid', overig: 'Overig',
}

export default function HrProtokollenPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [protocollen, setProtocollen] = useState<Protocol[]>([])
  const [laden, setLaden] = useState(true)
  const [verwijderModal, setVerwijderModal] = useState<string | null>(null)

  useEffect(() => {
    async function laad() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: profiel } = await supabase
        .from('profiles').select('bedrijf_id, rol').eq('id', user.id).single()
      if (!profiel || !['hr', 'admin'].includes(profiel.rol ?? '')) {
        router.push('/home'); return
      }
      const { data } = await supabase
        .from('protocollen').select('id, titel, beschrijving, categorie, gepubliceerd, aangemaakt_op, bijgewerkt_op').eq('bedrijf_id', profiel.bedrijf_id)
        .order('aangemaakt_op', { ascending: false })
        .limit(100)
      if (data) setProtocollen(data as Protocol[])
      setLaden(false)
    }
    laad()
  }, [router])

  async function togglePublicatie(id: string, huidig: boolean) {
    const { error } = await supabase.from('protocollen').update({ gepubliceerd: !huidig }).eq('id', id)
    if (error) { toast({ title: 'Kon publicatie niet wijzigen', variant: 'error' }); return }
    setProtocollen(prev => prev.map(p => p.id === id ? { ...p, gepubliceerd: !huidig } : p))
  }

  async function verwijder(id: string) {
    const { error } = await supabase.from('protocollen').delete().eq('id', id)
    if (error) { toast({ title: 'Verwijderen mislukt', variant: 'error' }); return }
    setProtocollen(prev => prev.filter(p => p.id !== id))
    setVerwijderModal(null)
    toast({ title: 'Protocol verwijderd', variant: 'success' })
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <main style={{ padding: '32px 32px 48px' }}>
      <div style={{ maxWidth: 760 }}>

        <div className="flex items-start justify-between mb-6">
          <div>
            <nav aria-label="Kruimelpad" className="flex items-center gap-2 mb-1">
              <Link
                href="/hr"
                className="text-sm"
                style={{ color: 'var(--text-4)', borderRadius: 'var(--radius-sm)' }}
              >
                HR
              </Link>
              <span aria-hidden style={{ color: 'var(--text-4)' }}>/</span>
              <span className="text-sm" style={{ color: 'var(--text-2)' }}>Protocollen</span>
            </nav>
            <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-1)', letterSpacing: '-0.02em' }}>
              Protocollen beheren
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-3)' }}>
              {protocollen.length} protocol{protocollen.length !== 1 ? 'len' : ''}
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => router.push('/hr/protocollen/nieuw')}
            leftIcon={<Plus size={16} aria-hidden />}
          >
            Nieuw
          </Button>
        </div>

        {laden ? (
          <div className="flex justify-center py-16"><div className="mf-spinner" /></div>
        ) : protocollen.length === 0 ? (
          <Card>
            <EmptyState
              icon={FileText}
              title="Nog geen protocollen"
              description="Maak je eerste protocol aan om beleid en procedures te delen met je team."
              action={
                <Button
                  onClick={() => router.push('/hr/protocollen/nieuw')}
                  leftIcon={<Plus size={16} aria-hidden />}
                >
                  Eerste protocol aanmaken
                </Button>
              }
            />
          </Card>
        ) : (
          <ul className="flex flex-col gap-3" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {protocollen.map(p => (
              <li key={p.id}>
                <Card interactive style={{ padding: '16px' }}>
                  <div className="flex items-start gap-4">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'var(--mentaforce-primary-light)', color: 'var(--mentaforce-primary)' }}
                      aria-hidden
                    >
                      <FileText size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{p.titel}</p>
                          <p className="text-xs mt-0.5" style={{ color: 'var(--text-4)' }}>
                            {CAT_LABELS[p.categorie] ?? p.categorie} · {new Date(p.bijgewerkt_op).toLocaleDateString('nl-BE', { day: 'numeric', month: 'short' })}
                          </p>
                        </div>
                        <Badge variant={p.gepubliceerd ? 'success' : 'warning'} style={{ flexShrink: 0 }}>
                          {p.gepubliceerd ? 'Gepubliceerd' : 'Concept'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-3 flex-wrap">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => router.push(`/hr/protocollen/${p.id}/bewerken`)}
                          leftIcon={<Pencil size={15} aria-hidden />}
                        >
                          Bewerken
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => togglePublicatie(p.id, p.gepubliceerd)}
                          leftIcon={p.gepubliceerd ? <EyeOff size={15} aria-hidden /> : <Eye size={15} aria-hidden />}
                        >
                          {p.gepubliceerd ? 'Als concept opslaan' : 'Publiceren'}
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => setVerwijderModal(p.id)}
                          leftIcon={<Trash2 size={15} aria-hidden />}
                        >
                          Verwijderen
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Verwijder bevestiging */}
      <DialogRoot open={verwijderModal !== null} onOpenChange={(open) => { if (!open) setVerwijderModal(null) }}>
        <DialogContent>
          <DialogTitle>Protocol verwijderen?</DialogTitle>
          <DialogDescription>Dit kan niet ongedaan worden gemaakt.</DialogDescription>
          <div className="flex gap-3" style={{ marginTop: 24 }}>
            <Button variant="secondary" onClick={() => setVerwijderModal(null)} style={{ flex: 1 }}>
              Annuleren
            </Button>
            <Button
              variant="danger"
              onClick={() => { if (verwijderModal) verwijder(verwijderModal) }}
              style={{ flex: 1 }}
              leftIcon={<Trash2 size={16} aria-hidden />}
            >
              Verwijderen
            </Button>
          </div>
        </DialogContent>
      </DialogRoot>
      </main>
    </div>
  )
}
