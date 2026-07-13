'use client'

import { useState, type CSSProperties } from 'react'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Field } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { Plus, Check } from 'lucide-react'
import {
  PIJLERS,
  CONTENT_TYPES,
  PIJLER_LABELS,
  CONTENT_TYPE_LABELS,
  type ContentType,
  type Pijler,
} from '@/lib/coaching/content'

export interface ContentWaarden {
  titel: string
  inhoud: string
  pijler: Pijler
  type: ContentType
  media_url: string
  /** true = voor al mijn klanten (klant_id NULL); false = alleen deze klant. */
  voorAlleKlanten: boolean
  gepubliceerd: boolean
}

export interface ContentFormulierProps {
  /** Retourneer true bij succes; bij aanmaken wist het formulier dan zijn velden. */
  onSubmit: (waarden: ContentWaarden) => Promise<boolean>
  bezig: boolean
  fout: string | null
  klantNaam: string
  /** Beginwaarden vullen het formulier voor bewerken; leeg = aanmaakmodus. */
  initieel?: ContentWaarden
  onAnnuleer?: () => void
}

const SELECT_STYLE: CSSProperties = {
  width: '100%', padding: '10px 14px', fontSize: 15, lineHeight: 1.4,
  color: 'var(--text-1)', background: 'var(--bg-subtle)',
  border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-md)',
  outline: 'none', cursor: 'pointer',
}

const LEEG: ContentWaarden = {
  titel: '', inhoud: '', pijler: 'mind', type: 'artikel',
  media_url: '', voorAlleKlanten: false, gepubliceerd: true,
}

export function ContentFormulier({ onSubmit, bezig, fout, klantNaam, initieel, onAnnuleer }: ContentFormulierProps) {
  const [waarden, setWaarden] = useState<ContentWaarden>(initieel ?? LEEG)
  const bewerken = initieel !== undefined

  function zet<K extends keyof ContentWaarden>(sleutel: K, waarde: ContentWaarden[K]) {
    setWaarden(prev => ({ ...prev, [sleutel]: waarde }))
  }

  async function verstuur() {
    if (!waarden.titel.trim() || !waarden.inhoud.trim() || bezig) return
    const gelukt = await onSubmit(waarden)
    if (gelukt && !bewerken) setWaarden(LEEG)
  }

  const doelgroepOpties: { waarde: boolean; label: string }[] = [
    { waarde: false, label: klantNaam },
    { waarde: true, label: 'Al mijn klanten' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Field label="Titel" error={fout ?? undefined}>
        <Input
          type="text"
          placeholder="Bijv. Ademhalingsoefening bij stress"
          value={waarden.titel}
          maxLength={160}
          onChange={e => zet('titel', e.target.value)}
        />
      </Field>

      <Field label="Inhoud" hint="De les of opdracht in je eigen woorden.">
        <Textarea
          placeholder="Schrijf hier de mindset- of stress-les of -opdracht voor je klant…"
          value={waarden.inhoud}
          rows={7}
          maxLength={20000}
          onChange={e => zet('inhoud', e.target.value)}
        />
      </Field>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Type">
          <select className="mf-coach-select" style={SELECT_STYLE} value={waarden.type} onChange={e => zet('type', e.target.value as ContentType)}>
            {CONTENT_TYPES.map(t => <option key={t} value={t}>{CONTENT_TYPE_LABELS[t]}</option>)}
          </select>
        </Field>

        <Field label="Pijler">
          <select className="mf-coach-select" style={SELECT_STYLE} value={waarden.pijler} onChange={e => zet('pijler', e.target.value as Pijler)}>
            {PIJLERS.map(p => <option key={p} value={p}>{PIJLER_LABELS[p]}</option>)}
          </select>
        </Field>
      </div>

      <Field label="Media-link (optioneel)" hint="Externe link naar audio, video of bestand.">
        <Input
          type="url"
          placeholder="https://…"
          value={waarden.media_url}
          maxLength={500}
          onChange={e => zet('media_url', e.target.value)}
        />
      </Field>

      {/* Doelgroep alleen bij aanmaken: bestaande content wijzigt niet van doelgroep. */}
      {!bewerken && (
      <fieldset style={{ border: 'none', margin: 0, padding: 0 }}>
        <legend style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>Voor wie</legend>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {doelgroepOpties.map(opt => {
            const actief = waarden.voorAlleKlanten === opt.waarde
            return (
              <button
                key={String(opt.waarde)}
                type="button"
                onClick={() => zet('voorAlleKlanten', opt.waarde)}
                aria-pressed={actief}
                className="mf-pressable"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                  padding: '10px 12px', borderRadius: 'var(--radius-md)', fontSize: 13, textAlign: 'left',
                  fontWeight: actief ? 600 : 500, cursor: 'pointer',
                  background: actief ? 'var(--mentaforce-primary-light)' : 'var(--bg-subtle)',
                  border: `1px solid ${actief ? 'var(--mentaforce-primary)' : 'var(--border)'}`,
                  color: actief ? 'var(--mentaforce-primary)' : 'var(--text-3)',
                  transition: 'background 0.15s var(--ease), border-color 0.15s var(--ease)',
                }}
              >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{opt.label}</span>
                {actief && <Check size={15} aria-hidden style={{ flexShrink: 0 }} />}
              </button>
            )
          })}
        </div>
      </fieldset>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>Publiceren</p>
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
            {waarden.gepubliceerd ? 'Direct zichtbaar voor je klant' : 'Alleen zichtbaar voor jou (concept)'}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={waarden.gepubliceerd}
          aria-label="Content publiceren"
          onClick={() => zet('gepubliceerd', !waarden.gepubliceerd)}
          className="relative"
          style={{
            width: 46, height: 26, borderRadius: 100, flexShrink: 0, position: 'relative',
            background: waarden.gepubliceerd ? 'var(--mentaforce-primary)' : 'var(--border-strong)',
            transition: 'background 0.15s var(--ease)', border: 'none', cursor: 'pointer',
          }}
        >
          <span style={{
            position: 'absolute', top: 3, left: 3, width: 20, height: 20, borderRadius: '50%',
            background: 'var(--bg-app)',
            transform: waarden.gepubliceerd ? 'translateX(20px)' : 'translateX(0)',
            transition: 'transform 0.18s var(--ease)',
          }} />
        </button>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        {bewerken && onAnnuleer && (
          <Button variant="secondary" onClick={onAnnuleer} style={{ flex: 1 }}>Annuleer</Button>
        )}
        <Button
          onClick={verstuur}
          loading={bezig}
          disabled={!waarden.titel.trim() || !waarden.inhoud.trim()}
          leftIcon={bewerken ? <Check size={15} aria-hidden /> : <Plus size={15} aria-hidden />}
          style={{ flex: bewerken ? 1 : undefined }}
        >
          {bewerken ? 'Wijzigingen opslaan' : 'Content toevoegen'}
        </Button>
      </div>

      <style>{`
        .mf-coach-select:focus-visible {
          border-color: var(--mentaforce-primary);
          box-shadow: 0 0 0 3px var(--mentaforce-primary-light);
          outline: none;
        }
      `}</style>
    </div>
  )
}
