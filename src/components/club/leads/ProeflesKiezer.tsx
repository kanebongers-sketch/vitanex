'use client'

import { useMemo, useState } from 'react'
import type { Lead } from '@/lib/club/leads/model'
import type { ProeflesLes } from '@/lib/club/leads/lessen'
import { dagVan, toonDag } from '@/lib/club/leads/regels'
import type { Doe } from './usePaneel'
import { formatTijd } from '@/lib/aiyourgym/taal/formaat'
import { useTaal, useTekst } from '@/lib/aiyourgym/taal/client'
import { LEADS } from '@/lib/aiyourgym/taal/woorden/club/leads'

interface ProeflesKiezerProps {
  lead: Lead
  lessen: ProeflesLes[]
  vandaag: string
  bezig: boolean
  doe: Doe
  onKlaar: () => void
}

/** De lessen gegroepeerd per dag, in volgorde. */
function perDag(lessen: ProeflesLes[]): [string, ProeflesLes[]][] {
  const groepen = new Map<string, ProeflesLes[]>()
  for (const les of lessen) {
    const dag = dagVan(new Date(les.startOp))
    groepen.set(dag, [...(groepen.get(dag) ?? []), les])
  }
  return [...groepen.entries()]
}

// Proefles inplannen: een plek in een groepsles van de komende 7 dagen (alleen
// lessen met plek), of een vrij tijdstip voor een rondleiding of losse proeftraining.
export function ProeflesKiezer({ lead, lessen, vandaag, bezig, doe, onKlaar }: ProeflesKiezerProps) {
  const taal = useTaal()
  const t = useTekst(LEADS).proefles
  const [soort, setSoort] = useState<'les' | 'tijdstip'>(lessen.length > 0 ? 'les' : 'tijdstip')
  const [tijdstip, setTijdstip] = useState('')
  const [omschrijving, setOmschrijving] = useState(t.standaardWat)
  const groepen = useMemo(() => perDag(lessen), [lessen])
  const url = `/api/club/leads/${lead.id}/proefles`

  async function plan(body: unknown) {
    const uit = await doe(url, 'POST', body)
    if (uit.ok) onKlaar()
  }

  return (
    <div className="club-leads-stapblok">
      <div className="club-segment" role="group" aria-label={t.soort}>
        <button type="button" aria-pressed={soort === 'les'} onClick={() => setSoort('les')}>
          {t.groepsles}
        </button>
        <button type="button" aria-pressed={soort === 'tijdstip'} onClick={() => setSoort('tijdstip')}>
          {t.vrijTijdstip}
        </button>
      </div>
      {soort === 'les' ? (
        groepen.length === 0 ? (
          <p className="club-leeg">{t.geenLessen}</p>
        ) : (
          <div className="club-leads-lesdagen">
            {groepen.map(([dag, lijst]) => (
              <section key={dag} aria-label={toonDag(dag, vandaag, taal)}>
                <h4 className="club-leads-lesdag">{toonDag(dag, vandaag, taal)}</h4>
                <ul className="club-leads-lessen">
                  {lijst.map((les) => (
                    <li key={les.id}>
                      <button
                        type="button"
                        className="club-leads-les"
                        aria-pressed={lead.proeflesLesId === les.id}
                        disabled={bezig}
                        onClick={() => plan({ actie: 'les', lesId: les.id })}
                      >
                        <span className="club-leads-lestijd">{formatTijd(les.startOp, taal)}</span>
                        <span className="club-leads-lesnaam">{les.naam}</span>
                        <span className={`club-chip ${les.vrij <= 2 ? 'club-chip--let-op' : 'club-chip--ok'}`}>
                          {t.plekken(les.vrij)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )
      ) : (
        <form
          className="club-leads-formulier"
          onSubmit={(e) => {
            e.preventDefault()
            const moment = new Date(tijdstip)
            if (!Number.isNaN(moment.getTime())) void plan({ actie: 'tijdstip', tijdstip: moment.toISOString(), omschrijving })
          }}
        >
          <div className="club-formrij">
            <label className="club-veld">
              <span>{t.datumTijd}</span>
              <input type="datetime-local" className="club-invoer" required min={`${vandaag}T00:00`} value={tijdstip} onChange={(e) => setTijdstip(e.target.value)} />
            </label>
            <label className="club-veld">
              <span>{t.wat}</span>
              <input className="club-invoer" maxLength={200} value={omschrijving} onChange={(e) => setOmschrijving(e.target.value)} />
            </label>
          </div>
          <button type="submit" className="club-knop club-knop--primair" disabled={bezig || tijdstip === ''}>
            {t.inplannen}
          </button>
        </form>
      )}
    </div>
  )
}
