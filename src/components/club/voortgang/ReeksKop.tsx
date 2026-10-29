import type { ReeksInfo, ReeksSleutel, Verschillen } from '@/lib/club/voortgang/tijdlijn'
import { datumKort, getal, reeksTekst, verschilTekst } from './weergave'
import { useTaal, useTekst } from '@/lib/aiyourgym/taal/client'
import { VOORTGANG } from '@/lib/aiyourgym/taal/woorden/club/voortgang'

interface ReeksKopProps {
  info: ReeksInfo
  verschil: Verschillen
  reeksen: readonly ReeksInfo[]
  gekozen: ReeksSleutel
  onKies: (sleutel: ReeksSleutel) => void
}

/**
 * Het grote getal van de gekozen meetwaarde met de verschillen, en de wissel.
 * Verschillen zijn neutraal gekleurd: of omhoog goed is, hangt af van het doel.
 */
export function ReeksKop({ info: bron, verschil, reeksen, gekozen, onKies }: ReeksKopProps) {
  const taal = useTaal()
  const tv = useTekst(VOORTGANG)
  const t = tv.reeks
  const info = reeksTekst(bron, tv)
  const eenheid = info.eenheid ? ` ${info.eenheid}` : ''
  return (
    <div className="club-voortgang-reekskop">
      <div className="club-voortgang-cijfer">
        <span className="club-tegel-label">{info.label}</span>
        <span className="club-voortgang-getal">
          {getal(verschil.laatste.waarde, taal)}
          {info.eenheid && <small>{info.eenheid}</small>}
        </span>
        <span className="club-voortgang-meetdatum">{t.gemeten(datumKort(verschil.laatste.datum, taal))}</span>
      </div>
      <dl className="club-voortgang-verschillen">
        <div>
          <dt>{t.sindsStart}</dt>
          <dd>{verschil.sindsStart === null ? t.eersteMeting : `${verschilTekst(verschil.sindsStart, taal)}${eenheid}`}</dd>
          <dd className="club-voortgang-klein">{datumKort(verschil.start.datum, taal)}</dd>
        </div>
        <div>
          <dt>{t.sindsVorige}</dt>
          <dd>{verschil.sindsVorige === null ? t.nogGeen : `${verschilTekst(verschil.sindsVorige, taal)}${eenheid}`}</dd>
          <dd className="club-voortgang-klein">{verschil.vorige ? datumKort(verschil.vorige.datum, taal) : t.volgendeMeting}</dd>
        </div>
      </dl>
      {reeksen.length > 1 && (
        <div className="club-segment club-voortgang-wissel" role="group" aria-label={t.kies}>
          {reeksen.map((r) => (
            <button key={r.sleutel} type="button" aria-pressed={r.sleutel === gekozen} onClick={() => onKies(r.sleutel)}>
              {reeksTekst(r, tv).kort}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
