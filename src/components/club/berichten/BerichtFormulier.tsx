'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import { X } from 'lucide-react'
import type { VestigingInfo } from '@/lib/club/kern/vestigingen'
import { SOORTEN, SOORT_CHIP, SOORT_LABEL, TEKST_MAX, TITEL_MAX, leesBerichtAntwoord, type Bericht } from '@/lib/club/berichten/model'
import { stuur } from '@/components/club/leden/stuur'
import { BerichtVoorbeeld } from './BerichtVoorbeeld'
import { DoelgroepVelden } from './DoelgroepVelden'
import { conceptVan, nieuwConcept, type Concept } from './concept'

// Nieuw bericht of bewerken, in een paneel: links de velden, rechts het live
// voorbeeld zoals het in de app staat. Escape of het kruisje sluit.

interface Props {
  bericht: Bericht | null
  vestigingen: readonly VestigingInfo[]
  tags: readonly string[]
  onOpgeslagen: (b: Bericht, nieuw: boolean) => void
  onSluit: () => void
}

export function BerichtFormulier({ bericht, vestigingen, tags, onOpgeslagen, onSluit }: Props) {
  const [nu] = useState(() => new Date())
  const [concept, setConcept] = useState<Concept>(() => (bericht ? conceptVan(bericht) : nieuwConcept(nu)))
  const [fout, setFout] = useState<string | null>(null)
  const [bezig, setBezig] = useState(false)
  const titelRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    titelRef.current?.focus()
    const opEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onSluit()
    }
    window.addEventListener('keydown', opEsc)
    return () => window.removeEventListener('keydown', opEsc)
  }, [onSluit])

  const zet = (patch: Partial<Concept>) => setConcept((c) => ({ ...c, ...patch }))

  async function bewaar(e: FormEvent) {
    e.preventDefault()
    if (bezig) return
    setBezig(true)
    setFout(null)
    const body = { ...concept, tag: concept.tag.trim() }
    const uit = bericht ? await stuur(`/api/club/berichten/${bericht.id}`, 'PATCH', { actie: 'bewerken', ...body }) : await stuur('/api/club/berichten', 'POST', body)
    setBezig(false)
    const opgeslagen = uit.ok ? leesBerichtAntwoord(uit.data) : null
    if (!opgeslagen) return setFout(uit.ok ? 'Onverwacht antwoord van de server.' : uit.fout)
    onOpgeslagen(opgeslagen, bericht === null)
  }

  return (
    <div className="club-paneel-scherm" onClick={(e) => e.target === e.currentTarget && onSluit()}>
      <div className="club-paneel club-bericht-paneel" role="dialog" aria-modal="true" aria-labelledby="bericht-paneel-titel">
        <header className="club-bericht-paneelkop">
          <div>
            <p className="club-boventitel">Ledenapp · Home</p>
            <h2 id="bericht-paneel-titel">{bericht ? 'Bericht bewerken' : 'Nieuw bericht'}</h2>
          </div>
          <button type="button" className="club-knop club-knop--stil club-knop--klein" onClick={onSluit} aria-label="Sluiten">
            <X size={18} aria-hidden />
          </button>
        </header>

        <div className="club-bericht-paneelvlak">
          <form className="club-bericht-form" onSubmit={bewaar} noValidate>
            <label className="club-veld">
              <span>Titel</span>
              <input ref={titelRef} className="club-invoer" required maxLength={TITEL_MAX} value={concept.titel} onChange={(e) => zet({ titel: e.target.value })} />
              <small className="club-bericht-teller">{concept.titel.length} / {TITEL_MAX}</small>
            </label>

            <fieldset className="club-bericht-groep">
              <legend className="club-label">Soort</legend>
              <div className="club-bericht-soorten">
                {SOORTEN.map((s) => (
                  <label key={s} className={`club-bericht-soort club-bericht-soort--${SOORT_CHIP[s]}`}>
                    <input type="radio" name="bericht-soort" className="club-sr" checked={concept.soort === s} onChange={() => zet({ soort: s })} />
                    {SOORT_LABEL[s]}
                  </label>
                ))}
              </div>
            </fieldset>

            <label className="club-veld">
              <span>Tekst</span>
              <textarea className="club-invoer club-bericht-tekstvak" maxLength={TEKST_MAX} rows={7} value={concept.tekst} onChange={(e) => zet({ tekst: e.target.value })} aria-describedby="bericht-tekst-hint" />
              <small id="bericht-tekst-hint" className="club-bericht-teller">
                Lege regel = nieuwe alinea. Begin met &quot;- &quot; voor een opsomming. {concept.tekst.length} / {TEKST_MAX}
              </small>
            </label>

            <DoelgroepVelden concept={concept} vestigingen={vestigingen} tags={tags} zet={zet} />

            <div className="club-formrij">
              <label className="club-veld">
                <span>Zichtbaar vanaf</span>
                <input type="datetime-local" className="club-invoer" value={concept.van} onChange={(e) => zet({ van: e.target.value })} />
              </label>
              <label className="club-veld">
                <span>Zichtbaar tot</span>
                <input type="datetime-local" className="club-invoer" value={concept.tot} min={concept.van || undefined} onChange={(e) => zet({ tot: e.target.value })} />
              </label>
            </div>
            <p className="club-hint">Nederlandse tijd. Laat &quot;tot&quot; leeg voor geen einde.</p>

            <label className="club-bericht-vink club-bericht-vink--groot">
              <input type="checkbox" checked={concept.vastgepind} onChange={(e) => zet({ vastgepind: e.target.checked })} />
              Vastpinnen bovenaan Home
            </label>

            <div aria-live="polite">{fout && <p className="club-melding club-melding--fout">{fout}</p>}</div>

            <div className="club-acties">
              <button type="submit" className="club-knop club-knop--primair" disabled={bezig}>
                {bezig ? 'Bezig met opslaan' : bericht ? 'Wijzigingen opslaan' : 'Bericht plaatsen'}
              </button>
              <button type="button" className="club-knop" onClick={onSluit}>
                Annuleren
              </button>
            </div>
          </form>

          <BerichtVoorbeeld concept={concept} vestigingen={vestigingen} nu={nu} />
        </div>
      </div>
    </div>
  )
}
