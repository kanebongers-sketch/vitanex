import { Eye, EyeOff, ListOrdered, UserPlus, Users } from 'lucide-react'
import { clubPad } from '@/lib/club/kern/vestiging'
import { naamVan, type VestigingInfo } from '@/lib/club/kern/vestigingen'
import { DEELNAME_LABEL, eenheidTekst, SOORT_INFO, type Challenge } from '@/lib/club/challenges/model'
import { dagenTeGaan, laatsteDag, STATUS_LABEL, type ChallengeStatus } from '@/lib/club/challenges/periode'
import type { StandData } from '@/lib/club/challenges/lezen'
import { ChallengeActies } from './ChallengeActies'
import { StandTabel } from './StandTabel'
import { datumKort, periodeTekst, statusTekst } from './weergave'

// Een challenge open: wat het is, de kerncijfers en de stand van de deelnemers.

interface Props {
  c: Challenge
  status: ChallengeStatus
  stand: StandData | null
  vandaag: string
  vestiging: string
  vestigingen: readonly VestigingInfo[]
}

function Kenmerken({ c, vestigingen }: { c: Challenge; vestigingen: readonly VestigingInfo[] }) {
  return (
    <ul className="club-challenges-kenmerken">
      <li>
        <Users size={15} aria-hidden /> {c.vestigingen.length === 0 ? 'Alle vestigingen' : c.vestigingen.map((v) => naamVan(vestigingen, v)).join(', ')}
      </li>
      <li>
        <UserPlus size={15} aria-hidden /> {DEELNAME_LABEL[c.deelname]}
      </li>
      <li>
        {c.zichtbaarApp ? <Eye size={15} aria-hidden /> : <EyeOff size={15} aria-hidden />} {c.zichtbaarApp ? 'Zichtbaar in de ledenapp' : 'Niet in de ledenapp'}
      </li>
      <li>
        <ListOrdered size={15} aria-hidden /> {c.ranglijst ? 'Ranglijst aan (voornaam en eerste letter)' : 'Geen ranglijst'}
      </li>
    </ul>
  )
}

function Cijfers({ stand }: { stand: StandData }) {
  const s = stand.samenvatting
  const rijen = [
    { label: 'Deelnemers', waarde: String(s.deelnemers) },
    { label: 'Begonnen', waarde: String(s.actief) },
    { label: 'Gehaald', waarde: String(s.gehaald) },
    { label: 'Gemiddeld', waarde: s.gemiddeld.toLocaleString('nl-NL') },
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

export function ChallengeDetail({ c, status, stand, vandaag, vestiging, vestigingen }: Props) {
  const eind = laatsteDag(c)
  return (
    <article className="club-challenges-detail" aria-labelledby="challenge-titel">
      <header className="club-challenges-detailkop">
        <p className="club-boventitel">
          {STATUS_LABEL[status]} · {SOORT_INFO[c.soort].label}
          {c.demo && ' · demo'}
        </p>
        <h2 id="challenge-titel">{c.titel}</h2>
        <p className="club-challenges-doelzin">
          Doel: <strong>{eenheidTekst(c.soort, c.doel)}</strong> · {periodeTekst(c.start, eind)}
          {status !== 'afgelopen' && ` · ${statusTekst(status, c.start, eind, dagenTeGaan(c, vandaag)).toLowerCase()}`}
          {c.gestoptOp && ' · vroegtijdig gestopt'}
        </p>
        {c.uitleg && <p className="club-challenges-uitleg">{c.uitleg}</p>}
        <p className="club-hint">{SOORT_INFO[c.soort].uitleg}</p>
        {status !== 'afgelopen' && <ChallengeActies id={c.id} titel={c.titel} wijzigHref={clubPad('/challenges', vestiging, { c: c.id, wijzig: '1' })} />}
      </header>

      <Kenmerken c={c} vestigingen={vestigingen} />

      {status === 'gepland' ? (
        <p className="club-challenges-leeg">De stand verschijnt zodra de challenge op {datumKort(c.start)} begint.</p>
      ) : stand ? (
        <>
          <Cijfers stand={stand} />
          <section aria-labelledby="challenge-stand">
            <h3 id="challenge-stand" className="club-challenges-subkop">
              Stand
            </h3>
            <StandTabel stand={stand.stand} doel={c.doel} ranglijstAan={c.ranglijst} />
          </section>
        </>
      ) : (
        <p className="club-melding club-melding--fout" role="status">
          De stand kon niet worden geladen. Ververs de pagina of probeer het later opnieuw.
        </p>
      )}
    </article>
  )
}
