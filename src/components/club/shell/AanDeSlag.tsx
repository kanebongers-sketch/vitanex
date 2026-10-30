'use client'

import Link from 'next/link'
import { useSyncExternalStore } from 'react'
import { usePathname } from 'next/navigation'
import { ArrowRight, X } from 'lucide-react'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { MENU } from '@/lib/aiyourgym/taal/woorden/club/menu'
import { verborgenSleutel, type AanDeSlagStand } from '@/lib/club/menu/aan-de-slag'

// "Aan de slag" in de kop: een kleine ring met de stand ("4 van 8") en een
// link naar de volgende stap. Het kruisje verbergt het voor deze persoon in
// deze browser (localStorage); lukt opslaan niet, dan verbergt het alleen tot
// de volgende pagina. Op de server en bij de eerste weergave staat er niets,
// zodat een weggeklikt blok nooit even knippert.

const GEBEURTENIS = 'club-aan-de-slag'
/** Wat in dit tabblad is weggeklikt, ook als localStorage niet werkt. */
const weg = new Set<string>()

function isWeg(sleutel: string): boolean {
  if (weg.has(sleutel)) return true
  try {
    return window.localStorage.getItem(sleutel) === '1'
  } catch {
    return false
  }
}

function abonneer(opWijziging: () => void): () => void {
  window.addEventListener('storage', opWijziging)
  window.addEventListener(GEBEURTENIS, opWijziging)
  return () => {
    window.removeEventListener('storage', opWijziging)
    window.removeEventListener(GEBEURTENIS, opWijziging)
  }
}

function verberg(sleutel: string): void {
  weg.add(sleutel)
  try {
    window.localStorage.setItem(sleutel, '1')
  } catch {
    // Opslaan kan niet (privevenster of geblokkeerd): het blok blijft weg in dit tabblad.
  }
  window.dispatchEvent(new Event(GEBEURTENIS))
}

/** Een ring met de voortgang; puur versiering (de tekst ernaast zegt hetzelfde). */
function Ring({ af, totaal }: { af: number; totaal: number }) {
  const omtrek = 2 * Math.PI * 7
  const deel = totaal > 0 ? af / totaal : 0
  return (
    <svg className="club-ads-ring" viewBox="0 0 18 18" width="18" height="18" aria-hidden>
      <circle cx="9" cy="9" r="7" className="club-ads-ring-spoor" />
      <circle cx="9" cy="9" r="7" className="club-ads-ring-deel" strokeDasharray={`${omtrek * deel} ${omtrek}`} transform="rotate(-90 9 9)" />
    </svg>
  )
}

interface Props {
  stand: AanDeSlagStand
  persoon: string
  sportschool: string
  /** Op Vandaag staat de grote startkaart al: daar niet dubbel. */
  nietOpVandaag: boolean
}

export function AanDeSlag({ stand, persoon, sportschool, nietOpVandaag }: Props) {
  const t = useTekst(MENU).aanDeSlag
  const pad = usePathname()
  const sleutel = verborgenSleutel(persoon, sportschool, stand)
  const verborgen = useSyncExternalStore(abonneer, () => isWeg(sleutel), () => true)
  if (verborgen || (nietOpVandaag && (pad === '/club' || pad === '/club/'))) return null
  const { af, totaal, volgende } = stand
  const uitleg = volgende.href ? t.volgende(volgende.titel) : t.eigenaar(volgende.titel)
  const inhoud = (
    <>
      <Ring af={af} totaal={totaal} />
      <span className="club-ads-label">{t.label}</span>
      <span className="club-ads-stand" aria-hidden>{t.stand(af, totaal)}</span>
      <span className="club-sr">{`${t.voortgang(af, totaal)}. ${uitleg}`}</span>
      {volgende.href && <ArrowRight aria-hidden size={14} className="club-ads-pijl" />}
    </>
  )
  return (
    <div className="club-ads" role="group" aria-label={t.label}>
      {volgende.href ? (
        <Link href={volgende.href} className="club-ads-link" title={uitleg}>
          {inhoud}
        </Link>
      ) : (
        <span className="club-ads-link" title={uitleg}>
          {inhoud}
        </span>
      )}
      <button type="button" className="club-ads-weg" aria-label={t.verbergen} title={t.verbergen} onClick={() => verberg(sleutel)}>
        <X aria-hidden size={14} />
      </button>
    </div>
  )
}
