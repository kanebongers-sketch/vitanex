'use client'

import { useId, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { stuur } from '@/components/club/leden/stuur'
import { MAX_NOTITIE, type Maaltijd, type VoedingPlan, type VoedingSjabloon } from '@/lib/club/voeding/model'
import { controleerInvoer, DOELEN, type RekenInvoer, type RekenUitkomst, type VoedingDoel } from '@/lib/club/voeding/rekenhulp'
import { pasSjabloonToe } from '@/lib/club/voeding/sjabloon'
import { startConcept, veldenNaarInvoer, type RekenVelden } from '@/lib/club/voeding/startwaarden'
import { AdviezenVeld } from './AdviezenVeld'
import { DoelenVelden, type DoelTekst } from './DoelenVelden'
import { MacroBord } from './MacroBord'
import { MaaltijdenVeld } from './MaaltijdenVeld'
import { RekenhulpPaneel } from './RekenhulpPaneel'
import { SjabloonToepassen } from './SjabloonToepassen'
import { VerwijderPlan } from './VerwijderPlan'
import { useTaal, useTekst } from '@/lib/aiyourgym/taal/client'
import { VOEDING } from '@/lib/aiyourgym/taal/woorden/club/voeding'

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
  const taal = useTaal()
  const tv = useTekst(VOEDING)
  const t = tv.editor

  const getallen = naarGetal(doelen)
  const voorbeeld = Object.values(getallen).every(Number.isFinite) ? getallen : null

  function neemOver(u: RekenUitkomst, invoer: RekenInvoer) {
    setDoelen(naarTekst(u))
    setDoel(invoer.doel)
    setBerekening(invoer)
    setMelding(t.overgenomen(u.kcal))
  }

  function pasToe(s: VoedingSjabloon) {
    const invoer = veldenNaarInvoer(velden)
    const geldig = controleerInvoer(invoer, taal).length === 0 ? (invoer as RekenInvoer) : null
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
    const uitleg = bron === 'berekend' ? t.bronBerekend : bron === 'sjabloon' ? t.bronSjabloon : t.bronOngewijzigd
    setMelding(t.toegepast(s.naam, uitleg))
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
    setMelding(t.opgeslagen)
    router.refresh()
  }

  return (
    <div className="club-voeding club-voeding-editor">
      <form className="club-voeding-editor-plan" onSubmit={(e) => void bewaar(e)} aria-labelledby={`${id}-kop`}>
        <section className="club-kaart club-voeding-blok">
          <h2 id={`${id}-kop`}>{t.dagdoelVoor(lidNaam)}</h2>
          {voorbeeld && <MacroBord doelen={voorbeeld} taal={taal} />}
          <DoelenVelden waarde={doelen} onWijzig={setDoelen} />
          <fieldset className="club-voeding-keuzes">
            <legend className="club-label">{t.doel}</legend>
            {DOELEN.map((d) => (
              <label key={d}>
                <input type="radio" name={`${id}-doel`} checked={doel === d} onChange={() => setDoel(d)} />
                <span>{tv.doel[d].label}</span>
              </label>
            ))}
          </fieldset>
        </section>

        <section className="club-kaart club-voeding-blok" aria-labelledby={`${id}-adviezen`}>
          <h2 id={`${id}-adviezen`}>{t.adviezen}</h2>
          <AdviezenVeld adviezen={adviezen} onWijzig={setAdviezen} />
        </section>

        <section className="club-kaart club-voeding-blok" aria-labelledby={`${id}-dag`}>
          <h2 id={`${id}-dag`}>{t.dagindeling}</h2>
          <p className="club-voeding-hint">{t.dagHint}</p>
          <MaaltijdenVeld maaltijden={maaltijden} onWijzig={setMaaltijden} />
        </section>

        <section className="club-kaart club-voeding-blok" aria-labelledby={`${id}-notitie`}>
          <h2 id={`${id}-notitie`}>{t.notitie}</h2>
          <textarea className="club-invoer" rows={3} maxLength={MAX_NOTITIE} value={notitie} onChange={(e) => setNotitie(e.target.value)} aria-describedby={`${id}-notitie-uitleg`} />
          <p id={`${id}-notitie-uitleg`} className="club-voeding-hint">{t.notitieHint}</p>
        </section>

        <p className="club-voeding-disclaimer">{tv.disclaimer}</p>

        <div className="club-voeding-acties">
          <button type="submit" className="club-knop club-knop--primair" disabled={bezig || !voorbeeld}>
            {bezig ? t.bezig : plan ? t.opslaan : t.maken}
          </button>
          <Link href={terugHref} className="club-knop club-knop--stil">
            {t.naarKaart}
          </Link>
          {plan && <VerwijderPlan lidId={lidId} terugHref={terugHref} />}
        </div>
        <div className="club-voeding-melding" role="status" aria-live="polite">
          {fout && <p className="club-melding club-melding--fout">{fout}</p>}
          {!fout && melding && <p className="club-melding club-melding--ok">{melding}</p>}
        </div>
      </form>

      <aside className="club-voeding-zij" aria-label={t.zij}>
        <RekenhulpPaneel velden={velden} onWijzig={setVelden} onOvernemen={neemOver} />
        <section className="club-kaart club-voeding-blok" aria-label={t.sjabloonToepassen}>
          <SjabloonToepassen sjablonen={sjablonen} onToepassen={pasToe} beheerHref={sjablonenHref} />
        </section>
      </aside>
    </div>
  )
}
