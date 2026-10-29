import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import type { VandaagLead } from '@/lib/club/cijfers/haal-vandaag'
import { dagenTussen } from '@/lib/club/cijfers/tijd'
import { clubPad, type Vestiging } from '@/lib/club/kern/vestiging'
import { clubTekst } from '@/lib/aiyourgym/taal/server'
import { VANDAAG } from '@/lib/aiyourgym/taal/woorden/club/vandaag-scherm'

type LeadTekst = (typeof VANDAAG)['nl']['leads']

// Werklijst: leads die vandaag (of eerder) gebeld moesten worden. Een klik
// opent de lead in het zijpaneel van Leads.

function statusTekst(status: string, t: LeadTekst): string {
  return status in t.status ? t.status[status as keyof LeadTekst['status']] : status
}

function wanneer(op: string | null, vandaag: string, t: LeadTekst): string {
  if (!op) return t.geenDatum
  const d = dagenTussen(op, vandaag)
  if (d <= 0) return t.vandaag
  return d === 1 ? t.sindsGisteren : t.teLaat(d)
}

interface Props {
  leads: VandaagLead[]
  totaal: number
  vandaag: string
  vestiging: Vestiging
}

export async function LeadsOpvolgen({ leads, totaal, vandaag, vestiging }: Props) {
  const t = (await clubTekst(VANDAAG)).leads
  return (
    <section className="club-kaart club-vandaag-kaart" aria-labelledby="vandaag-leads">
      <header className="club-sectiekop club-vandaag-sectiekop">
        <h2 id="vandaag-leads">{t.titel}</h2>
        <Link href={clubPad('/leads', vestiging)} className="club-vandaag-meer">
          {totaal > leads.length ? t.alle(totaal) : t.naarLeads} <ArrowUpRight aria-hidden size={14} />
        </Link>
      </header>
      {leads.length === 0 ? (
        <p className="club-leeg">{t.leeg}</p>
      ) : (
        <ul className="club-lijst club-vandaag-lijst">
          {leads.map((l) => {
            const laat = l.opvolgenOp !== null && l.opvolgenOp < vandaag
            return (
              <li key={l.id}>
                <Link href={clubPad('/leads', vestiging, { lead: l.id })} className="club-rij club-vandaag-rijlink">
                  <span className="club-rij-hoofd">
                    <span className="club-rij-titel">{l.naam}</span>
                    <span className="club-rij-sub">{[statusTekst(l.status, t), l.interesse].filter(Boolean).join(' · ')}</span>
                  </span>
                  <span className={`club-chip ${laat ? 'club-chip--let-op' : 'club-chip--merk'}`}>{wanneer(l.opvolgenOp, vandaag, t)}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
