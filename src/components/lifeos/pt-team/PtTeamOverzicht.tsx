'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'
import { haalJson } from '@/lib/lifeos/api/http'
import { leesTeamOverzicht, type TeamOverzicht } from '@/lib/lifeos/pt-dashboard/team-overzicht'
import { euro } from '@/lib/lifeos/pt-dashboard/abonnementen'
import { dagKort } from '@/lib/lifeos/pt-dashboard/datum'
import { Tegel } from '@/components/lifeos/pt-dashboard/Tegel'
import { ClubTabel } from './ClubTabel'

// Container: Kane's blik op het hele PT-team — wat elke PT'er in zijn eigen
// dashboard (/<naam>) invulde, naast elkaar. Alleen-lezen.

type Staat = { fase: 'laden' } | { fase: 'fout'; bericht: string } | { fase: 'ok'; data: TeamOverzicht }

const PIN = { geen: 'Nog geen pincode', wacht: 'Pincode wacht op jou', actief: 'Actief' } as const

export function PtTeamOverzicht() {
  const [staat, setStaat] = useState<Staat>({ fase: 'laden' })
  const laad = useCallback(
    (): Promise<void> =>
      haalJson('/api/lifeos/pt-team', leesTeamOverzicht).then((uit) =>
        setStaat(uit.ok ? { fase: 'ok', data: uit.waarde } : { fase: 'fout', bericht: uit.fout }),
      ),
    [],
  )
  useEffect(() => {
    void laad()
  }, [laad])

  if (staat.fase === 'laden') return <p className="ptd-hint">Laden…</p>
  if (staat.fase === 'fout') return <Foutmelding bericht={staat.bericht} opnieuw={() => void laad()} />
  const { rijen, clubs } = staat.data
  const som = (f: (r: (typeof rijen)[number]) => number) => rijen.reduce((s, r) => s + f(r), 0)
  const leadsTotaal = som((r) => r.leads.totaal)
  const klant = som((r) => r.leads.klant)

  return (
    <div className="ptd ptd--ingebed">
      <div className="ptd-tegels">
        <Tegel getal={String(som((r) => r.leads.dezeWeek))} label="Leads deze week" uitleg={`${som((r) => r.leads.dezeMaand)} deze maand`} />
        <Tegel getal={String(som((r) => r.leads.open))} label="Open leads" uitleg={`${som((r) => r.teLaat)} opvolging te laat`} />
        <Tegel getal={String(klant)} label="Klant geworden" uitleg={leadsTotaal ? `${Math.round((klant / leadsTotaal) * 100)}% van ${leadsTotaal} leads` : 'nog geen leads'} accent />
        <Tegel getal={euro(som((r) => r.maandwaarde))} label="PT-abonnementen p/m" uitleg={`${som((r) => r.klantenLopend)} lopend · incl. btw`} />
      </div>

      <section className="ptd-sectie" aria-labelledby="team-kop">
        <div className="ptd-sectiekop">
          <h2 id="team-kop">Per PT&apos;er</h2>
          <span>klik een naam voor alle leads en klanten</span>
        </div>
        <div className="ptd-scroll">
          <table className="ptd-tabel">
            <thead>
              <tr>
                <th scope="col">PT&apos;er</th><th scope="col">Leads wk</th><th scope="col">Maand</th><th scope="col">Open</th>
                <th scope="col">Te laat</th><th scope="col">Klant</th><th scope="col">Conversie</th><th scope="col">Abonnementen</th>
                <th scope="col">Per maand</th><th scope="col">Laatste lead</th><th scope="col">Dashboard</th>
              </tr>
            </thead>
            <tbody>
              {rijen.map((r) => (
                <tr key={r.id}>
                  <td><Link className="ptd-link" href={`/lifeos/pt-team/${r.id}`}>{r.naam}</Link></td>
                  <td>{r.leads.dezeWeek}</td>
                  <td>{r.leads.dezeMaand}</td>
                  <td>{r.leads.open}</td>
                  <td>{r.teLaat > 0 ? <span className="ptd-badge ptd-badge--let-op">{r.teLaat}</span> : 0}</td>
                  <td>{r.leads.klant}</td>
                  <td>{r.leads.conversie === null ? '–' : `${r.leads.conversie}%`}</td>
                  <td>{r.klantenLopend}{r.bevroren > 0 ? ` (${r.bevroren} bevr.)` : ''}</td>
                  <td>{euro(r.maandwaarde)}</td>
                  <td>{r.laatsteLead ? dagKort(r.laatsteLead) : '–'}</td>
                  <td>{r.pinStatus ? PIN[r.pinStatus] : '–'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="ptd-hint">
          Een 0 betekent: niets ingevuld in het dashboard — niet per se niets gedaan. Pincodes keur je goed op het dashboard bij
          PT-gesprekken.
        </p>
      </section>

      <ClubTabel clubs={clubs} />
    </div>
  )
}
