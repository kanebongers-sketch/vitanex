'use client'

import { useRef, useState, type FormEvent } from 'react'
import { ArrowLeft, ArrowRight, Check, LoaderCircle } from 'lucide-react'
import { PRIJS_STAPPEN, eersteStapMetPrijsFout, leesPrijsAanvraag, prijsFoutenVanStap, type PrijsFouten, type PrijsVeld } from '@/lib/aiyourgym/prijs-aanvraag'
import { PrijsBedankt } from './PrijsBedankt'
import { PrijsStap, type PrijsInvoer, type WijzigPrijs } from './PrijsStap'

// Een prijs op maat in drie korte stappen: sportschool, omvang, contact. Dezelfde
// controle als de server (leesPrijsAanvraag) per stap. Het verzoek gaat naar de
// bestaande demo-aanvraag met doel 'prijs'; er gaat niets automatisch naar buiten.

interface PrijsFormulierProps {
  startPakket: string | null
}

type Verzenden = { staat: 'rust' } | { staat: 'bezig' } | { staat: 'fout'; melding: string } | { staat: 'klaar' }

const LEEG: PrijsInvoer = { soort: '', pakket: '', vestigingen: '1', leden: '', naam: '', sportschool: '', email: '', telefoon: '', akkoord: false, website: '' }

function body(invoer: PrijsInvoer) {
  return { ...invoer, doel: 'prijs', vestigingen: invoer.vestigingen.trim() }
}

async function verstuur(invoer: PrijsInvoer): Promise<{ ok: true } | { ok: false; melding: string; fouten?: PrijsFouten }> {
  try {
    const res = await fetch('/api/aiyourgym/demo-aanvraag', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body(invoer)) })
    if (res.ok) return { ok: true }
    const data: unknown = await res.json().catch(() => null)
    const d = typeof data === 'object' && data !== null ? (data as { fout?: unknown; fouten?: unknown }) : {}
    const fouten = typeof d.fouten === 'object' && d.fouten !== null ? (d.fouten as PrijsFouten) : undefined
    return { ok: false, melding: typeof d.fout === 'string' ? d.fout : 'Versturen lukte niet. Probeer het later opnieuw.', fouten }
  } catch {
    return { ok: false, melding: 'Geen verbinding. Controleer het internet en probeer het opnieuw.' }
  }
}

function Voortgang({ huidig, verste, onKies }: { huidig: number; verste: number; onKies: (stap: number) => void }) {
  return (
    <nav aria-label="Stappen van de prijsaanvraag">
      <ol className="aan-voortgang prijs-voortgang">
        {PRIJS_STAPPEN.map((s, i) => {
          const staat = i === huidig ? 'nu' : i <= verste ? 'klaar' : 'later'
          return (
            <li key={s.sleutel} data-staat={staat}>
              <button type="button" onClick={() => onKies(i)} disabled={i > verste} aria-current={i === huidig ? 'step' : undefined}>
                <span className="aan-voortgang-nr" aria-hidden="true">
                  {staat === 'klaar' ? <Check size={14} strokeWidth={3} /> : i + 1}
                </span>
                <span className="aan-voortgang-titel">
                  <span className="ayg-sr">Stap {i + 1}: </span>
                  {s.titel}
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

export function PrijsFormulier({ startPakket }: PrijsFormulierProps) {
  const [invoer, setInvoer] = useState<PrijsInvoer>({ ...LEEG, pakket: startPakket ?? '' })
  const [stap, setStap] = useState(0)
  const [verste, setVerste] = useState(0)
  const [fouten, setFouten] = useState<PrijsFouten>({})
  const [verzenden, setVerzenden] = useState<Verzenden>({ staat: 'rust' })
  const kopRef = useRef<HTMLHeadingElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const wijzig: WijzigPrijs = (veld, waarde) => {
    setInvoer((oud) => ({ ...oud, [veld]: waarde }))
    setFouten((oud) => (oud[veld as PrijsVeld] ? { ...oud, [veld]: undefined } : oud))
  }

  function naarStap(nieuw: number) {
    setStap(nieuw)
    setVerste((v) => Math.max(v, nieuw))
    requestAnimationFrame(() => kopRef.current?.focus())
  }

  function toonFouten(nieuw: PrijsFouten) {
    setFouten(nieuw)
    const veld = PRIJS_STAPPEN.flatMap((s) => s.velden as readonly PrijsVeld[]).find((v) => nieuw[v])
    if (veld) requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>(`[name="${veld}"]`)?.focus())
  }

  async function opVersturen(e: FormEvent) {
    e.preventDefault()
    if (verzenden.staat === 'bezig') return
    const controle = leesPrijsAanvraag(body(invoer))
    const hier = controle.ok ? {} : prijsFoutenVanStap(stap, controle.fouten)
    if (Object.keys(hier).length > 0) return toonFouten(hier)
    if (stap < PRIJS_STAPPEN.length - 1) {
      setFouten({})
      return naarStap(stap + 1)
    }
    if (!controle.ok) {
      const eerste = eersteStapMetPrijsFout(controle.fouten)
      if (eerste !== null) naarStap(eerste)
      return setFouten(controle.fouten)
    }
    setVerzenden({ staat: 'bezig' })
    const uit = await verstuur(invoer)
    if (uit.ok) return setVerzenden({ staat: 'klaar' })
    if (uit.fouten) {
      const eerste = eersteStapMetPrijsFout(uit.fouten)
      if (eerste !== null && eerste !== stap) naarStap(eerste)
      toonFouten(uit.fouten)
    }
    setVerzenden({ staat: 'fout', melding: uit.melding })
  }

  if (verzenden.staat === 'klaar') return <PrijsBedankt naam={invoer.naam.trim().split(/\s+/)[0] ?? ''} />

  const bezig = verzenden.staat === 'bezig'
  const laatste = stap === PRIJS_STAPPEN.length - 1
  return (
    <form ref={formRef} className="aan-formulier dem-formulier" onSubmit={(e) => void opVersturen(e)} noValidate aria-busy={bezig}>
      <Voortgang huidig={stap} verste={verste} onKies={naarStap} />
      <h2 ref={kopRef} tabIndex={-1} className="aan-stapkop">
        <span className="aan-stapkop-nr">
          Stap {stap + 1} van {PRIJS_STAPPEN.length}
        </span>
        {PRIJS_STAPPEN[stap].titel}
      </h2>
      <div className="aan-stap" key={stap}>
        <PrijsStap stap={stap} invoer={invoer} fouten={prijsFoutenVanStap(stap, fouten)} wijzig={wijzig} />
      </div>
      {verzenden.staat === 'fout' && (
        <p className="aan-melding" role="alert">
          {verzenden.melding}
        </p>
      )}
      <div className="aan-acties">
        {stap > 0 && (
          <button type="button" className="ayg-knop ayg-knop--rand" onClick={() => naarStap(stap - 1)}>
            <ArrowLeft size={18} aria-hidden="true" className="aan-terug-pijl" />
            Terug
          </button>
        )}
        <button type="submit" className="ayg-knop ayg-knop--accent aan-verder" disabled={bezig}>
          {bezig ? <LoaderCircle size={18} className="aan-draai" aria-hidden="true" /> : null}
          {bezig ? 'Versturen…' : laatste ? 'Vraag mijn prijs op maat aan' : 'Volgende'}
          {!bezig && <ArrowRight size={18} aria-hidden="true" />}
        </button>
      </div>
      {laatste && <p className="aan-hint">Vrijblijvend. We sturen geen nieuwsbrief.</p>}
    </form>
  )
}
