'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Kaart, NogNiets } from '@/components/lifeos/os/Kaart'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'
import { haalJson } from '@/lib/lifeos/api/http'
import { datumSleutel } from '@/lib/lifeos/datum/datum'
import { leesVoedingAntwoord, type VoedingDoelen, type VoedingLog } from '@/lib/lifeos/voeding/voeding'
import { dagTotalen } from '@/lib/lifeos/voeding/totalen'
import { dagSamenvatting } from '@/lib/lifeos/voeding/formatteer'
import { MacroWaarde } from './MacroWaarde'

// De dagtotalen. Vervangt het dagoverzicht van MyFitnessPal.
//
// ─── HET EERLIJKE PUNT VAN DEZE KAART ───────────────────────────────────────
// Logde je drie maaltijden en vulde je bij één de eiwitten in, dan is het
// eiwittotaal onvolledig — en dat staat er dan ook: "42 g · uit 1 van 3
// maaltijden". Niet stilzwijgend 0 optellen voor de andere twee, want dan leest
// 42 als je dagtotaal en concludeer je dat je te weinig at, terwijl je alleen
// te weinig getypt hebt.
//
// De dekking komt uit `totalen.ts` en reist mee ín het `Totaal`-object. Deze
// kaart kán het getal dus niet tonen zonder de nuance tegen te komen — dat is
// waarom die twee daar in één type zitten en niet in twee losse variabelen.
//
// Geen advies. Geen "je eet te weinig eiwit". Cijfers tonen, niet oordelen.

type Staat =
  | { fase: 'laden' }
  | { fase: 'fout'; bericht: string }
  | { fase: 'ok'; logs: VoedingLog[]; doelen: VoedingDoelen }

export function MacrosKaart() {
  const [staat, setStaat] = useState<Staat>({ fase: 'laden' })

  const dagRef = useRef<string | null>(null)
  const generatie = useRef(0)

  const laad = useCallback((voorDag: string): Promise<void> => {
    const mijn = ++generatie.current
    return haalJson(`/api/lifeos/voeding?datum=${encodeURIComponent(voorDag)}`, leesVoedingAntwoord).then(
      (uitkomst) => {
        if (mijn !== generatie.current) return
        setStaat(
          uitkomst.ok
            ? { fase: 'ok', logs: uitkomst.waarde.logs, doelen: uitkomst.waarde.doelen }
            : { fase: 'fout', bericht: uitkomst.fout },
        )
      },
    )
  }, [])

  const verval = useCallback(() => {
    generatie.current++
  }, [])

  useEffect(() => {
    const dag = datumSleutel(new Date())
    dagRef.current = dag
    void laad(dag)
    return verval
  }, [laad, verval])

  const opnieuw = useCallback(() => {
    const dag = dagRef.current
    if (!dag) return
    setStaat({ fase: 'laden' })
    void laad(dag)
  }, [laad])

  return (
    <Kaart titel="Macro's vandaag" vervangt="MyFitnessPal">
      {staat.fase === 'laden' ? <Skelet /> : null}

      {staat.fase === 'fout' ? <Foutmelding bericht={staat.bericht} opnieuw={opnieuw} /> : null}

      {staat.fase === 'ok' ? <Totalen logs={staat.logs} doelen={staat.doelen} /> : null}
    </Kaart>
  )
}

function Totalen({ logs, doelen }: { logs: readonly VoedingLog[]; doelen: VoedingDoelen }) {
  const t = dagTotalen(logs)

  if (t.logs === 0) {
    return (
      <NogNiets
        wat="Nog niets gelogd vandaag"
        waarom="Log iets bij Voeding, dan staat je dag hier bij elkaar."
      />
    )
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {/* Eén <dl>: dit ís een lijst van naam → waarde. De calorieën staan er
          niet buiten maar spannen de volle breedte — hiërarchie via schaal en
          ruimte, niet via een apart element. */}
      <dl
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(108px, 1fr))',
          gap: '16px 18px',
          margin: 0,
        }}
      >
        <MacroWaarde label="Calorieën" totaal={t.kcal} eenheid="kcal" doel={doelen.kcalDoel} groot />
        <MacroWaarde label="Eiwit" totaal={t.eiwit} eenheid="g" doel={doelen.eiwitDoelG} decimalen={1} />
        <MacroWaarde label="Koolhydraten" totaal={t.koolhydraten} eenheid="g" decimalen={1} />
        <MacroWaarde label="Vet" totaal={t.vet} eenheid="g" decimalen={1} />
      </dl>

      <p style={{ fontSize: 12, color: 'var(--text-4)', margin: 0, lineHeight: 1.5 }}>
        {dagSamenvatting(t.logs)}
      </p>
    </div>
  )
}

function Skelet() {
  return (
    <div aria-hidden="true" style={{ display: 'grid', gap: 14 }}>
      <div style={{ height: 34, width: '46%', borderRadius: 6, background: 'var(--bg-raised)' }} />
      <div style={{ display: 'flex', gap: 16 }}>
        {[1, 2, 3].map((i) => (
          <div key={i} style={{ height: 30, flex: 1, borderRadius: 4, background: 'var(--bg-raised)' }} />
        ))}
      </div>
    </div>
  )
}
