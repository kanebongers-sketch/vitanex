'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Ban, QrCode } from 'lucide-react'
import { stuur } from '@/components/club/leden/stuur'
import type { LinkOpScherm } from '@/lib/club/nieuwe-leden/links-opslag'
import { useTaal, useTekst } from '@/lib/aiyourgym/taal/client'
import { formatDatum } from '@/lib/aiyourgym/taal/formaat'
import { NIEUWE_LEDEN } from '@/lib/aiyourgym/taal/woorden/club/nieuwe-leden'
import { QrPaneel } from './QrPaneel'
import { aanmeldUrl } from './AanmeldlinkMaken'
import type { VormKeuze } from './NieuweLedenKnoppen'
import './nieuwe-leden.css'

// De lijst met aanmeldlinks: per link de stand (werkt, verlopen, gebruikt,
// ingetrokken), hoe vaak gebruikt, tot wanneer, en de knoppen QR tonen en
// Intrekken (met bevestiging). Een ingetrokken link en zijn QR werken meteen niet meer.

interface Props {
  links: LinkOpScherm[]
  vormen: VormKeuze[]
  sportschool: string
  basis: string
  bewerken: boolean
}

const CHIP: Record<LinkOpScherm['staat'], string> = { open: 'club-chip--ok', verlopen: 'club-chip--uit', vol: 'club-chip--uit', ingetrokken: 'club-chip--let-op' }

export function AanmeldlinkLijst({ links, vormen, sportschool, basis, bewerken }: Props) {
  const tekst = useTekst(NIEUWE_LEDEN)
  const w = tekst.lijst
  const taal = useTaal()
  const router = useRouter()
  const [open, setOpen] = useState<string | null>(null)
  const [vraag, setVraag] = useState<string | null>(null)
  const [fout, setFout] = useState<string | null>(null)

  async function trekIn(id: string) {
    setFout(null)
    const r = await stuur(`/api/club/leden/aanmeldlinks/${encodeURIComponent(id)}`, 'DELETE')
    setVraag(null)
    if (!r.ok) return setFout(r.fout)
    router.refresh()
  }

  if (links.length === 0) return <p className="club-melding" role="status">{w.leeg}</p>

  return (
    <>
      {fout && <p className="club-melding club-melding--fout" role="alert">{fout}</p>}
      <ul className="club-lijst club-kaart club-nl-links">
        {links.map((l) => {
          const vorm = l.vormId ? vormen.find((v) => v.id === l.vormId)?.naam ?? null : null
          const tot = l.verlooptOp ? w.tot(formatDatum(l.verlooptOp, taal, 'kort')) : w.zonderEinde
          return (
            <li key={l.id} className="club-nl-link">
              <div className="club-rij">
                <div className="club-rij-hoofd">
                  <span className="club-rij-titel">{l.naam ?? w.naamLeeg}</span>
                  <span className="club-rij-sub">{[w.gebruikt(l.gebruikt, l.maxGebruik), tot, vorm ? w.vast(vorm) : null].filter(Boolean).join(' · ')}</span>
                </div>
                <span className={`club-chip ${CHIP[l.staat]}`}>{w.staat[l.staat]}</span>
                {l.staat === 'open' && (
                  <button type="button" className="club-knop club-knop--klein" aria-expanded={open === l.id} onClick={() => setOpen(open === l.id ? null : l.id)}>
                    <QrCode size={15} aria-hidden /> {w.tonen}
                  </button>
                )}
                {bewerken && l.staat !== 'ingetrokken' && (
                  <button type="button" className="club-knop club-knop--klein club-knop--stil" onClick={() => setVraag(l.id)}>
                    <Ban size={15} aria-hidden /> {w.intrekken}
                  </button>
                )}
              </div>
              {vraag === l.id && (
                <div className="club-nl-vraag" role="alertdialog" aria-label={w.intrekkenVraag}>
                  <p>{w.intrekkenVraag}</p>
                  <button type="button" className="club-knop club-knop--klein" onClick={() => setVraag(null)}>{w.nee}</button>
                  <button type="button" className="club-knop club-knop--klein club-knop--primair" onClick={() => void trekIn(l.id)}>{w.ja}</button>
                </div>
              )}
              {open === l.id && l.staat === 'open' && (
                <div className="club-nl-link-qr">
                  <QrPaneel url={aanmeldUrl(basis, l.code)} sportschool={sportschool} posterHref={`/club/leden/aanmeldlinks/${l.id}/poster`} />
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </>
  )
}
