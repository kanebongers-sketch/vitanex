import { CheckCircle2, CircleDashed, CircleAlert } from 'lucide-react'
import type { Dienst } from '@/lib/club/platform/koppelingen-stand'
import type { PLATFORM } from '@/lib/aiyourgym/taal/woorden/club/platform'
import { ProefmailKnop, VapidKnop } from './KoppelingActies'

// Per dienst de stand en de instellingen (alleen namen, nooit waarden), met
// uitleg wat er nog moet en een proefmail of sleutelpaar waar dat helpt.

type Tekst = (typeof PLATFORM)['nl']['systeem']['koppelingen']

const ICOON = { werkt: CheckCircle2, uit: CircleDashed, onvolledig: CircleAlert } as const

export function Koppelingen({ diensten, t }: { diensten: readonly Dienst[]; t: Tekst }) {
  return (
    <section className="club-systeem-koppelingen" aria-labelledby="koppelingen-kop">
      <div className="club-sectiekop"><h2 id="koppelingen-kop">{t.kop}</h2></div>
      <p className="club-hint">{t.uitleg}</p>
      <ul className="club-systeem-diensten">
        {diensten.map((d) => {
          const Icoon = ICOON[d.stand]
          const tekst = t.diensten[d.sleutel]
          return (
            <li key={d.sleutel} className="club-kaart club-systeem-dienst" data-stand={d.stand}>
              <div className="club-systeem-dienstkop">
                <h3>{tekst.titel}</h3>
                <span className="club-systeem-stand">
                  <Icoon size={15} aria-hidden /> {t.stand[d.stand]}
                  {d.modus ? ` · ${t.modus[d.modus]}` : ''}
                </span>
              </div>
              <p className="club-systeem-wat">{tekst.wat}</p>
              <ul className="club-systeem-instellingen">
                {d.instellingen.map((i) => (
                  <li key={i.naam} data-stand={i.stand}>
                    <code>{i.naam}</code>
                    <span>{t.instelling[i.stand]}{i.verplicht ? '' : ` (${t.optioneel})`}</span>
                  </li>
                ))}
              </ul>
              {d.stand !== 'werkt' && <p className="club-hint">{tekst.hoe}</p>}
              {d.sleutel === 'mail_club' && <ProefmailKnop soort="club" />}
              {d.sleutel === 'mail_ayg' && <ProefmailKnop soort="ayg" />}
              {d.sleutel === 'push' && d.stand !== 'werkt' && <VapidKnop />}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
