import Link from 'next/link'
import { CalendarClock, Plus } from 'lucide-react'
import { STAP_LABEL, STATUS_LABEL, type Lead } from '@/lib/lifeos/leads/leads'
import { ABONNEMENT, eindeVastePeriode, euro } from '@/lib/lifeos/pt-dashboard/abonnementen'
import type { PtOverzicht } from '@/lib/lifeos/pt-dashboard/overzicht'
import { dagKort, relatief } from '@/lib/lifeos/pt-dashboard/datum'
import type { DoelenWeergave } from '@/lib/lifeos/pt-dashboard/doelen'
import { Tegel } from './Tegel'
import { DoelVoortgang } from './DoelVoortgang'
import { ContactActies } from './velden'

// /<naam> — wat vraagt vandaag aandacht, en hoe sta je ervoor. Puur weergave:
// alle cijfers komen uit `ptOverzicht` (lib/lifeos/pt-dashboard/overzicht.ts).

interface Props {
  code: string
  vandaag: string
  o: PtOverzicht
  /** Doelen van Kane met voortgang; leeg/null = sectie verborgen. */
  doelen?: DoelenWeergave | null
}

export function Overzicht({ code, vandaag, o, doelen }: Props) {
  const opvolgen = [...o.teLaat, ...o.vandaag]
  const leeg = o.leads.totaal === 0 && o.klanten.lopend === 0
  return (
    <>
      <div className="ptd-tegels">
        <Tegel getal={String(o.leads.dezeWeek)} label="Leads deze week" uitleg={`${o.leads.dezeMaand} deze maand`} />
        <Tegel getal={String(o.leads.open)} label="Open leads" uitleg={o.teLaat.length > 0 ? `${o.teLaat.length} opvolging te laat` : 'niets te laat'} />
        <Tegel
          getal={String(o.leads.klant)}
          label="Klant geworden"
          uitleg={o.leads.conversie === null ? 'nog geen leads' : `${o.leads.conversie}% van alle leads`}
          accent
        />
        <Tegel getal={euro(o.klanten.maandwaarde)} label="Abonnementen p/m" uitleg={`${o.klanten.lopend} lopend · incl. btw`} />
      </div>

      {doelen ? <DoelVoortgang weergave={doelen} /> : null}

      <div className="ptd-acties">
        <Link className="ptd-knop ptd-knop--primair" href={`/${code}/lead?nieuw=1`}><Plus size={18} aria-hidden /> Lead invullen</Link>
        <Link className="ptd-knop" href={`/${code}/klanten?nieuw=1`}><Plus size={18} aria-hidden /> Klant toevoegen</Link>
      </div>

      {leeg ? (
        <p className="ptd-leeg">
          Welkom! Begin met je leads: iedereen die je spreekt over personal training — op de vloer, bij een intake of aan de
          telefoon. Zet ook je huidige PT-klanten erin met hun abonnement. Elke week bespreken we dit in het coachgesprek.
        </p>
      ) : null}

      <section className="ptd-sectie" aria-labelledby="opvolgen-kop">
        <div className="ptd-sectiekop">
          <h2 id="opvolgen-kop">Opvolgen</h2>
          <span>{opvolgen.length === 0 ? 'alles bij' : `${opvolgen.length} vandaag of eerder`}</span>
        </div>
        {opvolgen.length === 0 ? (
          <p className="ptd-leeg">Niemand staat vandaag op je opvollijst. Geef open leads een opvolgdatum, dan verschijnen ze hier op tijd.</p>
        ) : (
          <ul className="ptd-lijst">
            {opvolgen.map((l) => <OpvolgRij key={l.id} code={code} lead={l} vandaag={vandaag} />)}
          </ul>
        )}
      </section>

      {o.zonderPlan.length > 0 ? (
        <section className="ptd-sectie" aria-labelledby="plan-kop">
          <div className="ptd-sectiekop">
            <h2 id="plan-kop">Zonder volgende stap</h2>
            <span>{o.zonderPlan.length} open</span>
          </div>
          <p className="ptd-hint">Deze leads hebben geen opvolgdatum of volgende stap — zo raken ze uit beeld.</p>
          <ul className="ptd-lijst">
            {o.zonderPlan.slice(0, 6).map((l) => <OpvolgRij key={l.id} code={code} lead={l} vandaag={vandaag} />)}
          </ul>
        </section>
      ) : null}

      {o.klanten.vastBijnaKlaar.length > 0 ? (
        <section className="ptd-sectie" aria-labelledby="vast-kop">
          <div className="ptd-sectiekop">
            <h2 id="vast-kop">Vaste periode loopt af</h2>
            <span>binnen 30 dagen</span>
          </div>
          <p className="ptd-hint">Een goed moment voor een evaluatie: resultaten bespreken en samen het vervolg kiezen.</p>
          <ul className="ptd-lijst">
            {o.klanten.vastBijnaKlaar.map((k) => (
              <li key={k.id} className="ptd-rij">
                <div className="ptd-rij-kop">
                  <span className="ptd-naam">{k.naam}</span>
                  <span className="ptd-badge">t/m {dagKort(eindeVastePeriode(k.startdatum))}</span>
                </div>
                <div className="ptd-meta"><span>{ABONNEMENT[k.abonnement].label}</span></div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  )
}

function OpvolgRij({ code, lead: l, vandaag }: { code: string; lead: Lead; vandaag: string }) {
  const teLaat = l.opvolgdatum !== null && l.opvolgdatum < vandaag
  return (
    <li className="ptd-rij">
      <div className="ptd-rij-kop">
        <span className="ptd-naam">{l.naam}</span>
        <span className="ptd-badge">{STATUS_LABEL[l.status]}</span>
      </div>
      {l.opvolgdatum || l.volgendeStap ? (
        <div className="ptd-meta">
          <span className={teLaat ? 'ptd-badge ptd-badge--let-op' : 'ptd-badge ptd-badge--accent'}>
            <CalendarClock size={13} aria-hidden />
            {l.volgendeStap ? STAP_LABEL[l.volgendeStap] : 'Opvolgen'}
            {l.opvolgdatum ? ` · ${relatief(l.opvolgdatum, vandaag)}` : ''}
          </span>
        </div>
      ) : null}
      {l.notitie ? <p className="ptd-tekst ptd-kort">{l.notitie}</p> : null}
      <div className="ptd-acties ptd-acties--rij">
        <ContactActies contact={l.contact} naam={l.naam} />
        <Link className="ptd-knop ptd-knop--klein" href={`/${code}/lead?open=${l.id}#lead-${l.id}`}>Bijwerken</Link>
      </div>
    </li>
  )
}
