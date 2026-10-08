import { BRON_LABEL, STATUS_LABEL, leadRegel, type LeadSamenvatting } from '@/lib/lifeos/leads/leads'

// Het kopje "Lead tracker" in het coachgesprek: wat de PT'er sinds het vorige
// gesprek op de eigen lead-pagina invulde. Puur weergave.

const DAG = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short' })

export function LeadOverzicht({ leads, pinActief }: { leads: LeadSamenvatting; pinActief: boolean }) {
  return (
    <section aria-label="Lead tracker" style={{ display: 'grid', gap: 6, padding: '10px 12px', borderRadius: 10, border: '1px solid var(--line)', background: 'var(--bg-raised)' }}>
      <p style={{ margin: 0, fontSize: 11.5, fontWeight: 600, color: 'var(--text-4)' }}>
        Lead tracker · sinds {DAG.format(new Date(leads.sinds))}
      </p>
      <p style={{ margin: 0, fontSize: 13, color: 'var(--text-1)', lineHeight: 1.5 }}>
        {pinActief || leads.nieuw > 0 ? leadRegel(leads) : 'Lead-pagina nog niet in gebruik: de pincode is nog niet goedgekeurd.'}
        {leads.klantenTotaal > 0 ? <span style={{ color: 'var(--text-3)' }}> · {leads.klantenTotaal} klant{leads.klantenTotaal === 1 ? '' : 'en'} ooit via leads</span> : null}
      </p>
      {leads.lijst.length > 0 ? (
        <ul style={{ display: 'grid', gap: 3, listStyle: 'none', padding: 0, margin: 0 }}>
          {leads.lijst.map((l) => (
            <li key={l.id} style={{ fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.45 }}>
              <strong style={{ fontWeight: 600, color: 'var(--text-1)' }}>{l.naam}</strong>
              {' · '}
              <span style={{ color: l.status === 'klant' ? 'var(--brand)' : 'var(--text-2)' }}>{STATUS_LABEL[l.status]}</span>
              <span style={{ color: 'var(--text-3)' }}> · {BRON_LABEL[l.bron]}</span>
              {l.notitie ? <span style={{ color: 'var(--text-3)' }}> · {l.notitie}</span> : null}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}
