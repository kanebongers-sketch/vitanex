import Link from 'next/link'
import { ClipboardList } from 'lucide-react'
import { DOSSIER_SIGNAAL_LABEL, dossierTaakTekst, type DossierTaak } from '@/lib/lifeos/pt-dashboard/dossier-agenda'

// Op het overzicht: bij welke klanten er deze week iets in het dossier moet
// gebeuren (check, test, eindevaluatie, intake of nulmeting die ontbreekt,
// lang niet gemeten). Elke rij opent het dossier op het juiste tabblad. Puur.

function tabVoor(t: DossierTaak): string {
  if (t.signalen.includes('intake_ontbreekt')) return 'intake'
  return 'metingen'
}

export function DossiersDezeWeek({ code, taken }: { code: string; taken: readonly DossierTaak[] }) {
  return (
    <section className="ptd-sectie" aria-labelledby="dossiers-kop">
      <div className="ptd-sectiekop">
        <h2 id="dossiers-kop">Dossiers deze week</h2>
        <span>{taken.length === 0 ? 'alles bij' : `${taken.length} ${taken.length === 1 ? 'klant' : 'klanten'}`}</span>
      </div>
      {taken.length === 0 ? (
        <p className="ptd-leeg">Geen meetmomenten deze week en elk lopend dossier heeft een intake en nulmeting.</p>
      ) : (
        <ul className="ptd-lijst ffdos-dossiers">
          {taken.map((t) => (
            <li key={t.klant.id} className="ptd-rij">
              <div className="ptd-rij-kop">
                <Link className="ptd-naam ptd-link" href={`/${code}/klanten/${t.klant.id}?tab=${tabVoor(t)}`}>{t.klant.naam}</Link>
                {t.moment ? <span className="ptd-badge ptd-badge--accent">{t.moment.soort === 'eind' ? 'Eindevaluatie' : t.moment.soort === 'check' ? 'Check' : t.moment.soort === 'test' ? 'Test' : 'Intake'}</span> : null}
              </div>
              <p className="ptd-meta">
                <span className="ffdos-dossier-taak"><ClipboardList size={13} aria-hidden /> {dossierTaakTekst(t)}</span>
                {t.signalen.map((s) => <span key={s} className="ptd-badge ptd-badge--let-op">{DOSSIER_SIGNAAL_LABEL[s]}</span>)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
