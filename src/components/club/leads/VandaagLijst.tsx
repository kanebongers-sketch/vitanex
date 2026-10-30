'use client'

import { Check } from 'lucide-react'
import { leadInitialen, type Lead } from '@/lib/club/leads/model'
import { toonDag, toonMoment, type VandaagItem, type VandaagReden } from '@/lib/club/leads/regels'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { ContactKnoppen } from './ContactKnoppen'
import { useTaal, useTekst } from '@/lib/aiyourgym/taal/client'
import { LEADS } from '@/lib/aiyourgym/taal/woorden/club/leads'

interface VandaagLijstProps {
  items: VandaagItem[]
  vandaag: string
  bezig: string | null
  onOpen: (id: string) => void
  onGedaan: (lead: Lead) => void
  onUitkomst: (lead: Lead, actie: 'geweest' | 'niet_gekomen') => void
  /** Rollen v2, alleen zien: geen knoppen die iets wijzigen (kanBewerken). */
  alleenLezen?: boolean
}

const REDEN_KLASSE: Record<VandaagReden, string> = {
  uitkomst: 'club-chip--let-op',
  proefles: 'club-chip--merk',
  te_laat: 'club-chip--let-op',
  opvolgen: 'club-chip--info',
}

function wanneer(item: VandaagItem, vandaag: string, taal: Taal): string {
  const { lead, reden } = item
  if ((reden === 'uitkomst' || reden === 'proefles') && lead.proeflesOp) return toonMoment(lead.proeflesOp, taal)
  return lead.opvolgenOp ? LEADS[taal].vandaag.opvolgen(toonDag(lead.opvolgenOp.slice(0, 10), vandaag, taal)) : ''
}

// De actie van vandaag, bovenaan: wie bel je, wie komt er proefsporten en van
// wie moet je nog invullen hoe de proefles ging. Een regel per persoon.
export function VandaagLijst({ items, vandaag, bezig, onOpen, onGedaan, onUitkomst, alleenLezen = false }: VandaagLijstProps) {
  const taal = useTaal()
  const t = useTekst(LEADS).vandaag
  return (
    <section className="club-leads-vandaag" aria-labelledby="leads-vandaag-kop">
      <div className="club-sectiekop">
        <h2 id="leads-vandaag-kop">{t.titel}</h2>
        <span>{items.length === 0 ? t.allesBij : t.acties(items.length)}</span>
      </div>
      {items.length === 0 ? (
        <p className="club-leeg">{t.leeg}</p>
      ) : (
        <ol className="club-lijst club-leads-actielijst">
          {items.map((item) => {
            const { lead, reden } = item
            const chip = { tekst: t.reden[reden], klasse: REDEN_KLASSE[reden] }
            const isBezig = bezig === lead.id
            return (
              <li key={lead.id} className="club-rij club-leads-actie" data-reden={reden}>
                <span className="club-avatar" aria-hidden>
                  {leadInitialen(lead.naam)}
                </span>
                <div className="club-rij-hoofd">
                  <button type="button" className="club-leads-naamknop club-rij-titel" onClick={() => onOpen(lead.id)}>
                    {lead.naam}
                  </button>
                  <span className="club-rij-sub">
                    {wanneer(item, vandaag, taal)}
                    {lead.interesse ? ` · ${lead.interesse}` : ''}
                  </span>
                </div>
                <span className={`club-chip ${chip.klasse}`}>{chip.tekst}</span>
                <div className="club-leads-rijacties">
                  {alleenLezen ? (
                    <ContactKnoppen naam={lead.naam} telefoon={lead.telefoon} email={lead.email} />
                  ) : reden === 'uitkomst' ? (
                    <>
                      <button type="button" className="club-knop club-knop--klein club-knop--primair" disabled={isBezig} onClick={() => onUitkomst(lead, 'geweest')}>
                        {t.geweest}
                      </button>
                      <button type="button" className="club-knop club-knop--klein" disabled={isBezig} onClick={() => onUitkomst(lead, 'niet_gekomen')}>
                        {t.nietGekomen}
                      </button>
                    </>
                  ) : (
                    <>
                      <ContactKnoppen naam={lead.naam} telefoon={lead.telefoon} email={lead.email} />
                      {reden !== 'proefles' && (
                        <button type="button" className="club-knop club-knop--klein" disabled={isBezig} onClick={() => onGedaan(lead)} aria-label={t.gedaanLabel(lead.naam)}>
                          <Check size={15} aria-hidden />
                          <span>{t.gedaan}</span>
                        </button>
                      )}
                    </>
                  )}
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}
