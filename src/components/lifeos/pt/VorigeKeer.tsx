import type { VorigeEvaluatie } from '@/lib/lifeos/pt-gesprek/team'
import { VerslagDownload } from './VerslagDownload'

// Wat jullie vorige keer bespraken, bovenaan het coachgesprek. Puur weergave.

const labelStijl: React.CSSProperties = { fontSize: 11.5, fontWeight: 600, color: 'var(--text-4)' }
const DAG_KORT = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short' })

/** Wat jullie vorige keer bespraken — zodat je niet blanco begint. */
export function VorigeKeer({ vorige }: { vorige: VorigeEvaluatie }) {
  const { algemeen, energie, voortgang } = vorige.scores
  return (
    <div style={{ display: 'grid', gap: 4, padding: '10px 12px', borderRadius: 10, border: '1px solid var(--line)', background: 'var(--bg-raised)' }}>
      <p style={{ ...labelStijl, margin: 0 }}>
        Vorige keer · {DAG_KORT.format(new Date(vorige.op))} · algemeen {algemeen}/5 · energie {energie}/5 · voortgang {voortgang}/5
        {' · '}
        <VerslagDownload id={vorige.id} />
      </p>
      {vorige.notitie ? <p style={{ margin: 0, fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5 }}>{vorige.notitie}</p> : null}
      {vorige.aandachtspunt ? (
        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-1)', lineHeight: 1.5 }}>
          <span style={{ color: 'var(--brand)', fontWeight: 600 }}>Aandachtspunt:</span> {vorige.aandachtspunt}
        </p>
      ) : null}
    </div>
  )
}
