// "Wat je gewoontes je kosten" — groot getal, jouw meting, wat onderzoek zegt,
// één haalbare stap en de bron. Puur presentational: alles komt uit
// src/lib/vandaag/rekening.ts.

import type { Rekening, RekeningRegel } from '@/lib/vandaag/rekening'

const KOP_ID = 'rekening-kop'

const TITELS: Record<RekeningRegel['id'], string> = {
  stappen: 'Bewegen',
  slaap: 'Slaap',
  vo2max: 'Conditie',
  rusthartslag: 'Rusthartslag',
}

function Regel({ regel }: { regel: RekeningRegel }) {
  const titel = TITELS[regel.id]
  return (
    <li style={{ display: 'grid', gap: 14, padding: '28px 0', borderTop: '1px solid var(--border)' }}>
      <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)' }}>
        {titel}
        <span style={{ color: regel.goed ? 'var(--brand)' : 'var(--text-2)' }}>· {regel.goed ? 'in de zone' : 'kost je iets'}</span>
      </p>
      <p style={{ margin: 0, fontSize: 16, color: 'var(--text-1)' }}>{regel.jij}</p>
      <div>
        <p style={{ margin: 0, fontSize: 'clamp(44px, 12vw, 64px)', lineHeight: 1, letterSpacing: '-0.03em', fontWeight: 600, color: regel.goed ? 'var(--brand)' : 'var(--text-1)' }}>
          {regel.getal}
        </p>
        <p style={{ margin: '8px 0 0', fontSize: 15, color: 'var(--text-2)', lineHeight: 1.45 }}>{regel.getalUitleg}</p>
      </div>
      <p style={{ margin: 0, fontSize: 14, color: 'var(--text-2)', lineHeight: 1.6 }}>{regel.onderzoek}</p>
      {regel.stap && (
        <p style={{ margin: 0, padding: '12px 14px', borderRadius: 12, fontSize: 15, fontWeight: 600, color: 'var(--brand)', background: 'var(--brand-soft)' }}>
          {regel.stap}
        </p>
      )}
      <ul aria-label="Bronnen" style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 4 }}>
        {regel.bronnen.map((b) => (
          <li key={b.url} style={{ fontSize: 12, lineHeight: 1.5 }}>
            <a href={b.url} target="_blank" rel="noopener noreferrer" className="mf-vandaag-link" style={{ color: 'var(--text-3)' }}>
              Bron: {b.titel}
            </a>
          </li>
        ))}
      </ul>
    </li>
  )
}

export function RekeningPaneel({ rekening }: { rekening: Rekening }) {
  return (
    <section aria-labelledby={KOP_ID} style={{ display: 'grid', gap: 8 }}>
      <h2 id={KOP_ID} style={{ margin: 0, fontSize: 'clamp(24px, 6vw, 30px)', lineHeight: 1.15, letterSpacing: '-0.02em', fontWeight: 600, color: 'var(--text-1)' }}>
        Wat je gewoontes je kosten
      </h2>
      <p style={{ margin: '0 0 8px', fontSize: 14, color: 'var(--text-3)', lineHeight: 1.5 }}>
        Jouw metingen naast groot onderzoek. Geen verzonnen persoonlijke voorspelling — wel de richting.
      </p>
      {rekening.soort === 'te_weinig_data' ? (
        <p style={{ margin: 0, padding: '16px 0', borderTop: '1px solid var(--border)', fontSize: 15, color: 'var(--text-2)', lineHeight: 1.5 }}>
          Na {rekening.nodig} dagen met slaap- of stappendata zie je hier wat je gewoontes je kosten. Koppel Health Connect op je Android-telefoon, dan gaat het vanzelf, of houd je slaap en stappen zelf bij.
        </p>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {rekening.regels.map((r) => <Regel key={r.id} regel={r} />)}
        </ul>
      )}
    </section>
  )
}
