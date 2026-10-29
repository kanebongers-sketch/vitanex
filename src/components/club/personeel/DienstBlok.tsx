import Link from 'next/link'
import { Check, CheckCheck, Lock } from 'lucide-react'
import type { Dienst, PersoneelLid } from '@/lib/club/personeel/typen'
import { clubTekst } from '@/lib/aiyourgym/taal/server'
import { PERSONEEL } from '@/lib/aiyourgym/taal/woorden/club/personeel'
import { plekStijl, type Bereik } from './weergave'

// Een dienst als blok in de tijdbalk: tijd, soort, en kleine tekens voor de
// urenstatus. Kleur van de medewerker als streep, naam staat in de baan ernaast
// (en in het label voor schermlezers), dus kleur is nooit de enige drager.

interface Props {
  dienst: Dienst
  bereik: Bereik
  soortNaam: string | null
  lid: PersoneelLid | null
  href: string
  isGeopend: boolean
}

function UurTeken({ dienst }: { dienst: Dienst }) {
  if (dienst.uurStatus === 'verwerkt') return <Lock aria-hidden size={12} />
  if (dienst.uurStatus === 'goedgekeurd') return <CheckCheck aria-hidden size={13} />
  if (dienst.uurStatus === 'gewerkt') return <Check aria-hidden size={13} />
  return null
}

export async function DienstBlok({ dienst, bereik, soortNaam, lid, href, isGeopend }: Props) {
  const tk = await clubTekst(PERSONEEL)
  const wie = lid?.naam ?? tk.algemeen.openDienst
  const extra = dienst.uursoort !== 'werk' ? ` (${tk.labels.uursoort[dienst.uursoort]})` : ''
  const status = tk.labels.uurStatus[dienst.uurStatus].toLowerCase()
  const label = `${wie}${extra}: ${tk.algemeen.vanTot(dienst.begin, dienst.eind)}${soortNaam ? `, ${soortNaam}` : ''}${dienst.uurStatus !== 'gepland' ? `, ${tk.blok.uren(status)}` : ''}`
  return (
    <Link
      href={href}
      scroll={false}
      className="club-personeel-blok"
      style={plekStijl(dienst.begin, dienst.eind, bereik)}
      data-kleur={lid?.kleur}
      data-open={dienst.medewerkerId === null || undefined}
      data-uursoort={dienst.uursoort}
      aria-current={isGeopend ? 'true' : undefined}
      aria-label={label}
      title={dienst.notitie ?? undefined}
    >
      <span className="club-personeel-bloktijd club-getal">
        {tk.algemeen.vanTot(dienst.begin, dienst.eind)}
      </span>
      <span className="club-personeel-bloksoort">
        {dienst.uursoort !== 'werk' ? tk.labels.uursoort[dienst.uursoort] : (soortNaam ?? (dienst.medewerkerId === null ? tk.algemeen.open : ''))}
        {dienst.status === 'geruild' && ` · ${tk.blok.geruild}`}
      </span>
      <span className="club-personeel-blokteken">
        <UurTeken dienst={dienst} />
      </span>
    </Link>
  )
}
