import { ClipboardCheck, DoorOpen, Flame, Footprints, Gem, Mountain, Target, TrendingUp, Users, type LucideIcon } from 'lucide-react'
import { sorteerVoorWeergave, type Badge, type BadgeIcoon } from '@/lib/club/challenges/badges'
import { datumKort } from './weergave'
import { useTaal, useTekst } from '@/lib/aiyourgym/taal/client'
import { CHALLENGES } from '@/lib/aiyourgym/taal/woorden/club/challenges'

// Badges in de ledenapp: behaalde eerst, in de merkkleur met de datum;
// de rest gedempt, met waar het lid staat. Erkenning, geen beloning.

const ICOON: Record<BadgeIcoon, LucideIcon> = {
  deur: DoorOpen,
  tien: Footprints,
  vijfentwintig: TrendingUp,
  vijftig: Mountain,
  honderd: Gem,
  reeks: Flame,
  groepsles: Users,
  schema: ClipboardCheck,
  challenge: Target,
}

export function BadgeRaster({ badges }: { badges: readonly Badge[] }) {
  const behaald = badges.filter((b) => b.behaald).length
  const taal = useTaal()
  const tc = useTekst(CHALLENGES)
  const t = tc.app
  return (
    <section className="club-challenges-badges" aria-labelledby="lidapp-badges-kop">
      <div className="club-challenges-app-rij">
        <h3 id="lidapp-badges-kop" className="club-challenges-app-kop">
          {t.badges}
        </h3>
        <span className="club-challenges-app-teller">
          {t.teller(behaald, badges.length)}
        </span>
      </div>
      <ul className="club-challenges-raster">
        {sorteerVoorWeergave(badges).map((b) => {
          const Icoon = ICOON[b.icoon]
          const bt = tc.badges[b.sleutel as keyof typeof tc.badges] ?? { titel: b.titel, uitleg: b.uitleg }
          return (
            <li key={b.sleutel} className={b.behaald ? 'is-behaald' : undefined}>
              <span className="club-challenges-medaille" aria-hidden>
                <Icoon size={22} strokeWidth={1.8} />
              </span>
              <strong>{bt.titel}</strong>
              <small>{b.behaald ? (b.op ? datumKort(b.op, taal) : t.behaald) : b.stand ? t.teller(Math.min(b.stand.nu, b.stand.doel), b.stand.doel) : t.nogNiet}</small>
              <span className="club-sr">{b.behaald ? t.behaaldUitleg(bt.uitleg) : t.nietBehaaldUitleg(bt.uitleg)}</span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
