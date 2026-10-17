'use client'

import { useMemo, useState } from 'react'
import { Eye } from 'lucide-react'
import { actieveVragen, secties } from '@/lib/club/intakevragen/lijst'
import type { IntakeVraag } from '@/lib/club/intakevragen/soorten'
import { beginStaat, type IntakeStaat } from '@/components/club/training/intake-staat'
import { IntakeSectie } from './IntakeSectie'

interface IntakeVoorbeeldProps {
  vragen: readonly IntakeVraag[]
  vandaag: string
}

/** Het formulier zoals de trainer het ziet. Je kunt het invullen; er wordt niets opgeslagen. */
export function IntakeVoorbeeld({ vragen, vandaag }: IntakeVoorbeeldProps) {
  const [s, setS] = useState<IntakeStaat>(() => beginStaat(vandaag, ''))
  const zet = (deel: Partial<IntakeStaat>) => setS((oud) => ({ ...oud, ...deel }))
  const delen = useMemo(() => secties(actieveVragen(vragen)), [vragen])
  const toestemmingIn = delen.find((d) => d.vragen.some((v) => v.gezondheid))?.naam ?? null
  return (
    <aside className="club-intakevragen-voorbeeld" aria-labelledby="voorbeeld-kop">
      <header>
        <p className="club-boventitel"><Eye size={14} aria-hidden /> Live voorbeeld</p>
        <h2 id="voorbeeld-kop">Zo ziet de trainer het</h2>
        <p className="club-hint">Probeer het uit. Hier wordt niets opgeslagen. Lid, datum en metingen staan er in het echte formulier omheen.</p>
      </header>
      <div className="club-intakevragen-voorbeeldvlak">
        {delen.length === 0 && <p className="club-hint">Er staan geen vragen aan.</p>}
        {delen.map((d, i) => (
          <IntakeSectie key={d.naam} nr={i + 2} naam={d.naam} vragen={d.vragen} s={s} zet={zet} metToestemming={d.naam === toestemmingIn} />
        ))}
      </div>
    </aside>
  )
}
