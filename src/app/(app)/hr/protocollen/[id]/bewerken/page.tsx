'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/supabase'
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
import { useVertaling } from '@/lib/i18n/TaalProvider'

// Labels staan in het woordenboek: werk.protocolCategorie.<value>
const CATEGORIEEN = ['algemeen', 'arbo', 'verzuim', 'it', 'hr', 'veiligheid', 'overig'].map(value => ({ value }))

export default function BewerkProtocolPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string
  const { toast } = useToast()
  const { t, taal } = useVertaling()

  const [laden, setLaden] = useState(true)
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState('')
  const [bevestigVerlaten, setBevestigVerlaten] = useState(false)

  const [titel, setTitel] = useState('')
  const [beschrijving, setBeschrijving] = useState('')
  const [inhoud, setInhoud] = useState('')
  const [categorie, setCategorie] = useState('algemeen')
  const [icoon, setIcoon] = useState('📋')
  const [kleur, setKleur] = useState('var(--mf-green)')
  const [gepubliceerd, setGepubliceerd] = useState(true)

  useEffect(() => {
    async function laad() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: profiel } = await supabase
        .from('profiles').select('bedrijf_id, rol').eq('id', user.id).single()
      if (!profiel || !['hr', 'admin'].includes(profiel.rol ?? '')) {
        router.push('/home'); return
      }

      const { data } = await supabase.from('protocollen').select('id, titel, beschrijving, inhoud, gepubliceerd, bedrijf_id, categorie, icoon, kleur').eq('id', id).single()
      if (!data || data.bedrijf_id !== profiel.bedrijf_id) { router.push('/hr/protocollen'); return }

      setTitel(data.titel)
      setBeschrijving(data.beschrijving ?? '')
      setInhoud(data.inhoud)
      setCategorie(data.categorie)
      setIcoon(data.icoon)
      setKleur(data.kleur)
      setGepubliceerd(data.gepubliceerd)
      setLaden(false)
    }
    laad()
  }, [router, id])

  async function opslaan() {
    if (!titel.trim()) { setFout(t('werk.protocolForm.foutTitel')); return }
    setBezig(true); setFout('')
    const { error } = await supabase.from('protocollen').update({
      titel: titel.trim(), beschrijving: beschrijving.trim() || null,
      inhoud: inhoud.trim(), categorie, icoon, kleur, gepubliceerd,
      bijgewerkt_op: new Date().toISOString(),
    }).eq('id', id)
    if (error) {
      const melding = taal === 'nl' ? error.message : t('werk.algemeen.ietsMis')
      setFout(t('werk.protocolForm.opslaanMisluktMet', { fout: melding }))
      toast({ title: t('werk.protocolForm.opslaanMislukt'), description: melding, variant: 'error' })
      setBezig(false)
      return
    }
    toast({ title: t('werk.protocolForm.wijzigingenToast'), variant: 'success' })
    router.push('/hr/protocollen')
  }

  function probeerAnnuleren() {
    if (titel.trim() !== '') { setBevestigVerlaten(true); return }
    router.push('/hr/protocollen')
  }

  // Fout-melding bepalen per veld voor aria-koppeling.
  const titelFout = fout === t('werk.protocolForm.foutTitel') ? fout : undefined
  const algemeneFout = fout && !titelFout ? fout : undefined

  if (laden) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><div className="mf-spinner" /></div>
    </div>
  )

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
            {t('werk.protocolForm.terug')}
          </button>
          <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-1)', letterSpacing: '-0.02em' }}>
            {t('werk.protocolForm.titelBewerken')}
          </h1>
        </div>

        <div className="flex flex-col gap-4">
          {/* Titel & beschrijving */}
          <Card style={{ padding: '20px' }}>
            <div className="flex flex-col gap-4">
              <Field label={t('werk.protocolForm.titel')} required error={titelFout}>
                <Input value={titel} onChange={e => setTitel(e.target.value)} />
              </Field>
              <Field label={t('werk.protocolForm.beschrijving')}>
                <Input value={beschrijving} onChange={e => setBeschrijving(e.target.value)} />
              </Field>
            </div>
          </Card>

          {/* Categorie */}
          <Card style={{ padding: '20px' }}>
            <fieldset style={{ border: 'none', margin: 0, padding: 0 }}>
              <legend className="text-sm font-semibold mb-3" style={{ color: 'var(--text-2)' }}>{t('werk.protocolForm.categorie')}</legend>
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
                      <span>{t(`werk.protocolCategorie.${cat.value}`)}</span>
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
              label={t('werk.protocolForm.inhoud')}
              hint={t('werk.protocolForm.opmaakHint')}
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
                <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{t('werk.protocolForm.gepubliceerd')}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
                  {gepubliceerd ? t('werk.protocolForm.zichtbaar') : t('werk.protocolForm.alleenHr')}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={gepubliceerd}
                aria-label={t('werk.protocolForm.gepubliceerdLabel')}
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
              {t('werk.algemeen.annuleren')}
            </Button>
            <Button onClick={opslaan} loading={bezig} disabled={bezig} style={{ flex: 1 }}>
              {t('werk.protocolForm.wijzigingenOpslaan')}
            </Button>
          </div>
        </div>
      </div>

      {/* Niet-opgeslagen wijzigingen */}
      <DialogRoot open={bevestigVerlaten} onOpenChange={setBevestigVerlaten}>
        <DialogContent>
          <DialogTitle>{t('werk.protocolForm.verlatenTitel')}</DialogTitle>
          <DialogDescription>{t('werk.protocolForm.verlatenTekstBewerken')}</DialogDescription>
          <div className="flex gap-3" style={{ marginTop: 24 }}>
            <Button variant="secondary" onClick={() => setBevestigVerlaten(false)} style={{ flex: 1 }}>
              {t('werk.protocolForm.blijven')}
            </Button>
            <Button variant="danger" onClick={() => router.push('/hr/protocollen')} style={{ flex: 1 }}>
              {t('werk.protocolForm.verlaten')}
            </Button>
          </div>
        </DialogContent>
      </DialogRoot>
      </main>
    </div>
  )
}
