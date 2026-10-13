import type { ReactNode } from 'react'
import { STATUS_LABEL, STAP_LABEL, type Lead } from '@/lib/lifeos/leads/leads'
import { STOP_REDEN_LABEL, type PtKlant } from '@/lib/lifeos/pt-dashboard/abonnementen'
import { dagKort, relatief } from '@/lib/lifeos/pt-dashboard/datum'
import { scoreAfspraak, type Afspraak, type CheckupStand } from '@/lib/lifeos/pt-dashboard/checkup'

// De checkup met één PT'er: vier onderdelen om samen langs te lopen, met de
// namen erbij, en de afspraken van de vorige checkup (gehaald of niet). Alles
// uit wat de PT'er in de app invulde. Puur weergave.

const MAX_NAMEN = 12

function Blok({ nr, titel, kern, children }: { nr: string; titel: string; kern: string; children: ReactNode }) {
  return (
    <div className="ptd-rij ck-blok">
      <div className="gp-actie-kop">
        <span className="gp-nummer" aria-hidden>{nr}</span>
        <h3>{titel}</h3>
      </div>
      <p className="ck-kern">{kern}</p>
      {children}
    </div>
  )
}

function Namen<T>({ titel, items, sleutel, regel, leeg }: { titel: string; items: readonly T[]; sleutel: (x: T) => string; regel: (x: T) => ReactNode; leeg?: string }) {
  if (items.length === 0) return leeg ? <p className="ptd-hint">{leeg}</p> : null
  return (
    <div className="ck-namen">
      <p className="ptd-label">{titel} ({items.length})</p>
      <ul>
        {items.slice(0, MAX_NAMEN).map((x) => <li key={sleutel(x)}>{regel(x)}</li>)}
        {items.length > MAX_NAMEN ? <li className="ptd-hint">en nog {items.length - MAX_NAMEN}</li> : null}
      </ul>
    </div>
  )
}

function LeadRegel({ lead: l, vandaag }: { lead: Lead; vandaag: string }) {
  return (
    <>
      <strong>{l.naam}</strong>
      <span>{l.opvolgdatum ? relatief(l.opvolgdatum, vandaag) : STATUS_LABEL[l.status]}{l.volgendeStap ? ` · ${STAP_LABEL[l.volgendeStap]}` : ''}</span>
    </>
  )
}
const leadRegel = (vandaag: string) => function regel(l: Lead) {
  return <LeadRegel lead={l} vandaag={vandaag} />
}
const klantNaam = (k: PtKlant) => <strong>{k.naam}</strong>

export function AfspraakStand({ afspraak, stand }: { afspraak: Afspraak; stand: CheckupStand }) {
  const scores = scoreAfspraak(afspraak, stand)
  return (
    <div className="ptd-kaart gp-focus">
      <p className="ptd-label">Afgesproken op {dagKort(afspraak.gemaaktOp)}{afspraak.gemaaktDoor ? ` met ${afspraak.gemaaktDoor}` : ''}</p>
      <ul className="ck-scores">
        {scores.map((s) => (
          <li key={s.soort}>
            <span>{s.label}</span>
            <strong>{s.stand}</strong>
            <span className={s.gehaald ? 'ptd-badge ptd-badge--accent' : 'ptd-badge ptd-badge--let-op'}>{s.gehaald ? 'Gehaald' : 'Nog niet'}</span>
          </li>
        ))}
      </ul>
      {afspraak.notitie ? <p className="ptd-doel-notitie">{afspraak.notitie}</p> : null}
    </div>
  )
}

export function CheckupKaart({ stand: s, vandaag, doelGesprekken }: { stand: CheckupStand; vandaag: string; doelGesprekken: number | null }) {
  const r = s.referrals
  return (
    <div className="ck-raster">
      <Blok
        nr="01"
        titel="Leads & opvolging"
        kern={`${s.leads.nieuw.length} nieuwe gesprekken${doelGesprekken ? ` (doel ${doelGesprekken} per week)` : ''} · ${s.leads.teLaat.length} te laat · ${s.leads.zonderPlan.length} zonder plan`}
      >
        <Namen titel="Te laat: wat is de volgende stap?" items={s.leads.teLaat} sleutel={(l) => l.id} regel={leadRegel(vandaag)} leeg="Niets te laat." />
        <Namen titel="Zonder plan: datum en stap afspreken" items={s.leads.zonderPlan} sleutel={(l) => l.id} regel={leadRegel(vandaag)} />
      </Blok>
      <Blok
        nr="02"
        titel="Pijplijn & conversie"
        kern={`${s.pijplijn.ingepland.length} ingepland · ${s.pijplijn.nieuweKlanten.length} nieuwe klanten · ${s.pijplijn.nieuwKlant} van ${s.leads.nieuw.length} nieuwe leads al klant`}
      >
        <Namen titel="Intake of proefles ingepland" items={s.pijplijn.ingepland} sleutel={(l) => l.id} regel={leadRegel(vandaag)} leeg="Niemand ingepland voor intake of proefles." />
        <Namen titel="Nieuwe klanten" items={s.pijplijn.nieuweKlanten} sleutel={(k) => k.id} regel={klantNaam} />
      </Blok>
      <Blok
        nr="03"
        titel="Referrals"
        kern={`Bij ${r.ooitGevraagd} van ${r.lopend} lopende klanten gevraagd · ${r.gevraagdSinds} sinds vorige checkup · ${r.binnen} via referral binnen`}
      >
        <Namen titel="Nog niet gevraagd: bij wie deze week?" items={r.nogNiet} sleutel={(k) => k.id} regel={klantNaam} leeg="Bij alle lopende klanten is gevraagd." />
      </Blok>
      <Blok
        nr="04"
        titel="Behoud"
        kern={`${s.behoud.gestopt.length} gestopt of opgezegd · ${s.behoud.eindeVastePeriode.length} bij einde vaste periode (30 dagen)`}
      >
        <Namen
          titel="Gestopt of opgezegd"
          items={s.behoud.gestopt}
          sleutel={(k) => k.id}
          regel={(k) => <><strong>{k.naam}</strong><span>{k.stopReden ? STOP_REDEN_LABEL[k.stopReden] : 'reden niet ingevuld'}</span></>}
        />
        <Namen
          titel="Vaste periode loopt af: tevreden? verlengen?"
          items={s.behoud.eindeVastePeriode}
          sleutel={(x) => x.klant.id}
          regel={(x) => <><strong>{x.klant.naam}</strong><span>{dagKort(x.einde)}</span></>}
        />
      </Blok>
    </div>
  )
}
