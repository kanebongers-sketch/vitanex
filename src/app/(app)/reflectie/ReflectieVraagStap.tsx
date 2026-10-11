'use client'

// Eén reflectievraag centraal — kalm, één ding tegelijk. Puur presentational:
// de container (page.tsx) bezit antwoorden, actieve index en focus.

import type { RefObject } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Field } from '@/components/ui/Field'
import { StepDots } from '@/components/ui/StepDots'
import { Textarea } from '@/components/ui/Textarea'
import VitaReflectieBegeleider from '@/components/vita/VitaReflectieBegeleider'
import { useVertaling } from '@/lib/i18n/TaalProvider'
import { REFLECTIE_VRAGEN } from './reflectieVragen'

interface ReflectieVraagStapProps {
  /** Index van de actieve vraag in REFLECTIE_VRAGEN. */
  index: number
  /** Huidige antwoordtekst van de actieve vraag. */
  waarde: string
  /** Per vraag: is er al een (niet-leeg) antwoord? */
  beantwoord: readonly boolean[]
  /** Ref naar het tekstveld, zodat de container kan focussen. */
  veldRef: RefObject<HTMLTextAreaElement | null>
  onWijzig: (waarde: string) => void
  onKies: (index: number) => void
}

export default function ReflectieVraagStap({
  index,
  waarde,
  beantwoord,
  veldRef,
  onWijzig,
  onKies,
}: ReflectieVraagStapProps) {
  const { t } = useVertaling()
  const vraag = REFLECTIE_VRAGEN[index]
  const totaal = REFLECTIE_VRAGEN.length

  return (
    <Card style={{ padding: '22px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.02em' }}>
          {t('mentaal.reflectie.vraagVan', { nummer: index + 1, totaal })}
        </p>
        <StepDots
          count={totaal}
          activeIndex={index}
          completed={beantwoord}
          onSelect={onKies}
          navLabel={t('mentaal.reflectie.navLabel')}
          stepLabel={i => t(beantwoord[i] ? 'mentaal.reflectie.stapBeantwoord' : 'mentaal.reflectie.stap', { nummer: i + 1, vraag: t(`mentaal.reflectie.vraag.${REFLECTIE_VRAGEN[i].id}`) })}
          gap={2}
        />
      </div>

      {/* key = vraag.id: zachte fade + 4px slide (mf-fade-in, 250ms) bij het
          wisselen van vraag. minHeight vangt lengteverschillen op → geen
          layout-shift van de knoppen eronder. */}
      <div key={vraag.id} className="mf-fade-in" style={{ minHeight: 232 }}>
        <div style={{ marginBottom: 14 }}>
          <VitaReflectieBegeleider fase="vraag" vraagId={vraag.id} size={40} />
        </div>
        <Field
          label={t(`mentaal.reflectie.vraag.${vraag.id}`)}
          htmlFor={`reflectie-${vraag.id}`}
          hint={t('mentaal.reflectie.hint')}
        >
          <Textarea
            ref={veldRef}
            id={`reflectie-${vraag.id}`}
            rows={3}
            value={waarde}
            onChange={e => onWijzig(e.target.value)}
            placeholder={t(`mentaal.reflectie.placeholder.${vraag.id}`)}
          />
        </Field>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<ChevronLeft size={15} aria-hidden />}
          disabled={index === 0}
          onClick={() => onKies(index - 1)}
        >
          {t('mentaal.reflectie.vorige')}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          rightIcon={<ChevronRight size={15} aria-hidden />}
          disabled={index === totaal - 1}
          onClick={() => onKies(index + 1)}
        >
          {t('mentaal.reflectie.volgende')}
        </Button>
      </div>
    </Card>
  )
}
