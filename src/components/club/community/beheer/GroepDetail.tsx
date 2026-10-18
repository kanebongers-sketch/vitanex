import Link from 'next/link'
import { Search } from 'lucide-react'
import { TOEGANG_LABEL } from '@/lib/club/community/model'
import type { GroepDetail as Detail } from '@/lib/club/community/beheer'
import { BeheerKnop } from './BeheerKnop'

// Een groep in het beheer: kop met wijzigen en archiveren, de leden (toevoegen
// via zoeken, eruit halen) en de laatste berichten met verbergen of plaatsen.

const DATUM = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Amsterdam' })

interface Props {
  detail: Detail
  wijzigHref: string
  /** Zoeken naar leden (GET-formulier op deze pagina). */
  zoek: { v: string; g: string; tekst: string; resultaten: { id: string; naam: string }[] | null }
  vestigingNaam: string | null
  koppeling: string | null
}

export function GroepDetail({ detail, wijzigHref, zoek, vestigingNaam, koppeling }: Props) {
  const { groep, leden, berichten } = detail
  const g = encodeURIComponent(groep.id)
  const inGroep = new Set(leden.filter((l) => l.status === 'lid').map((l) => l.lidId))
  const actief = leden.filter((l) => l.status === 'lid')
  const eruit = leden.filter((l) => l.status === 'verwijderd')
  return (
    <div className="club-cmb-kolom">
      <section className="club-cmb-kaart">
        <div className="club-cmb-kopregel">
          <div>
            <p className="club-boventitel">
              {TOEGANG_LABEL[groep.toegang].label} · {vestigingNaam ?? 'Alle vestigingen'}
              {groep.gearchiveerdOp ? ' · Gearchiveerd' : ''}
            </p>
            <h2>{groep.naam}</h2>
          </div>
          <div className="club-cmb-knoppen">
            <Link href={wijzigHref} scroll={false} className="club-knop club-knop--stil club-knop--klein">
              Wijzigen
            </Link>
            {groep.gearchiveerdOp ? (
              <BeheerKnop url={`/api/club/community/groepen/${g}`} method="PATCH" body={{ actie: 'terugzetten' }} label="Terugzetten" />
            ) : (
              <BeheerKnop url={`/api/club/community/groepen/${g}`} method="PATCH" body={{ actie: 'archiveren' }} label="Archiveren" bevestig={`${groep.naam} archiveren? Leden zien de groep dan niet meer. Berichten blijven bewaard.`} />
            )}
          </div>
        </div>
        {groep.uitleg && <p>{groep.uitleg}</p>}
        <p className="club-cmb-item-meta">
          {koppeling ? `${koppeling}. ` : ''}Ranglijst {groep.ranglijst ? (groep.challengeId ? 'volgt de challenge' : 'op bezoekdagen deze maand') : 'staat uit'}.
        </p>
      </section>

      <section className="club-cmb-kaart" aria-labelledby="cmb-leden-kop">
        <h3 id="cmb-leden-kop">Leden ({actief.length})</h3>
        <form method="get" className="club-cmb-rij" role="search">
          <input type="hidden" name="v" value={zoek.v} />
          <input type="hidden" name="g" value={zoek.g} />
          <label className="club-veld">
            <span>Lid toevoegen</span>
            <input className="club-invoer" type="search" name="zoek" defaultValue={zoek.tekst} placeholder="Zoek op voor- of achternaam" minLength={2} maxLength={40} />
          </label>
          <div className="club-cmb-knoppen club-cmb-onder">
            <button type="submit" className="club-knop club-knop--stil">
              <Search size={16} aria-hidden /> Zoeken
            </button>
          </div>
        </form>
        {zoek.resultaten === null && <p className="club-melding club-melding--fout">Zoeken lukte niet. Probeer het opnieuw.</p>}
        {zoek.resultaten && zoek.tekst && (
          <ul className="club-cmb-leden" aria-label="Zoekresultaten">
            {zoek.resultaten.length === 0 && <li>Geen leden gevonden.</li>}
            {zoek.resultaten.map((r) => (
              <li key={r.id}>
                <span>{r.naam}</span>
                {inGroep.has(r.id) ? <span className="club-cmb-status">Al in de groep</span> : <BeheerKnop url={`/api/club/community/groepen/${g}/leden`} method="POST" body={{ lidId: r.id }} label="Toevoegen" soort="primair" />}
              </li>
            ))}
          </ul>
        )}
        {actief.length > 0 ? (
          <ul className="club-cmb-leden">
            {actief.map((l) => (
              <li key={l.lidId}>
                <span>
                  {l.naam} <small className="club-cmb-item-meta">via {l.toegevoegdDoor === 'Zelf' ? 'de app' : l.toegevoegdDoor}</small>
                </span>
                <BeheerKnop url={`/api/club/community/groepen/${g}/leden`} method="DELETE" body={{ lidId: l.lidId }} label="Uit groep halen" bevestig={`${l.naam} uit ${groep.naam} halen? Het lid kan daarna niet zelf terug.`} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="club-cmb-item-meta">Nog geen leden in deze groep.</p>
        )}
        {eruit.length > 0 && (
          <details>
            <summary>Uit de groep gehaald ({eruit.length})</summary>
            <ul className="club-cmb-leden">
              {eruit.map((l) => (
                <li key={l.lidId} className="is-weg">
                  <span>{l.naam}</span>
                  <BeheerKnop url={`/api/club/community/groepen/${g}/leden`} method="POST" body={{ lidId: l.lidId }} label="Terugzetten" />
                </li>
              ))}
            </ul>
          </details>
        )}
      </section>

      <section className="club-cmb-kaart" aria-labelledby="cmb-berichten-kop">
        <h3 id="cmb-berichten-kop">Laatste berichten</h3>
        {berichten.length > 0 ? (
          <ul className="club-cmb-berichten">
            {berichten.map((b) => {
              const url = `/api/club/community/berichten/${encodeURIComponent(b.id)}`
              return (
                <li key={b.id}>
                  <div className="club-cmb-item-meta">
                    <strong>{b.auteur}</strong>
                    <time dateTime={b.op}>{DATUM.format(new Date(b.op))}</time>
                    {b.status !== 'zichtbaar' && <span className={`club-cmb-status club-cmb-status--${b.status}`}>{b.status === 'vastgehouden' ? 'Vastgehouden' : 'Verborgen'}</span>}
                  </div>
                  <p>{b.tekst}</p>
                  <div className="club-cmb-knoppen">
                    {b.status === 'zichtbaar' ? <BeheerKnop url={url} method="PATCH" body={{ actie: 'verbergen' }} label="Verbergen" soort="gevaar" /> : <BeheerKnop url={url} method="PATCH" body={{ actie: 'plaatsen' }} label="Plaatsen" />}
                  </div>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="club-cmb-item-meta">Nog geen berichten in deze groep.</p>
        )}
      </section>
    </div>
  )
}
