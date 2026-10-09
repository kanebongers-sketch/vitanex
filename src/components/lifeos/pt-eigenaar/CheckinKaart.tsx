import { CHECKIN_VRAGEN, ENERGIE_LABEL, momentLabel, type Checkin } from '@/lib/lifeos/pt-dashboard/checkin'

// De weekcheck-in van één PT'er, alleen lezen (voor de eigenaar). Puur.

export function CheckinKaart({ checkin: c }: { checkin: Checkin }) {
  const antwoorden = CHECKIN_VRAGEN.filter((v) => c[v.veld])
  return (
    <div className="ptd-checkin">
      <p className="ptd-meta">
        {c.energie ? <span className="ptd-badge">Energie: {ENERGIE_LABEL[c.energie]}</span> : null}
        <span>bijgewerkt {momentLabel(c.bijgewerktOp)}</span>
      </p>
      {antwoorden.length === 0 ? (
        <p className="ptd-hint">Alleen de energie ingevuld.</p>
      ) : (
        <dl className="ptd-checkin-lijst">
          {antwoorden.map((v) => (
            <div key={v.veld}>
              <dt className="ptd-label">{v.kort}</dt>
              <dd className="ptd-tekst">{c[v.veld]}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  )
}
