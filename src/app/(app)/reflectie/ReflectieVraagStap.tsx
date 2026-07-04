'use client'

// Eén reflectievraag centraal — kalm, één ding tegelijk. Puur presentational:
// de container (page.tsx) bezit antwoorden, actieve index en focus.

import type { RefObject } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Field } from '@/components/ui/Field'
import { Textarea } from '@/components/ui/Textarea'
import VitaReflectieBegeleider from '@/components/vita/VitaReflectieBegeleider'
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
  const vraag = REFLECTIE_VRAGEN[index]
  const totaal = REFLECTIE_VRAGEN.length

  return (
    <Card style={{ padding: '22px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.02em' }}>
          Vraag {index + 1} van {totaal}
        </p>
        <nav aria-label="Reflectievragen" style={{ display: 'flex', gap: 2 }}>
          {REFLECTIE_VRAGEN.map((v, i) => {
            const isActief = i === index
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => onKies(i)}
                className="mf-reflectie-dot"
                aria-label={`Vraag ${i + 1}: ${v.vraag}${beantwoord[i] ? ' (beantwoord)' : ''}`}
                aria-current={isActief ? 'step' : undefined}
                style={{
                  width: 24,
                  height: 24,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <span
                  aria-hidden
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    background: beantwoord[i] ? 'var(--mentaforce-primary)' : 'var(--border-strong)',
                    boxShadow: isActief ? '0 0 0 3px var(--mentaforce-primary-light)' : 'none',
                    transition: 'background 0.2s var(--ease), box-shadow 0.2s var(--ease)',
                  }}
                />
              </button>
            )
          })}
        </nav>
      </div>

      {/* key = vraag.id: zachte fade + 4px slide (mf-fade-in, 250ms) bij het
          wisselen van vraag. minHeight vangt lengteverschillen op → geen
          layout-shift van de knoppen eronder. */}
      <div key={vraag.id} className="mf-fade-in" style={{ minHeight: 232 }}>
        <div style={{ marginBottom: 14 }}>
          <VitaReflectieBegeleider fase="vraag" vraagId={vraag.id} size={40} />
        </div>
        <Field
          label={vraag.vraag}
          htmlFor={`reflectie-${vraag.id}`}
          hint="Eén of twee zinnen is al genoeg."
        >
          <Textarea
            ref={veldRef}
            id={`reflectie-${vraag.id}`}
            rows={3}
            value={waarde}
            onChange={e => onWijzig(e.target.value)}
            placeholder={vraag.placeholder}
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
          Vorige
        </Button>
        <Button
          variant="secondary"
          size="sm"
          rightIcon={<ChevronRight size={15} aria-hidden />}
          disabled={index === totaal - 1}
          onClick={() => onKies(index + 1)}
        >
          Volgende
        </Button>
      </div>

      <style>{`
        .mf-reflectie-dot:focus-visible {
          outline: 2px solid var(--mentaforce-primary);
          outline-offset: 2px;
          border-radius: 6px;
        }
      `}</style>
    </Card>
  )
}
