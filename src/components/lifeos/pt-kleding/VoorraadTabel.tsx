'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { voorraadPerArtikel, type KledingArtikel, type VoorraadRegel } from '@/lib/lifeos/pt-dashboard/kleding'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'
import { kledingActie } from './kleding-api'

// De voorraad in Eersel: per artikel een rij, per maat het aantal. Kane past
// een aantal direct aan (typen + Enter of weg-klikken); eigenaren lezen mee.

interface Props {
  artikelen: readonly KledingArtikel[]
  voorraad: readonly VoorraadRegel[]
  magBewerken: boolean
}

export function VoorraadTabel({ artikelen, voorraad: regels, magBewerken }: Props) {
  const voorraad = voorraadPerArtikel(artikelen, regels)
  const router = useRouter()
  const [fout, setFout] = useState<string | null>(null)
  const [bezig, setBezig] = useState(false)

  async function zet(artikelId: string, maat: string, waarde: string, oud: number) {
    const aantal = Number(waarde)
    if (waarde.trim() === '' || !Number.isInteger(aantal) || aantal === oud) return
    if (aantal < 0) return setFout('Een voorraad kan niet negatief zijn.')
    setBezig(true)
    setFout(null)
    const f = await kledingActie({ actie: 'voorraad', artikelId, maat, aantal })
    setBezig(false)
    if (f) setFout(f)
    else router.refresh()
  }

  if (artikelen.length === 0) return <p className="ptd-leeg">Nog geen artikelen. {magBewerken ? 'Voeg hieronder het eerste artikel toe.' : ''}</p>
  return (
    <>
      <ul className="ptd-lijst">
        {artikelen.map((a) => {
          const perMaat = voorraad.get(a.id)
          const totaal = [...(perMaat?.values() ?? [])].reduce((s, n) => s + n, 0)
          return (
            <li key={a.id} className="ptd-rij">
              <div className="ptd-rij-kop">
                <span className="ptd-naam">{a.naam}</span>
                <span className={totaal === 0 ? 'ptd-badge ptd-badge--let-op' : 'ptd-badge'}>{totaal} op voorraad</span>
              </div>
              <div className="kl-maten">
                {a.maten.map((m) => {
                  const n = perMaat?.get(m) ?? 0
                  return (
                    <label key={m} className="kl-maat">
                      <span>{m}</span>
                      {magBewerken ? (
                        <input
                          className="ptd-invoer"
                          type="number"
                          inputMode="numeric"
                          min={0}
                          max={10000}
                          defaultValue={n}
                          disabled={bezig}
                          aria-label={`Voorraad ${a.naam} maat ${m}`}
                          onBlur={(e) => void zet(a.id, m, e.target.value, n)}
                          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                        />
                      ) : (
                        <strong className={n === 0 ? 'kl-op' : undefined}>{n}</strong>
                      )}
                    </label>
                  )
                })}
              </div>
            </li>
          )
        })}
      </ul>
      {fout ? <Foutmelding bericht={fout} /> : null}
    </>
  )
}
