'use client'

import { useState } from 'react'
import { PT_DOMEIN } from '@/lib/fit-factory/domein'
import type { EigenaarRij } from '@/lib/lifeos/pt-dashboard/team-overzicht'
import type { PinActie } from '@/lib/lifeos/leads/leads'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'
import { pinActie } from '@/components/lifeos/pt/PinGoedkeuren'
import { haalJson, leesNiets } from '@/lib/lifeos/api/http'
import { CLUB_LABEL } from '@/lib/lifeos/pt-dashboard/clubs'
import { ClubmanagerFormulier } from './ClubmanagerFormulier'

// Wie in de PT-app meekijkt (alleen lezen): eigenaren (het hele team) en
// clubmanagers (één club). Per persoon de link en de stand van de pincode; net
// als bij een PT'er werkt een gekozen pin pas na jouw goedkeuring met de
// controlecode. Clubmanagers voeg je hier toe en stop je hier.

const PIN = { geen: 'Nog geen pincode gekozen', wacht: 'Pincode wacht op jou', actief: 'Pincode actief' } as const

export function EigenaarToegang({ eigenaren, onVernieuw }: { eigenaren: readonly EigenaarRij[]; onVernieuw: () => Promise<void> }) {
  const [bezig, setBezig] = useState<string | null>(null)
  const [fout, setFout] = useState<string | null>(null)

  async function stop(e: EigenaarRij) {
    if (!window.confirm(`${e.naam} stoppen als clubmanager? De link werkt dan niet meer en alle toestellen worden uitgelogd.`)) return
    setBezig(e.id)
    setFout(null)
    const uit = await haalJson('/api/lifeos/pt-app/clubmanagers', leesNiets, { method: 'DELETE', body: JSON.stringify({ persoonId: e.id }) })
    setBezig(null)
    if (!uit.ok) setFout(uit.fout)
    else await onVernieuw()
  }

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
        <h2 id="eigenaren-kop">Eigenaren &amp; clubmanagers</h2>
        <span>kijken mee in de PT-app, alleen lezen</span>
      </div>
      {eigenaren.length === 0 ? <p className="ptd-leeg">Nog niemand.</p> : null}
      <ul className="ptd-lijst">
        {eigenaren.map((e) => (
          <li key={e.id} className="ptd-rij">
            <div className="ptd-rij-kop">
              <span className="ptd-naam">
                {e.naam}
                <span className="ptd-zacht"> · {e.rol === 'clubmanager' && e.club ? `clubmanager ${CLUB_LABEL[e.club]}` : 'eigenaar'}</span>
              </span>
              <span className={e.pinStatus === 'wacht' ? 'ptd-badge ptd-badge--let-op' : e.pinStatus === 'actief' ? 'ptd-badge ptd-badge--accent' : 'ptd-badge'}>
                {PIN[e.pinStatus]}
              </span>
            </div>
            <p className="ptd-meta">
              <span>{PT_DOMEIN}/{e.code}</span>
              {e.controle ? <span>Controlecode <strong className="ptd-controle">{e.controle}</strong>: vraag deze na vóór je goedkeurt</span> : null}
            </p>
            {e.pinStatus !== 'geen' || e.rol === 'clubmanager' ? (
              <div className="ptd-acties ptd-acties--rij">
                {e.pinStatus === 'geen' ? null : e.pinStatus === 'wacht' ? (
                  <>
                    <button type="button" className="ptd-knop ptd-knop--klein ptd-knop--primair" disabled={bezig !== null} onClick={() => void doe(e, 'goedkeuren')}>Goedkeuren</button>
                    <button type="button" className="ptd-knop ptd-knop--klein" disabled={bezig !== null} onClick={() => void doe(e, 'afwijzen')}>Afwijzen</button>
                  </>
                ) : (
                  <button type="button" className="ptd-knop ptd-knop--klein" disabled={bezig !== null} onClick={() => void doe(e, 'resetten')}>Pincode resetten</button>
                )}
                {e.rol === 'clubmanager' ? (
                  <button type="button" className="ptd-knop ptd-knop--klein ptd-knop--gevaar ptd-rechts" disabled={bezig !== null} onClick={() => void stop(e)}>Stoppen</button>
                ) : null}
              </div>
            ) : null}
          </li>
        ))}
      </ul>
      <ClubmanagerFormulier onToegevoegd={onVernieuw} />
      {fout ? <Foutmelding bericht={fout} /> : null}
    </section>
  )
}
