'use client'

import { useMemo, useSyncExternalStore, type CSSProperties } from 'react'
import { Check, Printer, RotateCcw } from 'lucide-react'
import {
  bewaarVoortgang,
  checklistIn,
  leesVoortgang,
  totaleVoortgang,
  voortgangVan,
  wissel,
  type ChecklistGroep,
} from '@/lib/aiyourgym/overstapchecklist'
import { useTaal } from '@/lib/aiyourgym/taal/client'
import { CHECKLIST } from '@/lib/aiyourgym/taal/woorden/website/overstapchecklist'
import { ruweVoortgang, ruweVoortgangServer, schrijfVoortgang, volgVoortgang } from './opslag'

// De overstapchecklist om af te vinken. Zonder account of e-mailadres: de
// voortgang blijft in deze browser (opslag.ts). Printen geeft de hele lijst op
// papier, met de vinkjes die al staan.

interface GroepProps {
  groep: ChecklistGroep
  nr: number
  gedaan: ReadonlySet<string>
  onWissel: (id: string) => void
}

function Groep({ groep, nr, gedaan, onWissel }: GroepProps) {
  const t = CHECKLIST[useTaal()]
  const v = voortgangVan(gedaan, groep.punten)
  const af = v.klaar === v.totaal
  return (
    <section className="ayg-cl-groep" aria-labelledby={`cl-${groep.sleutel}`} data-af={af ? '' : undefined}>
      <header className="ayg-cl-groep-kop">
        <span className="ayg-cl-groep-nr" aria-hidden>
          {String(nr).padStart(2, '0')}
        </span>
        <div>
          <p className="ayg-cl-wanneer">{groep.wanneer}</p>
          <h2 className="ayg-h3" id={`cl-${groep.sleutel}`}>
            {groep.titel}
          </h2>
        </div>
        <span className="ayg-cl-groep-tel">
          {t.van(v.klaar, v.totaal)}
        </span>
      </header>
      <ul className="ayg-cl-punten">
        {groep.punten.map((p) => {
          const aan = gedaan.has(p.id)
          return (
            <li key={p.id}>
              <label className="ayg-cl-punt" data-aan={aan ? '' : undefined}>
                <input type="checkbox" checked={aan} onChange={() => onWissel(p.id)} aria-describedby={p.uitleg ? `cl-u-${p.id}` : undefined} />
                <span className="ayg-cl-vak" aria-hidden>
                  <Check size={15} strokeWidth={3} />
                </span>
                <span className="ayg-cl-tekst">
                  <span className="ayg-cl-zin">{p.tekst}</span>
                  {p.uitleg && (
                    <span className="ayg-cl-uitleg" id={`cl-u-${p.id}`}>
                      {p.uitleg}
                    </span>
                  )}
                </span>
              </label>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

export function Overstapchecklist() {
  const taal = useTaal()
  const t = CHECKLIST[taal]
  const groepen = checklistIn(taal)
  const ruw = useSyncExternalStore(volgVoortgang, ruweVoortgang, ruweVoortgangServer)
  const gedaan = useMemo(() => leesVoortgang(ruw), [ruw])
  const totaal = totaleVoortgang(gedaan)
  const balk = { '--cl-deel': totaal.totaal === 0 ? 0 : totaal.klaar / totaal.totaal } as CSSProperties

  const onWissel = (id: string) => schrijfVoortgang(bewaarVoortgang(wissel(gedaan, id)))
  const opnieuw = () => {
    if (window.confirm(t.opnieuwVraag)) schrijfVoortgang(null)
  }

  return (
    <div className="ayg-wrap ayg-cl">
      <aside className="ayg-cl-zij" aria-label={t.voortgang}>
        <div className="ayg-cl-stand">
          <p className="ayg-cl-stand-getal" aria-live="polite">
            <strong>{totaal.klaar}</strong>
            <span>{t.gedaan(totaal.totaal)}</span>
          </p>
          <div className="ayg-cl-balk" style={balk} role="progressbar" aria-valuemin={0} aria-valuemax={totaal.totaal} aria-valuenow={totaal.klaar} aria-label={t.afgevinkt}>
            <span />
          </div>
          <p className="ayg-klein">{t.browser}</p>
        </div>
        <div className="ayg-cl-acties">
          <button type="button" className="ayg-knop ayg-knop--rand ayg-knop--klein" onClick={() => window.print()}>
            <Printer size={16} aria-hidden /> {t.printen}
          </button>
          <button type="button" className="ayg-cl-wis" onClick={opnieuw} disabled={totaal.klaar === 0}>
            <RotateCcw size={15} aria-hidden /> {t.opnieuw}
          </button>
        </div>
      </aside>
      <div className="ayg-cl-groepen">
        {groepen.map((g, i) => (
          <Groep key={g.sleutel} groep={g} nr={i + 1} gedaan={gedaan} onWissel={onWissel} />
        ))}
      </div>
    </div>
  )
}
