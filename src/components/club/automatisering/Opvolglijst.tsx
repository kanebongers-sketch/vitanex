'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { OpvolgGroep } from '@/lib/club/automatisering/weergave'
import { OpvolgTaak } from './OpvolgTaak'

// De opvolglijst: per regel een groep met de leden die vandaag aandacht nodig
// hebben. Een afgehandelde taak verdwijnt meteen; daarna ververst de pagina.

interface Props {
  groepen: readonly OpvolgGroep[]
  /** Per lid-id de link naar de ledenkaart. */
  ledenkaarten: Readonly<Record<string, string>>
}

export function Opvolglijst({ groepen, ledenkaarten }: Props) {
  const router = useRouter()
  const [weg, setWeg] = useState<ReadonlySet<string>>(new Set())
  const [melding, setMelding] = useState<{ ok: boolean; tekst: string } | null>(null)

  function klaar(tekst: string, ok: boolean, id?: string) {
    setMelding({ ok, tekst })
    if (id) setWeg((oud) => new Set([...oud, id]))
    if (ok) router.refresh()
  }

  const zichtbaar = groepen.map((g) => ({ ...g, items: g.items.filter((i) => !weg.has(i.id)) })).filter((g) => g.items.length > 0)

  return (
    <>
      <div role="status" aria-live="polite" className="club-opvolg-status">
        {melding && <p className={`club-melding ${melding.ok ? 'club-melding--ok' : 'club-melding--fout'}`}>{melding.tekst}</p>}
      </div>
      {zichtbaar.length === 0 ? (
        <p className="club-leeg">Alles is opgevolgd. Er staat niemand meer open in deze vestiging.</p>
      ) : (
        <div className="club-opvolg-groepen">
          {zichtbaar.map((g) => (
            <section key={g.regel} id={`regel-${g.regel}`} className="club-opvolg-groep" aria-labelledby={`kop-${g.regel}`}>
              <header className="club-opvolg-groepkop">
                <h2 id={`kop-${g.regel}`}>
                  {g.titel} <span className="club-opvolg-aantal">{g.items.length}</span>
                </h2>
                <p>{g.uitleg}</p>
              </header>
              <ul className="club-opvolg-taken">
                {g.items.map((item) => (
                  <OpvolgTaak key={item.id} item={item} ledenkaart={ledenkaarten[item.lidId] ?? '/club/leden'} onKlaar={klaar} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </>
  )
}
