import { isPakketSleutel } from '@/lib/aiyourgym/pakketten'
import { pakketInTaal } from '@/lib/aiyourgym/taal/woorden/algemeen/pakketten'
import { DEMO_SOORTEN, MAX_DEMO_VESTIGINGEN } from '@/lib/aiyourgym/demo-aanvraag'
import { useTaal } from '@/lib/aiyourgym/taal/client'
import { PAKKET_TEKST } from '@/lib/aiyourgym/taal/woorden/website/pakketten'
import { PRIJS_OP_MAAT } from '@/lib/aiyourgym/taal/woorden/website/prijs-op-maat'
import { PRIJS_LEDEN, PRIJS_PAKKETTEN, type PrijsFouten } from '@/lib/aiyourgym/prijs-aanvraag'
import { Veld } from '@/components/aiyourgym/aanmelden/Veld'
import { aygPad } from '@/components/aiyourgym/site/paden'
import { Keuzes } from './Keuzes'

// De inhoud van een stap van het prijsformulier: sportschool, omvang of contact.

export interface PrijsInvoer {
  soort: string
  pakket: string
  vestigingen: string
  leden: string
  naam: string
  sportschool: string
  email: string
  telefoon: string
  akkoord: boolean
  /** Lokveld tegen robots, blijft leeg. */
  website: string
}

export type WijzigPrijs = <K extends keyof PrijsInvoer>(veld: K, waarde: PrijsInvoer[K]) => void

interface PrijsStapProps {
  stap: number
  invoer: PrijsInvoer
  fouten: PrijsFouten
  wijzig: WijzigPrijs
}

function StapSportschool({ invoer, fouten, wijzig }: Omit<PrijsStapProps, 'stap'>) {
  const taal = useTaal()
  const t = PRIJS_OP_MAAT[taal]
  const soorten = DEMO_SOORTEN.map((s) => ({ sleutel: s.sleutel, label: t.soorten[s.sleutel] }))
  // De losse pakketten in de gekozen taal, plus "Alle pakketten" en "Weet ik nog niet".
  const pakketten = PRIJS_PAKKETTEN.map((p) =>
    p.sleutel === 'weet-niet' ? { ...p, label: PAKKET_TEKST[taal].weetNiet } : p.sleutel === 'alles' ? { ...p, label: PAKKET_TEKST[taal].alles } : isPakketSleutel(p.sleutel) ? { ...p, label: pakketInTaal(p.sleutel, taal).naam } : p,
  )
  return (
    <>
      <Keuzes naam="soort" legende={t.soortVraag} opties={soorten} gekozen={invoer.soort} fout={fouten.soort} onKies={(v) => wijzig('soort', v)} />
      <Keuzes naam="pakket" legende={t.pakketVraag} opties={pakketten} gekozen={invoer.pakket} fout={fouten.pakket} onKies={(v) => wijzig('pakket', v)} />
    </>
  )
}

function StapOmvang({ invoer, fouten, wijzig }: Omit<PrijsStapProps, 'stap'>) {
  const t = PRIJS_OP_MAAT[useTaal()]
  const leden = PRIJS_LEDEN.map((l) => ({ sleutel: l.sleutel, label: t.leden[l.sleutel] }))
  return (
    <>
      <Veld id="prijs-vestigingen" name="vestigingen" label={t.vestigingen} type="text" inputMode="numeric" pattern="[0-9]*" maxLength={3}
        value={invoer.vestigingen} onChange={(e) => wijzig('vestigingen', e.target.value.replace(/\D/g, ''))} fout={fouten.vestigingen} hint={t.vestigingenHint(MAX_DEMO_VESTIGINGEN)} required />
      <Keuzes naam="leden" legende={t.ledenVraag} opties={leden} gekozen={invoer.leden} fout={fouten.leden} onKies={(v) => wijzig('leden', v)} />
    </>
  )
}

function StapContact({ invoer, fouten, wijzig }: Omit<PrijsStapProps, 'stap'>) {
  const taal = useTaal()
  const t = PRIJS_OP_MAAT[taal]
  return (
    <>
      <div className="aan-rij">
        <Veld id="prijs-naam" name="naam" label={t.naam} autoComplete="name" value={invoer.naam} onChange={(e) => wijzig('naam', e.target.value)} fout={fouten.naam} maxLength={60} required />
        <Veld id="prijs-sportschool" name="sportschool" label={t.sportschoolNaam} autoComplete="organization" value={invoer.sportschool} onChange={(e) => wijzig('sportschool', e.target.value)} fout={fouten.sportschool} maxLength={80} required />
      </div>
      <div className="aan-rij">
        <Veld id="prijs-email" name="email" type="email" label={t.email} autoComplete="email" value={invoer.email} onChange={(e) => wijzig('email', e.target.value)} fout={fouten.email} maxLength={120} required />
        <Veld id="prijs-telefoon" name="telefoon" type="tel" label={t.telefoon} autoComplete="tel" hint={t.telefoonHint} value={invoer.telefoon} onChange={(e) => wijzig('telefoon', e.target.value)} fout={fouten.telefoon} maxLength={20} required />
      </div>
      <div className="aan-akkoord" data-fout={fouten.akkoord ? 'ja' : undefined}>
        <input id="prijs-akkoord" name="akkoord" type="checkbox" checked={invoer.akkoord} onChange={(e) => wijzig('akkoord', e.target.checked)}
          aria-invalid={fouten.akkoord ? true : undefined} aria-describedby={fouten.akkoord ? 'prijs-akkoord-fout' : undefined} />
        <label htmlFor="prijs-akkoord">
          {t.akkoord.voor}
          <a href={aygPad('/privacy')} target="_blank" rel="noopener">{t.akkoord.privacy}</a>
          {t.akkoord.na}
        </label>
      </div>
      {fouten.akkoord && <p id="prijs-akkoord-fout" className="aan-fout" role="alert">{fouten.akkoord}</p>}
      {/* Tegen robots: mensen zien dit veld niet en laten het leeg. */}
      <div className="aan-val" aria-hidden="true">
        <label htmlFor="prijs-website">Website</label>
        <input id="prijs-website" type="text" tabIndex={-1} autoComplete="off" value={invoer.website} onChange={(e) => wijzig('website', e.target.value)} />
      </div>
    </>
  )
}

export function PrijsStap({ stap, ...rest }: PrijsStapProps) {
  if (stap === 0) return <StapSportschool {...rest} />
  if (stap === 1) return <StapOmvang {...rest} />
  return <StapContact {...rest} />
}
