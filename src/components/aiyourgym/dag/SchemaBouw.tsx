'use client'

import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react'
import { Check, Send } from 'lucide-react'
import type { VoorbeeldOefening } from '@/components/aiyourgym/inhoud/voorbeeldschema'
import { Venster } from '@/components/aiyourgym/mockups/kaders'
import { OefNr } from '@/components/aiyourgym/mockups/OefNr'
import { SchemaToestel } from '@/components/aiyourgym/schemas/SchemaToestel'
import { VOORBEELD_INTAKE } from '@/components/aiyourgym/schemas/voorbeeld-intake'
import { scrollPositie, volgScroll } from '@/components/aiyourgym/site/scrollpositie'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { DAG_SCHEMA } from '@/lib/aiyourgym/taal/woorden/website/dag'
import { SCHEMA_SCHERMEN } from '@/lib/aiyourgym/taal/woorden/website/schemas'
import { eindStand, FASEN, pinVoortgang, standVan, zelfdeStand, type Aantallen, type Stand } from './schema-bouw'

// De piek van de voorpagina (en de opening van /trainingsschemas): een schema
// bouwt zich op terwijl je scrolt. Intake, voorstel, kernpunten, en dan landt het
// op de telefoon van het lid. Alleen eigen schermen met voorbeeldgegevens van
// Kernhal en de echte coaching uit de bibliotheek; geen oefenbeelden (die staan
// alleen achter het inloggen, besluit Kane 27-10-2026).
// Op de pc met beweging plakt het podium (CSS: .dag-schema-spoor) en loopt de
// stand mee met de scroll; elders, en bij minder beweging, staat de eindstand.
// React tekent alleen bij een echte wissel (een rij erbij, een andere fase); de
// telefoon schuift via de CSS-variabele --app.

const KERN = 3
const MET_PIN = '(min-width: 1024px) and (prefers-reduced-motion: no-preference)'

interface SchemaBouwProps {
  oefeningen: readonly VoorbeeldOefening[]
  /** Kloktijd en kop links op het podium. */
  kop: ReactNode
  /** De regel onder de fasen (link naar de pagina met details). */
  onder?: ReactNode
  id?: string
}

function kopHoogte(): number {
  const kop = document.querySelector('.ayg-kop')
  return kop instanceof HTMLElement ? kop.offsetHeight : 0
}

/** Volgt de scroll zolang het podium vastzit; anders blijft de eindstand staan. */
function useStand(spoor: RefObject<HTMLDivElement | null>, n: Aantallen): Stand {
  const [stand, setStand] = useState<Stand>(() => eindStand(n))
  const { intake, rijen, kern } = n
  useEffect(() => {
    const el = spoor.current
    if (!el) return
    const media = window.matchMedia(MET_PIN)
    const aantallen = { intake, rijen, kern }
    const meet = () => {
      if (!media.matches) {
        setStand((oud) => (zelfdeStand(oud, eindStand(aantallen)) ? oud : eindStand(aantallen)))
        el.style.setProperty('--app', '1')
        return
      }
      const r = el.getBoundingClientRect()
      const p = pinVoortgang(r.top, r.height, scrollPositie().scherm, kopHoogte())
      const nieuw = standVan(p, aantallen)
      el.style.setProperty('--app', String(nieuw.app))
      el.style.setProperty('--sp', p.toFixed(4))
      setStand((oud) => (zelfdeStand(oud, nieuw) ? oud : nieuw))
    }
    meet()
    const stop = volgScroll(meet)
    media.addEventListener('change', meet)
    return () => {
      stop()
      media.removeEventListener('change', meet)
    }
  }, [spoor, intake, rijen, kern])
  return stand
}

export function SchemaBouw({ oefeningen, kop, onder, id }: SchemaBouwProps) {
  const t = useTekst(DAG_SCHEMA)
  const s = useTekst(SCHEMA_SCHERMEN)
  const spoor = useRef<HTMLDivElement>(null)
  const intake = [s.doel.spiermassa, s.niveau[VOORBEELD_INTAKE.niveau], t.dagen(VOORBEELD_INTAKE.dagenPerWeek), t.minuten(VOORBEELD_INTAKE.minutenPerSessie)]
  const eerste = oefeningen[0]
  const kernpunten = eerste ? eerste.coaching.kernpunten.slice(0, KERN) : []
  const stand = useStand(spoor, { intake: intake.length, rijen: oefeningen.length, kern: kernpunten.length })
  const actief = FASEN.indexOf(stand.fase)

  return (
    <div ref={spoor} className="dag-schema-spoor" id={id}>
      <div className="dag-schema-podium">
        <div className="dag-schema-tekst">
          {kop}
          <ol className="dag-fasen" aria-label={t.fasenLabel}>
            {FASEN.map((f, i) => (
              <li key={f} data-actief={i === actief ? '' : undefined} data-voorbij={i < actief ? '' : undefined}>
                <span className="dag-fase-nr" aria-hidden>
                  {i + 1}
                </span>
                <span>
                  <b>{t.fasen[f].naam}</b>
                  <span>{t.fasen[f].zin}</span>
                </span>
              </li>
            ))}
          </ol>
          {onder && <div className="dag-schema-onder">{onder}</div>}
        </div>

        <div className="dag-schema-toneel aygm" role="img" aria-label={t.beeldLabel} data-fase={stand.fase}>
          <div className="dag-schema-editor">
            <Venster actief="Coaching">
              <div className="dag-ed">
                <div className="dag-ed-kop">
                  <b>{t.editor}</b>
                  <i>{s.app.naam}</i>
                </div>
                <p className="aygm-boven">{t.uitIntake}</p>
                <span className="dag-ed-intake">
                  {intake.map((x, i) => (
                    <i key={x} data-zicht={i < stand.intake ? '' : undefined}>
                      {x}
                    </i>
                  ))}
                </span>
                <p className="aygm-boven">{t.dagA}</p>
                <ol className="dag-ed-rijen">
                  {oefeningen.map((o, i) => (
                    <li key={o.naam} data-zicht={i < stand.rijen ? '' : undefined}>
                      <span className="dag-ed-rij">
                        <OefNr nr={i + 1} maat={26} />
                        <b>{o.naam}</b>
                        <span>{s.voorschrift(o.voorschrift)}</span>
                      </span>
                      {i === 0 && (
                        <span className="dag-ed-kern" data-open={stand.kern > 0 ? '' : undefined}>
                          <small>{t.kernpunten}</small>
                          {kernpunten.map((k, n) => (
                            <span key={k.punt} data-zicht={n < stand.kern ? '' : undefined}>
                              <em>{n + 1}</em>
                              <span>
                                <b>{k.punt}</b> {k.uitleg}
                              </span>
                            </span>
                          ))}
                        </span>
                      )}
                    </li>
                  ))}
                </ol>
              </div>
            </Venster>
          </div>
          <div className="dag-schema-telefoon">
            <SchemaToestel oefeningen={oefeningen} gekozen={0} uitleg={false} />
          </div>
          <span className="dag-schema-verstuurd" aria-hidden>
            <Send size={13} /> {t.verstuurd}
            <Check size={13} />
          </span>
        </div>
      </div>
    </div>
  )
}
