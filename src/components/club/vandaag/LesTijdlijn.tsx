import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import type { VandaagLes } from '@/lib/club/cijfers/haal-vandaag'
import { lesFase } from '@/lib/club/cijfers/vandaag'
import { tijdNl } from '@/lib/club/cijfers/tijd'
import { clubTekst } from '@/lib/aiyourgym/taal/server'
import { VANDAAG } from '@/lib/aiyourgym/taal/woorden/club/vandaag-scherm'

type LesTekst = (typeof VANDAAG)['nl']['lessen']

// Lessen van vandaag als een verticale tijdlijn. Wat al geweest is, klapt in
// tot een regel (uit te klappen), wat bezig is krijgt de merkkleur, en een
// "nu"-streep laat zien waar de dag staat. Vol is een signaal (koraal), geen succes.

interface Props {
  lessen: VandaagLes[]
  nu: Date
  roosterPad: string
}

type Fase = ReturnType<typeof lesFase> | 'geannuleerd'

function faseVan(les: VandaagLes, nu: Date): Fase {
  return les.geannuleerd ? 'geannuleerd' : lesFase(les.start, les.eind, nu)
}

function Bezetting({ les, t }: { les: VandaagLes; t: LesTekst }) {
  const deel = les.capaciteit > 0 ? Math.min(les.geboekt / les.capaciteit, 1) : 0
  const vol = les.capaciteit > 0 && les.geboekt >= les.capaciteit
  return (
    <div className="club-vandaag-bezetting">
      <span className="club-vandaag-balk" aria-hidden>
        <span style={{ transform: `scaleX(${deel})` }} data-vol={vol || undefined} />
      </span>
      <span className="club-getal">
        {t.plekken(les.geboekt, les.capaciteit)}
      </span>
      {vol && <span className="club-chip club-chip--let-op">{t.vol}</span>}
      {les.wachtlijst > 0 && <span className="club-chip club-chip--let-op">{t.wachtlijst(les.wachtlijst)}</span>}
    </div>
  )
}

function LesRij({ les, fase, t }: { les: VandaagLes; fase: Fase; t: LesTekst }) {
  return (
    <li className="club-vandaag-les" data-fase={fase}>
      <time dateTime={les.start.toISOString()} className="club-vandaag-lestijd">
        {tijdNl(les.start)}
      </time>
      <span className="club-vandaag-punt" aria-hidden />
      <div className="club-vandaag-lesinhoud">
        <p className="club-vandaag-lesnaam">
          {les.naam}
          {fase === 'bezig' && <span className="club-chip club-chip--merk">{t.bezig}</span>}
          {fase === 'geannuleerd' && <span className="club-chip club-chip--uit">{t.geannuleerd}</span>}
        </p>
        <p className="club-vandaag-lessub">{[les.instructeur, les.zaal, t.tot(tijdNl(les.eind))].filter(Boolean).join(' · ')}</p>
        {fase !== 'geannuleerd' && <Bezetting les={les} t={t} />}
      </div>
    </li>
  )
}

function NuStreep({ nu, tekst, t }: { nu: Date; tekst?: string; t: LesTekst }) {
  return (
    <li className="club-vandaag-nustreep">
      <span>
        {t.nu(tijdNl(nu))}
        {tekst ? ` · ${tekst}` : ''}
      </span>
    </li>
  )
}

function Tijdlijn({ lessen, nu, t }: Omit<Props, 'roosterPad'> & { t: LesTekst }) {
  const metFase = lessen.map((les) => ({ les, fase: faseVan(les, nu) }))
  const eerder = metFase.filter((x) => x.les.eind.getTime() <= nu.getTime())
  const bezig = metFase.filter((x) => x.les.eind.getTime() > nu.getTime() && x.les.start.getTime() <= nu.getTime())
  const straks = metFase.filter((x) => x.les.start.getTime() > nu.getTime())
  const inklappen = eerder.length > 1 && straks.length + bezig.length > 0
  return (
    <ol className="club-vandaag-tijdlijn">
      {inklappen ? (
        <li className="club-vandaag-eerder">
          <details>
            <summary>{t.eerder(eerder.length)}</summary>
            <ol className="club-vandaag-tijdlijn">
              {eerder.map((x) => (
                <LesRij key={x.les.id} les={x.les} fase={x.fase} t={t} />
              ))}
            </ol>
          </details>
        </li>
      ) : (
        eerder.map((x) => <LesRij key={x.les.id} les={x.les} fase={x.fase} t={t} />)
      )}
      {bezig.map((x) => (
        <LesRij key={x.les.id} les={x.les} fase={x.fase} t={t} />
      ))}
      <NuStreep nu={nu} t={t} tekst={straks.length === 0 ? t.allesBegonnen : undefined} />
      {straks.map((x) => (
        <LesRij key={x.les.id} les={x.les} fase={x.fase} t={t} />
      ))}
    </ol>
  )
}

export async function LesTijdlijn({ lessen, nu, roosterPad }: Props) {
  const t = (await clubTekst(VANDAAG)).lessen
  return (
    <section className="club-kaart club-vandaag-kaart club-vandaag-lessen" aria-labelledby="vandaag-lessen">
      <header className="club-sectiekop club-vandaag-sectiekop">
        <h2 id="vandaag-lessen">{t.titel}</h2>
        <Link href={roosterPad} className="club-vandaag-meer">
          {t.naarRooster} <ArrowUpRight aria-hidden size={14} />
        </Link>
      </header>
      {lessen.length === 0 ? <p className="club-leeg">{t.leeg}</p> : <Tijdlijn lessen={lessen} nu={nu} t={t} />}
    </section>
  )
}
