import { UserX } from 'lucide-react'
import type { Afhaak } from '@/lib/lifeos/pt-klant/afhaak'

// Presentational: de PT-klanten die afhaken — lopend abonnement, maar al weken
// niet op PT (zie `pt-klant/afhaak`). Staat onder de weekstatus op de PT-kaart,
// zodat "wie moet ik deze week inplannen" en "wie glipt er weg" samen in beeld zijn.
// Niemand → niets: een lege "0 afhakers"-regel voegt alleen ruis toe.

const LIMIET = 5

export function AfhaakLijst({ afhaak }: { afhaak: readonly Afhaak[] }) {
  if (afhaak.length === 0) return null
  const zichtbaar = afhaak.slice(0, LIMIET)
  const rest = afhaak.length - zichtbaar.length

  return (
    <section
      aria-labelledby="pt-afhaak-kop"
      style={{ display: 'grid', gap: 8, paddingTop: 14, borderTop: '1px solid var(--line)' }}
    >
      <h3
        id="pt-afhaak-kop"
        style={{
          display: 'flex', alignItems: 'center', gap: 7, margin: 0,
          fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
          color: 'var(--text-3)',
        }}
      >
        <UserX size={14} strokeWidth={2.2} aria-hidden style={{ color: 'var(--brand)' }} />
        Lang niet gezien
      </h3>
      <ul style={{ display: 'grid', gap: 4, listStyle: 'none', padding: 0, margin: 0 }}>
        {zichtbaar.map((a) => (
          <li
            key={a.id}
            style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 13.5, padding: '4px 0' }}
          >
            <span style={{ color: 'var(--text-1)' }}>{a.naam}</span>
            <span className="os-cijfer" style={{ color: 'var(--text-3)', whiteSpace: 'nowrap' }}>
              {a.wekenGeleden} {a.wekenGeleden === 1 ? 'week' : 'weken'}
            </span>
          </li>
        ))}
      </ul>
      {rest > 0 ? (
        <p style={{ margin: 0, fontSize: 12, color: 'var(--text-3)' }}>
          en nog {rest} {rest === 1 ? 'klant' : 'klanten'}
        </p>
      ) : null}
    </section>
  )
}
