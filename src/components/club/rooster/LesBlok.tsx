import Link from 'next/link'
import type { CSSProperties } from 'react'
import { bezettingDeel, bezettingNiveau, type LesOverzicht } from '@/lib/club/rooster/raster'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { ROOSTER } from '@/lib/aiyourgym/taal/woorden/club/rooster'

// Een les als blok in het weekraster of als rij in de daglijst. De soort is
// alleen een dun streepje; de bezetting is het belangrijkste signaal.

interface Props {
  les: LesOverzicht
  href: string
  tijd: string
  isVoorbij: boolean
  isGeopend: boolean
  taal: Taal
  /** Plek in het raster (minuten en baan); zonder = rij in de daglijst. */
  plek?: { van: number; duur: number; baan: number; banen: number }
}

/** Lessen van zo kort of korter krijgen naam en bezetting op een regel. */
const KORTE_LES_MIN = 35

export function Bezetting({ les, taal }: { les: LesOverzicht; taal: Taal }) {
  const t = ROOSTER[taal].les
  const niveau = les.geannuleerd ? 'uit' : bezettingNiveau(les.geboekt, les.capaciteit)
  const stijl = { '--deel': bezettingDeel(les.geboekt, les.capaciteit) } as CSSProperties
  return (
    <span className="club-rooster-bezetting" data-niveau={niveau}>
      <span className="club-rooster-balk" style={stijl} aria-hidden>
        <span />
      </span>
      <span className="club-rooster-teller">
        <span className="club-getal">
          {les.geboekt}/{les.capaciteit}
        </span>
        {les.wachtlijst > 0 && <span className="club-rooster-wacht">{t.wacht(les.wachtlijst)}</span>}
      </span>
    </span>
  )
}

function omschrijving(les: LesOverzicht, tijd: string, taal: Taal): string {
  const t = ROOSTER[taal].les
  const delen = [
    tijd,
    les.lestype?.naam ?? t.les,
    les.instructeur?.naam,
    les.zaal?.naam,
    les.geannuleerd ? t.omschrijvingNietDoor : t.bezet(les.geboekt, les.capaciteit),
    les.wachtlijst > 0 ? t.opWachtlijst(les.wachtlijst) : null,
  ]
  return delen.filter(Boolean).join(', ')
}

export function LesBlok({ les, href, tijd, isVoorbij, isGeopend, plek, taal }: Props) {
  const t = ROOSTER[taal]
  const stijl = plek ? ({ '--van': plek.van, '--duur': plek.duur, '--baan': plek.baan, '--banen': plek.banen } as CSSProperties) : undefined
  const meta = [les.instructeur?.naam, les.zaal?.naam].filter(Boolean).join(' · ')
  return (
    <Link
      href={href}
      scroll={false}
      className={plek ? 'club-rooster-les' : 'club-rooster-rij'}
      style={stijl}
      data-soort={les.lestype?.soort ?? 'overig'}
      data-voorbij={isVoorbij || undefined}
      data-kort={(plek && plek.duur <= KORTE_LES_MIN) || undefined}
      data-geannuleerd={les.geannuleerd || undefined}
      aria-current={isGeopend ? 'true' : undefined}
      aria-label={omschrijving(les, tijd, taal)}
      title={les.lestype ? t.soort[les.lestype.soort] : undefined}
    >
      <span className="club-rooster-les-tijd club-getal">{tijd}</span>
      <span className="club-rooster-les-naam">{les.lestype?.naam ?? t.les.les}</span>
      {meta && <span className="club-rooster-les-meta">{meta}</span>}
      {les.geannuleerd ? <span className="club-rooster-les-uit">{t.les.gaatNietDoor}</span> : <Bezetting les={les} taal={taal} />}
    </Link>
  )
}
