import Link from 'next/link'
import { clubPad, type Vestiging } from '@/lib/club/kern/vestiging'
import { lijstZoek, STANDAARD_PARAMS, type LedenTellingen, type LijstParams } from '@/lib/club/leden/lijst'
import { GRENS_RISICO } from '@/lib/club/leden/behoud'
import { getTaal } from '@/lib/aiyourgym/taal/server'
import { LEDEN } from '@/lib/aiyourgym/taal/woorden/club/leden'

// Cijfertegels boven de ledenlijst. Elke tegel is een filter: klik en de lijst
// toont alleen die groep. Nog een keer klikken zet het filter weer uit.

interface LedenTegelsProps {
  tellingen: LedenTellingen
  params: LijstParams
  vestiging: Vestiging
}

interface Tegel {
  sleutel: keyof LedenTellingen
  label: string
  sub: string
  actief: boolean
  wijziging: Partial<LijstParams>
}

function tegels(p: LijstParams, t: (typeof LEDEN)['nl']['tegels']): Tegel[] {
  const status = (s: 'actief' | 'gepauzeerd' | 'opgezegd' | 'proef'): Partial<LijstParams> => ({ status: p.status === s ? null : s, risico: false })
  return [
    { sleutel: 'actief', label: t.actief.label, sub: t.actief.sub, actief: p.status === 'actief' && !p.risico, wijziging: status('actief') },
    { sleutel: 'proef', label: t.proef.label, sub: t.proef.sub, actief: p.status === 'proef', wijziging: status('proef') },
    { sleutel: 'gepauzeerd', label: t.gepauzeerd.label, sub: t.gepauzeerd.sub, actief: p.status === 'gepauzeerd', wijziging: status('gepauzeerd') },
    { sleutel: 'opgezegd', label: t.opgezegd.label, sub: t.opgezegd.sub, actief: p.status === 'opgezegd', wijziging: status('opgezegd') },
    { sleutel: 'risico', label: t.risico.label, sub: t.risico.sub(GRENS_RISICO), actief: p.risico, wijziging: { status: null, risico: !p.risico } },
  ]
}

export async function LedenTegels({ tellingen, params, vestiging }: LedenTegelsProps) {
  const tekst = LEDEN[await getTaal()].tegels
  const basis: LijstParams = { ...STANDAARD_PARAMS, q: params.q, sort: params.sort, oplopend: params.oplopend }
  return (
    <nav className="club-leden-tegels" aria-label={tekst.label}>
      {tegels(params, tekst).map((t) => (
        <Link
          key={t.sleutel}
          href={clubPad('/leden', vestiging, lijstZoek(basis, t.wijziging))}
          className={`club-leden-tegel${t.sleutel === 'risico' ? ' club-leden-tegel--risico' : ''}`}
          aria-current={t.actief ? 'true' : undefined}
          scroll={false}
        >
          <span className="club-tegel-label">{t.label}</span>
          <span className="club-leden-tegel-getal club-getal">{tellingen[t.sleutel]}</span>
          <span className="club-tegel-sub">{t.sub}</span>
        </Link>
      ))}
    </nav>
  )
}
