'use client'

import { useId, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { Check, SlidersHorizontal, Sparkles } from 'lucide-react'
import { useStartGang, type StartGangProps } from './StartVoet'

// "We hebben dit alvast voor je klaargezet": bovenaan een stap staat wat er
// al klaar staat, met Klopt (door naar de volgende stap) of Aanpassen (de
// invoer klapt open, of je gaat naar de pagina waar het staat).

export interface KlaarRegel {
  titel: string
  tekst: string
}

interface KlaargezetProps {
  /** Waar het vandaan komt, bijvoorbeeld "Voor een boutique studio". */
  bron?: string | null
  regels: readonly KlaarRegel[]
  gang: StartGangProps
  /** Eerst opslaan voor je door gaat (bij een stap met invoer). */
  voorVerder?: () => Promise<boolean>
  /** De invoer die open klapt bij Aanpassen. */
  children?: ReactNode
  /** Of: Aanpassen gaat naar deze pagina. */
  aanpassenHref?: string
  /** Begint de invoer al open (bijvoorbeeld als er nog niets klaar staat)? */
  beginOpen?: boolean
}

export function Klaargezet({ bron, regels, gang, voorVerder, children, aanpassenHref, beginOpen = false }: KlaargezetProps) {
  const { bezig, fout, verder } = useStartGang(gang)
  const [open, setOpen] = useState(beginOpen)
  const invoer = useRef<HTMLDivElement>(null)
  const id = useId()

  /** Openklappen en meteen naar het eerste veld, zodat je met het toetsenbord direct verder kunt. */
  function wissel() {
    const wordtOpen = !open
    setOpen(wordtOpen)
    if (!wordtOpen) return
    requestAnimationFrame(() => {
      const eerste = invoer.current?.querySelector<HTMLElement>('input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled])')
      eerste?.focus()
    })
  }
  return (
    <div className="club-start-klaargezet-wrap">
      <section className="club-start-klaargezet" aria-labelledby={`${id}-kop`}>
        <div className="club-start-klaargezet-kop">
          <span className="club-start-klaargezet-icoon" aria-hidden>
            <Sparkles size={18} />
          </span>
          <div>
            <h2 id={`${id}-kop`}>We hebben dit alvast voor je klaargezet</h2>
            {bron && <p className="club-zacht">{bron}. Alles is later aan te passen.</p>}
          </div>
        </div>
        <dl className="club-start-klaargezet-lijst">
          {regels.map((r) => (
            <div key={r.titel}>
              <dt>{r.titel}</dt>
              <dd>{r.tekst}</dd>
            </div>
          ))}
        </dl>
        <div className="club-start-klaargezet-knoppen" aria-live="polite">
          <button type="button" className="club-knop club-knop--primair" disabled={bezig} onClick={() => void verder(voorVerder)}>
            <Check aria-hidden size={16} /> {bezig ? 'Even geduld...' : 'Klopt'}
          </button>
          {aanpassenHref ? (
            <Link href={aanpassenHref} className="club-knop">
              <SlidersHorizontal aria-hidden size={16} /> Aanpassen
            </Link>
          ) : (
            children && (
              <button type="button" className="club-knop" aria-expanded={open} aria-controls={`${id}-invoer`} onClick={wissel}>
                <SlidersHorizontal aria-hidden size={16} /> {open ? 'Inklappen' : 'Aanpassen'}
              </button>
            )
          )}
          {fout && <p className="club-fout" role="alert">{fout}</p>}
        </div>
      </section>
      {children && (
        <div ref={invoer} id={`${id}-invoer`} className="club-start-aanpassen" hidden={!open}>
          {children}
        </div>
      )}
    </div>
  )
}
