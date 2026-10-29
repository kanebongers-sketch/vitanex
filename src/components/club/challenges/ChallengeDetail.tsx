import { Eye, EyeOff, ListOrdered, UserPlus, Users } from 'lucide-react'
import { clubPad } from '@/lib/club/kern/vestiging'
import { naamVan, type VestigingInfo } from '@/lib/club/kern/vestigingen'
import type { Challenge } from '@/lib/club/challenges/model'
import { dagenTeGaan, laatsteDag, type ChallengeStatus } from '@/lib/club/challenges/periode'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { formatGetal } from '@/lib/aiyourgym/taal/formaat'
import type { ChallengesTekst } from '@/lib/aiyourgym/taal/woorden/club/challenges'
import { getTaal } from '@/lib/aiyourgym/taal/server'
import { CHALLENGES } from '@/lib/aiyourgym/taal/woorden/club/challenges'
import type { StandData } from '@/lib/club/challenges/lezen'
import { ChallengeActies } from './ChallengeActies'
import { StandTabel } from './StandTabel'
import { datumKort, eenheidIn, periodeTekst, statusTekst } from './weergave'

// Een challenge open: wat het is, de kerncijfers en de stand van de deelnemers.

interface Props {
  c: Challenge
  status: ChallengeStatus
  stand: StandData | null
  vandaag: string
  vestiging: string
  vestigingen: readonly VestigingInfo[]
}

function Kenmerken({ c, vestigingen, tc }: { c: Challenge; vestigingen: readonly VestigingInfo[]; tc: ChallengesTekst }) {
  const t = tc.detail
  return (
    <ul className="club-challenges-kenmerken">
      <li>
        <Users size={15} aria-hidden /> {c.vestigingen.length === 0 ? t.alleVestigingen : c.vestigingen.map((v) => naamVan(vestigingen, v)).join(', ')}
      </li>
      <li>
        <UserPlus size={15} aria-hidden /> {tc.deelname[c.deelname]}
      </li>
      <li>
        {c.zichtbaarApp ? <Eye size={15} aria-hidden /> : <EyeOff size={15} aria-hidden />} {c.zichtbaarApp ? t.zichtbaar : t.nietZichtbaar}
      </li>
      <li>
        <ListOrdered size={15} aria-hidden /> {c.ranglijst ? t.ranglijstAan : t.geenRanglijst}
      </li>
    </ul>
  )
}

function Cijfers({ stand, tc, taal }: { stand: StandData; tc: ChallengesTekst; taal: Taal }) {
  const s = stand.samenvatting
  const t = tc.detail
  const rijen = [
    { label: t.deelnemers, waarde: String(s.deelnemers) },
    { label: t.begonnen, waarde: String(s.actief) },
    { label: t.gehaald, waarde: String(s.gehaald) },
    { label: t.gemiddeld, waarde: formatGetal(s.gemiddeld, taal) },
  ]
  return (
    <dl className="club-challenges-cijfers">
      {rijen.map((r) => (
        <div key={r.label}>
          <dt>{r.label}</dt>
          <dd>{r.waarde}</dd>
        </div>
      ))}
    </dl>
  )
}

export async function ChallengeDetail({ c, status, stand, vandaag, vestiging, vestigingen }: Props) {
  const eind = laatsteDag(c)
  const taal = await getTaal()
  const tc = CHALLENGES[taal]
  const t = tc.detail
  return (
    <article className="club-challenges-detail" aria-labelledby="challenge-titel">
      <header className="club-challenges-detailkop">
        <p className="club-boventitel">
          {tc.status[status]} · {tc.soort[c.soort].label}
          {c.demo && ` · ${t.demo}`}
        </p>
        <h2 id="challenge-titel">{c.titel}</h2>
        <p className="club-challenges-doelzin">
          {t.doel} <strong>{eenheidIn(c.soort, c.doel, taal)}</strong> · {periodeTekst(c.start, eind, taal)}
          {status !== 'afgelopen' && ` · ${statusTekst(status, c.start, eind, dagenTeGaan(c, vandaag), taal).toLowerCase()}`}
          {c.gestoptOp && ` · ${t.gestopt}`}
        </p>
        {c.uitleg && <p className="club-challenges-uitleg">{c.uitleg}</p>}
        <p className="club-hint">{tc.soort[c.soort].uitleg}</p>
        {status !== 'afgelopen' && <ChallengeActies id={c.id} titel={c.titel} wijzigHref={clubPad('/challenges', vestiging, { c: c.id, wijzig: '1' })} />}
      </header>

      <Kenmerken c={c} vestigingen={vestigingen} tc={tc} />

      {status === 'gepland' ? (
        <p className="club-challenges-leeg">{t.standStraks(datumKort(c.start, taal))}</p>
      ) : stand ? (
        <>
          <Cijfers stand={stand} tc={tc} taal={taal} />
          <section aria-labelledby="challenge-stand">
            <h3 id="challenge-stand" className="club-challenges-subkop">
              {t.stand}
            </h3>
            <StandTabel stand={stand.stand} doel={c.doel} ranglijstAan={c.ranglijst} />
          </section>
        </>
      ) : (
        <p className="club-melding club-melding--fout" role="status">
          {t.laadFout}
        </p>
      )}
    </article>
  )
}
