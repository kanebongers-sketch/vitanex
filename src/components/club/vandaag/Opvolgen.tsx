import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import type { VandaagLead } from '@/lib/club/cijfers/haal-vandaag'
import type { RisicoLid } from '@/lib/club/cijfers/vandaag'
import { RISICO_DAGEN } from '@/lib/club/cijfers/vandaag'
import { dagenTussen, dagKort } from '@/lib/club/cijfers/tijd'
import { clubPad, type Vestiging } from '@/lib/club/kern/vestiging'
import { initialen } from '@/lib/club/kern/lid'

// Twee werklijsten naast de tijdlijn: leads die vandaag (of eerder) gebeld
// moesten worden, en actieve leden die al drie weken niet zijn geweest.

const LEAD_STATUS: Record<string, string> = {
  nieuw: 'Nieuw',
  contact: 'In contact',
  proefles_geweest: 'Na proefles',
}

function wanneer(op: string | null, vandaag: string): string {
  if (!op) return 'Geen datum'
  const d = dagenTussen(op, vandaag)
  if (d <= 0) return 'Vandaag'
  return d === 1 ? 'Sinds gisteren' : `${d} dagen over tijd`
}

export function LeadsOpvolgen({ leads, totaal, vandaag, vestiging }: { leads: VandaagLead[]; totaal: number; vandaag: string; vestiging: Vestiging }) {
  return (
    <section className="club-kaart" aria-labelledby="vandaag-leads">
      <header className="club-sectiekop">
        <h2 id="vandaag-leads">Leads opvolgen</h2>
        <Link href={clubPad('/leads', vestiging)} className="club-vandaag-meer">
          {totaal > leads.length ? `Alle ${totaal}` : 'Naar leads'} <ArrowUpRight aria-hidden size={14} />
        </Link>
      </header>
      {leads.length === 0 ? (
        <p className="club-leeg">Niemand hoeft vandaag gebeld te worden.</p>
      ) : (
        <ul className="club-lijst">
          {leads.map((l) => {
            const laat = l.opvolgenOp !== null && l.opvolgenOp < vandaag
            return (
              <li key={l.id} className="club-rij">
                <div className="club-rij-hoofd">
                  <span className="club-rij-titel">{l.naam}</span>
                  <span className="club-rij-sub">{[LEAD_STATUS[l.status] ?? l.status, l.interesse].filter(Boolean).join(' · ')}</span>
                </div>
                <span className={`club-chip ${laat ? 'club-chip--let-op' : 'club-chip--merk'}`}>{wanneer(l.opvolgenOp, vandaag)}</span>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

const ZICHTBAAR = 7

export function RisicoLeden({ leden, vandaag, vestiging }: { leden: RisicoLid[]; vandaag: string; vestiging: Vestiging }) {
  return (
    <section className="club-kaart" aria-labelledby="vandaag-risico">
      <header className="club-sectiekop">
        <h2 id="vandaag-risico">Leden met risico</h2>
        <span className="club-getal">{leden.length}</span>
      </header>
      <p className="club-hint club-vandaag-uitleg">Actief, maar {RISICO_DAGEN} dagen of langer niet geweest. Langst weg bovenaan.</p>
      {leden.length === 0 ? (
        <p className="club-leeg">Iedereen is de laatste drie weken geweest.</p>
      ) : (
        <ul className="club-lijst">
          {leden.slice(0, ZICHTBAAR).map(({ lid, dagenWeg }) => (
            <li key={lid.id}>
              <Link href={clubPad(`/leden/${lid.id}`, vestiging)} className="club-rij club-vandaag-rijlink">
                <span className="club-avatar" aria-hidden>
                  {initialen(lid)}
                </span>
                <span className="club-rij-hoofd">
                  <span className="club-rij-titel">
                    {lid.voornaam} {lid.achternaam}
                  </span>
                  <span className="club-rij-sub">{lid.abonnement ?? 'Abonnement onbekend'}</span>
                </span>
                <span className="club-vandaag-weg">
                  {dagenWeg === null ? (
                    <span className="club-zacht">geen bezoek bekend</span>
                  ) : (
                    <>
                      <strong className="club-getal">{dagenWeg}</strong> dagen
                    </>
                  )}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {leden.length > ZICHTBAAR && (
        <p className="club-hint">
          En nog {leden.length - ZICHTBAAR} anderen. Stand van {dagKort(vandaag)}.
        </p>
      )}
    </section>
  )
}
