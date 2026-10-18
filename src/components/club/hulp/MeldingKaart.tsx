import { SOORT_LABEL, STATUS_LABEL, type Melding } from '@/lib/club/hulp/melding'

// Een melding met status en (als dat er is) het antwoord. Puur (server component).

export function nlMoment(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Amsterdam' }).format(d)
}

export function StatusChip({ status }: { status: Melding['status'] }) {
  const soort = status === 'klaar' ? 'club-chip--ok' : status === 'bezig' ? 'club-chip--merk' : 'club-chip--let-op'
  return <span className={`club-chip ${soort}`}>{STATUS_LABEL[status]}</span>
}

export function MeldingKaart({ m }: { m: Melding }) {
  return (
    <article className="club-hulp-melding" aria-label={m.onderwerp}>
      <header className="club-hulp-meldingkop">
        <div>
          <p className="club-hulp-meta">
            {SOORT_LABEL[m.soort]} · {nlMoment(m.aangemaaktOp)}
            {m.pagina ? ` · ${m.pagina}` : ''}
          </p>
          <h3>{m.onderwerp}</h3>
        </div>
        <StatusChip status={m.status} />
      </header>
      <p className="club-hulp-beschrijving">{m.beschrijving}</p>
      {m.antwoord ? (
        <div className="club-hulp-antwoord">
          <p className="club-hulp-meta">Antwoord{m.beantwoordOp ? ` · ${nlMoment(m.beantwoordOp)}` : ''}</p>
          <p>{m.antwoord}</p>
        </div>
      ) : (
        <p className="club-hint">Nog geen antwoord.</p>
      )}
    </article>
  )
}
