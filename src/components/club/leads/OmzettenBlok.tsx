'use client'

import { useEffect, useState } from 'react'
import { TriangleAlert } from 'lucide-react'
import type { Lead } from '@/lib/club/leads/model'
import { splitsNaam } from '@/lib/club/leads/naam'
import { treffersUitJson, type DubbelTreffer } from '@/lib/club/leads/dubbel'
import { LID_STATUSSEN, lidStatusLabel } from '@/lib/club/kern/lid'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { useTaal, useTekst } from '@/lib/aiyourgym/taal/client'
import { LEADS } from '@/lib/aiyourgym/taal/woorden/club/leads'
import { stuur } from './stuur'
import type { Doe } from './usePaneel'

interface OmzettenBlokProps {
  lead: Lead
  bezig: boolean
  doe: Doe
  onGelukt: (melding: string) => void
}

function statusLabel(status: string, taal: Taal): string {
  const s = LID_STATUSSEN.find((x) => x === status)
  return s ? lidStatusLabel(s, taal) : status
}

function opTekst(op: DubbelTreffer['op'], taal: Taal): string {
  const t = LEADS[taal].omzetten
  return op.map((o) => (o === 'email' ? t.zelfdeEmail : t.zelfdeTelefoon)).join(t.en)
}

// Lid maken: eerst kijken of deze persoon al lid is in deze vestiging (zelfde
// e-mail of telefoon). Zo ja: koppelen aan dat lid, of bewust toch een nieuw lid.
export function OmzettenBlok({ lead, bezig, doe, onGelukt }: OmzettenBlokProps) {
  const [dubbelen, setDubbelen] = useState<DubbelTreffer[] | null>(null)
  const [controleFout, setControleFout] = useState<string | null>(null)
  const { voornaam, achternaam } = splitsNaam(lead.naam)
  const url = `/api/club/leads/${lead.id}/omzetten`
  const taal = useTaal()
  const t = useTekst(LEADS).omzetten

  useEffect(() => {
    let actief = true
    void stuur(url, 'GET').then((uit) => {
      if (!actief) return
      if (uit.ok) setDubbelen(treffersUitJson(uit.data.dubbelen))
      else setControleFout(uit.fout)
    })
    return () => {
      actief = false
    }
  }, [url])

  async function zetOm(body: unknown) {
    const uit = await doe(url, 'POST', body)
    if (uit.ok && typeof uit.data.melding === 'string') onGelukt(uit.data.melding)
    else if (!uit.ok) setDubbelen(treffersUitJson(uit.data.dubbelen))
  }

  if (controleFout) return <p className="club-melding club-melding--fout">{controleFout}</p>
  if (dubbelen === null) return <div className="club-skelet" aria-label={t.controleren} />

  return (
    <div className="club-leads-stapblok">
      {dubbelen.length > 0 && (
        <div className="club-melding club-melding--fout club-leads-dubbel" role="alert">
          <p>
            <TriangleAlert size={16} aria-hidden /> {t.dubbel}
          </p>
          <ul className="club-lijst">
            {dubbelen.map(({ lid, op }) => (
              <li key={lid.id} className="club-rij">
                <div className="club-rij-hoofd">
                  <span className="club-rij-titel">
                    {lid.voornaam} {lid.achternaam}
                  </span>
                  <span className="club-rij-sub">
                    {statusLabel(lid.status, taal)} · {opTekst(op, taal)}
                  </span>
                </div>
                <button type="button" className="club-knop club-knop--klein club-knop--primair" disabled={bezig} onClick={() => zetOm({ bestaandLidId: lid.id })}>
                  {t.koppel}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      <dl className="club-leads-voorbeeld">
        <div>
          <dt>{t.voornaam}</dt>
          <dd>{voornaam || t.ontbreekt}</dd>
        </div>
        <div>
          <dt>{t.achternaam}</dt>
          <dd className={achternaam ? undefined : 'club-leads-telaat'}>{achternaam || t.achternaamOntbreekt}</dd>
        </div>
        <div>
          <dt>{t.status}</dt>
          <dd>{t.proeflid}</dd>
        </div>
      </dl>
      <p className="club-hint">{t.hint}</p>
      <button
        type="button"
        className={`club-knop ${dubbelen.length > 0 ? '' : 'club-knop--primair'}`}
        disabled={bezig || !achternaam}
        onClick={() => zetOm({ negeerDubbel: dubbelen.length > 0 })}
      >
        {dubbelen.length > 0 ? t.toch : t.maak}
      </button>
    </div>
  )
}
