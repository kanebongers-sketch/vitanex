import type { Vandaag } from '@/lib/club/cijfers/haal-vandaag'
import { BINNEN_MINUTEN } from '@/lib/club/cijfers/vandaag'
import { weekdagNaam, weekdagVan } from '@/lib/club/cijfers/tijd'

// De bovenkant van Vandaag: een reuzencijfer voor wie er nu is, en daarnaast
// drie feiten in een rustige kolom. Bewust geen rij gelijke tegels.

interface Props {
  data: Vandaag
}

function VerschilTekst({ data }: Props) {
  const dag = weekdagNaam(weekdagVan(data.vandaag))
  const { verschil, richting } = data.verschil
  if (richting === 'gelijk') return <span className="club-vandaag-feit-sub">Even veel als vorige {dag} om deze tijd</span>
  return (
    <span className="club-vandaag-feit-sub">
      <span className={richting === 'meer' ? 'club-plus' : 'club-min'}>
        {richting === 'meer' ? '+' : ''}
        {verschil}
      </span>{' '}
      ten opzichte van vorige {dag} om deze tijd ({data.checkinsVorigeWeek})
    </span>
  )
}

export function VandaagHero({ data }: Props) {
  const lessen = data.lessen.filter((l) => !l.geannuleerd)
  const nogTeGaan = lessen.filter((l) => l.start.getTime() > data.nu.getTime()).length
  const proefTijden = data.proeflessen.length
  return (
    <section className="club-vandaag-hero" aria-label="Nu in de club">
      <div className="club-vandaag-nu">
        <span className="club-vandaag-label">Nu binnen</span>
        <strong className="club-vandaag-reus">{data.nuBinnen}</strong>
        <span className="club-vandaag-nu-sub">check-ins in de laatste {BINNEN_MINUTEN} minuten</span>
      </div>
      <dl className="club-vandaag-feiten">
        <div className="club-vandaag-feit">
          <dt>Check-ins vandaag</dt>
          <dd>
            <strong>{data.checkinsVandaag}</strong>
            <VerschilTekst data={data} />
          </dd>
        </div>
        <div className="club-vandaag-feit">
          <dt>Lessen vandaag</dt>
          <dd>
            <strong>{lessen.length}</strong>
            <span className="club-vandaag-feit-sub">{lessen.length === 0 ? 'Geen lessen gepland' : `${nogTeGaan} nog te gaan`}</span>
          </dd>
        </div>
        <div className="club-vandaag-feit">
          <dt>Proeflessen vandaag</dt>
          <dd>
            <strong>{proefTijden}</strong>
            <span className="club-vandaag-feit-sub">{proefTijden === 0 ? 'Geen proeflessen gepland' : data.proeflessen.map((p) => p.naam.split(' ')[0]).join(', ')}</span>
          </dd>
        </div>
      </dl>
    </section>
  )
}
