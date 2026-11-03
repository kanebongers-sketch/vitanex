'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { VestigingInfo } from '@/lib/club/kern/vestigingen'
import { GRENZEN, type Werkwijze } from '@/lib/club/prikbord/typen'
import { stuur } from '@/components/club/leden/stuur'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { PRIKBORD } from '@/lib/aiyourgym/taal/woorden/club/prikbord'

// Een werkwijze uitvoeren: de stappen afvinken in de vestiging waar je bent,
// met een notitie (vaste waarschuwing: geen medische details). Klaar legt
// vast wie, wanneer, waar en welke stappen. Openen en sluiten vink je
// dagelijks af in Taken; dit is voor wat niet elke dag gebeurt.

interface Props {
  werkwijze: Werkwijze
  vestigingen: readonly VestigingInfo[]
  vestiging: string | null
  onKlaar: () => void
}

export function WerkwijzeUitvoeren({ werkwijze, vestigingen, vestiging, onKlaar }: Props) {
  const tekst = useTekst(PRIKBORD)
  const t = tekst.uitvoeren
  const router = useRouter()
  const [gestartOp] = useState(() => new Date().toISOString())
  const [vinkjes, setVinkjes] = useState<number[]>([])
  const [waar, setWaar] = useState(vestiging ?? vestigingen[0]?.sleutel ?? '')
  const [notitie, setNotitie] = useState('')
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)
  const [klaar, setKlaar] = useState(false)
  const open = werkwijze.stappen.length - vinkjes.length

  const wissel = (i: number) => setVinkjes((nu) => (nu.includes(i) ? nu.filter((x) => x !== i) : [...nu, i]))

  async function rondAf() {
    if (bezig) return
    setBezig(true)
    setFout(null)
    const uit = await stuur('/api/club/prikbord/uitvoeringen', 'POST', { werkwijzeId: werkwijze.id, versie: werkwijze.versie, vestiging: waar, gestartOp, afgevinkt: vinkjes, notitie })
    setBezig(false)
    if (!uit.ok) return setFout(uit.fout)
    setKlaar(true)
    router.refresh()
  }

  if (klaar) {
    return (
      <div className="pb-uitvoeren">
        <p className="club-melding club-melding--ok" role="status">
          {t.opgeslagen}
        </p>
        <button type="button" className="club-knop club-knop--klein" onClick={onKlaar}>
          {tekst.werkwijzen.sluiten}
        </button>
      </div>
    )
  }

  return (
    <div className="pb-uitvoeren">
      <ol className="pb-afvinken">
        {werkwijze.stappen.map((s, i) => (
          <li key={i}>
            <label className="pb-vink">
              <input type="checkbox" checked={vinkjes.includes(i)} onChange={() => wissel(i)} />
              <span>
                <b>{s.tekst}</b>
                {s.uitleg ? <span className="club-hint">{s.uitleg}</span> : null}
              </span>
            </label>
          </li>
        ))}
      </ol>
      {vestigingen.length > 1 ? (
        <label className="club-veld pb-smal">
          <span>{t.vestiging}</span>
          <select className="club-invoer" value={waar} onChange={(e) => setWaar(e.target.value)}>
            {vestigingen.map((v) => (
              <option key={v.sleutel} value={v.sleutel}>
                {v.naam}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <label className="club-veld">
        <span>{t.notitie}</span>
        <textarea className="club-invoer" value={notitie} onChange={(e) => setNotitie(e.target.value)} maxLength={GRENZEN.notitie} rows={3} aria-describedby={`pb-waarschuwing-${werkwijze.id}`} />
        <span id={`pb-waarschuwing-${werkwijze.id}`} className="pb-waarschuwing">
          {t.waarschuwing}
        </span>
      </label>
      {fout ? (
        <p className="club-melding club-melding--fout" role="alert">
          {fout}
        </p>
      ) : null}
      <div className="pb-acties">
        <button type="button" className="club-knop club-knop--primair" onClick={() => void rondAf()} disabled={bezig || !waar}>
          {bezig ? t.bezig : t.klaar}
        </button>
        {open > 0 ? <span className="club-hint">{t.nogOpen(open)}</span> : null}
        <button type="button" className="club-knop club-knop--stil" onClick={onKlaar}>
          {tekst.formulier.annuleren}
        </button>
      </div>
    </div>
  )
}
