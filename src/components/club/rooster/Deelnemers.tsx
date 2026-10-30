'use client'

import { Check, UserX, X } from 'lucide-react'
import { initialen } from '@/lib/club/kern/lid'
import type { Deelnemer } from '@/lib/club/rooster/lesbeheer-opslag'
import type { AfvinkStatus } from '@/lib/club/rooster/regels'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { ROOSTER } from '@/lib/aiyourgym/taal/woorden/club/rooster'
import { LidNaamLink } from '@/components/club/shell/LidNaamLink'
import { stuur, useClubActie } from './vraag'
import { Avatar } from '@/components/club/ontwerp/Avatar'

// Deelnemers afvinken (instructeur), reserveringen annuleren (balie) en de
// wachtlijst. Elke actie gaat via de rooster-API en ververst daarna het paneel.

/** De naam van het lid; een verwijderd of onbekend lid krijgt een omschrijving. */
function useNaamVan(): (d: Deelnemer) => string {
  const t = useTekst(ROOSTER).deelnemers
  return (d) => (d.lid ? `${d.lid.voornaam} ${d.lid.achternaam}`.trim() : d.reservering.lidId === null ? t.verwijderdLid : t.onbekendLid)
}

/** Vanuit het lid werken: de naam linkt naar de ledenkaart (tabblad Planning) voor wie Leden mag zien. */
interface LinkInfo {
  vestiging: string
  magLeden: boolean
}

function Naam({ d, naam, link }: { d: Deelnemer; naam: string; link: LinkInfo }) {
  return (
    <LidNaamLink lidId={d.lid ? d.reservering.lidId : null} vestiging={link.vestiging} magLeden={link.magLeden} tab="planning" className="club-rij-titel">
      {naam}
    </LidNaamLink>
  )
}

function DeelnemerFoto({ d }: { d: Deelnemer }) {
  if (!d.lid) return <span className="club-avatar" aria-hidden>?</span>
  return <Avatar naam={`${d.lid.voornaam} ${d.lid.achternaam}`} initialen={initialen(d.lid)} foto={{ soort: 'lid', id: d.lid.id, versie: d.lid.foto }} />
}

interface RijProps {
  d: Deelnemer
  kanAfvinken: boolean
  kanAnnuleren: boolean
  link: LinkInfo
}

function DeelnemerRij({ d, kanAfvinken, kanAnnuleren, link }: RijProps) {
  const { bezig, fout, voerUit } = useClubActie()
  const status = d.reservering.status
  const t = useTekst(ROOSTER).deelnemers
  const naam = useNaamVan()(d)

  const zet = (nieuw: AfvinkStatus) =>
    voerUit(() => stuur(`/api/club/rooster/reserveringen/${d.reservering.id}`, 'PATCH', { status: status === nieuw ? 'geboekt' : nieuw }))
  const annuleer = () => voerUit(() => stuur(`/api/club/rooster/reserveringen/${d.reservering.id}/annuleren`, 'POST'))

  return (
    <li className="club-rij club-rooster-deelnemer" data-status={status}>
      <DeelnemerFoto d={d} />
      <span className="club-rij-hoofd">
        <Naam d={d} naam={naam} link={link} />
        <span className="club-rij-sub">
          {d.lid?.status === 'proef' ? t.proeflid : ''}
          {d.reservering.bron === 'app' ? t.viaApp : d.reservering.bron === 'balie' ? t.viaBalie : t.doorInstructeur}
        </span>
        {fout && <span className="club-fout" role="alert">{fout}</span>}
      </span>
      {kanAfvinken && (
        <span className="club-rooster-afvink" role="group" aria-label={t.aanwezigheid(naam)}>
          <button type="button" className="club-rooster-afvinkknop" data-soort="aanwezig" aria-pressed={status === 'aanwezig'} disabled={bezig} onClick={() => zet('aanwezig')}>
            <Check aria-hidden size={15} />
            <span>{t.aanwezig}</span>
          </button>
          <button type="button" className="club-rooster-afvinkknop" data-soort="no_show" aria-pressed={status === 'no_show'} disabled={bezig} onClick={() => zet('no_show')}>
            <UserX aria-hidden size={15} />
            <span>{t.noShow}</span>
          </button>
        </span>
      )}
      {kanAnnuleren && status === 'geboekt' && (
        <button type="button" className="club-knop club-knop--stil club-knop--klein" aria-label={t.annuleren(naam)} disabled={bezig} onClick={annuleer}>
          <X aria-hidden size={15} />
        </button>
      )}
    </li>
  )
}

interface Props {
  deelnemers: Deelnemer[]
  kanAfvinken: boolean
  kanAnnuleren: boolean
  link: LinkInfo
}

export function DeelnemerLijst({ deelnemers, kanAfvinken, kanAnnuleren, link }: Props) {
  const t = useTekst(ROOSTER).deelnemers
  if (deelnemers.length === 0) return <p className="club-leeg">{t.niemand}</p>
  return (
    <ul className="club-lijst">
      {deelnemers.map((d) => (
        <DeelnemerRij key={d.reservering.id} d={d} kanAfvinken={kanAfvinken} kanAnnuleren={kanAnnuleren} link={link} />
      ))}
    </ul>
  )
}

function WachtRij({ d, kanAnnuleren, link }: { d: Deelnemer; kanAnnuleren: boolean; link: LinkInfo }) {
  const { bezig, fout, voerUit } = useClubActie()
  const t = useTekst(ROOSTER).deelnemers
  const naam = useNaamVan()(d)
  return (
    <li className="club-rij">
      <span className="club-rooster-positie club-getal" aria-label={t.positie(String(d.reservering.wachtpositie ?? ''))}>
        {d.reservering.wachtpositie ?? '·'}
      </span>
      <span className="club-rij-hoofd">
        <Naam d={d} naam={naam} link={link} />
        {fout && <span className="club-fout" role="alert">{fout}</span>}
      </span>
      {kanAnnuleren && (
        <button
          type="button"
          className="club-knop club-knop--stil club-knop--klein"
          aria-label={t.vanWachtlijst(naam)}
          disabled={bezig}
          onClick={() => voerUit(() => stuur(`/api/club/rooster/reserveringen/${d.reservering.id}/annuleren`, 'POST'))}
        >
          <X aria-hidden size={15} />
        </button>
      )}
    </li>
  )
}

export function Wachtlijst({ wachtlijst, kanAnnuleren, link }: { wachtlijst: Deelnemer[]; kanAnnuleren: boolean; link: LinkInfo }) {
  const t = useTekst(ROOSTER).deelnemers
  if (wachtlijst.length === 0) return <p className="club-hint">{t.wachtLeeg}</p>
  return (
    <ol className="club-lijst">
      {wachtlijst.map((d) => (
        <WachtRij key={d.reservering.id} d={d} kanAnnuleren={kanAnnuleren} link={link} />
      ))}
    </ol>
  )
}

export function Afmeldingen({ geannuleerd, link }: { geannuleerd: Deelnemer[]; link: LinkInfo }) {
  const t = useTekst(ROOSTER).deelnemers
  const naamVan = useNaamVan()
  if (geannuleerd.length === 0) return null
  return (
    <details className="club-rooster-uitklap">
      <summary>{t.afgemeld(geannuleerd.length)}</summary>
      <ul className="club-lijst">
        {geannuleerd.map((d) => (
          <li key={d.reservering.id} className="club-rij">
            <DeelnemerFoto d={d} />
            <span className="club-rij-hoofd">
              <Naam d={d} naam={naamVan(d)} link={link} />
            </span>
            {d.reservering.teLaat && <span className="club-chip club-chip--let-op">{t.teLaat}</span>}
          </li>
        ))}
      </ul>
    </details>
  )
}
