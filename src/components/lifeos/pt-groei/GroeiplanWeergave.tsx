import { CLUB_LABEL } from '@/lib/lifeos/pt-dashboard/clubs'
import { PERIODE_DAGEN, VOOR_LABEL, type ClubStand, type GroeiActie, type GroeiCijfers } from '@/lib/lifeos/pt-dashboard/groeiplan'
import { Tegel } from '@/components/lifeos/pt-dashboard/Tegel'

// Het groeiplan lezen: focus, acties (per rol), en de live cijfers ernaast.
// Puur weergave — de pagina kiest welke acties en clubs iemand ziet.

export function GroeiFocus({ focus, bijgewerkt }: { focus: string; bijgewerkt: string | null }) {
  return (
    <section className="ptd-sectie" aria-labelledby="gp-focus-kop">
      <div className="ptd-kaart gp-focus">
        <p className="ptd-label" id="gp-focus-kop">Focus</p>
        <p className="gp-focus-tekst">{focus}</p>
        <p className="ptd-hint">{bijgewerkt ?? 'Startplan: Kane en de eigenaren vullen dit verder aan.'}</p>
      </div>
    </section>
  )
}

export function GroeiActies({ acties, toonVoor }: { acties: readonly GroeiActie[]; toonVoor: boolean }) {
  return (
    <section className="ptd-sectie" aria-labelledby="gp-acties-kop">
      <div className="ptd-sectiekop">
        <h2 id="gp-acties-kop">Wat we doen</h2>
        <span>{acties.length} {acties.length === 1 ? 'actie' : 'acties'}</span>
      </div>
      {acties.length === 0 ? (
        <p className="ptd-leeg">Er staan nog geen acties in het plan.</p>
      ) : (
        <ol className="gp-acties">
          {acties.map((a, i) => (
            <li key={`${i}-${a.titel}`} className="ptd-rij">
              <div className="gp-actie-kop">
                <span className="gp-nummer" aria-hidden>{String(i + 1).padStart(2, '0')}</span>
                <h3>{a.titel}</h3>
                {toonVoor ? <span className="gp-voor">{VOOR_LABEL[a.voor]}</span> : null}
              </div>
              {a.uitleg ? <p>{a.uitleg}</p> : null}
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

export function GroeiTegels({ c, titel }: { c: GroeiCijfers; titel: string }) {
  return (
    <section className="ptd-sectie" aria-labelledby="gp-cijfers-kop">
      <div className="ptd-sectiekop">
        <h2 id="gp-cijfers-kop">{titel}</h2>
        <span>laatste {PERIODE_DAGEN} dagen</span>
      </div>
      <div className="ptd-tegels">
        <Tegel getal={String(c.leads)} label="Gesprekken" uitleg="leads vastgelegd" />
        <Tegel getal={String(c.klantGeworden)} label="Klant geworden" uitleg={`van die ${c.leads} leads`} accent={c.klantGeworden > 0} />
        <Tegel getal={String(c.nietOpgevolgd)} label="Nog opvolgen" uitleg="2+ dagen nieuw of datum verlopen" />
        <Tegel getal={`${c.referralGevraagd}/${c.leads}`} label="Referral gevraagd" uitleg={`${c.viaReferral} via referral binnen`} />
      </div>
      <p className="ptd-hint">Alleen wat in de app staat telt mee: niet ingevuld is hier 0.</p>
    </section>
  )
}

function Voortgang({ actief, doel }: { actief: number; doel: number | null }) {
  if (doel === null) return <span className="ptd-hint">geen doel</span>
  const deel = doel === 0 ? 1 : Math.min(actief / doel, 1)
  return (
    <span className="gp-voortgang">
      <span className="gp-balk" aria-hidden><span style={{ transform: `scaleX(${deel})` }} /></span>
      <span>{actief} / {doel}</span>
    </span>
  )
}

export function ClubTabel({ standen }: { standen: readonly ClubStand[] }) {
  return (
    <section className="ptd-sectie" aria-labelledby="gp-clubs-kop">
      <div className="ptd-sectiekop">
        <h2 id="gp-clubs-kop">Per club</h2>
        <span>actieve PT-klanten tegenover het doel</span>
      </div>
      <div className="ptd-scroll">
        <table className="ptd-tabel">
          <caption className="sr-only">Actieve PT-klanten, doel, leads en nieuwe klanten per club</caption>
          <thead>
            <tr>
              <th scope="col">Club</th>
              <th scope="col">Actief / doel</th>
              <th scope="col">Leads {PERIODE_DAGEN}d</th>
              <th scope="col">Nieuwe klanten {PERIODE_DAGEN}d</th>
            </tr>
          </thead>
          <tbody>
            {standen.map((s) => (
              <tr key={s.club}>
                <th scope="row">{CLUB_LABEL[s.club]}</th>
                <td><Voortgang actief={s.actief} doel={s.doel} /></td>
                <td>{s.leads}</td>
                <td>{s.nieuweKlanten}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
