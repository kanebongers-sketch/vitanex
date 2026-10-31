'use client'

import { useRef, useState, type FormEvent } from 'react'
import { ArrowLeft, ArrowRight, LoaderCircle } from 'lucide-react'
import { leesAanmelding, type AanmeldVeld } from '@/lib/aiyourgym/aanmelding'
import { slugVoorstel } from '@/lib/club/kern/subdomein'
import type { PakketSleutel } from '@/lib/aiyourgym/pakketten'
import { useTaal } from '@/lib/aiyourgym/taal/client'
import { AANMELD_FORMULIER } from '@/lib/aiyourgym/taal/woorden/website/aanmelden'
import { foutenIn, kiesMeldingen } from '@/lib/aiyourgym/taal/woorden/website/meldingen'
import { STAPPEN, eersteStapMetFout, foutenVanStap, isStripeCheckout, isTestbetaalAdres, type Fouten } from './stappen'
import { Voortgang } from './Voortgang'
import { Samenvatting } from './Samenvatting'
import { StapPakket } from './StapPakket'
import { StapSportschool } from './StapSportschool'
import { StapEigenaar } from './StapEigenaar'
import { StapAkkoord } from './StapAkkoord'
import { Ontvangen } from './Ontvangen'
import type { Invoer, PakketKeuze, Wijzig } from './types'
import { gekozenVan, wisselPakket } from './keuze'
import { MAX_VESTIGINGEN_ONLINE } from '@/lib/aiyourgym/aanmelding'

// Het aanmeldformulier in vier stappen. Dezelfde controle als de server
// (leesAanmelding) per stap, zodat fouten meteen bij het juiste veld staan.

interface AanmeldFormulierProps {
  pakketten: readonly PakketKeuze[]
  /** Al gekozen pakketten (van de prijzenpagina, ?pakketten=lessen,groei). */
  startPakketten: readonly PakketSleutel[]
  /** Staat de testbetaling aan (zolang Stripe niet voor alles een prijs heeft)? */
  testAan: boolean
  /** Staan de subdomeinen aan? Dan naam.aiyourgym.com, anders aiyourgym.com/naam. */
  subdomeinen: boolean
  /** Naam van de sportschool die de bezoeker al typte (oproep op de voorpagina, ?naam=). */
  startNaam?: string
}

const LEEG: Omit<Invoer, 'pakketten'> = {
  sportschoolNaam: '', aantalVestigingen: 1, ledenSchatting: '', slug: '', slugZelf: false, eigenaarNaam: '', eigenaarEmail: '', eigenaarTelefoon: '', wachtwoord: '', wachtwoordHerhaal: '', akkoord: false, website: '',
}

type Verzenden = { staat: 'rust' } | { staat: 'bezig' } | { staat: 'fout'; melding: string } | { staat: 'ontvangen'; melding: string }

export function AanmeldFormulier({ pakketten, startPakketten, testAan, subdomeinen, startNaam = '' }: AanmeldFormulierProps) {
  // Ook met pakketten uit de URL begint het formulier bij de keuze: er kan er nog een bij.
  const [invoer, setInvoer] = useState<Invoer>({ ...LEEG, sportschoolNaam: startNaam, slug: startNaam ? slugVoorstel(startNaam) : '', pakketten: [...startPakketten] })
  const [stap, setStap] = useState(0)
  const [verste, setVerste] = useState(0)
  const [fouten, setFouten] = useState<Fouten>({})
  const [verzenden, setVerzenden] = useState<Verzenden>({ staat: 'rust' })
  const kopRef = useRef<HTMLHeadingElement>(null)
  const taal = useTaal()
  const t = AANMELD_FORMULIER[taal]

  const pakket = gekozenVan(pakketten, invoer.pakketten, testAan, taal)

  const wijzig: Wijzig = (veld, waarde) => {
    setInvoer((oud) => ({ ...oud, [veld]: waarde }))
    setFouten((oud) => (oud[veld as keyof Fouten] ? { ...oud, [veld]: undefined } : oud))
  }

  function zetPakketten(maak: (oud: readonly PakketSleutel[]) => PakketSleutel[]) {
    setInvoer((oud) => ({ ...oud, pakketten: maak(oud.pakketten) }))
    setFouten((oud) => ({ ...oud, pakketten: undefined }))
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
      const el = veld === 'pakketten' ? document.querySelector<HTMLElement>('input[name="pakketten"]') : document.getElementById(veld)
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
    const hier = uitslag.ok ? {} : foutenIn(foutenVanStap(stap, uitslag.fouten), taal)
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
      const vertaald = foutenIn(uitslag.fouten, taal)
      setFouten(vertaald)
      const eerste = eersteStapMetFout(vertaald)
      if (eerste !== null && eerste !== stap) naarStap(eerste)
      else naarEersteFout(vertaald)
      return
    }
    setVerzenden({ staat: 'bezig' })
    try {
      const res = await fetch('/api/aiyourgym/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(verzendBody()) })
      const json = (await res.json().catch(() => null)) as { staat?: unknown; url?: unknown } | null
      const m = kiesMeldingen(json, taal)
      if (res.ok && json?.staat === 'testbetaling' && isTestbetaalAdres(json.url)) {
        window.location.assign(json.url)
        return
      }
      if (res.ok && json?.staat === 'betalen' && isStripeCheckout(json.url)) {
        window.location.assign(json.url)
        return
      }
      if (res.ok && json?.staat === 'aanvraag') {
        setVerzenden({ staat: 'ontvangen', melding: m.melding ?? t.ontvangen })
        return
      }
      if (m.fouten) {
        const fouten = m.fouten as Fouten
        setFouten(fouten)
        const eerste = eersteStapMetFout(fouten)
        if (eerste !== null) naarStap(eerste)
      }
      setVerzenden({ staat: 'fout', melding: m.fout ?? t.mislukt })
    } catch {
      setVerzenden({ staat: 'fout', melding: t.geenVerbinding })
    }
  }

  if (verzenden.staat === 'ontvangen') return <Ontvangen melding={verzenden.melding} sportschool={invoer.sportschoolNaam} />

  const laatste = stap === STAPPEN.length - 1
  const stapFouten = foutenVanStap(stap, fouten)
  const stapTekst = t.stappen[STAPPEN[stap].sleutel]
  return (
    <div className="aan-raster">
      <form className="aan-formulier" onSubmit={verstuur} noValidate aria-busy={verzenden.staat === 'bezig'}>
        <Voortgang huidig={stap} verste={verste} onKies={naarStap} />
        <h2 ref={kopRef} tabIndex={-1} className="aan-stapkop">
          <span className="aan-stapkop-nr">{t.stapVan(stap + 1, STAPPEN.length)}</span>
          {stapTekst.titel}
        </h2>
        <div className="aan-stap" key={stap}>
          {stap === 0 && <StapPakket pakketten={pakketten} gekozen={invoer.pakketten} fout={stapFouten.pakketten} onWissel={(s) => zetPakketten((oud) => wisselPakket(oud, s))} />}
          {stap === 1 && <StapSportschool subdomeinen={subdomeinen} invoer={invoer} maxVestigingen={MAX_VESTIGINGEN_ONLINE} onbeperkt={false} fouten={stapFouten} wijzig={wijzig} />}
          {stap === 2 && <StapEigenaar invoer={invoer} fouten={stapFouten} wijzig={wijzig} />}
          {stap === 3 && <StapAkkoord subdomeinen={subdomeinen} invoer={invoer} pakket={pakket} fouten={stapFouten} wijzig={wijzig} naarStap={naarStap} />}
        </div>
        {verzenden.staat === 'fout' && <p className="aan-melding" role="alert">{verzenden.melding}</p>}
        {stapTekst.hierna && <p className="aan-hierna">{stapTekst.hierna}</p>}
        <div className="aan-acties">
          {stap > 0 && (
            <button type="button" className="ayg-knop ayg-knop--rand" onClick={() => naarStap(stap - 1)}>
              <ArrowLeft size={18} aria-hidden="true" className="aan-terug-pijl" />
              {t.terug}
            </button>
          )}
          <button type="submit" className="ayg-knop ayg-knop--accent aan-verder" disabled={verzenden.staat === 'bezig'}>
            {verzenden.staat === 'bezig' ? <LoaderCircle size={18} className="aan-draai" aria-hidden="true" /> : null}
            {!laatste ? t.volgende : pakket?.open && pakket.test ? t.naarStarten : pakket?.open ? t.naarBetalen : t.aanvraagVersturen}
            {verzenden.staat !== 'bezig' && <ArrowRight size={18} aria-hidden="true" />}
          </button>
        </div>
      </form>
      <Samenvatting subdomeinen={subdomeinen} invoer={invoer} pakket={pakket} />
    </div>
  )
}
