'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ProviderKaart } from '@/lib/club/health/providers'
import type { KoppelingPubliek } from '@/lib/club/health/opslag'
import type { DataSoort } from '@/lib/club/health/typen'
import { stuur } from '@/components/club/app/verzoek'
import { useTaal, useTekst } from '@/lib/aiyourgym/taal/client'
import { HEALTH } from '@/lib/aiyourgym/taal/woorden/ledenapp/health'
import { NativeKoppeling } from './NativeKoppeling'
import { datumKort, healthUrl } from './paden'

// Een kaart per bron: logo (of beginletter), status, uitleg en de knop.
// "Binnenkort" heeft geen knop: we beloven niets wat nog niet werkt.

interface BronKaartProps {
  p: ProviderKaart
  koppeling: KoppelingPubliek | null
  /** Soorten van deze bron waarvoor het lid toestemming gaf. */
  toegestaan: readonly DataSoort[]
  voor: string | null
  alleenLezen: boolean
  /** Wist deze bron alles bij ontkoppelen (regel van de leverancier)? */
  altijdWissen: boolean
}

type StatusTekst = (typeof HEALTH)['nl']['status']

function statusVan(p: ProviderKaart, k: KoppelingPubliek | null, s: StatusTekst): { tekst: string; toon?: 'aan' | 'let' } {
  if (k?.status === 'actief') return { tekst: s.gekoppeld, toon: 'aan' }
  if (k?.status === 'fout') return { tekst: s.fout, toon: 'let' }
  if (k?.status === 'opnieuw_koppelen' || k?.status === 'ingetrokken') return { tekst: s.opnieuw, toon: 'let' }
  if (p.status === 'beschikbaar') return { tekst: s.beschikbaar }
  if (p.status === 'alleen_app') return { tekst: s.alleenApp }
  return { tekst: s.binnenkort }
}

function Ontkoppelen({ p, voor, altijdWissen, klaar }: { p: ProviderKaart; voor: string | null; altijdWissen: boolean; klaar: () => void }) {
  const [wissen, setWissen] = useState(altijdWissen)
  const h = useTekst(HEALTH)
  const k = h.kaart
  const naam = h.bronnen[p.id].naam
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)
  const ontkoppel = async () => {
    setBezig(true)
    const r = await stuur(healthUrl(`/ontkoppelen/${p.id}`, voor), 'POST', { wissen })
    setBezig(false)
    if (!r.ok) return setFout(r.fout)
    klaar()
  }
  return (
    <div className="club-hl-ontkoppel">
      <p>{k.ontkoppelUitleg(naam, p.native)}</p>
      <label className="club-hl-akkoord">
        <input type="checkbox" className="club-hl-vink" checked={wissen} disabled={altijdWissen} onChange={(e) => setWissen(e.target.checked)} />
        <span>{altijdWissen ? k.altijdWissen(naam) : k.ookWissen(naam)}</span>
      </label>
      <div className="club-hl-acties">
        <button type="button" className="club-lidapp-knop" disabled={bezig} onClick={ontkoppel}>
          {k.ontkoppelen}
        </button>
      </div>
      {fout && (
        <p className="club-hl-melding" data-soort="fout" role="alert">
          {fout}
        </p>
      )}
    </div>
  )
}

export function BronKaart({ p, koppeling, toegestaan, voor, alleenLezen, altijdWissen }: BronKaartProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const taal = useTaal()
  const h = useTekst(HEALTH)
  const bron = h.bronnen[p.id]
  const status = statusVan(p, koppeling, h.status)
  const gekoppeld = koppeling !== null && koppeling.status !== 'ingetrokken'
  const kanKoppelen = p.status === 'beschikbaar' && !alleenLezen && toegestaan.length > 0
  return (
    <li className="club-hl-bron" data-status={p.status} data-gekoppeld={gekoppeld ? 'ja' : 'nee'}>
      <span className="club-hl-logo" aria-hidden>
        {p.logo ? <img src={p.logo} alt="" width={44} height={44} /> : bron.naam.charAt(0)}
      </span>
      <div className="club-hl-bron-tekst">
        <span className="club-hl-bron-naam">
          {bron.naam}
          <span className="club-hl-status" data-toon={status.toon}>
            {status.tekst}
          </span>
        </span>
        <p>{bron.omschrijving}</p>
        {bron.kanttekening && <p className="club-hl-noot">{bron.kanttekening}</p>}
        {koppeling?.laatsteSyncOp && <p className="club-hl-noot">{h.kaart.laatst(datumKort(koppeling.laatsteSyncOp, taal))}</p>}
      </div>
      <div className="club-hl-acties">
        {p.native && p.status === 'alleen_app' && <NativeKoppeling bron={p.id === 'apple_health' ? 'apple_health' : 'health_connect'} soorten={toegestaan} voor={voor} alleenLezen={alleenLezen} />}
        {!p.native && !gekoppeld && kanKoppelen && (
          <a className="club-lidapp-knop club-lidapp-knop--primair" href={healthUrl(`/koppelen/${p.id}`, voor)}>
            {koppeling ? h.kaart.opnieuwKoppelen : h.kaart.koppelen}
          </a>
        )}
        {!gekoppeld && p.status === 'beschikbaar' && toegestaan.length === 0 && <span className="club-hl-noot">{h.kaart.eerstAanvinken}</span>}
        {gekoppeld && !alleenLezen && !open && (
          <button type="button" className="club-lidapp-knop club-lidapp-knop--stil" onClick={() => setOpen(true)}>
            {h.kaart.ontkoppelen}
          </button>
        )}
      </div>
      {open && <Ontkoppelen p={p} voor={voor} altijdWissen={altijdWissen} klaar={() => { setOpen(false); router.refresh() }} />}
    </li>
  )
}
