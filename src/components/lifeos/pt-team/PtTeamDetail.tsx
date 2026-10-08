'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'
import { haalJson } from '@/lib/lifeos/api/http'
import { leesPtDetail, type PtDetail } from '@/lib/lifeos/pt-dashboard/team-overzicht'
import { ptOverzicht } from '@/lib/lifeos/pt-dashboard/overzicht'
import { euro, isLopend } from '@/lib/lifeos/pt-dashboard/abonnementen'
import { Tegel } from '@/components/lifeos/pt-dashboard/Tegel'
import { LeadKaart } from '@/components/lifeos/pt-dashboard/LeadKaart'
import { KlantKaart } from '@/components/lifeos/pt-dashboard/KlantKaart'
import { DoelenSectie } from './DoelenFormulier'

// Container: alles van één PT'er, alleen-lezen — precies wat die zelf in zijn
// dashboard ziet, zodat je het in het coachgesprek samen kunt doorlopen.

type Staat = { fase: 'laden' } | { fase: 'fout'; bericht: string } | { fase: 'ok'; data: PtDetail }
type Tab = 'leads' | 'klanten'

export function PtTeamDetail({ id }: { id: string }) {
  const [staat, setStaat] = useState<Staat>({ fase: 'laden' })
  const [tab, setTab] = useState<Tab>('leads')
  const laad = useCallback(
    (): Promise<void> =>
      haalJson(`/api/lifeos/pt-team/${encodeURIComponent(id)}`, leesPtDetail).then((uit) =>
        setStaat(uit.ok ? { fase: 'ok', data: uit.waarde } : { fase: 'fout', bericht: uit.fout }),
      ),
    [id],
  )
  useEffect(() => {
    void laad()
  }, [laad])
  const o = useMemo(() => (staat.fase === 'ok' ? ptOverzicht(staat.data.leads, staat.data.klanten, staat.data.vandaag) : null), [staat])

  if (staat.fase === 'laden') return <p className="ptd-hint">Laden…</p>
  if (staat.fase === 'fout') return <Foutmelding bericht={staat.bericht} opnieuw={() => void laad()} />
  const d = staat.data
  if (!o) return null

  return (
    <div className="ptd ptd--ingebed">
      <div>
        <h1 className="os-zone__kop">{d.naam}</h1>
        {d.code ? <p className="ptd-hint">Eigen dashboard: mentaforce.nl/{d.code}</p> : null}
      </div>
      <div className="ptd-tegels">
        <Tegel getal={String(o.leads.dezeWeek)} label="Leads deze week" uitleg={`${o.leads.dezeMaand} deze maand · ${o.leads.totaal} totaal`} />
        <Tegel getal={String(o.leads.open)} label="Open leads" uitleg={`${o.teLaat.length} te laat · ${o.zonderPlan.length} zonder plan`} />
        <Tegel getal={String(o.leads.klant)} label="Klant geworden" uitleg={o.leads.conversie === null ? 'nog geen leads' : `${o.leads.conversie}% van alle leads`} accent />
        <Tegel getal={euro(o.klanten.maandwaarde)} label="Abonnementen p/m" uitleg={`${o.klanten.lopend} lopend · ${o.klanten.sessiesPerWeek} sessies p/w`} />
      </div>

      <DoelenSectie
        persoonId={id}
        naam={d.naam}
        doelen={d.doelen}
        leads={d.leads}
        klanten={d.klanten}
        vandaag={d.vandaag}
        onOpgeslagen={(doelen) => setStaat((s) => (s.fase === 'ok' ? { ...s, data: { ...s.data, doelen } } : s))}
      />

      <div className="ptd-filters" role="group" aria-label="Tonen">
        <button type="button" className="ptd-chip" aria-pressed={tab === 'leads'} onClick={() => setTab('leads')}>Leads <small>{d.leads.length}</small></button>
        <button type="button" className="ptd-chip" aria-pressed={tab === 'klanten'} onClick={() => setTab('klanten')}>Klanten <small>{d.klanten.length}</small></button>
      </div>

      {tab === 'leads' ? (
        d.leads.length === 0 ? (
          <p className="ptd-leeg">{d.naam} heeft nog geen leads ingevuld.</p>
        ) : (
          <ul className="ptd-lijst">{d.leads.map((l) => <LeadKaart key={l.id} lead={l} vandaag={d.vandaag} />)}</ul>
        )
      ) : d.klanten.length === 0 ? (
        <p className="ptd-leeg">{d.naam} heeft nog geen PT-klanten ingevuld.</p>
      ) : (
        <ul className="ptd-lijst">
          {[...d.klanten]
            .sort((a, b) => Number(isLopend(b, d.vandaag)) - Number(isLopend(a, d.vandaag)))
            .map((k) => <KlantKaart key={k.id} klant={k} vandaag={d.vandaag} />)}
        </ul>
      )}
    </div>
  )
}
