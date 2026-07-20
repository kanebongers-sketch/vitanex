'use client'

import { useRef, useState } from 'react'
import { CalendarPlus, Check, X } from 'lucide-react'
import { haalJson, leesNiets } from '@/lib/lifeos/api/http'
import { datumSleutel } from '@/lib/lifeos/datum/datum'
import {
  bouwAfspraak,
  bouwHerinnering,
  momentOverDagen,
  momentVanInvoer,
  type AgendaInvoer,
} from './afspraak'

// "Plan gesprek": zet met één flow een gesprek met deze persoon in je Google-
// agenda. Twee wegen — een snelle herinnering (vandaag / over 3 dagen / volgende
// week) of een afspraak met dag, tijd en duur. Schrijft naar het bestaande
// endpoint POST /api/lifeos/agenda/events (dat maakt een echt Google-event in je
// gekozen agenda). Is je agenda niet gekoppeld, dan zegt het endpoint dat (409)
// en tonen we die melding eerlijk in plaats van te doen alsof het lukte.

interface PlanGesprekProps {
  naam: string
  /** Compacte trigger (voor op een kaart) i.p.v. de volle knop (in de drawer). */
  compact?: boolean
}

type Staat =
  | { fase: 'dicht' }
  | { fase: 'open' }
  | { fase: 'bezig' }
  | { fase: 'ok' }
  | { fase: 'fout'; bericht: string }

const DUREN = [15, 30, 60] as const

export function PlanGesprek({ naam, compact = false }: PlanGesprekProps) {
  const [vandaag] = useState(() => new Date())
  const [staat, setStaat] = useState<Staat>({ fase: 'dicht' })
  const [dag, setDag] = useState(() => datumSleutel(momentOverDagen(vandaag, 1, 9)))
  const [tijd, setTijd] = useState('09:00')
  const [duur, setDuur] = useState<number>(30)
  const sluitTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  async function plaats(invoer: AgendaInvoer) {
    setStaat({ fase: 'bezig' })
    const uit = await haalJson('/api/lifeos/agenda/events', leesNiets, {
      method: 'POST',
      body: JSON.stringify(invoer),
    })
    if (!uit.ok) {
      setStaat({ fase: 'fout', bericht: uit.fout })
      return
    }
    setStaat({ fase: 'ok' })
    // Bevestiging even laten staan, dan sluiten.
    sluitTimer.current = setTimeout(() => setStaat({ fase: 'dicht' }), 2400)
  }

  function herinnering(dagen: number) {
    void plaats(bouwHerinnering(naam, momentOverDagen(vandaag, dagen, 9)))
  }

  function afspraak() {
    const moment = momentVanInvoer(dag, tijd)
    if (!moment) {
      setStaat({ fase: 'fout', bericht: 'Kies een geldige dag en tijd.' })
      return
    }
    void plaats(bouwAfspraak(naam, moment, duur))
  }

  const open = staat.fase !== 'dicht'

  return (
    <div className="crm-plan">
      <button
        type="button"
        className={compact ? 'crm-plan__trigger crm-plan__trigger--compact' : 'crm-plan__trigger'}
        aria-expanded={open}
        onClick={() => setStaat(open ? { fase: 'dicht' } : { fase: 'open' })}
      >
        <CalendarPlus size={compact ? 14 : 15} strokeWidth={2.2} aria-hidden="true" />
        Plan gesprek
      </button>

      {open ? (
        <div className="crm-plan__paneel" role="group" aria-label={`Gesprek met ${naam} plannen`}>
          <div className="crm-plan__kop">
            <span className="crm-plan__titel">Gesprek met {naam}</span>
            <button
              type="button"
              className="crm-plan__sluit"
              aria-label="Sluiten"
              onClick={() => setStaat({ fase: 'dicht' })}
            >
              <X size={14} strokeWidth={2.2} aria-hidden="true" />
            </button>
          </div>

          {staat.fase === 'ok' ? (
            <p className="crm-plan__ok" role="status">
              <Check size={15} strokeWidth={2.4} aria-hidden="true" /> In je agenda gezet.
            </p>
          ) : (
            <>
              <fieldset className="crm-plan__vak" disabled={staat.fase === 'bezig'}>
                <legend className="crm-plan__label">Herinnering</legend>
                <div className="crm-plan__snel">
                  <button type="button" className="crm-plan__chip" onClick={() => herinnering(0)}>
                    Vandaag
                  </button>
                  <button type="button" className="crm-plan__chip" onClick={() => herinnering(3)}>
                    Over 3 dagen
                  </button>
                  <button type="button" className="crm-plan__chip" onClick={() => herinnering(7)}>
                    Volgende week
                  </button>
                </div>
              </fieldset>

              <fieldset className="crm-plan__vak" disabled={staat.fase === 'bezig'}>
                <legend className="crm-plan__label">Afspraak</legend>
                <div className="crm-plan__rij">
                  <input
                    type="date"
                    className="crm-plan__invoer"
                    style={{ colorScheme: 'dark' }}
                    value={dag}
                    onChange={(e) => setDag(e.target.value)}
                    aria-label="Dag"
                  />
                  <input
                    type="time"
                    className="crm-plan__invoer"
                    style={{ colorScheme: 'dark' }}
                    value={tijd}
                    onChange={(e) => setTijd(e.target.value)}
                    aria-label="Tijd"
                  />
                  <select
                    className="crm-plan__invoer"
                    value={duur}
                    onChange={(e) => setDuur(Number(e.target.value))}
                    aria-label="Duur in minuten"
                  >
                    {DUREN.map((m) => (
                      <option key={m} value={m}>
                        {m} min
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="crm-plan__primair"
                    onClick={afspraak}
                    disabled={staat.fase === 'bezig'}
                  >
                    {staat.fase === 'bezig' ? 'Bezig…' : 'Plan'}
                  </button>
                </div>
              </fieldset>

              {staat.fase === 'fout' ? (
                <p className="crm-plan__fout" role="alert">
                  {staat.bericht}
                </p>
              ) : null}
            </>
          )}
        </div>
      ) : null}

      <style href="crm-plan" precedence="medium">{CSS}</style>
    </div>
  )
}

const CSS = `
.crm-plan { position: relative; }
.crm-plan__trigger {
  display: inline-flex; align-items: center; gap: 6px;
  height: 32px; padding: 0 12px;
  background: var(--brand-soft); color: var(--brand);
  border: 1px solid color-mix(in srgb, var(--brand) 34%, transparent);
  border-radius: var(--radius-btn);
  font-family: inherit; font-size: 12.5px; font-weight: 600; cursor: pointer;
  transition: background 160ms var(--ease), transform 160ms var(--ease);
}
.crm-plan__trigger--compact { height: 28px; padding: 0 10px; font-size: 12px; }
.crm-plan__trigger:hover { background: color-mix(in srgb, var(--brand) 22%, transparent); transform: translateY(-1px); }
.crm-plan__trigger:focus-visible { outline: 2px solid var(--brand); outline-offset: 2px; }
.crm-plan__paneel {
  position: absolute; z-index: 5; right: 0; margin-top: 8px; width: min(320px, 84vw);
  display: grid; gap: 12px; padding: 14px;
  background: var(--bg-card); border: 1px solid var(--line-strong);
  border-radius: var(--radius-md); box-shadow: var(--shadow-lg);
  animation: crm-plan-in 180ms var(--ease) both;
}
@keyframes crm-plan-in { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: none; } }
.crm-plan__kop { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.crm-plan__titel { font-size: 13px; font-weight: 700; color: var(--text-1); }
.crm-plan__sluit {
  display: inline-flex; width: 24px; height: 24px; align-items: center; justify-content: center;
  padding: 0; border: 0; border-radius: 6px; background: transparent; color: var(--text-3); cursor: pointer;
}
.crm-plan__sluit:hover { background: color-mix(in srgb, var(--text-1) 10%, transparent); color: var(--text-1); }
.crm-plan__sluit:focus-visible { outline: 2px solid var(--brand); outline-offset: 2px; }
.crm-plan__vak { display: grid; gap: 8px; margin: 0; padding: 0; border: 0; }
.crm-plan__vak[disabled] { opacity: 0.6; }
.crm-plan__label {
  padding: 0; font-size: 10px; font-weight: 700; letter-spacing: 0.08em;
  text-transform: uppercase; color: var(--text-4);
}
.crm-plan__snel { display: flex; flex-wrap: wrap; gap: 6px; }
.crm-plan__chip {
  padding: 6px 10px; background: var(--bg-raised); color: var(--text-2);
  border: 1px solid var(--line); border-radius: 999px;
  font-family: inherit; font-size: 12px; font-weight: 600; cursor: pointer;
  transition: border-color 160ms var(--ease), color 160ms var(--ease);
}
.crm-plan__chip:hover { border-color: color-mix(in srgb, var(--brand) 40%, var(--line)); color: var(--text-1); }
.crm-plan__chip:focus-visible { outline: 2px solid var(--brand); outline-offset: 2px; }
.crm-plan__rij { display: grid; grid-template-columns: 1fr 84px 84px auto; gap: 6px; align-items: center; }
.crm-plan__invoer {
  min-width: 0; padding: 7px 8px; background: var(--bg-raised); color: var(--text-1);
  border: 1px solid var(--line); border-radius: var(--radius-sm);
  font-family: inherit; font-size: 12.5px; color-scheme: dark;
}
.crm-plan__invoer:focus-visible { outline: 2px solid var(--brand); outline-offset: 1px; border-color: var(--brand); }
.crm-plan__primair {
  height: 34px; padding: 0 14px; background: var(--brand); color: var(--bg-app);
  border: 0; border-radius: var(--radius-btn);
  font-family: inherit; font-size: 12.5px; font-weight: 700; cursor: pointer;
  transition: transform 160ms var(--ease), box-shadow 160ms var(--ease);
}
.crm-plan__primair:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 14px var(--brand-glow); }
.crm-plan__primair:disabled { opacity: 0.6; cursor: default; }
.crm-plan__primair:focus-visible { outline: 2px solid var(--brand); outline-offset: 2px; }
.crm-plan__ok {
  display: flex; align-items: center; gap: 6px; margin: 0;
  font-size: 13px; font-weight: 600; color: var(--status-success);
}
.crm-plan__fout { margin: 0; font-size: 12.5px; line-height: 1.45; color: var(--status-danger); }
@media (prefers-reduced-motion: reduce) {
  .crm-plan__paneel { animation: none; }
  .crm-plan__trigger, .crm-plan__primair, .crm-plan__chip { transition: none; }
  .crm-plan__trigger:hover, .crm-plan__primair:hover:not(:disabled) { transform: none; }
}
`
