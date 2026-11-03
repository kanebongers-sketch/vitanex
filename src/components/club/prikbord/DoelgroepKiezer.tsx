'use client'

import type { VestigingInfo } from '@/lib/club/kern/vestigingen'
import { ROLLEN, type Rol } from '@/lib/club/rollen/typen'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { PRIKBORD } from '@/lib/aiyourgym/taal/woorden/club/prikbord'
import { ROLLEN_TEKST } from '@/lib/aiyourgym/taal/woorden/club/rollen'

// Voor wie: vestigingen (geen = alle) en rollen (geen = iedereen), als
// aan/uit-knoppen. Met een vestiging staat de keuze voor vestigingen er niet.

interface Props {
  vestigingen: readonly VestigingInfo[]
  gekozenVestigingen: readonly string[]
  gekozenRollen: readonly Rol[]
  onVestigingen: (v: string[]) => void
  onRollen: (r: Rol[]) => void
}

function wissel<T>(lijst: readonly T[], x: T): T[] {
  return lijst.includes(x) ? lijst.filter((y) => y !== x) : [...lijst, x]
}

export function DoelgroepKiezer({ vestigingen, gekozenVestigingen, gekozenRollen, onVestigingen, onRollen }: Props) {
  const t = useTekst(PRIKBORD).formulier
  const rollen = useTekst(ROLLEN_TEKST).rollen
  return (
    <div className="pb-doelgroep">
      {vestigingen.length > 1 ? (
        <fieldset className="pb-keuzes">
          <legend className="club-label">{t.vestigingen}</legend>
          <button type="button" className="pb-keuze" aria-pressed={gekozenVestigingen.length === 0} onClick={() => onVestigingen([])}>
            {t.alleVestigingen}
          </button>
          {vestigingen.map((v) => (
            <button key={v.sleutel} type="button" className="pb-keuze" aria-pressed={gekozenVestigingen.includes(v.sleutel)} onClick={() => onVestigingen(wissel(gekozenVestigingen, v.sleutel))}>
              {v.naam}
            </button>
          ))}
        </fieldset>
      ) : null}
      <fieldset className="pb-keuzes">
        <legend className="club-label">{t.rollen}</legend>
        <button type="button" className="pb-keuze" aria-pressed={gekozenRollen.length === 0} onClick={() => onRollen([])}>
          {t.iedereen}
        </button>
        {ROLLEN.map((r) => (
          <button key={r} type="button" className="pb-keuze" aria-pressed={gekozenRollen.includes(r)} onClick={() => onRollen(wissel(gekozenRollen, r))}>
            {rollen[r]}
          </button>
        ))}
      </fieldset>
    </div>
  )
}
