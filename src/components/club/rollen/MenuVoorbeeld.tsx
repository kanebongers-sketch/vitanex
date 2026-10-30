'use client'

import { useMemo, useState } from 'react'
import { groepenMet, groepInTaal, onderdeelInTaal, onderdelenVan } from '@/components/club/shell/onderdelen'
import { useTaal, useTekst } from '@/lib/aiyourgym/taal/client'
import { ROLLEN_TEKST } from '@/lib/aiyourgym/taal/woorden/club/rollen'
import { niveausVoor, onderdelenVoor, startpagina } from '@/lib/club/rollen/model'
import { ROLLEN, type Rol, type Rolrechten } from '@/lib/club/rollen/typen'
import type { Verborgen } from '@/lib/club/kern/pakketten'

// "Bekijk menu als": het menu voor een rol, met de rechten zoals ze nu op het
// scherm staan (ook voor het opslaan) en de onderdelen die de sportschool heeft.
// Rekent met dezelfde functie als Club zelf (niveau, onderdelenVoor).

interface MenuVoorbeeldProps {
  rechten: Rolrechten
  uit: readonly Verborgen[]
}

export function MenuVoorbeeld({ rechten, uit }: MenuVoorbeeldProps) {
  const taal = useTaal()
  const tekst = useTekst(ROLLEN_TEKST)
  const [rol, setRol] = useState<Rol>('trainer')
  const { groepen, start } = useMemo(() => {
    const niveaus = niveausVoor({ rollen: [rol], rechten, uit })
    const toegestaan = onderdelenVoor(niveaus)
    return {
      groepen: groepenMet(uit, toegestaan).map((g) => ({ g: groepInTaal(g, taal), onderdelen: onderdelenVan(g.sleutel, uit, toegestaan).map((o) => onderdeelInTaal(o, taal)) })),
      start: startpagina([rol], rechten, niveaus),
    }
  }, [rol, rechten, uit, taal])

  return (
    <section className="club-rollen-voorbeeld" aria-labelledby="club-rollen-voorbeeld-kop">
      <div className="club-rollen-voorbeeld-kop">
        <div>
          <h2 id="club-rollen-voorbeeld-kop">{tekst.rechten.bekijkAls}</h2>
          <p>{tekst.rechten.bekijkAlsUitleg}</p>
        </div>
        <div className="club-rollen-tabs" role="tablist" aria-label={tekst.rechten.bekijkAls}>
          {ROLLEN.map((r) => (
            <button key={r} type="button" role="tab" aria-selected={r === rol} className="club-rollen-tab" onClick={() => setRol(r)}>
              {tekst.rollen[r]}
            </button>
          ))}
        </div>
      </div>
      <div className="club-rollen-menu" role="tabpanel">
        {groepen.length === 0 ? (
          <p className="club-rollen-leeg">{tekst.rechten.leegMenu}</p>
        ) : (
          groepen.map(({ g, onderdelen }) => (
            <div key={g.sleutel} className="club-rollen-menugroep">
              <h3>{g.label}</h3>
              <ul>
                {onderdelen.map((o) => (
                  <li key={o.sleutel} className={`/club${o.pad}` === start ? 'is-start' : undefined}>
                    {o.label}
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </div>
    </section>
  )
}
