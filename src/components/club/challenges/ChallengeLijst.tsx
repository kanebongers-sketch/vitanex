import Link from 'next/link'
import { clubPad } from '@/lib/club/kern/vestiging'
import { naamVan, type VestigingInfo } from '@/lib/club/kern/vestigingen'
import type { Challenge } from '@/lib/club/challenges/model'
import { dagenTeGaan, laatsteDag, tijdVerstreken, type ChallengeStatus, type Gegroepeerd } from '@/lib/club/challenges/periode'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import type { ChallengesTekst } from '@/lib/aiyourgym/taal/woorden/club/challenges'
import { getTaal } from '@/lib/aiyourgym/taal/server'
import { CHALLENGES } from '@/lib/aiyourgym/taal/woorden/club/challenges'
import { periodeTekst, statusTekst } from './weergave'

// De challenges in drie groepen: lopend, gepland en afgelopen. Per challenge
// een strakke regel met het doel als groot getal; klik opent de stand.

interface Props {
  groepen: Gegroepeerd
  vandaag: string
  gekozen: string | null
  vestiging: string
  vestigingen: readonly VestigingInfo[]
}

const VOLGORDE: readonly ChallengeStatus[] = ['lopend', 'gepland', 'afgelopen']

function voorWie(c: Challenge, vestigingen: readonly VestigingInfo[], t: ChallengesTekst): string {
  if (c.vestigingen.length === 0) return t.lijst.alleVestigingen
  return c.vestigingen.map((v) => naamVan(vestigingen, v)).join(', ')
}

function Regel({ c, status, vandaag, gekozen, vestiging, vestigingen, tc, taal }: { c: Challenge; status: ChallengeStatus; tc: ChallengesTekst; taal: Taal } & Omit<Props, 'groepen'>) {
  const eind = laatsteDag(c)
  const tijd = status === 'lopend' ? tijdVerstreken(c, vandaag) : status === 'afgelopen' ? 1 : 0
  return (
    <li>
      <Link href={clubPad('/challenges', vestiging, { c: c.id })} scroll={false} className="club-challenges-regel" aria-current={gekozen === c.id ? 'true' : undefined}>
        <span className="club-challenges-doel" aria-hidden>
          {c.doel}
        </span>
        <span className="club-challenges-regel-inhoud">
          <span className="club-challenges-regel-titel">{c.titel}</span>
          <span className="club-challenges-regel-sub">
            {tc.soort[c.soort].label} · {periodeTekst(c.start, eind, taal)} · {voorWie(c, vestigingen, tc)}
          </span>
          <span className="club-challenges-tijd" aria-hidden>
            <span style={{ transform: `scaleX(${tijd})` }} />
          </span>
        </span>
        <span className={`club-chip ${status === 'lopend' ? 'club-chip--merk' : status === 'gepland' ? 'club-chip--info' : 'club-chip--uit'}`}>
          {c.gestoptOp && status === 'afgelopen' ? tc.lijst.gestopt : statusTekst(status, c.start, eind, dagenTeGaan(c, vandaag), taal)}
        </span>
        <span className="club-sr">
          {tc.lijst.doel(c.doel)} {c.deelname === 'inschrijven' ? tc.lijst.metInschrijven : ''}
        </span>
      </Link>
    </li>
  )
}

export async function ChallengeLijst({ groepen, ...rest }: Props) {
  const taal = await getTaal()
  const tc = CHALLENGES[taal]
  return (
    <div className="club-challenges-lijsten">
      {VOLGORDE.map((status) => {
        const lijst = groepen[status]
        return (
          <section key={status} className="club-challenges-groep" aria-labelledby={`challenges-${status}`}>
            <h2 id={`challenges-${status}`} className="club-challenges-groepkop">
              {tc.status[status]} <span>{lijst.length}</span>
            </h2>
            {lijst.length === 0 ? (
              <p className="club-challenges-leeg">
                {status === 'lopend' ? tc.lijst.leegLopend : status === 'gepland' ? tc.lijst.leegGepland : tc.lijst.leegAfgelopen}
              </p>
            ) : (
              <ul className="club-challenges-lijst">
                {lijst.map((c) => (
                  <Regel key={c.id} c={c} status={status} tc={tc} taal={taal} {...rest} />
                ))}
              </ul>
            )}
          </section>
        )
      })}
    </div>
  )
}
