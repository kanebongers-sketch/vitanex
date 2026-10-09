'use client'

import { useState } from 'react'
import { PT_DOMEIN } from '@/lib/fit-factory/domein'
import type { EigenaarRij } from '@/lib/lifeos/pt-dashboard/team-overzicht'
import type { PinActie } from '@/lib/lifeos/leads/leads'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'
import { pinActie } from '@/components/lifeos/pt/PinGoedkeuren'

// Eigenaren die in de PT-app meekijken met het hele team (alleen lezen): hun
// link en de stand van hun pincode. Net als bij een PT'er werkt een gekozen pin
// pas na jouw goedkeuring — keur alleen goed als de eigenaar bevestigt dat hij
// 'm zelf koos.

const PIN = { geen: 'Nog geen pincode gekozen', wacht: 'Pincode wacht op jou', actief: 'Pincode actief' } as const

export function EigenaarToegang({ eigenaren, onVernieuw }: { eigenaren: readonly EigenaarRij[]; onVernieuw: () => Promise<void> }) {
  const [bezig, setBezig] = useState<string | null>(null)
  const [fout, setFout] = useState<string | null>(null)
  if (eigenaren.length === 0) return null

  async function doe(e: EigenaarRij, actie: PinActie) {
    if (actie === 'resetten' && !window.confirm(`Pincode van ${e.naam} resetten? ${e.naam} wordt overal uitgelogd en kiest daarna een nieuwe.`)) return
    setBezig(e.id)
    setFout(null)
    const f = await pinActie(e.id, actie)
    setBezig(null)
    if (f) setFout(f)
    else await onVernieuw()
  }

  return (
    <section className="ptd-sectie" aria-labelledby="eigenaren-kop">
      <div className="ptd-sectiekop">
        <h2 id="eigenaren-kop">Eigenaren</h2>
        <span>kijken mee in de PT-app, alleen lezen</span>
      </div>
      <ul className="ptd-lijst">
        {eigenaren.map((e) => (
          <li key={e.id} className="ptd-rij">
            <div className="ptd-rij-kop">
              <span className="ptd-naam">{e.naam}</span>
              <span className={e.pinStatus === 'wacht' ? 'ptd-badge ptd-badge--let-op' : e.pinStatus === 'actief' ? 'ptd-badge ptd-badge--accent' : 'ptd-badge'}>
                {PIN[e.pinStatus]}
              </span>
            </div>
            <p className="ptd-meta">
              <span>{PT_DOMEIN}/{e.code}</span>
              {e.controle ? <span>Controlecode <strong className="ptd-controle">{e.controle}</strong>: vraag deze na vóór je goedkeurt</span> : null}
            </p>
            {e.pinStatus !== 'geen' ? (
              <div className="ptd-acties ptd-acties--rij">
                {e.pinStatus === 'wacht' ? (
                  <>
                    <button type="button" className="ptd-knop ptd-knop--klein ptd-knop--primair" disabled={bezig !== null} onClick={() => void doe(e, 'goedkeuren')}>Goedkeuren</button>
                    <button type="button" className="ptd-knop ptd-knop--klein" disabled={bezig !== null} onClick={() => void doe(e, 'afwijzen')}>Afwijzen</button>
                  </>
                ) : (
                  <button type="button" className="ptd-knop ptd-knop--klein" disabled={bezig !== null} onClick={() => void doe(e, 'resetten')}>Pincode resetten</button>
                )}
              </div>
            ) : null}
          </li>
        ))}
      </ul>
      {fout ? <Foutmelding bericht={fout} /> : null}
    </section>
  )
}
