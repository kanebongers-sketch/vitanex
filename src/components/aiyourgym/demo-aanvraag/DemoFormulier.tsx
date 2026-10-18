'use client'

import { useRef, useState, type FormEvent } from 'react'
import { ArrowRight, LoaderCircle } from 'lucide-react'
import { DEMO_SOORTEN, MAX_DEMO_OPMERKING, leesDemoAanvraag, type DemoFouten, type DemoSoort } from '@/lib/aiyourgym/demo-aanvraag'
import { Veld } from '@/components/aiyourgym/aanmelden/Veld'
import { DemoBedankt } from './DemoBedankt'
import { DemoKeuzes } from './DemoKeuzes'
import { LEEG, type DemoInvoer, type WijzigDemo } from './types'

// Het formulier om een gratis demo aan te vragen. Dezelfde controle als de
// server (leesDemoAanvraag), zodat fouten meteen bij het juiste veld staan.
// Er gaat niets automatisch naar buiten: Kane belt of mailt zelf terug.

interface DemoFormulierProps {
  startSoort: DemoSoort | null
}

type Verzenden = { staat: 'rust' } | { staat: 'bezig' } | { staat: 'fout'; melding: string } | { staat: 'klaar' }

const VOLGORDE: readonly (keyof DemoFouten)[] = ['naam', 'sportschool', 'email', 'telefoon', 'vestigingen', 'soort', 'moment', 'opmerking', 'akkoord']

function body(invoer: DemoInvoer) {
  return { ...invoer, vestigingen: invoer.vestigingen.trim() }
}

async function verstuur(invoer: DemoInvoer): Promise<{ ok: true } | { ok: false; melding: string; fouten?: DemoFouten }> {
  try {
    const res = await fetch('/api/aiyourgym/demo-aanvraag', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body(invoer)) })
    const data: unknown = await res.json().catch(() => null)
    if (res.ok) return { ok: true }
    const d = typeof data === 'object' && data !== null ? (data as { fout?: unknown; fouten?: unknown }) : {}
    const fouten = typeof d.fouten === 'object' && d.fouten !== null ? (d.fouten as DemoFouten) : undefined
    return { ok: false, melding: typeof d.fout === 'string' ? d.fout : 'Versturen lukte niet. Probeer het later opnieuw.', fouten }
  } catch {
    return { ok: false, melding: 'Geen verbinding. Controleer het internet en probeer het opnieuw.' }
  }
}

export function DemoFormulier({ startSoort }: DemoFormulierProps) {
  const [invoer, setInvoer] = useState<DemoInvoer>({ ...LEEG, soort: startSoort ?? '' })
  const [fouten, setFouten] = useState<DemoFouten>({})
  const [verzenden, setVerzenden] = useState<Verzenden>({ staat: 'rust' })
  const formRef = useRef<HTMLFormElement>(null)

  const wijzig: WijzigDemo = (veld, waarde) => {
    setInvoer((oud) => ({ ...oud, [veld]: waarde }))
    setFouten((oud) => (oud[veld as keyof DemoFouten] ? { ...oud, [veld]: undefined } : oud))
  }

  function toonFouten(nieuw: DemoFouten) {
    setFouten(nieuw)
    const eerste = VOLGORDE.find((v) => nieuw[v])
    if (eerste) requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>(`[name="${eerste}"]`)?.focus())
  }

  async function opVersturen(e: FormEvent) {
    e.preventDefault()
    if (verzenden.staat === 'bezig') return
    const controle = leesDemoAanvraag(body(invoer))
    if (!controle.ok) return toonFouten(controle.fouten)
    setVerzenden({ staat: 'bezig' })
    const uit = await verstuur(invoer)
    if (uit.ok) return setVerzenden({ staat: 'klaar' })
    if (uit.fouten) toonFouten(uit.fouten)
    setVerzenden({ staat: 'fout', melding: uit.melding })
  }

  if (verzenden.staat === 'klaar') return <DemoBedankt naam={invoer.naam.trim().split(/\s+/)[0] ?? ''} />

  const bezig = verzenden.staat === 'bezig'
  return (
    <form ref={formRef} className="aan-formulier dem-formulier" onSubmit={(e) => void opVersturen(e)} noValidate aria-describedby="dem-uitleg">
      <p id="dem-uitleg" className="aan-uitleg">
        Vul je gegevens in. We nemen binnen een werkdag contact op om een moment te plannen. Vrijblijvend.
      </p>
      {verzenden.staat === 'fout' && (
        <p className="aan-melding" role="alert">
          {verzenden.melding}
        </p>
      )}
      <div className="aan-rij">
        <Veld id="dem-naam" name="naam" label="Je naam" autoComplete="name" value={invoer.naam} onChange={(e) => wijzig('naam', e.target.value)} fout={fouten.naam} maxLength={60} required />
        <Veld id="dem-sportschool" name="sportschool" label="Naam van je sportschool" autoComplete="organization" value={invoer.sportschool} onChange={(e) => wijzig('sportschool', e.target.value)} fout={fouten.sportschool} maxLength={80} required />
      </div>
      <div className="aan-rij">
        <Veld id="dem-email" name="email" type="email" label="E-mailadres" autoComplete="email" value={invoer.email} onChange={(e) => wijzig('email', e.target.value)} fout={fouten.email} maxLength={120} required />
        <Veld id="dem-telefoon" name="telefoon" type="tel" label="Telefoonnummer" autoComplete="tel" hint="We bellen je om een moment af te spreken." value={invoer.telefoon} onChange={(e) => wijzig('telefoon', e.target.value)} fout={fouten.telefoon} maxLength={20} required />
      </div>
      <DemoKeuzes invoer={invoer} fouten={fouten} wijzig={wijzig} soorten={DEMO_SOORTEN} />
      <div className="aan-veld" data-fout={fouten.opmerking ? 'ja' : undefined}>
        <label htmlFor="dem-opmerking" className="aan-label">
          Opmerking <span className="dem-optioneel">(niet verplicht)</span>
        </label>
        <div className="aan-invoer dem-tekstvak">
          <textarea id="dem-opmerking" name="opmerking" rows={4} maxLength={MAX_DEMO_OPMERKING} value={invoer.opmerking} onChange={(e) => wijzig('opmerking', e.target.value)}
            aria-invalid={fouten.opmerking ? true : undefined} aria-describedby={fouten.opmerking ? 'dem-opmerking-fout' : 'dem-opmerking-hint'} />
        </div>
        <p id="dem-opmerking-hint" className="aan-hint">Waar ben je naar op zoek, of wat wil je zeker zien?</p>
        {fouten.opmerking && <p id="dem-opmerking-fout" className="aan-fout" role="alert">{fouten.opmerking}</p>}
      </div>
      <div className="aan-akkoord" data-fout={fouten.akkoord ? 'ja' : undefined}>
        <input id="dem-akkoord" name="akkoord" type="checkbox" checked={invoer.akkoord} onChange={(e) => wijzig('akkoord', e.target.checked)}
          aria-invalid={fouten.akkoord ? true : undefined} aria-describedby={fouten.akkoord ? 'dem-akkoord-fout' : undefined} />
        <label htmlFor="dem-akkoord">
          Ik heb de <a href="/aiyourgym/privacy" target="_blank" rel="noopener">privacyverklaring</a> gelezen. Mijn gegevens worden alleen gebruikt om contact op te nemen over de demo.
        </label>
      </div>
      {fouten.akkoord && <p id="dem-akkoord-fout" className="aan-fout" role="alert">{fouten.akkoord}</p>}
      {/* Tegen robots: mensen zien dit veld niet en laten het leeg. */}
      <div className="aan-val" aria-hidden="true">
        <label htmlFor="dem-website">Website</label>
        <input id="dem-website" type="text" tabIndex={-1} autoComplete="off" value={invoer.website} onChange={(e) => wijzig('website', e.target.value)} />
      </div>
      <div className="dem-versturen">
        <button type="submit" className="ayg-knop ayg-knop--accent dem-knop" disabled={bezig}>
          {bezig ? <LoaderCircle size={18} className="aan-draai" aria-hidden /> : null}
          {bezig ? 'Versturen…' : 'Plan mijn gratis demo'}
          {!bezig && <ArrowRight size={17} aria-hidden />}
        </button>
        <p className="aan-hint">Je zit nergens aan vast. We sturen geen nieuwsbrief.</p>
      </div>
    </form>
  )
}
