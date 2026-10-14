'use client'

import { useMemo, useState } from 'react'
import type { Lead } from '@/lib/club/leads/model'
import type { ProeflesLes } from '@/lib/club/leads/lessen'
import { dagVan, toonDag } from '@/lib/club/leads/regels'
import type { Doe } from './usePaneel'

interface ProeflesKiezerProps {
  lead: Lead
  lessen: ProeflesLes[]
  vandaag: string
  bezig: boolean
  doe: Doe
  onKlaar: () => void
}

const TIJD = new Intl.DateTimeFormat('nl-NL', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Amsterdam' })

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
  const [soort, setSoort] = useState<'les' | 'tijdstip'>(lessen.length > 0 ? 'les' : 'tijdstip')
  const [tijdstip, setTijdstip] = useState('')
  const [omschrijving, setOmschrijving] = useState('Rondleiding')
  const groepen = useMemo(() => perDag(lessen), [lessen])
  const url = `/api/club/leads/${lead.id}/proefles`

  async function plan(body: unknown) {
    const uit = await doe(url, 'POST', body)
    if (uit.ok) onKlaar()
  }

  return (
    <div className="club-leads-stapblok">
      <div className="club-segment" role="group" aria-label="Soort proefles">
        <button type="button" aria-pressed={soort === 'les'} onClick={() => setSoort('les')}>
          Groepsles
        </button>
        <button type="button" aria-pressed={soort === 'tijdstip'} onClick={() => setSoort('tijdstip')}>
          Vrij tijdstip
        </button>
      </div>
      {soort === 'les' ? (
        groepen.length === 0 ? (
          <p className="club-leeg">Geen lessen met plek in de komende 7 dagen. Kies een vrij tijdstip.</p>
        ) : (
          <div className="club-leads-lesdagen">
            {groepen.map(([dag, lijst]) => (
              <section key={dag} aria-label={toonDag(dag, vandaag)}>
                <h4 className="club-leads-lesdag">{toonDag(dag, vandaag)}</h4>
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
                        <span className="club-leads-lestijd">{TIJD.format(new Date(les.startOp))}</span>
                        <span className="club-leads-lesnaam">{les.naam}</span>
                        <span className={`club-chip ${les.vrij <= 2 ? 'club-chip--let-op' : 'club-chip--ok'}`}>
                          {les.vrij} {les.vrij === 1 ? 'plek' : 'plekken'}
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
              <span>Datum en tijd</span>
              <input type="datetime-local" className="club-invoer" required min={`${vandaag}T00:00`} value={tijdstip} onChange={(e) => setTijdstip(e.target.value)} />
            </label>
            <label className="club-veld">
              <span>Wat</span>
              <input className="club-invoer" maxLength={200} value={omschrijving} onChange={(e) => setOmschrijving(e.target.value)} />
            </label>
          </div>
          <button type="submit" className="club-knop club-knop--primair" disabled={bezig || tijdstip === ''}>
            Proefles inplannen
          </button>
        </form>
      )}
    </div>
  )
}
