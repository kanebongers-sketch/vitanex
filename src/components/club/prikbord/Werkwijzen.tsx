'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import type { VestigingInfo } from '@/lib/club/kern/vestigingen'
import { VOORBEELDEN, type Voorbeeld } from '@/lib/club/prikbord/typen'
import type { TakenlijstKeuze } from '@/lib/club/prikbord/opslag'
import type { WerkwijzeWeergave } from '@/lib/club/prikbord/weergave'
import { stuur } from '@/components/club/leden/stuur'
import { WerkwijzeEditor } from './WerkwijzeEditor'
import { WerkwijzeKaart, type Modus } from './WerkwijzeKaart'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { PRIKBORD } from '@/lib/aiyourgym/taal/woorden/club/prikbord'

// Blok 2 van het Prikbord: werkwijzen. Wie mag beheren kiest een voorbeeld
// (openen, sluiten, ongeval en EHBO, nieuw lid, klacht) of schrijft een eigen;
// niets wordt automatisch klaargezet (besluit Kane).

interface Props {
  werkwijzen: readonly WerkwijzeWeergave[]
  vestigingen: readonly VestigingInfo[]
  vestiging: string | null
  magBeheren: boolean
  kanUitvoeren: boolean
  takenlijsten: readonly TakenlijstKeuze[]
  open: { id: string; modus: Modus } | null
  onOpen: (o: { id: string; modus: Modus } | null) => void
}

export function Werkwijzen({ werkwijzen, vestigingen, vestiging, magBeheren, kanUitvoeren, takenlijsten, open, onOpen }: Props) {
  const t = useTekst(PRIKBORD).werkwijzen
  const [nieuw, setNieuw] = useState<'kiezen' | 'eigen' | null>(null)

  return (
    <section className="pb-blok" aria-labelledby="pb-werkwijzen">
      <div className="club-sectiekop">
        <h2 id="pb-werkwijzen">{t.kop}</h2>
        {magBeheren && nieuw === null ? (
          <button type="button" className="club-knop club-knop--klein club-knop--primair" onClick={() => setNieuw('kiezen')}>
            <Plus size={14} aria-hidden /> {t.nieuw}
          </button>
        ) : null}
      </div>
      {nieuw === 'kiezen' ? <VoorbeeldKiezer bestaand={werkwijzen} onEigen={() => setNieuw('eigen')} onKlaar={() => setNieuw(null)} /> : null}
      {nieuw === 'eigen' ? <WerkwijzeEditor vestigingen={vestigingen} takenlijsten={takenlijsten} onKlaar={() => setNieuw(null)} /> : null}
      {werkwijzen.length === 0 && nieuw === null ? (
        <p className="club-leeg">{magBeheren ? t.leeg : t.leegTeam}</p>
      ) : (
        <ul className="pb-lijst">
          {werkwijzen.map((w) => (
            <li key={w.werkwijze.id}>
              <WerkwijzeKaart
                w={w}
                vestigingen={vestigingen}
                vestiging={vestiging}
                magBeheren={magBeheren}
                kanUitvoeren={kanUitvoeren}
                takenlijsten={takenlijsten}
                modus={open?.id === w.werkwijze.id ? open.modus : null}
                onModus={(modus) => onOpen(modus ? { id: w.werkwijze.id, modus } : null)}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

interface KiezerProps {
  bestaand: readonly WerkwijzeWeergave[]
  onEigen: () => void
  onKlaar: () => void
}

function VoorbeeldKiezer({ bestaand, onEigen, onKlaar }: KiezerProps) {
  const tekst = useTekst(PRIKBORD)
  const t = tekst.kiezen
  const router = useRouter()
  const [bezig, setBezig] = useState<Voorbeeld | null>(null)
  const [fout, setFout] = useState<string | null>(null)

  async function kies(v: Voorbeeld) {
    if (bezig) return
    setBezig(v)
    setFout(null)
    const uit = await stuur('/api/club/prikbord/werkwijzen', 'POST', { voorbeeld: v })
    setBezig(null)
    if (!uit.ok) return setFout(uit.fout)
    onKlaar()
    router.refresh()
  }

  return (
    <div className="pb-kiezer club-kaart club-kaart--vlak">
      <div>
        <h3>{t.kop}</h3>
        <p className="club-hint">{t.uitleg}</p>
      </div>
      <ul className="pb-voorbeelden">
        {VOORBEELDEN.map((v) => {
          const bestaat = bestaand.some((w) => w.werkwijze.soort === v)
          const voorbeeld = tekst.voorbeelden[v]
          return (
            <li key={v} className="pb-voorbeeld">
              <b>{voorbeeld.titel}</b>
              <span className="club-hint">{voorbeeld.stappen.map((s) => s.tekst).join(' · ')}</span>
              <button type="button" className="club-knop club-knop--klein" onClick={() => void kies(v)} disabled={bezig !== null}>
                {bezig === v ? tekst.formulier.bezig : t.kies}
              </button>
              {bestaat ? <span className="club-chip club-chip--uit">{t.bestaat}</span> : null}
            </li>
          )
        })}
      </ul>
      {fout ? (
        <p className="club-melding club-melding--fout" role="alert">
          {fout}
        </p>
      ) : null}
      <div className="pb-acties">
        <button type="button" className="club-knop club-knop--klein" onClick={onEigen}>
          {t.ofEigen}
        </button>
        <button type="button" className="club-knop club-knop--klein club-knop--stil" onClick={onKlaar}>
          {tekst.formulier.annuleren}
        </button>
      </div>
    </div>
  )
}
