'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { bezitPerPersoon, type KledingArtikel, type Uitgifte } from '@/lib/lifeos/pt-dashboard/kleding'
import { dagKort } from '@/lib/lifeos/pt-dashboard/datum'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'
import { kledingActie } from './kleding-api'

// Per PT'er wat hij nu in bezit heeft (nog niet teruggegeven). Kane neemt per
// uitgifte terug: terug op voorraad (bruikbaar) of afgeschreven (kapot/kwijt).

interface Props {
  artikelen: readonly KledingArtikel[]
  uitgiftes: readonly Uitgifte[]
  team: readonly { id: string; naam: string }[]
  magBewerken: boolean
}

export function BezitLijst({ artikelen, uitgiftes, team, magBewerken }: Props) {
  const router = useRouter()
  const [bezig, setBezig] = useState<string | null>(null)
  const [fout, setFout] = useState<string | null>(null)
  const bezit = bezitPerPersoon(uitgiftes, artikelen)
  const naamArtikel = new Map(artikelen.map((a) => [a.id, a.naam]))

  async function terug(u: Uitgifte, opVoorraad: boolean) {
    const wat = `${u.aantal}× ${naamArtikel.get(u.artikelId) ?? 'artikel'} ${u.maat}`
    if (!window.confirm(opVoorraad ? `${wat} terug op voorraad in Eersel?` : `${wat} afschrijven (kapot of kwijt)? Het gaat niet terug op voorraad.`)) return
    setBezig(u.id)
    setFout(null)
    const f = await kledingActie({ actie: 'terug', uitgifteId: u.id, opVoorraad })
    setBezig(null)
    if (f) setFout(f)
    else router.refresh()
  }

  return (
    <>
      <ul className="ptd-lijst">
        {team.map((p) => {
          const regels = bezit.get(p.id) ?? []
          return (
            <li key={p.id} className="ptd-rij">
              <div className="ptd-rij-kop">
                <span className="ptd-naam">{p.naam}</span>
                <span className="ptd-badge">{regels.reduce((s, r) => s + r.aantal, 0)} stuks</span>
              </div>
              {regels.length === 0 ? (
                <p className="ptd-hint">Geen kleding uitgegeven.</p>
              ) : (
                <ul className="kl-bezit">
                  {regels.map((r) => (
                    <li key={`${r.artikelId}|${r.maat}`}>
                      <span className="ptd-tekst">{r.aantal}× {naamArtikel.get(r.artikelId)} <strong>{r.maat}</strong></span>
                      {r.uitgiftes.map((u) => (
                        <span key={u.id} className="ptd-meta">
                          <span>{u.aantal}× op {dagKort(u.uitgegevenOp)}</span>
                          {magBewerken ? (
                            <>
                              <button type="button" className="ptd-knop ptd-knop--klein" disabled={bezig !== null} onClick={() => void terug(u, true)}>Terug op voorraad</button>
                              <button type="button" className="ptd-knop ptd-knop--klein ptd-knop--gevaar" disabled={bezig !== null} onClick={() => void terug(u, false)}>Afschrijven</button>
                            </>
                          ) : null}
                        </span>
                      ))}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          )
        })}
      </ul>
      {fout ? <Foutmelding bericht={fout} /> : null}
    </>
  )
}
