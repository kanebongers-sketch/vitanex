'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/layout/Navbar'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { useToast } from '@/components/ui/Toast'
import {
  DialogRoot, DialogContent, DialogTitle, DialogDescription,
} from '@/components/ui/Dialog'
import { ArrowLeft, Check } from 'lucide-react'

const CATEGORIEEN = [
  { value: 'algemeen', label: 'Algemeen' },
  { value: 'arbo', label: 'Arbo & Veiligheid' },
  { value: 'verzuim', label: 'Verzuim' },
  { value: 'it', label: 'IT & Systemen' },
  { value: 'hr', label: 'HR & Onboarding' },
  { value: 'veiligheid', label: 'Veiligheid' },
  { value: 'overig', label: 'Overig' },
]

export default function NieuwProtocolPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [bedrijfId, setBedrijfId] = useState('')
  const [userId, setUserId] = useState('')
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState('')
  const [bevestigVerlaten, setBevestigVerlaten] = useState(false)

  const [titel, setTitel] = useState('')
  const [beschrijving, setBeschrijving] = useState('')
  const [inhoud, setInhoud] = useState('# Titel\n\n## Sectie\n\nSchrijf hier de inhoud van het protocol...')
  const [categorie, setCategorie] = useState('algemeen')
  const [icoon] = useState('📋')
  const [kleur] = useState('var(--mf-green)')
  const [gepubliceerd, setGepubliceerd] = useState(true)

  const isAangepast = titel.trim() !== '' || beschrijving.trim() !== ''

  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: profiel } = await supabase
        .from('profiles').select('bedrijf_id, rol').eq('id', user.id).single()
      if (!profiel || !['hr', 'admin'].includes(profiel.rol ?? '')) {
        router.push('/home'); return
      }
      setBedrijfId(profiel.bedrijf_id)
      setUserId(user.id)
    }
    check()
  }, [router])

  async function opslaan() {
    if (!titel.trim()) { setFout('Vul een titel in.'); return }
    if (!inhoud.trim()) { setFout('Vul de inhoud in.'); return }
    setBezig(true); setFout('')
    const { error } = await supabase.from('protocollen').insert({
      bedrijf_id: bedrijfId, auteur_id: userId,
      titel: titel.trim(), beschrijving: beschrijving.trim() || null,
      inhoud: inhoud.trim(), categorie, icoon, kleur, gepubliceerd,
    })
    if (error) {
      setFout('Opslaan mislukt: ' + error.message)
      toast({ title: 'Opslaan mislukt', description: error.message, variant: 'error' })
      setBezig(false)
      return
    }
    toast({ title: gepubliceerd ? 'Protocol gepubliceerd' : 'Concept opgeslagen', variant: 'success' })
    router.push('/hr/protocollen')
  }

  function probeerAnnuleren() {
    if (isAangepast) { setBevestigVerlaten(true); return }
    router.push('/hr/protocollen')
  }

  // Fout-melding bepalen per veld voor aria-koppeling.
  const titelFout = fout === 'Vul een titel in.' ? fout : undefined
  const inhoudFout = fout === 'Vul de inhoud in.' ? fout : undefined
  const algemeneFout = fout && !titelFout && !inhoudFout ? fout : undefined

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <main style={{ padding: '32px 32px 48px' }}>
      <div style={{ maxWidth: 680 }}>

        <div className="mb-6">
          <button
            type="button"
            onClick={probeerAnnuleren}
            className="mf-pressable inline-flex items-center gap-1.5 text-sm mb-2"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 0, borderRadius: 'var(--radius-sm)' }}
          >
            <ArrowLeft size={15} aria-hidden />
            Terug naar protocollen
          </button>
          <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-1)', letterSpacing: '-0.02em' }}>
            Protocol aanmaken
          </h1>
        </div>

        <div className="flex flex-col gap-4">
          {/* Titel & beschrijving */}
          <Card style={{ padding: '20px' }}>
            <div className="flex flex-col gap-4">
              <Field label="Titel" required error={titelFout}>
                <Input
                  value={titel}
                  onChange={e => setTitel(e.target.value)}
                  placeholder="bv. Verzuimprotocol 2026"
                />
              </Field>
              <Field label="Korte beschrijving">
                <Input
                  value={beschrijving}
                  onChange={e => setBeschrijving(e.target.value)}
                  placeholder="Wat staat er in dit protocol?"
                />
              </Field>
            </div>
          </Card>

          {/* Categorie */}
          <Card style={{ padding: '20px' }}>
            <fieldset style={{ border: 'none', margin: 0, padding: 0 }}>
              <legend className="text-sm font-semibold mb-3" style={{ color: 'var(--text-2)' }}>Categorie</legend>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORIEEN.map(cat => {
                  const actief = categorie === cat.value
                  return (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setCategorie(cat.value)}
                      aria-pressed={actief}
                      className="mf-pressable flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-sm text-left"
                      style={{
                        background: actief ? 'var(--mentaforce-primary-light)' : 'var(--bg-subtle)',
                        border: `1px solid ${actief ? 'var(--mentaforce-primary)' : 'var(--border)'}`,
                        color: actief ? 'var(--mentaforce-primary)' : 'var(--text-3)',
                        fontWeight: actief ? 600 : 400,
                        transition: 'background 0.15s var(--ease), border-color 0.15s var(--ease)',
                      }}
                    >
                      <span>{cat.label}</span>
                      {actief && <Check size={15} aria-hidden />}
                    </button>
                  )
                })}
              </div>
            </fieldset>
          </Card>

          {/* Inhoud (Markdown) */}
          <Card style={{ padding: '20px' }}>
            <Field
              label="Inhoud (Markdown)"
              required
              hint="Opmaak: # H1 · ## H2 · **vet** · - lijst"
              error={inhoudFout}
            >
              <Textarea
                value={inhoud}
                onChange={e => setInhoud(e.target.value)}
                rows={16}
                style={{ fontFamily: 'var(--font-mono, ui-monospace, monospace)', fontSize: 14, lineHeight: 1.6, resize: 'none' }}
              />
            </Field>
          </Card>

          {/* Publicatie */}
          <Card style={{ padding: '20px' }}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>Publiceren</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
                  {gepubliceerd ? 'Zichtbaar voor alle medewerkers' : 'Alleen zichtbaar voor HR (concept)'}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={gepubliceerd}
                aria-label="Protocol publiceren"
                onClick={() => setGepubliceerd(!gepubliceerd)}
                className="relative w-12 h-6 rounded-full flex-shrink-0"
                style={{
                  background: gepubliceerd ? 'var(--mentaforce-primary)' : 'var(--border-strong)',
                  transition: 'background 0.15s var(--ease)',
                  border: 'none', cursor: 'pointer',
                }}
              >
                <span
                  className="absolute top-0.5 w-5 h-5 rounded-full"
                  style={{
                    background: 'var(--bg-app)',
                    transform: gepubliceerd ? 'translateX(26px)' : 'translateX(2px)',
                    transition: 'transform 0.18s var(--ease)',
                  }}
                />
              </button>
            </div>
          </Card>

          {algemeneFout && (
            <p role="alert" aria-live="polite" className="text-sm" style={{ color: 'var(--mf-red)' }}>
              {algemeneFout}
            </p>
          )}

          <div className="flex gap-3">
            <Button variant="secondary" onClick={probeerAnnuleren} style={{ flex: 1 }}>
              Annuleren
            </Button>
            <Button onClick={opslaan} loading={bezig} disabled={bezig} style={{ flex: 1 }}>
              {gepubliceerd ? 'Publiceren' : 'Als concept opslaan'}
            </Button>
          </div>
        </div>
      </div>

      {/* Niet-opgeslagen wijzigingen */}
      <DialogRoot open={bevestigVerlaten} onOpenChange={setBevestigVerlaten}>
        <DialogContent>
          <DialogTitle>Pagina verlaten?</DialogTitle>
          <DialogDescription>Je hebt niet-opgeslagen wijzigingen. Deze gaan verloren als je nu weggaat.</DialogDescription>
          <div className="flex gap-3" style={{ marginTop: 24 }}>
            <Button variant="secondary" onClick={() => setBevestigVerlaten(false)} style={{ flex: 1 }}>
              Blijven
            </Button>
            <Button variant="danger" onClick={() => router.push('/hr/protocollen')} style={{ flex: 1 }}>
              Verlaten
            </Button>
          </div>
        </DialogContent>
      </DialogRoot>
      </main>
    </div>
  )
}
