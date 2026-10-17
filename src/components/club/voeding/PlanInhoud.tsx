import type { Maaltijd } from '@/lib/club/voeding/model'

// Adviezen en dagindeling van een plan, als weergave (Club en ledenapp).

interface PlanInhoudProps {
  adviezen: readonly string[]
  maaltijden: readonly Maaltijd[]
  /** Unieke prefix voor de kop-id's. */
  idPrefix: string
}

export function PlanInhoud({ adviezen, maaltijden, idPrefix }: PlanInhoudProps) {
  return (
    <>
      {adviezen.length > 0 && (
        <section aria-labelledby={`${idPrefix}-adviezen`}>
          <h3 id={`${idPrefix}-adviezen`} className="club-voeding-subkop">Adviezen</h3>
          <ol className="club-voeding-adviezen">
            {adviezen.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ol>
        </section>
      )}
      {maaltijden.length > 0 && (
        <section aria-labelledby={`${idPrefix}-dag`}>
          <h3 id={`${idPrefix}-dag`} className="club-voeding-subkop">Een dag als voorbeeld</h3>
          <ol className="club-voeding-dag">
            {maaltijden.map((m, i) => (
              <li key={`${m.naam}-${i}`}>
                {m.tijd ? <time>{m.tijd}</time> : <span className="is-geen-tijd" aria-hidden>·</span>}
                <strong>{m.naam}</strong>
                {m.voorbeelden && <p>{m.voorbeelden}</p>}
              </li>
            ))}
          </ol>
        </section>
      )}
    </>
  )
}
