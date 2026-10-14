import Link from 'next/link'
import { Fragment } from 'react'
import { ArrowUpRight } from 'lucide-react'
import type { VandaagLes } from '@/lib/club/cijfers/haal-vandaag'
import { lesFase } from '@/lib/club/cijfers/vandaag'
import { tijdNl } from '@/lib/club/cijfers/tijd'

// Lessen van vandaag als een verticale tijdlijn: wat geweest is wordt rustig
// grijs, wat bezig is krijgt amber, en een "nu"-streep laat zien waar de dag staat.

interface Props {
  lessen: VandaagLes[]
  nu: Date
  roosterPad: string
}

function Bezetting({ les }: { les: VandaagLes }) {
  const deel = les.capaciteit > 0 ? Math.min(les.geboekt / les.capaciteit, 1) : 0
  const vol = les.geboekt >= les.capaciteit
  return (
    <div className="club-vandaag-bezetting">
      <span className="club-vandaag-balk" aria-hidden>
        <span style={{ transform: `scaleX(${deel})` }} data-vol={vol || undefined} />
      </span>
      <span className="club-getal">
        {les.geboekt}/{les.capaciteit}
      </span>
      {vol && <span className="club-chip club-chip--ok">Vol</span>}
      {les.wachtlijst > 0 && <span className="club-chip club-chip--info">{les.wachtlijst} op wachtlijst</span>}
    </div>
  )
}

export function LesTijdlijn({ lessen, nu, roosterPad }: Props) {
  const nuIndex = lessen.findIndex((l) => l.start.getTime() > nu.getTime())
  return (
    <section className="club-kaart club-vandaag-lessen" aria-labelledby="vandaag-lessen">
      <header className="club-sectiekop">
        <h2 id="vandaag-lessen">Lessen vandaag</h2>
        <Link href={roosterPad} className="club-vandaag-meer">
          Naar het rooster <ArrowUpRight aria-hidden size={14} />
        </Link>
      </header>
      {lessen.length === 0 ? (
        <p className="club-leeg">Vandaag staan er geen groepslessen op het rooster.</p>
      ) : (
        <ol className="club-vandaag-tijdlijn">
          {lessen.map((les, i) => {
            const fase = les.geannuleerd ? 'geannuleerd' : lesFase(les.start, les.eind, nu)
            return (
              <Fragment key={les.id}>
                {i === nuIndex && (
                  <li className="club-vandaag-nustreep" aria-label={`Nu, ${tijdNl(nu)}`}>
                    <span>Nu {tijdNl(nu)}</span>
                  </li>
                )}
                <li className="club-vandaag-les" data-fase={fase}>
                  <time dateTime={les.start.toISOString()} className="club-vandaag-lestijd">
                    {tijdNl(les.start)}
                  </time>
                  <span className="club-vandaag-punt" aria-hidden />
                  <div className="club-vandaag-lesinhoud">
                    <p className="club-vandaag-lesnaam">
                      {les.naam}
                      {fase === 'bezig' && <span className="club-chip club-chip--merk">Bezig</span>}
                      {fase === 'geannuleerd' && <span className="club-chip club-chip--uit">Geannuleerd</span>}
                    </p>
                    <p className="club-rij-sub">{[les.instructeur, les.zaal, `tot ${tijdNl(les.eind)}`].filter(Boolean).join(' · ')}</p>
                    {fase !== 'geannuleerd' && <Bezetting les={les} />}
                  </div>
                </li>
              </Fragment>
            )
          })}
          {nuIndex === -1 && (
            <li className="club-vandaag-nustreep" aria-label={`Nu, ${tijdNl(nu)}`}>
              <span>Nu {tijdNl(nu)} · alle lessen van vandaag zijn geweest</span>
            </li>
          )}
        </ol>
      )}
    </section>
  )
}
