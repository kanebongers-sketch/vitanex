import { ClipboardCheck, DoorOpen, Flame, Footprints, Gem, Mountain, Target, TrendingUp, Users, type LucideIcon } from 'lucide-react'
import { sorteerVoorWeergave, type Badge, type BadgeIcoon } from '@/lib/club/challenges/badges'
import { datumKort } from './weergave'

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
  return (
    <section className="club-challenges-badges" aria-labelledby="lidapp-badges-kop">
      <div className="club-challenges-app-rij">
        <h3 id="lidapp-badges-kop" className="club-challenges-app-kop">
          Badges
        </h3>
        <span className="club-challenges-app-teller">
          {behaald} van {badges.length}
        </span>
      </div>
      <ul className="club-challenges-raster">
        {sorteerVoorWeergave(badges).map((b) => {
          const Icoon = ICOON[b.icoon]
          return (
            <li key={b.sleutel} className={b.behaald ? 'is-behaald' : undefined}>
              <span className="club-challenges-medaille" aria-hidden>
                <Icoon size={22} strokeWidth={1.8} />
              </span>
              <strong>{b.titel}</strong>
              <small>{b.behaald ? (b.op ? datumKort(b.op) : 'Behaald') : b.stand ? `${Math.min(b.stand.nu, b.stand.doel)} van ${b.stand.doel}` : 'Nog niet'}</small>
              <span className="club-sr">{b.behaald ? `Behaald. ${b.uitleg}` : `Nog niet behaald. ${b.uitleg}`}</span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
