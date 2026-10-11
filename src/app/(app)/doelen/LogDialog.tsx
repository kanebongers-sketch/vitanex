'use client'

import { Check, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Textarea } from '@/components/ui/Textarea'
import {
  DialogRoot, DialogContent, DialogTitle, DialogDescription,
} from '@/components/ui/Dialog'
import { type WeekDoel, logVandaag } from '@/lib/doelen/weekdoelen'
import type { CatInfo } from './DoelKaart'
import { useVertaling } from '@/lib/i18n/TaalProvider'
import { rijkeTekst } from '@/components/vita/rijkeTekst'

interface LogDialogProps {
  /** Het doel dat gelogd/aangepast wordt; null = dialog dicht. */
  doel: WeekDoel | null
  cat: CatInfo | null
  notitie: string
  onNotitieChange: (waarde: string) => void
  /** Bevestig met gehaald/niet gelukt — slaat ook de notitie op. */
  onBevestig: (gehaald: boolean) => void
  onSluit: () => void
}

/**
 * Detail-dialog voor een dagelijkse doel-log: aanpassen van een eerdere keuze
 * of loggen mét notitie. Enter in de notitie bevestigt direct als "gehaald"
 * (Superhuman-principe: zo min mogelijk tikken), Shift+Enter maakt een nieuwe regel.
 */
export default function LogDialog({ doel, cat, notitie, onNotitieChange, onBevestig, onSluit }: LogDialogProps) {
  const { t } = useVertaling()
  const logEntry = doel ? logVandaag(doel) : undefined

  return (
    <DialogRoot open={!!doel} onOpenChange={open => { if (!open) onSluit() }}>
      {doel && cat && (
        <DialogContent>
          <p style={{ fontSize: 11, color: cat.kleur, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>{cat.label}</p>
          <DialogTitle style={{ fontSize: 16, marginTop: 2 }}>{doel.doel_titel}</DialogTitle>

          <DialogDescription>{doel.doel_beschrijving}</DialogDescription>

          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', margin: '16px 0 12px' }}>
            {rijkeTekst(t('vita.doelen.dialoogVraag'), {
              doel: <strong style={{ color: cat.kleur }}>{doel.target_waarde} {doel.eenheid}</strong>,
            })}
          </p>

          {/* Gehaald / Niet gelukt knoppen */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
            <Button
              onClick={() => onBevestig(true)}
              leftIcon={<Check size={16} strokeWidth={3} aria-hidden />}
              style={{
                padding: '14px', borderRadius: 'var(--radius-md)',
                border: `2px solid ${logEntry?.gehaald === true ? cat.kleur : 'var(--border-strong)'}`,
                background: logEntry?.gehaald === true ? cat.kleur : 'var(--bg-subtle)',
                color: logEntry?.gehaald === true ? 'var(--bg-app)' : 'var(--text-2)',
              }}
            >
              {t('vita.doelen.jaGehaald')}
            </Button>
            <Button
              onClick={() => onBevestig(false)}
              leftIcon={<X size={16} strokeWidth={3} aria-hidden />}
              style={{
                padding: '14px', borderRadius: 'var(--radius-md)',
                border: `2px solid ${logEntry?.gehaald === false ? 'var(--mf-red)' : 'var(--border-strong)'}`,
                background: logEntry?.gehaald === false ? 'var(--mf-red)' : 'var(--bg-subtle)',
                color: logEntry?.gehaald === false ? 'var(--bg-app)' : 'var(--text-2)',
              }}
            >
              {t('vita.doelen.nietGelukt')}
            </Button>
          </div>

          <Field label={t('vita.doelen.notitieLabel')}>
            <Textarea
              placeholder={t('vita.doelen.notitiePlaceholder')}
              value={notitie}
              onChange={e => onNotitieChange(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  onBevestig(true)
                }
              }}
              rows={2}
            />
          </Field>
          <p style={{ fontSize: 11, color: 'var(--text-4)', margin: '8px 0 0' }}>
            {t('vita.doelen.enterHint')}
          </p>
        </DialogContent>
      )}
    </DialogRoot>
  )
}
