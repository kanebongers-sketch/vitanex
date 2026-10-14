import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import type { VandaagLead } from '@/lib/club/cijfers/haal-vandaag'
import { dagenTussen } from '@/lib/club/cijfers/tijd'
import { clubPad, type Vestiging } from '@/lib/club/kern/vestiging'

// Werklijst: leads die vandaag (of eerder) gebeld moesten worden. Een klik
// opent de lead in het zijpaneel van Leads.

const LEAD_STATUS: Record<string, string> = {
  nieuw: 'Nieuw',
  contact: 'In contact',
  proefles_geweest: 'Na proefles',
}

function wanneer(op: string | null, vandaag: string): string {
  if (!op) return 'Geen datum'
  const d = dagenTussen(op, vandaag)
  if (d <= 0) return 'Vandaag'
  return d === 1 ? 'Sinds gisteren' : `${d} dagen te laat`
}

interface Props {
  leads: VandaagLead[]
  totaal: number
  vandaag: string
  vestiging: Vestiging
}

export function LeadsOpvolgen({ leads, totaal, vandaag, vestiging }: Props) {
  return (
    <section className="club-kaart club-vandaag-kaart" aria-labelledby="vandaag-leads">
      <header className="club-sectiekop club-vandaag-sectiekop">
        <h2 id="vandaag-leads">Leads opvolgen</h2>
        <Link href={clubPad('/leads', vestiging)} className="club-vandaag-meer">
          {totaal > leads.length ? `Alle ${totaal}` : 'Naar leads'} <ArrowUpRight aria-hidden size={14} />
        </Link>
      </header>
      {leads.length === 0 ? (
        <p className="club-leeg">Niemand hoeft vandaag gebeld te worden.</p>
      ) : (
        <ul className="club-lijst club-vandaag-lijst">
          {leads.map((l) => {
            const laat = l.opvolgenOp !== null && l.opvolgenOp < vandaag
            return (
              <li key={l.id}>
                <Link href={clubPad('/leads', vestiging, { lead: l.id })} className="club-rij club-vandaag-rijlink">
                  <span className="club-rij-hoofd">
                    <span className="club-rij-titel">{l.naam}</span>
                    <span className="club-rij-sub">{[LEAD_STATUS[l.status] ?? l.status, l.interesse].filter(Boolean).join(' · ')}</span>
                  </span>
                  <span className={`club-chip ${laat ? 'club-chip--let-op' : 'club-chip--merk'}`}>{wanneer(l.opvolgenOp, vandaag)}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
