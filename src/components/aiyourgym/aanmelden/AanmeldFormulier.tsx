'use client'

import { useRef, useState, type FormEvent } from 'react'
import { ArrowLeft, ArrowRight, LoaderCircle } from 'lucide-react'
import { leesAanmelding, type AanmeldVeld } from '@/lib/aiyourgym/aanmelding'
import type { PakketSleutel } from '@/lib/aiyourgym/pakketten'
import { STAPPEN, eersteStapMetFout, foutenVanStap, isStripeCheckout, isTestbetaalAdres, type Fouten } from './stappen'
import { Voortgang } from './Voortgang'
import { Samenvatting } from './Samenvatting'
import { StapPakket } from './StapPakket'
import { StapSportschool } from './StapSportschool'
import { StapEigenaar } from './StapEigenaar'
import { StapAkkoord } from './StapAkkoord'
import { Ontvangen } from './Ontvangen'
import type { Invoer, PakketKeuze, Wijzig } from './types'

// Het aanmeldformulier in vier stappen. Dezelfde controle als de server
// (leesAanmelding) per stap, zodat fouten meteen bij het juiste veld staan.

interface AanmeldFormulierProps {
  pakketten: readonly PakketKeuze[]
  proefdagen: number
  startPakket: PakketSleutel | null
  /** Staan de subdomeinen aan? Dan naam.aiyourgym.com, anders aiyourgym.com/naam. */
  subdomeinen: boolean
}

const LEEG: Omit<Invoer, 'pakket'> = {
  sportschoolNaam: '', aantalVestigingen: 1, slug: '', slugZelf: false, eigenaarNaam: '', eigenaarEmail: '', eigenaarTelefoon: '', wachtwoord: '', wachtwoordHerhaal: '', akkoord: false, website: '',
}

type Verzenden = { staat: 'rust' } | { staat: 'bezig' } | { staat: 'fout'; melding: string } | { staat: 'ontvangen'; melding: string }

export function AanmeldFormulier({ pakketten, proefdagen, startPakket, subdomeinen }: AanmeldFormulierProps) {
  const [invoer, setInvoer] = useState<Invoer>({ ...LEEG, pakket: startPakket ?? '' })
  const [stap, setStap] = useState(startPakket ? 1 : 0)
  const [verste, setVerste] = useState(startPakket ? 1 : 0)
  const [fouten, setFouten] = useState<Fouten>({})
  const [verzenden, setVerzenden] = useState<Verzenden>({ staat: 'rust' })
  const kopRef = useRef<HTMLHeadingElement>(null)

  const pakket = pakketten.find((p) => p.sleutel === invoer.pakket) ?? null
  const maxVestigingen = pakket?.maxVestigingen ?? 1

  const wijzig: Wijzig = (veld, waarde) => {
    setInvoer((oud) => ({ ...oud, [veld]: waarde }))
    setFouten((oud) => (oud[veld as keyof Fouten] ? { ...oud, [veld]: undefined } : oud))
  }

  function kiesPakket(sleutel: PakketSleutel) {
    const max = pakketten.find((p) => p.sleutel === sleutel)?.maxVestigingen ?? 1
    setInvoer((oud) => ({ ...oud, pakket: sleutel, aantalVestigingen: Math.min(oud.aantalVestigingen, max) }))
    setFouten((oud) => ({ ...oud, pakket: undefined, aantalVestigingen: undefined }))
  }

  function naarStap(nieuw: number) {
    setStap(nieuw)
    setVerste((v) => Math.max(v, nieuw))
    requestAnimationFrame(() => kopRef.current?.focus())
  }

  /** Na een fout: de focus naar het eerste veld met een fout, zodat je meteen ziet wat er mist. */
  function naarEersteFout(f: Fouten) {
    const veld = STAPPEN.flatMap((s) => s.velden as readonly AanmeldVeld[]).find((v) => f[v])
    if (!veld) return
    requestAnimationFrame(() => {
      const el = veld === 'pakket' ? document.querySelector<HTMLElement>('input[name="pakket"]') : document.getElementById(veld)
      el?.focus()
      el?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    })
  }

  /** Wat de browser controleert (met de herhaling van het wachtwoord). */
  function body() {
    return { ...invoer, slugZelf: undefined }
  }

  /** Wat naar de server gaat: zonder de herhaling. */
  function verzendBody() {
    return { ...body(), wachtwoordHerhaal: undefined }
  }

  function volgende() {
    const uitslag = leesAanmelding(body())
    const hier = uitslag.ok ? {} : foutenVanStap(stap, uitslag.fouten)
    if (Object.keys(hier).length > 0) {
      setFouten(hier)
      naarEersteFout(hier)
      return
    }
    setFouten({})
    naarStap(stap + 1)
  }

  async function verstuur(e: FormEvent) {
    e.preventDefault()
    if (stap < STAPPEN.length - 1) return volgende()
    const uitslag = leesAanmelding(body())
    if (!uitslag.ok) {
      setFouten(uitslag.fouten)
      const eerste = eersteStapMetFout(uitslag.fouten)
      if (eerste !== null && eerste !== stap) naarStap(eerste)
      else naarEersteFout(uitslag.fouten)
      return
    }
    setVerzenden({ staat: 'bezig' })
    try {
      const res = await fetch('/api/aiyourgym/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(verzendBody()) })
      const json = (await res.json().catch(() => null)) as { staat?: unknown; url?: unknown; melding?: unknown; fout?: unknown; fouten?: Fouten } | null
      if (res.ok && json?.staat === 'testbetaling' && isTestbetaalAdres(json.url)) {
        window.location.assign(json.url)
        return
      }
      if (res.ok && json?.staat === 'betalen' && isStripeCheckout(json.url)) {
        window.location.assign(json.url)
        return
      }
      if (res.ok && json?.staat === 'aanvraag') {
        setVerzenden({ staat: 'ontvangen', melding: typeof json.melding === 'string' ? json.melding : 'We hebben je aanvraag ontvangen.' })
        return
      }
      if (json?.fouten) {
        setFouten(json.fouten)
        const eerste = eersteStapMetFout(json.fouten)
        if (eerste !== null) naarStap(eerste)
      }
      setVerzenden({ staat: 'fout', melding: typeof json?.fout === 'string' ? json.fout : 'Aanmelden lukte niet. Probeer het later opnieuw.' })
    } catch {
      setVerzenden({ staat: 'fout', melding: 'Geen verbinding. Controleer je internet en probeer het opnieuw.' })
    }
  }

  if (verzenden.staat === 'ontvangen') return <Ontvangen melding={verzenden.melding} sportschool={invoer.sportschoolNaam} />

  const laatste = stap === STAPPEN.length - 1
  const stapFouten = foutenVanStap(stap, fouten)
  return (
    <div className="aan-raster">
      <form className="aan-formulier" onSubmit={verstuur} noValidate aria-busy={verzenden.staat === 'bezig'}>
        <Voortgang huidig={stap} verste={verste} onKies={naarStap} />
        <h2 ref={kopRef} tabIndex={-1} className="aan-stapkop">
          <span className="aan-stapkop-nr">Stap {stap + 1} van {STAPPEN.length}</span>
          {STAPPEN[stap].titel}
        </h2>
        <div className="aan-stap" key={stap}>
          {stap === 0 && <StapPakket pakketten={pakketten} gekozen={invoer.pakket} proefdagen={proefdagen} fout={stapFouten.pakket} onKies={kiesPakket} />}
          {stap === 1 && <StapSportschool subdomeinen={subdomeinen} invoer={invoer} maxVestigingen={maxVestigingen} onbeperkt={pakket?.onbeperkt ?? false} fouten={stapFouten} wijzig={wijzig} />}
          {stap === 2 && <StapEigenaar invoer={invoer} fouten={stapFouten} wijzig={wijzig} />}
          {stap === 3 && <StapAkkoord subdomeinen={subdomeinen} invoer={invoer} pakket={pakket} proefdagen={proefdagen} fouten={stapFouten} wijzig={wijzig} naarStap={naarStap} />}
        </div>
        {verzenden.staat === 'fout' && <p className="aan-melding" role="alert">{verzenden.melding}</p>}
        {STAPPEN[stap].hierna && <p className="aan-hierna">{STAPPEN[stap].hierna}</p>}
        <div className="aan-acties">
          {stap > 0 && (
            <button type="button" className="ayg-knop ayg-knop--rand" onClick={() => naarStap(stap - 1)}>
              <ArrowLeft size={18} aria-hidden="true" className="aan-terug-pijl" />
              Terug
            </button>
          )}
          <button type="submit" className="ayg-knop ayg-knop--accent aan-verder" disabled={verzenden.staat === 'bezig'}>
            {verzenden.staat === 'bezig' ? <LoaderCircle size={18} className="aan-draai" aria-hidden="true" /> : null}
            {!laatste ? 'Volgende' : pakket?.open && pakket.test ? 'Verder naar je proefperiode' : pakket?.open ? `Naar betalen, eerste ${proefdagen} dagen gratis` : 'Aanvraag versturen'}
            {verzenden.staat !== 'bezig' && <ArrowRight size={18} aria-hidden="true" />}
          </button>
        </div>
      </form>
      <Samenvatting subdomeinen={subdomeinen} invoer={invoer} pakket={pakket} proefdagen={proefdagen} />
    </div>
  )
}
