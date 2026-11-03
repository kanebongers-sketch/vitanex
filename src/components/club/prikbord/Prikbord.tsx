'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { VestigingInfo } from '@/lib/club/kern/vestigingen'
import type { KladNotitie } from '@/lib/club/kladblok/model'
import type { TakenlijstKeuze } from '@/lib/club/prikbord/opslag'
import type { PrikbordWeergave } from '@/lib/club/prikbord/weergave'
import { stuur } from '@/components/club/leden/stuur'
import { Kladblok } from '@/components/club/kladblok/Kladblok'
import { Mededelingen } from './Mededelingen'
import { Werkwijzen } from './Werkwijzen'
import type { Modus } from './WerkwijzeKaart'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { PRIKBORD } from '@/lib/aiyourgym/taal/woorden/club/prikbord'

// Het Prikbord: drie blokken onder elkaar. 1. Mededelingen, 2. Werkwijzen,
// 3. Notities (het bestaande kladblok; /club/notities blijft het volle scherm).
// Een werkwijze opent via ?w=<id> (link "Hoe doe je dit" vanuit Taken).

interface Props {
  weergave: PrikbordWeergave | null
  vestigingen: readonly VestigingInfo[]
  vestiging: string | null
  magPlaatsen: boolean
  magBeheren: boolean
  kanBevestigen: boolean
  takenlijsten: readonly TakenlijstKeuze[]
  /** undefined = geen blok Notities (geen recht); null = laden mislukt. */
  notities: KladNotitie[] | null | undefined
  werkwijzeVanNotitie: Readonly<Record<string, string>>
  startWerkwijze: string | null
}

export function Prikbord(p: Props) {
  const t = useTekst(PRIKBORD)
  const [open, setOpen] = useState<{ id: string; modus: Modus } | null>(p.startWerkwijze ? { id: p.startWerkwijze, modus: 'lezen' } : null)

  useEffect(() => {
    if (open) document.getElementById(`werkwijze-${open.id}`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [open])

  const openWerkwijze = (id: string) => setOpen({ id, modus: 'lezen' })

  return (
    <div className="pb">
      {p.weergave ? (
        <>
          <Mededelingen
            lopend={p.weergave.lopend}
            archief={p.weergave.archief}
            vestigingen={p.vestigingen}
            magPlaatsen={p.magPlaatsen}
            kanBevestigen={p.kanBevestigen}
            onOpenWerkwijze={openWerkwijze}
          />
          <Werkwijzen
            werkwijzen={p.weergave.werkwijzen}
            vestigingen={p.vestigingen}
            vestiging={p.vestiging}
            magBeheren={p.magBeheren}
            kanUitvoeren={p.kanBevestigen}
            takenlijsten={p.takenlijsten}
            open={open}
            onOpen={setOpen}
          />
        </>
      ) : null}
      {p.notities !== undefined && p.vestiging ? (
        <section className="pb-blok" aria-labelledby="pb-notities">
          <div className="club-sectiekop">
            <h2 id="pb-notities">{t.notities.kop}</h2>
          </div>
          {p.notities === null ? (
            <p className="club-melding club-melding--fout" role="alert">
              {t.pagina.fout}
            </p>
          ) : (
            <Kladblok
              key={p.vestiging}
              vestiging={p.vestiging}
              begin={p.notities}
              startId={null}
              notitieActie={(n) => <NotitieNaarWerkwijze notitie={n} bestaand={p.werkwijzeVanNotitie[n.id] ?? null} magMaken={p.magBeheren} onOpen={openWerkwijze} />}
            />
          )}
        </section>
      ) : null}
    </div>
  )
}

interface NaarProps {
  notitie: KladNotitie
  bestaand: string | null
  magMaken: boolean
  onOpen: (id: string) => void
}

/** Bij een notitie in Kennis: "Maak er een werkwijze van" (kopie), of de link naar die werkwijze. */
function NotitieNaarWerkwijze({ notitie, bestaand, magMaken, onOpen }: NaarProps) {
  const t = useTekst(PRIKBORD)
  const router = useRouter()
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)
  if (bestaand) {
    return (
      <button type="button" className="club-knop club-knop--stil club-knop--klein" onClick={() => onOpen(bestaand)}>
        {t.notities.naarWerkwijze}
      </button>
    )
  }
  if (!magMaken || notitie.map !== 'kennis' || notitie.gearchiveerd) return null

  async function maak() {
    if (bezig) return
    setBezig(true)
    setFout(null)
    const uit = await stuur('/api/club/prikbord/werkwijzen', 'POST', { notitieId: notitie.id })
    setBezig(false)
    if (!uit.ok) return setFout(uit.fout)
    router.refresh()
  }

  return (
    <>
      <button type="button" className="club-knop club-knop--stil club-knop--klein" onClick={() => void maak()} disabled={bezig}>
        {bezig ? t.formulier.bezig : t.notities.maakWerkwijze}
      </button>
      {fout ? (
        <span className="club-fout" role="alert">
          {fout}
        </span>
      ) : null}
    </>
  )
}
