'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, X } from 'lucide-react'
import type { PlanVoorLid } from '@/lib/club/voeding/model'
import type { LidPlanModus } from '@/lib/club/voeding/eigen'
import { useTaal, useTekst } from '@/lib/aiyourgym/taal/client'
import { VOEDING } from '@/lib/aiyourgym/taal/woorden/club/voeding'
import { VOEDING_EIGEN } from '@/lib/aiyourgym/taal/woorden/club/voeding-eigen'
import { stuur } from '@/components/club/app/verzoek'
import { voedingUrl } from '../dagboek/api'
import { DagdoelStap, DagStap, DoelStap, OverJouStap } from './Stappen'
import { macrosGeldig, reken, startConcept, verzoekVan, type Concept, type Indelingen } from './staat'

// Het eigen voedingsplan in vier korte stappen. Stap 2 (rekenhulp) mag over;
// dan vult het lid zelf het dagdoel in. Opslaan of, bij een plan van de
// trainer zonder recht op overschrijven, een voorstel sturen. De server beslist.

interface WizardProps {
  plan: PlanVoorLid | null
  modus: LidPlanModus
  voor: string | null
  onKlaar: (soort: 'opgeslagen' | 'voorstel') => void
  onSluit: () => void
}

export function Wizard({ plan, modus, voor, onKlaar, onSluit }: WizardProps) {
  const t = useTekst(VOEDING_EIGEN)
  const tv = useTekst(VOEDING)
  const taal = useTaal()
  const tw = t.wizard
  const namen: Indelingen = { 3: tw.indeling.drie, 4: tw.indeling.vier, 5: tw.indeling.vijf, 6: tw.indeling.zes }
  const [c, setC] = useState<Concept>(() => startConcept(plan, namen))
  const [stap, setStap] = useState(0)
  const [fouten, setFouten] = useState<string[]>([])
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)
  const kop = useRef<HTMLHeadingElement>(null)
  const eersteKeer = useRef(true)

  useEffect(() => {
    if (eersteKeer.current) {
      eersteKeer.current = false
      return
    }
    kop.current?.focus()
  }, [stap])

  const titels = [tw.doelTitel, tw.overTitel, tw.dagdoelTitel, tw.dagTitel]
  const kanVerder = stap === 0 ? c.doel !== null : stap === 2 ? macrosGeldig(c) : true

  function bereken() {
    const u = reken(c, taal)
    if (!u.ok) return setFouten(u.fouten)
    setFouten([])
    setC(u.concept)
    setStap(2)
  }

  function overslaan() {
    setFouten([])
    setC({ ...c, berekening: null, verbruik: null })
    setStap(2)
  }

  async function bewaar() {
    setBezig(true)
    setFout(null)
    const a = await stuur(voedingUrl('/plan', voor), 'POST', verzoekVan(c))
    setBezig(false)
    if (a.ok) return onKlaar(a.data.soort === 'voorstel' ? 'voorstel' : 'opgeslagen')
    setFout(a.status === 400 ? t.fout.invoer : a.status === 429 ? t.fout.teVaak : a.status === 403 ? t.fout.voorvertoning : t.fout.opslaan)
  }

  const stapProps = { c, onWijzig: setC, t, tv, taal }
  const laatste = stap === titels.length - 1

  return (
    <section className="club-ve-wizard" aria-labelledby="ve-stap-kop">
      <header className="club-ve-wizard-kop">
        <div>
          <span className="club-ve-boventitel">{modus === 'voorstel' ? tw.titelVoorstel : tw.titel} · {tw.stapVan(stap + 1, titels.length)}</span>
          <h3 id="ve-stap-kop" ref={kop} tabIndex={-1}>{titels[stap]}</h3>
        </div>
        <button type="button" className="club-ve-rond" onClick={onSluit} aria-label={tw.sluiten}><X size={18} aria-hidden /></button>
      </header>
      <ol className="club-ve-voortgang" aria-hidden>
        {tw.stappen.map((naam, i) => (
          <li key={naam} className={i <= stap ? 'is-gedaan' : undefined}><span>{naam}</span></li>
        ))}
      </ol>
      {modus === 'voorstel' && stap === 0 && (
        <p className="club-ve-melding">{plan?.trainerNaam ? tw.voorstelUitleg(plan.trainerNaam) : tw.voorstelUitlegZonderNaam}</p>
      )}

      <div className="club-ve-stap" key={stap}>
        {stap === 0 && <DoelStap {...stapProps} />}
        {stap === 1 && <OverJouStap {...stapProps} fouten={fouten} />}
        {stap === 2 && <DagdoelStap {...stapProps} />}
        {stap === 3 && <DagStap {...stapProps} namen={namen} />}
      </div>

      {fout && <p className="club-ve-fout" role="alert">{fout}</p>}
      <footer className="club-ve-wizard-voet">
        {stap > 0 && (
          <button type="button" className="club-lidapp-knop club-lidapp-knop--stil" onClick={() => setStap(stap - 1)} disabled={bezig}>
            <ArrowLeft size={16} aria-hidden /> {tw.terug}
          </button>
        )}
        {stap === 1 ? (
          <>
            <button type="button" className="club-ve-tekstknop" onClick={overslaan}>{tw.overslaan}</button>
            <button type="button" className="club-vd-hoofdknop club-ve-hoofd" onClick={bereken}>{tw.bereken}</button>
          </>
        ) : laatste ? (
          <button type="button" className="club-vd-hoofdknop club-ve-hoofd" onClick={() => void bewaar()} disabled={bezig || !macrosGeldig(c)}>
            {bezig ? tw.bezig : modus === 'voorstel' ? tw.voorstelSturen : tw.opslaan}
          </button>
        ) : (
          <button type="button" className="club-vd-hoofdknop club-ve-hoofd" onClick={() => setStap(stap + 1)} disabled={!kanVerder}>{tw.verder}</button>
        )}
      </footer>
    </section>
  )
}
