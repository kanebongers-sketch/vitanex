'use client'

import { useId, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { stuur } from '@/components/club/leden/stuur'
import { DISCLAIMER, MAX_NOTITIE, type Maaltijd, type VoedingPlan, type VoedingSjabloon } from '@/lib/club/voeding/model'
import { controleerInvoer, DOEL_INFO, DOELEN, type RekenInvoer, type RekenUitkomst, type VoedingDoel } from '@/lib/club/voeding/rekenhulp'
import { pasSjabloonToe } from '@/lib/club/voeding/sjabloon'
import { startConcept, veldenNaarInvoer, type RekenVelden } from '@/lib/club/voeding/startwaarden'
import { AdviezenVeld } from './AdviezenVeld'
import { DoelenVelden, type DoelTekst } from './DoelenVelden'
import { MacroBord } from './MacroBord'
import { MaaltijdenVeld } from './MaaltijdenVeld'
import { RekenhulpPaneel } from './RekenhulpPaneel'
import { SjabloonToepassen } from './SjabloonToepassen'
import { VerwijderPlan } from './VerwijderPlan'

// Het voedingsplan van een lid maken of bewerken. Links het plan, rechts de
// rekenhulp en de sjablonen. Opslaan gaat in een keer via POST (nieuw of bestaand plan).

export interface PlanEditorProps {
  lidId: string
  lidNaam: string
  plan: VoedingPlan | undefined
  sjablonen: readonly VoedingSjabloon[]
  beginVelden: RekenVelden
  /** Terug naar de ledenkaart. */
  terugHref: string
  sjablonenHref: string
}

function naarTekst(n: { kcal: number; eiwitG: number; koolhydratenG: number; vetG: number }): DoelTekst {
  return { kcal: String(n.kcal), eiwitG: String(n.eiwitG), koolhydratenG: String(n.koolhydratenG), vetG: String(n.vetG) }
}

function naarGetal(d: DoelTekst) {
  const g = (s: string) => (s.trim() === '' ? Number.NaN : Number(s))
  return { kcal: g(d.kcal), eiwitG: g(d.eiwitG), koolhydratenG: g(d.koolhydratenG), vetG: g(d.vetG) }
}

export function PlanEditor({ lidId, lidNaam, plan, sjablonen, beginVelden, terugHref, sjablonenHref }: PlanEditorProps) {
  const router = useRouter()
  const id = useId()
  const begin = startConcept(plan)
  const [doelen, setDoelen] = useState<DoelTekst>(naarTekst(begin))
  const [doel, setDoel] = useState<VoedingDoel | null>(begin.doel)
  const [adviezen, setAdviezen] = useState<string[]>(begin.adviezen)
  const [maaltijden, setMaaltijden] = useState<Maaltijd[]>(begin.maaltijden)
  const [notitie, setNotitie] = useState(plan?.notitie ?? '')
  const [velden, setVelden] = useState<RekenVelden>(beginVelden)
  const [berekening, setBerekening] = useState<RekenInvoer | null>(begin.berekening)
  const [sjabloonId, setSjabloonId] = useState<string | null>(begin.sjabloonId)
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)
  const [melding, setMelding] = useState<string | null>(null)

  const getallen = naarGetal(doelen)
  const voorbeeld = Object.values(getallen).every(Number.isFinite) ? getallen : null

  function neemOver(u: RekenUitkomst, invoer: RekenInvoer) {
    setDoelen(naarTekst(u))
    setDoel(invoer.doel)
    setBerekening(invoer)
    setMelding(`Dagdoel overgenomen: ${u.kcal} kcal.`)
  }

  function pasToe(s: VoedingSjabloon) {
    const invoer = veldenNaarInvoer(velden)
    const geldig = controleerInvoer(invoer).length === 0 ? (invoer as RekenInvoer) : null
    const of = (n: number, terug: number) => (Number.isFinite(n) ? n : terug)
    const huidig = {
      kcal: of(getallen.kcal, begin.kcal),
      eiwitG: of(getallen.eiwitG, begin.eiwitG),
      koolhydratenG: of(getallen.koolhydratenG, begin.koolhydratenG),
      vetG: of(getallen.vetG, begin.vetG),
      doel,
      adviezen,
      maaltijden,
      berekening: geldig,
      sjabloonId,
    }
    const { plan: nieuw, bron } = pasSjabloonToe(s, huidig)
    setDoelen(naarTekst(nieuw))
    setDoel(nieuw.doel)
    setAdviezen(nieuw.adviezen)
    setMaaltijden(nieuw.maaltijden)
    setBerekening(nieuw.berekening)
    setSjabloonId(nieuw.sjabloonId)
    if (nieuw.berekening) setVelden({ ...velden, doel: nieuw.berekening.doel, eiwitPerKg: String(nieuw.berekening.eiwitPerKg) })
    const uitleg = bron === 'berekend' ? 'dagdoelen opnieuw berekend' : bron === 'sjabloon' ? 'dagdoelen uit het sjabloon' : 'dagdoelen ongewijzigd'
    setMelding(`Sjabloon ${s.naam} toegepast (${uitleg}). Nog niet opgeslagen.`)
  }

  async function bewaar(e: FormEvent) {
    e.preventDefault()
    setBezig(true)
    setFout(null)
    setMelding(null)
    const body = { ...getallen, doel, adviezen, maaltijden, notitie: notitie.trim() || null, berekening, sjabloonId }
    const uit = await stuur(`/api/club/voeding/leden/${lidId}`, 'POST', body)
    setBezig(false)
    if (!uit.ok) return setFout(uit.fout)
    setMelding('Het plan is opgeslagen.')
    router.refresh()
  }

  return (
    <div className="club-voeding club-voeding-editor">
      <form className="club-voeding-editor-plan" onSubmit={(e) => void bewaar(e)} aria-labelledby={`${id}-kop`}>
        <section className="club-kaart club-voeding-blok">
          <h2 id={`${id}-kop`}>Dagdoel voor {lidNaam}</h2>
          {voorbeeld && <MacroBord doelen={voorbeeld} />}
          <DoelenVelden waarde={doelen} onWijzig={setDoelen} />
          <fieldset className="club-voeding-keuzes">
            <legend className="club-label">Doel</legend>
            {DOELEN.map((d) => (
              <label key={d}>
                <input type="radio" name={`${id}-doel`} checked={doel === d} onChange={() => setDoel(d)} />
                <span>{DOEL_INFO[d].label}</span>
              </label>
            ))}
          </fieldset>
        </section>

        <section className="club-kaart club-voeding-blok" aria-labelledby={`${id}-adviezen`}>
          <h2 id={`${id}-adviezen`}>Adviezen</h2>
          <AdviezenVeld adviezen={adviezen} onWijzig={setAdviezen} />
        </section>

        <section className="club-kaart club-voeding-blok" aria-labelledby={`${id}-dag`}>
          <h2 id={`${id}-dag`}>Dagindeling</h2>
          <p className="club-voeding-hint">Een voorbeelddag met momenten en producten. Geen weegschaal: het lid ziet het als richting.</p>
          <MaaltijdenVeld maaltijden={maaltijden} onWijzig={setMaaltijden} />
        </section>

        <section className="club-kaart club-voeding-blok" aria-labelledby={`${id}-notitie`}>
          <h2 id={`${id}-notitie`}>Notitie voor trainers</h2>
          <textarea className="club-invoer" rows={3} maxLength={MAX_NOTITIE} value={notitie} onChange={(e) => setNotitie(e.target.value)} aria-describedby={`${id}-notitie-uitleg`} />
          <p id={`${id}-notitie-uitleg`} className="club-voeding-hint">Alleen voor het team, het lid ziet dit niet.</p>
        </section>

        <p className="club-voeding-disclaimer">{DISCLAIMER}</p>

        <div className="club-voeding-acties">
          <button type="submit" className="club-knop club-knop--primair" disabled={bezig || !voorbeeld}>
            {bezig ? 'Opslaan...' : plan ? 'Plan opslaan' : 'Plan maken'}
          </button>
          <Link href={terugHref} className="club-knop club-knop--stil">
            Naar de ledenkaart
          </Link>
          {plan && <VerwijderPlan lidId={lidId} terugHref={terugHref} />}
        </div>
        <div className="club-voeding-melding" role="status" aria-live="polite">
          {fout && <p className="club-melding club-melding--fout">{fout}</p>}
          {!fout && melding && <p className="club-melding club-melding--ok">{melding}</p>}
        </div>
      </form>

      <aside className="club-voeding-zij" aria-label="Rekenhulp en sjablonen">
        <RekenhulpPaneel velden={velden} onWijzig={setVelden} onOvernemen={neemOver} />
        <section className="club-kaart club-voeding-blok" aria-label="Sjabloon toepassen">
          <SjabloonToepassen sjablonen={sjablonen} onToepassen={pasToe} beheerHref={sjablonenHref} />
        </section>
      </aside>
    </div>
  )
}
