'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import type { AfspraakType, AfspraakWeergave } from '@/lib/club/afspraken/model'
import { nlDatumTijd, perDag, type Raster, type Weergave } from '@/lib/club/afspraken/weergave'
import { AfspraakFormulier, type NieuwStart, type Persoon } from './AfspraakFormulier'
import { AfspraakDetail } from './AfspraakDetail'
import { DagRaster } from './DagRaster'
import { Paneel } from './Paneel'
import { WeekOverzicht } from './WeekOverzicht'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { AFSPRAKEN } from '@/lib/aiyourgym/taal/woorden/club/afspraken'

// Het werkvlak van de afspraken: week of dag, plus het zijpaneel om een
// afspraak te maken of te openen. Na elke wijziging ververst de pagina.

type Open = { soort: 'nieuw'; start: NieuwStart } | { soort: 'afspraak'; id: string } | null

interface Props {
  vestiging: string
  weergave: Weergave
  maandag: string
  dag: string
  vandaag: string
  nuMinuten: number
  afspraken: AfspraakWeergave[]
  /** Kolommen en namen: alle trainers die een type geven, of de gefilterde. */
  trainers: Persoon[]
  /** Iedereen die een naam kan hebben in de lijst (ook oud-trainers). */
  namen: Persoon[]
  typen: AfspraakType[]
  typeTrainers: Record<string, string[]>
  leads: Persoon[]
  raster: Raster
  filterTrainer: string | null
}

export function AfsprakenWerkvlak(p: Props) {
  const router = useRouter()
  const [open, setOpen] = useState<Open>(null)
  const [melding, setMelding] = useState<string | null>(null)
  const [, startTransition] = useTransition()
  const t = useTekst(AFSPRAKEN).werkvlak
  const naamVan = new Map(p.namen.map((m) => [m.id, m.naam]))
  const trainerNaam = (id: string) => naamVan.get(id) ?? t.onbekend
  const gekozen = open?.soort === 'afspraak' ? p.afspraken.find((a) => a.id === open.id) ?? null : null

  function klaar(tekst: string) {
    setOpen(null)
    setMelding(tekst)
    startTransition(() => router.refresh())
  }

  const nieuw = (start: NieuwStart) => {
    setMelding(null)
    setOpen({ soort: 'nieuw', start })
  }
  const kies = (a: AfspraakWeergave) => {
    setMelding(null)
    setOpen({ soort: 'afspraak', id: a.id })
  }
  const verplaatsTrainers = (a: AfspraakWeergave): Persoon[] => {
    const ids = new Set([...(p.typeTrainers[a.typeId] ?? []), a.medewerkerId])
    return p.namen.filter((m) => ids.has(m.id))
  }

  return (
    <>
      <div className="club-acties club-afspraken-actiebalk">
        <button type="button" className="club-knop club-knop--primair" onClick={() => nieuw({ datum: p.weergave === 'dag' ? p.dag : p.vandaag, medewerkerId: p.filterTrainer })}>
          <Plus size={16} aria-hidden /> {t.nieuw}
        </button>
        <p className="club-afspraken-melding" role="status" aria-live="polite">{melding}</p>
      </div>

      {p.weergave === 'week' ? (
        <WeekOverzicht
          dagen={perDag(p.afspraken, p.maandag)}
          vandaag={p.vandaag}
          trainerNaam={trainerNaam}
          onKies={kies}
          onNieuw={(datum) => nieuw({ datum, medewerkerId: p.filterTrainer })}
        />
      ) : (
        <DagRaster
          datum={p.dag}
          raster={p.raster}
          trainers={p.trainers}
          afspraken={p.afspraken.filter((a) => a.status !== 'geannuleerd' && nlDatumTijd(a.start).datum === p.dag)}
          nuMinuten={p.dag === p.vandaag ? p.nuMinuten : null}
          magNieuw={p.dag >= p.vandaag}
          onKies={kies}
          onNieuw={(medewerkerId) => nieuw({ datum: p.dag, medewerkerId })}
        />
      )}

      {open?.soort === 'nieuw' ? (
        <Paneel label={t.nieuw} onSluit={() => setOpen(null)}>
          <AfspraakFormulier vestiging={p.vestiging} typen={p.typen} typeTrainers={p.typeTrainers} trainers={p.namen} leads={p.leads} start={open.start} vandaag={p.vandaag} onKlaar={klaar} onSluit={() => setOpen(null)} />
        </Paneel>
      ) : null}
      {gekozen ? (
        <Paneel label={t.afspraakMet(gekozen.lidNaam)} onSluit={() => setOpen(null)}>
          <AfspraakDetail key={gekozen.id} afspraak={gekozen} vestiging={p.vestiging} trainerNaam={trainerNaam(gekozen.medewerkerId)} trainers={verplaatsTrainers(gekozen)} vandaag={p.vandaag} onKlaar={klaar} />
        </Paneel>
      ) : null}
    </>
  )
}
