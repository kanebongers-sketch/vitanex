'use client'

import Link from 'next/link'
import { useCallback, useState } from 'react'
import { ChevronRight, ShieldCheck } from 'lucide-react'
import { berekenBmi } from '@/lib/club/training/intake'
import type { Intake } from '@/lib/club/training/intake-rij'
import { DOEL_LABEL } from '@/lib/club/training/typen'
import { toonDatum } from '@/lib/club/training/weergave'
import { IntakeDetail } from './IntakeDetail'
import { VoorstelKnop } from './VoorstelKnop'
import { Zijpaneel } from './Zijpaneel'

interface IntakeLijstProps {
  intakes: Intake[]
  trainers: Record<string, string>
  /** Pad naar de editor met __id__. */
  editorHref: string
  /** Pad naar het lidfilter met __lid__. */
  lidHref: string
  toonLid: boolean
}

/** De intakes als rijen: een klik opent de hele intake in een zijpaneel, het voorstel kan direct vanuit de rij. */
export function IntakeLijst({ intakes, trainers, editorHref, lidHref, toonLid }: IntakeLijstProps) {
  const [open, setOpen] = useState<Intake | null>(null)
  const sluit = useCallback(() => setOpen(null), [])

  return (
    <>
      <ul className="club-lijst club-kaart club-training-intakes">
        {intakes.map((i) => {
          const bmi = berekenBmi(i.metingen.gewicht_kg, i.metingen.lengte_cm)
          return (
            <li key={i.id} className="club-rij">
              <span className="club-training-datumblok" aria-hidden>{toonDatum(i.datum)}</span>
              <button type="button" className="club-rij-hoofd club-training-rijknop" onClick={() => setOpen(i)}>
                <span className="club-rij-titel">
                  {toonLid && i.lidNaam ? i.lidNaam : (i.antwoorden?.doelen.map((d) => DOEL_LABEL[d]).join(', ') ?? 'Intake')}
                </span>
                <span className="club-rij-sub">
                  {[
                    toonLid ? i.antwoorden?.doelen.map((d) => DOEL_LABEL[d]).join(', ') : null,
                    i.metingen.gewicht_kg ? `${i.metingen.gewicht_kg.toLocaleString('nl-NL')} kg` : null,
                    bmi ? `BMI ${bmi.toLocaleString('nl-NL')}` : null,
                    i.medewerkerId && trainers[i.medewerkerId] ? trainers[i.medewerkerId] : null,
                  ].filter(Boolean).join(' · ')}
                </span>
              </button>
              {i.toestemmingGezondheid && (
                <span className="club-chip club-chip--ok club-chip--geen club-training-avgchip" title="Toestemming voor gezondheidsgegevens">
                  <ShieldCheck aria-hidden size={13} /> AVG
                </span>
              )}
              <VoorstelKnop intakeId={i.id} editorHref={editorHref} primair={false} klein label="Schemavoorstel" />
              {toonLid && (
                <Link href={lidHref.replace('__lid__', i.lidId)} className="club-knop club-knop--stil club-knop--klein" aria-label={`Alles van ${i.lidNaam ?? 'dit lid'}`}>
                  <ChevronRight aria-hidden size={16} />
                </Link>
              )}
            </li>
          )
        })}
      </ul>
      {open && (
        <Zijpaneel titel={open.lidNaam ?? 'Intake'} boventitel="Intake" onSluit={sluit}>
          <VoorstelKnop intakeId={open.id} editorHref={editorHref} />
          <IntakeDetail intake={open} trainer={open.medewerkerId ? trainers[open.medewerkerId] ?? null : null} />
        </Zijpaneel>
      )}
    </>
  )
}
