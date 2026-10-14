import Link from 'next/link'
import type { CSSProperties } from 'react'
import { AlertTriangle, CalendarX, Clock, UserX } from 'lucide-react'
import { personeelHref, zonderPaneel, type PersoneelStaat } from '@/lib/club/personeel/url'
import { urenOordeel } from '@/lib/club/personeel/regels'
import type { Melding, MeldingSoort } from '@/lib/club/personeel/controle'
import type { PersoneelLid } from '@/lib/club/personeel/typen'
import { dagMaand, uurTekst, weekdagKort } from './weergave'

// Naast het rooster: uren per medewerker tegenover het contract, en de
// controle (overlap, rust, beschikbaarheid, gaten en open diensten).

const OORDEEL_TEKST = { goed: 'Klopt', te_veel: 'Te veel', te_weinig: 'Te weinig', geen_contract: 'Geen contract' } as const

export function UrenBalk({ team, gepland, staat }: { team: readonly PersoneelLid[]; gepland: ReadonlyMap<string, number>; staat: PersoneelStaat }) {
  return (
    <section className="club-kaart club-personeel-zijkaart" aria-labelledby="club-personeel-uren-titel">
      <h2 id="club-personeel-uren-titel">Uren deze week</h2>
      <ul className="club-personeel-urenlijst">
        {team.map((l) => {
          const min = gepland.get(l.id) ?? 0
          const oordeel = urenOordeel(min, l.contracturen)
          const max = Math.max(min, (l.contracturen ?? 0) * 60, 1)
          const stijl = { '--vul': `${(min / max) * 100}%`, '--contract': `${(((l.contracturen ?? 0) * 60) / max) * 100}%` } as CSSProperties
          return (
            <li key={l.id} className="club-personeel-urenrij" data-kleur={l.kleur} data-oordeel={oordeel}>
              <Link href={personeelHref(zonderPaneel(staat), { tab: 'mijn', mw: l.id })} className="club-personeel-urennaam">
                <span className="club-personeel-stip" aria-hidden />
                {l.naam}
              </Link>
              <span className="club-personeel-urengetal club-getal">
                {uurTekst(min)}
                <span className="club-zacht">{l.contracturen !== null ? ` / ${uurTekst(l.contracturen * 60)}` : ''}</span>
              </span>
              <span className="club-personeel-urenmeter" style={stijl} aria-hidden>
                <span />
              </span>
              <span className="club-personeel-urenoordeel">{OORDEEL_TEKST[oordeel]}</span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

const ICOON: Record<MeldingSoort, typeof AlertTriangle> = { overlap: AlertTriangle, rust: Clock, beschikbaar: CalendarX, gat: AlertTriangle, open: UserX }

export function ControleLijst({ meldingen, staat }: { meldingen: readonly Melding[]; staat: PersoneelStaat }) {
  const basis = zonderPaneel(staat)
  return (
    <section className="club-kaart club-personeel-zijkaart" aria-labelledby="club-personeel-controle-titel">
      <h2 id="club-personeel-controle-titel">
        Controle <span className="club-getal club-zacht">{meldingen.length}</span>
      </h2>
      {meldingen.length === 0 ? (
        <p className="club-hint">Alles gedekt, geen dubbele diensten en genoeg rust. Mooi rooster.</p>
      ) : (
        <ul className="club-personeel-meldingen">
          {meldingen.map((m, i) => {
            const Icoon = ICOON[m.soort]
            const href = m.dienstId ? personeelHref(basis, { dienst: m.dienstId }) : personeelHref(basis, { nieuw: m.datum })
            return (
              <li key={`${m.soort}-${m.dienstId ?? m.datum}-${i}`} data-soort={m.soort}>
                <Link href={href} scroll={false}>
                  <Icoon aria-hidden size={15} />
                  <span className="club-personeel-meldingdag">
                    {weekdagKort(m.datum)} {dagMaand(m.datum)}
                  </span>
                  <span>{m.tekst}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
