import Link from 'next/link'
import type { CSSProperties } from 'react'
import { bezettingDeel, bezettingNiveau, type LesOverzicht } from '@/lib/club/rooster/raster'
import { SOORT_LABEL } from '@/lib/club/rooster/typen'

// Een les als blok in het weekraster of als rij in de daglijst. De soort is
// alleen een dun streepje; de bezetting is het belangrijkste signaal.

interface Props {
  les: LesOverzicht
  href: string
  tijd: string
  isVoorbij: boolean
  isGeopend: boolean
  /** Plek in het raster (minuten en baan); zonder = rij in de daglijst. */
  plek?: { van: number; duur: number; baan: number; banen: number }
}

/** Lessen van zo kort of korter krijgen naam en bezetting op een regel. */
const KORTE_LES_MIN = 35

export function Bezetting({ les }: { les: LesOverzicht }) {
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
        {les.wachtlijst > 0 && <span className="club-rooster-wacht">+{les.wachtlijst} wacht</span>}
      </span>
    </span>
  )
}

function omschrijving(les: LesOverzicht, tijd: string): string {
  const delen = [
    tijd,
    les.lestype?.naam ?? 'Les',
    les.instructeur?.naam,
    les.zaal?.naam,
    les.geannuleerd ? 'gaat niet door' : `${les.geboekt} van ${les.capaciteit} plekken bezet`,
    les.wachtlijst > 0 ? `${les.wachtlijst} op de wachtlijst` : null,
  ]
  return delen.filter(Boolean).join(', ')
}

export function LesBlok({ les, href, tijd, isVoorbij, isGeopend, plek }: Props) {
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
      aria-label={omschrijving(les, tijd)}
      title={les.lestype ? SOORT_LABEL[les.lestype.soort] : undefined}
    >
      <span className="club-rooster-les-tijd club-getal">{tijd}</span>
      <span className="club-rooster-les-naam">{les.lestype?.naam ?? 'Les'}</span>
      {meta && <span className="club-rooster-les-meta">{meta}</span>}
      {les.geannuleerd ? <span className="club-rooster-les-uit">Gaat niet door</span> : <Bezetting les={les} />}
    </Link>
  )
}
