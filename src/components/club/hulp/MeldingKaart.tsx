import type { Melding } from '@/lib/club/hulp/melding'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { formatDatum, formatTijd } from '@/lib/aiyourgym/taal/formaat'
import { tekst } from '@/lib/aiyourgym/taal/woordenboek'
import { HULP } from '@/lib/aiyourgym/taal/woorden/club/hulp'

// Een melding met status en (als dat er is) het antwoord. Puur (server component);
// de taal komt van de pagina.

/** Datum en tijd van een melding, bijvoorbeeld "24 okt. 2026 14:05". */
export function meldMoment(iso: string, taal: Taal): string {
  const datum = formatDatum(iso, taal, 'kort')
  return datum ? `${datum} ${formatTijd(iso, taal)}` : ''
}

export function StatusChip({ status, taal }: { status: Melding['status']; taal: Taal }) {
  const soort = status === 'klaar' ? 'club-chip--ok' : status === 'bezig' ? 'club-chip--merk' : 'club-chip--let-op'
  return <span className={`club-chip ${soort}`}>{tekst(HULP, taal).status[status]}</span>
}

export function MeldingKaart({ m, taal }: { m: Melding; taal: Taal }) {
  const t = tekst(HULP, taal)
  return (
    <article className="club-hulp-melding" aria-label={m.onderwerp}>
      <header className="club-hulp-meldingkop">
        <div>
          <p className="club-hulp-meta">
            {t.soort[m.soort]} · {meldMoment(m.aangemaaktOp, taal)}
            {m.pagina ? ` · ${m.pagina}` : ''}
          </p>
          <h3>{m.onderwerp}</h3>
        </div>
        <StatusChip status={m.status} taal={taal} />
      </header>
      <p className="club-hulp-beschrijving">{m.beschrijving}</p>
      {m.antwoord ? (
        <div className="club-hulp-antwoord">
          <p className="club-hulp-meta">
            {t.kaart.antwoord}
            {m.beantwoordOp ? ` · ${meldMoment(m.beantwoordOp, taal)}` : ''}
          </p>
          <p>{m.antwoord}</p>
        </div>
      ) : (
        <p className="club-hint">{t.kaart.geenAntwoord}</p>
      )}
    </article>
  )
}
