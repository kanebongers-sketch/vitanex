import Link from 'next/link'
import { Search } from 'lucide-react'
import type { GroepDetail as Detail } from '@/lib/club/community/beheer'
import { BeheerKnop } from './BeheerKnop'
import { LOCALE } from '@/lib/aiyourgym/taal/taal'
import { getTaal } from '@/lib/aiyourgym/taal/server'
import { COMMUNITY } from '@/lib/aiyourgym/taal/woorden/club/community'

// Een groep in het beheer: kop met wijzigen en archiveren, de leden (toevoegen
// via zoeken, eruit halen) en de laatste berichten met verbergen of plaatsen.

interface Props {
  detail: Detail
  wijzigHref: string
  /** Zoeken naar leden (GET-formulier op deze pagina). */
  zoek: { v: string; g: string; tekst: string; resultaten: { id: string; naam: string }[] | null }
  vestigingNaam: string | null
  koppeling: string | null
}

export async function GroepDetail({ detail, wijzigHref, zoek, vestigingNaam, koppeling }: Props) {
  const taal = await getTaal()
  const tc = COMMUNITY[taal]
  const t = tc.detail
  const datum = new Intl.DateTimeFormat(LOCALE[taal], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Amsterdam' })
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
              {tc.toegang[groep.toegang].label} · {vestigingNaam ?? tc.beheer.alleVestigingen}
              {groep.gearchiveerdOp ? ` · ${t.gearchiveerd}` : ''}
            </p>
            <h2>{groep.naam}</h2>
          </div>
          <div className="club-cmb-knoppen">
            <Link href={wijzigHref} scroll={false} className="club-knop club-knop--stil club-knop--klein">
              {t.wijzigen}
            </Link>
            {groep.gearchiveerdOp ? (
              <BeheerKnop url={`/api/club/community/groepen/${g}`} method="PATCH" body={{ actie: 'terugzetten' }} label={t.terugzetten} />
            ) : (
              <BeheerKnop url={`/api/club/community/groepen/${g}`} method="PATCH" body={{ actie: 'archiveren' }} label={t.archiveren} bevestig={t.archiverenVraag(groep.naam)} />
            )}
          </div>
        </div>
        {groep.uitleg && <p>{groep.uitleg}</p>}
        <p className="club-cmb-item-meta">
          {koppeling ? `${koppeling}. ` : ''}{groep.ranglijst ? (groep.challengeId ? t.ranglijstChallenge : t.ranglijstBezoek) : t.ranglijstUit}
        </p>
      </section>

      <section className="club-cmb-kaart" aria-labelledby="cmb-leden-kop">
        <h3 id="cmb-leden-kop">{t.leden(actief.length)}</h3>
        <form method="get" className="club-cmb-rij" role="search">
          <input type="hidden" name="v" value={zoek.v} />
          <input type="hidden" name="g" value={zoek.g} />
          <label className="club-veld">
            <span>{t.lidToevoegen}</span>
            <input className="club-invoer" type="search" name="zoek" defaultValue={zoek.tekst} placeholder={t.zoekPlaats} minLength={2} maxLength={40} />
          </label>
          <div className="club-cmb-knoppen club-cmb-onder">
            <button type="submit" className="club-knop club-knop--stil">
              <Search size={16} aria-hidden /> {t.zoeken}
            </button>
          </div>
        </form>
        {zoek.resultaten === null && <p className="club-melding club-melding--fout">{t.zoekFout}</p>}
        {zoek.resultaten && zoek.tekst && (
          <ul className="club-cmb-leden" aria-label={t.zoekresultaten}>
            {zoek.resultaten.length === 0 && <li>{t.geenLeden}</li>}
            {zoek.resultaten.map((r) => (
              <li key={r.id}>
                <span>{r.naam}</span>
                {inGroep.has(r.id) ? <span className="club-cmb-status">{t.alInGroep}</span> : <BeheerKnop url={`/api/club/community/groepen/${g}/leden`} method="POST" body={{ lidId: r.id }} label={t.toevoegen} soort="primair" />}
              </li>
            ))}
          </ul>
        )}
        {actief.length > 0 ? (
          <ul className="club-cmb-leden">
            {actief.map((l) => (
              <li key={l.lidId}>
                <span>
                  {l.naam} <small className="club-cmb-item-meta">{l.toegevoegdDoor === 'Zelf' ? t.viaApp : t.via(l.toegevoegdDoor)}</small>
                </span>
                <BeheerKnop url={`/api/club/community/groepen/${g}/leden`} method="DELETE" body={{ lidId: l.lidId }} label={t.uitGroep} bevestig={t.uitGroepVraag(l.naam, groep.naam)} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="club-cmb-item-meta">{t.nogGeenLeden}</p>
        )}
        {eruit.length > 0 && (
          <details>
            <summary>{t.eruit(eruit.length)}</summary>
            <ul className="club-cmb-leden">
              {eruit.map((l) => (
                <li key={l.lidId} className="is-weg">
                  <span>{l.naam}</span>
                  <BeheerKnop url={`/api/club/community/groepen/${g}/leden`} method="POST" body={{ lidId: l.lidId }} label={t.terugzetten} />
                </li>
              ))}
            </ul>
          </details>
        )}
      </section>

      <section className="club-cmb-kaart" aria-labelledby="cmb-berichten-kop">
        <h3 id="cmb-berichten-kop">{t.laatsteBerichten}</h3>
        {berichten.length > 0 ? (
          <ul className="club-cmb-berichten">
            {berichten.map((b) => {
              const url = `/api/club/community/berichten/${encodeURIComponent(b.id)}`
              return (
                <li key={b.id}>
                  <div className="club-cmb-item-meta">
                    <strong>{b.auteur}</strong>
                    <time dateTime={b.op}>{datum.format(new Date(b.op))}</time>
                    {b.status !== 'zichtbaar' && <span className={`club-cmb-status club-cmb-status--${b.status}`}>{b.status === 'vastgehouden' ? t.vastgehouden : t.verborgen}</span>}
                  </div>
                  <p>{b.tekst}</p>
                  <div className="club-cmb-knoppen">
                    {b.status === 'zichtbaar' ? <BeheerKnop url={url} method="PATCH" body={{ actie: 'verbergen' }} label={t.verbergen} soort="gevaar" /> : <BeheerKnop url={url} method="PATCH" body={{ actie: 'plaatsen' }} label={t.plaatsen} />}
                  </div>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="club-cmb-item-meta">{t.geenBerichten}</p>
        )}
      </section>
    </div>
  )
}
