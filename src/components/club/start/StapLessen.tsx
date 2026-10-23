'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { SportschoolSoort } from '@/lib/club/start/soorten'
import type { VoorbeeldLes, VoorbeeldLestype } from '@/lib/club/start/voorbeelden'
import {
  aantalWijzigingen,
  beginLessen,
  beginTypen,
  controleerLessen,
  legeLes,
  leegType,
  lessenPlan,
  zichtbareLessen,
  type BestaandeSerie,
  type BestaandType,
  type LesRij,
  type TypeRij,
} from '@/lib/club/start/lessen-plan'
import { AlvastIngevuld } from './AlvastIngevuld'
import { LestypeKeuze } from './LestypeKeuze'
import { WeekLessen, type Keuze } from './WeekLessen'
import { ZalenEnInstructeurs } from './ZalenEnInstructeurs'
import { slaLessenOp } from './lessen-opslaan'
import { StartVoet, type StartVoetProps } from './StartVoet'
import { stuur } from '@/components/club/leden/stuur'

// Stap 5: alles voor de groepslessen in een scherm. De lestypen die bij de
// soort sportschool passen staan al aan, de voorgestelde week ook. Naam, duur
// en uitleg, en per les dag, tijd, plekken, zaal en instructeur pas je hier
// meteen aan. Bij verder slaat de stap alles op (dezelfde API's als
// Instellingen) en zet de vaste lessen in het rooster voor de komende 6 weken.
// Verder kan alleen met minstens een lestype, en met vaste lessen of de keuze
// "Ik heb geen vaste lessen" (de regel in stappen.ts).

interface StapLessenProps {
  vestiging: string
  vestigingNaam: string
  soort: SportschoolSoort | null
  lestypen: BestaandType[]
  series: BestaandeSerie[]
  zalen: Keuze[]
  instructeurs: Keuze[]
  /** Vandaag als jjjj-mm-dd: vaste lessen lopen vanaf vandaag. */
  vandaag: string
  /** De lestypen die bij de soort passen (staan aan bij een nieuwe sportschool). */
  passend: readonly VoorbeeldLestype[]
  /** Alle voorbeeldlestypen om uit te kiezen. */
  bibliotheek: readonly VoorbeeldLestype[]
  voorbeeldLessen: readonly VoorbeeldLes[]
  /** Bevestigde de eigenaar al dat er geen vaste lessen zijn? */
  geenVasteLessen: boolean
  voet: Omit<StartVoetProps, 'voorVerder' | 'primair'>
}

export function StapLessen(p: StapLessenProps) {
  const router = useRouter()
  const [basis, setBasis] = useState(() => {
    const typen = beginTypen(p.lestypen, p.passend, p.bibliotheek)
    return { typen, lessen: beginLessen(typen, p.series, p.voorbeeldLessen, p.zalen.length === 1 ? p.zalen[0].id : null) }
  })
  const [typen, setTypen] = useState<TypeRij[]>(basis.typen)
  const [lessen, setLessen] = useState<LesRij[]>(basis.lessen)
  const [zalen, setZalen] = useState<Keuze[]>(p.zalen)
  const [instructeurs, setInstructeurs] = useState<Keuze[]>(p.instructeurs)
  const [teller, setTeller] = useState(1)
  const [stand, setStand] = useState<string | null>(null)
  const [fout, setFout] = useState<string | null>(null)
  const [geen, setGeen] = useState(p.geenVasteLessen)
  const zichtbaar = useMemo(() => zichtbareLessen(lessen, typen), [lessen, typen])
  const wijzigingen = aantalWijzigingen(lessenPlan(typen, lessen, basis.typen, basis.lessen))

  function wisselType(sleutel: string) {
    setFout(null)
    setTypen((oud) => (sleutel.startsWith('nieuw:') ? oud.filter((t) => t.sleutel !== sleutel) : oud.map((t) => (t.sleutel === sleutel ? { ...t, aan: !t.aan } : t))))
  }

  function wijzigType(sleutel: string, w: Partial<TypeRij>) {
    setFout(null)
    setTypen((oud) => oud.map((t) => (t.sleutel === sleutel ? { ...t, ...w } : t)))
  }

  function wijzigLes(sleutel: string, w: Partial<LesRij>) {
    setFout(null)
    setLessen((oud) => oud.map((l) => (l.sleutel === sleutel ? { ...l, ...w } : l)))
  }

  function nieuwType() {
    setTypen((oud) => [...oud, leegType(teller)])
    setTeller((n) => n + 1)
  }

  function nieuweLes() {
    const les = legeLes(typen, teller, zalen.length === 1 ? zalen[0].id : null)
    if (!les) return
    setLessen((oud) => [...oud, les])
    setTeller((n) => n + 1)
  }

  /** Alleen bij verder: minstens een lestype, en vaste lessen of bewust geen. */
  function inhoudFout(): string | null {
    if (!typen.some((t) => t.aan)) return 'Kies minstens een lestype dat je geeft.'
    if (!zichtbaar.some((l) => l.aan) && !geen) return 'Zet minstens een vaste les in je week, of vink aan dat je geen vaste lessen hebt.'
    return null
  }

  async function bewaarGeen(): Promise<boolean> {
    const nu = geen && !zichtbaar.some((l) => l.aan)
    if (nu === p.geenVasteLessen) return true
    const uit = await stuur('/api/club/start', 'PATCH', { bevestig: { geen_vaste_lessen: nu } })
    if (!uit.ok) setFout(uit.fout)
    return uit.ok
  }

  async function voorVerder(doel: 'verder' | 'stoppen'): Promise<boolean> {
    setFout(null)
    const controle = controleerLessen(typen, lessen) ?? (doel === 'verder' ? inhoudFout() : null)
    if (controle) {
      setFout(controle)
      return false
    }
    if (!(await bewaarGeen())) return false
    if (wijzigingen === 0) return true
    const uit = await slaLessenOp({ vestiging: p.vestiging, vandaag: p.vandaag, typen, lessen, basisTypen: basis.typen, basisLessen: basis.lessen, bij: setStand })
    setStand(null)
    setTypen(uit.typen)
    setLessen(uit.lessen)
    if (uit.fout) {
      setBasis((b) => ({ typen: uit.typen.map((t) => b.typen.find((x) => x.sleutel === t.sleutel && x.id === t.id) ?? t), lessen: uit.lessen.map((l) => b.lessen.find((x) => x.sleutel === l.sleutel && x.id === l.id) ?? l) }))
      setFout(`${uit.fout} Wat al gelukt is blijft staan; probeer het nog een keer.`)
      return false
    }
    setBasis({ typen: uit.typen, lessen: uit.lessen })
    router.refresh()
    return true
  }

  return (
    <>
      <div className="club-start-lessen">
        <AlvastIngevuld soort={p.soort} />
        <LestypeKeuze typen={typen} onWissel={wisselType} onWijzig={wijzigType} onNieuw={nieuwType} soort={p.soort} />
        <div className="club-start-lessen-onder">
          <WeekLessen
            vestigingNaam={p.vestigingNaam}
            lessen={zichtbaar}
            typen={typen}
            zalen={zalen}
            instructeurs={instructeurs}
            onWijzig={wijzigLes}
            onNieuw={nieuweLes}
            geen={geen}
            onGeen={(g) => {
              setFout(null)
              setGeen(g)
            }}
          />
          <ZalenEnInstructeurs
            vestiging={p.vestiging}
            zalen={zalen}
            instructeurs={instructeurs}
            onZaal={(z) => setZalen((oud) => [...oud, z])}
            onInstructeur={(m) => setInstructeurs((oud) => [...oud, m])}
          />
        </div>
        <div aria-live="polite">
          {stand && <p className="club-melding" role="status">Bezig met opslaan: {stand}...</p>}
          {fout && <p className="club-melding club-melding--fout" role="alert">{fout}</p>}
        </div>
      </div>
      <StartVoet {...p.voet} voorVerder={voorVerder} primair={wijzigingen > 0 || geen !== p.geenVasteLessen ? 'Opslaan en verder' : undefined} />
    </>
  )
}
