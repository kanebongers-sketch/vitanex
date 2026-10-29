'use client'

import Link from 'next/link'
import { useCallback, useState } from 'react'
import { ChevronRight, ShieldCheck } from 'lucide-react'
import { berekenBmi } from '@/lib/club/training/intake'
import type { Intake } from '@/lib/club/training/intake-rij'
import { useTaal, useTekst } from '@/lib/aiyourgym/taal/client'
import { formatGetal } from '@/lib/aiyourgym/taal/formaat'
import { INTAKE } from '@/lib/aiyourgym/taal/woorden/club/intake'
import { TRAINING_LABELS } from '@/lib/aiyourgym/taal/woorden/club/training-labels'
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
  const taal = useTaal()
  const t = useTekst(INTAKE).lijst
  const l = useTekst(TRAINING_LABELS)
  const sluit = useCallback(() => setOpen(null), [])

  return (
    <>
      <ul className="club-lijst club-kaart club-training-intakes">
        {intakes.map((i) => {
          const bmi = berekenBmi(i.metingen.gewicht_kg, i.metingen.lengte_cm)
          return (
            <li key={i.id} className="club-rij">
              <span className="club-training-datumblok" aria-hidden>{toonDatum(i.datum, taal)}</span>
              <button type="button" className="club-rij-hoofd club-training-rijknop" onClick={() => setOpen(i)}>
                <span className="club-rij-titel">
                  {toonLid && i.lidNaam ? i.lidNaam : (i.antwoorden?.doelen.map((d) => l.doel[d]).join(', ') ?? t.intake)}
                </span>
                <span className="club-rij-sub">
                  {[
                    toonLid ? i.antwoorden?.doelen.map((d) => l.doel[d]).join(', ') : null,
                    i.metingen.gewicht_kg ? `${formatGetal(i.metingen.gewicht_kg, taal)} kg` : null,
                    bmi ? `BMI ${formatGetal(bmi, taal)}` : null,
                    i.medewerkerId && trainers[i.medewerkerId] ? trainers[i.medewerkerId] : null,
                  ].filter(Boolean).join(' · ')}
                </span>
              </button>
              {i.toestemmingGezondheid && (
                <span className="club-chip club-chip--ok club-chip--geen club-training-avgchip" title={t.avgTitel}>
                  <ShieldCheck aria-hidden size={13} /> {t.avg}
                </span>
              )}
              <VoorstelKnop intakeId={i.id} editorHref={editorHref} primair={false} klein label={t.voorstel} />
              {toonLid && (
                <Link href={lidHref.replace('__lid__', i.lidId)} className="club-knop club-knop--stil club-knop--klein" aria-label={t.allesVan(i.lidNaam ?? t.ditLid)}>
                  <ChevronRight aria-hidden size={16} />
                </Link>
              )}
            </li>
          )
        })}
      </ul>
      {open && (
        <Zijpaneel titel={open.lidNaam ?? t.intake} boventitel={t.intake} onSluit={sluit}>
          <VoorstelKnop intakeId={open.id} editorHref={editorHref} />
          <IntakeDetail intake={open} trainer={open.medewerkerId ? trainers[open.medewerkerId] ?? null : null} />
        </Zijpaneel>
      )}
    </>
  )
}
