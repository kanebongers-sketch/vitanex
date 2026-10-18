import { ShieldCheck } from 'lucide-react'
import { MELD_REDEN_LABEL } from '@/lib/club/community/model'
import type { TeBeoordelen } from '@/lib/club/community/beheer'
import { BeheerKnop } from './BeheerKnop'

// Berichten die op de sportschool wachten: vastgehouden door de woordfilter of
// door meerdere meldingen, of gemeld door een lid. Plaatsen of verbergen; de
// meldingen op het bericht zijn daarmee afgehandeld. De melder blijft anoniem.

const DATUM = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Amsterdam' })

export function Beoordelen({ items }: { items: TeBeoordelen[] }) {
  if (items.length === 0) {
    return (
      <div className="club-cmb-kaart">
        <h2>
          <ShieldCheck size={20} aria-hidden /> Niets te beoordelen
        </h2>
        <p>Er zijn geen gemelde of vastgehouden berichten. Een bericht met een woord uit de woordfilter, of dat leden melden, komt hier terecht.</p>
      </div>
    )
  }
  return (
    <section className="club-cmb-kolom" aria-labelledby="cmb-beoordeel-kop">
      <h2 id="cmb-beoordeel-kop">Te beoordelen ({items.length})</h2>
      <ul className="club-cmb-beoordeel">
        {items.map((b) => {
          const url = `/api/club/community/berichten/${encodeURIComponent(b.berichtId)}`
          return (
            <li key={b.berichtId} className="club-cmb-item">
              <div className="club-cmb-item-meta">
                <strong>{b.auteur}</strong>
                <span>{b.groepNaam}</span>
                <time dateTime={b.op}>{DATUM.format(new Date(b.op))}</time>
                <span className={`club-cmb-status club-cmb-status--${b.status}`}>{b.status === 'vastgehouden' ? `Vastgehouden${b.reden ? `: ${b.reden.toLowerCase()}` : ''}` : b.status === 'verborgen' ? 'Verborgen' : 'Zichtbaar'}</span>
              </div>
              <blockquote>{b.tekst}</blockquote>
              {b.meldingen.length > 0 && (
                <>
                  <ul className="club-cmb-redenen" aria-label="Meldingen">
                    {b.meldingen.map((m, i) => (
                      <li key={i}>{MELD_REDEN_LABEL[m.reden]}</li>
                    ))}
                  </ul>
                  {b.meldingen
                    .filter((m) => m.toelichting)
                    .map((m, i) => (
                      <p key={i} className="club-cmb-item-meta">
                        Toelichting: {m.toelichting}
                      </p>
                    ))}
                </>
              )}
              <div className="club-cmb-knoppen">
                {b.status !== 'verborgen' && <BeheerKnop url={url} method="PATCH" body={{ actie: 'verbergen' }} label="Verbergen" soort="gevaar" />}
                <BeheerKnop url={url} method="PATCH" body={{ actie: 'plaatsen' }} label={b.status === 'zichtbaar' ? 'In orde, laten staan' : 'Plaatsen'} soort="primair" />
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
