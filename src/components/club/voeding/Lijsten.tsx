import Link from 'next/link'
import { clubPad } from '@/lib/club/kern/vestiging'
import type { PlanRegel } from '@/lib/club/voeding/lezen'
import type { VoedingSjabloon } from '@/lib/club/voeding/model'
import { verdeling } from '@/lib/club/voeding/rekenhulp'
import { datumLang, doelLabel } from './weergave'

// De lijsten van het overzicht: plannen per lid en sjablonen van de sportschool.

function MiniBalk({ eiwitG, koolhydratenG, vetG }: { eiwitG: number; koolhydratenG: number; vetG: number }) {
  const v = verdeling({ eiwitG, koolhydratenG, vetG })
  return (
    <span className="club-voeding-balk" aria-hidden>
      {v.eiwit > 0 && <span className="is-eiwit" style={{ flexGrow: v.eiwit }} />}
      {v.koolhydraten > 0 && <span className="is-kh" style={{ flexGrow: v.koolhydraten }} />}
      {v.vet > 0 && <span className="is-vet" style={{ flexGrow: v.vet }} />}
    </span>
  )
}

interface PlannenLijstProps {
  regels: readonly PlanRegel[]
  vestiging: string
}

export function PlannenLijst({ regels, vestiging }: PlannenLijstProps) {
  if (regels.length === 0) return <p className="club-leeg">Nog geen voedingsplannen in deze vestiging. Zoek rechts een lid om te beginnen.</p>
  return (
    <ul className="club-voeding-lijst">
      {regels.map(({ plan, lid }) => (
        <li key={plan.id}>
          <Link href={clubPad(`/voeding/lid/${lid.id}`, vestiging)} className="club-voeding-regel">
            <span>
              <span className="club-voeding-regel-titel">
                {lid.voornaam} {lid.achternaam}
              </span>
              <span className="club-voeding-regel-sub">
                {doelLabel(plan.doel)} · {plan.eiwitG} g eiwit{plan.bijgewerktOp && ` · ${datumLang(plan.bijgewerktOp)}`}
              </span>
            </span>
            <span className="club-voeding-regel-kcal">
              {plan.kcal}
              <small>KCAL</small>
            </span>
            <MiniBalk {...plan} />
          </Link>
        </li>
      ))}
    </ul>
  )
}

interface SjablonenLijstProps {
  sjablonen: readonly VoedingSjabloon[]
  gekozen: string | null
  vestiging: string
}

export function SjablonenLijst({ sjablonen, gekozen, vestiging }: SjablonenLijstProps) {
  if (sjablonen.length === 0) return <p className="club-leeg">Nog geen sjablonen. Maak er een, bijvoorbeeld Rustig afvallen met vier vaste momenten.</p>
  return (
    <ul className="club-voeding-lijst">
      {sjablonen.map((s) => (
        <li key={s.id}>
          <Link href={clubPad('/voeding', vestiging, { tab: 'sjablonen', s: s.id })} scroll={false} className="club-voeding-regel" aria-current={gekozen === s.id ? 'true' : undefined}>
            <span>
              <span className="club-voeding-regel-titel">{s.naam}</span>
              <span className="club-voeding-regel-sub">
                {doelLabel(s.doel)} · {s.adviezen.length} {s.adviezen.length === 1 ? 'advies' : 'adviezen'} · {s.maaltijden.length} {s.maaltijden.length === 1 ? 'maaltijd' : 'maaltijden'}
              </span>
            </span>
            <span className={`club-voeding-regel-kcal${s.kcal === null ? ' is-tekst' : ''}`}>
              {s.kcal ?? 'Per lid'}
              {s.kcal !== null && <small>KCAL</small>}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
