'use client'

import Link from 'next/link'
import { CircleCheck, CircleAlert, Clock3, MapPin, TriangleAlert } from 'lucide-react'
import type { BalieLes, BalieLid, CheckinAntwoord } from '@/lib/club/checkin/types'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { CHECKIN } from '@/lib/aiyourgym/taal/woorden/club/checkin'
import { Avatar } from '@/components/club/ontwerp/Avatar'

// De grote kaarten van het baliescherm: het gevonden lid (met Inchecken) en
// de uitkomst na het inchecken. Gemaakt om vanaf een meter afstand te lezen.

const TIJD = new Intl.DateTimeFormat('nl-NL', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Amsterdam' })

export function tijd(iso: string): string {
  return TIJD.format(new Date(iso))
}

function LesRegel({ lid }: { lid: BalieLid }) {
  const t = useTekst(CHECKIN).kaart
  if (!lid.les) return <p className="club-checkin-les club-zacht">{t.geenLes}</p>
  const wacht = lid.les.status === 'wachtlijst' ? t.wachtlijst : lid.les.status === 'aanwezig' ? t.alAanwezig : ''
  return (
    <p className="club-checkin-les">
      <Clock3 aria-hidden size={18} />
      <span>
        {t.vandaag} <strong>{lid.les.naam}</strong>{t.om(tijd(lid.les.start))}{wacht}
        {lid.les.inVenster ? <em>{t.teltAanwezig}</em> : null}
      </span>
    </p>
  )
}

/** "Lid van Bergeijk" als het lid uit een andere vestiging komt. */
function VestigingChip({ lid }: { lid: BalieLid }) {
  const t = useTekst(CHECKIN).kaart
  if (!lid.andereVestiging) return null
  return (
    <span className={`club-chip ${lid.geenToegang ? 'club-chip--let-op' : 'club-chip--info'} club-checkin-elders`}>
      <MapPin aria-hidden size={13} /> {t.lidVan(lid.vestigingLabel)}
    </span>
  )
}

function Oordeel({ lid }: { lid: BalieLid }) {
  const t = useTekst(CHECKIN).kaart
  if (lid.geenToegang) {
    return (
      <p className="club-checkin-oordeel club-checkin-oordeel--niet">
        <CircleAlert aria-hidden size={22} />
        <span>{t.geenToegangHier} <span className="club-checkin-oordeel-regel">{t.alleenEigenRegel(lid.vestigingLabel)}</span></span>
      </p>
    )
  }
  if (!lid.magTrainen) {
    return (
      <p className="club-checkin-oordeel club-checkin-oordeel--niet">
        <CircleAlert aria-hidden size={22} /> <span>{t.nietActief(lid.statusLabel.toLowerCase())}</span>
      </p>
    )
  }
  return (
    <p className="club-checkin-oordeel club-checkin-oordeel--mag">
      <CircleCheck aria-hidden size={22} />
      <span>
        {t.magTrainen(lid.statusLabel, lid.andereVestiging)}
        {lid.andereVestiging ? <span className="club-checkin-oordeel-regel">{t.eldersRegel(lid.vestigingLabel)}</span> : null}
      </span>
    </p>
  )
}

/** Lidmaatschap laat dit niet toe (vestiging of daluren): waarschuwen, niet blokkeren. */
function VormWaarschuwing({ reden }: { reden: string }) {
  const t = useTekst(CHECKIN).kaart
  return (
    <p className="club-checkin-vorm" role="note">
      <TriangleAlert aria-hidden size={20} />
      <span>
        {t.letOpVorm} <span className="club-checkin-oordeel-regel">{t.vormRegel(reden)}</span>
      </span>
    </p>
  )
}

interface LidKaartProps {
  lid: BalieLid
  bezig: boolean
  onInchecken: () => void
}

export function BalieLidKaart({ lid, bezig, onInchecken }: LidKaartProps) {
  const t = useTekst(CHECKIN).kaart
  return (
    <article className={`club-checkin-kaart ${!lid.magTrainen ? 'club-checkin-kaart--niet' : lid.vormWaarschuwing ? 'club-checkin-kaart--let' : 'club-checkin-kaart--mag'}`} aria-live="polite">
      <div className="club-checkin-kaart-kop">
        <Avatar naam={lid.naam} initialen={lid.initialen} foto={{ soort: 'lid', id: lid.id, versie: lid.foto }} maat={64} className="club-avatar club-avatar--groot" />
        <div className="club-checkin-kaart-naam">
          <h2>{lid.naam}</h2>
          <p className="club-zacht club-getal">{[lid.lidnummer, lid.abonnement].filter(Boolean).join(' · ')}</p>
          <VestigingChip lid={lid} />
        </div>
      </div>
      <Oordeel lid={lid} />
      {lid.magTrainen && lid.vormWaarschuwing ? <VormWaarschuwing reden={lid.vormWaarschuwing} /> : null}
      <LesRegel lid={lid} />
      {lid.dubbelSinds ? <p className="club-checkin-dubbel">{t.dubbel(tijd(lid.dubbelSinds))}</p> : null}
      <button type="button" className="club-knop club-knop--primair club-knop--groot club-checkin-knop" onClick={onInchecken} disabled={bezig || !lid.magTrainen}>
        {lid.vormWaarschuwing ? t.toch : <>{t.inchecken} <kbd aria-hidden>Enter</kbd></>}
      </button>
    </article>
  )
}

/** Genoeg van een lid voor de uitkomst: uit het zoeken (BalieLid) of uit een QR-scan. */
export interface UitkomstLid {
  id: string
  naam: string
  andereVestiging: boolean
  vestigingLabel: string
  les?: BalieLes | null
}

interface UitkomstProps {
  lid: UitkomstLid
  antwoord: CheckinAntwoord
  bezig: boolean
  /** Bij een waarschuwing van het lidmaatschap: toch inchecken of laten. */
  onToch: () => void
  onNiet: () => void
  /** Zo lang blijft de uitkomst staan; een dunne balk telt af. Leeg = geen balk. */
  duurMs?: number
  /** De ledenkaart van dit lid; leeg = de naam is gewone tekst (geen recht op Leden). */
  lidHref?: string | null
}

/** De naam groot in beeld, als link naar de ledenkaart als die er is. */
function Naam({ naam, href }: { naam: string; href?: string | null }) {
  return <h2>{href ? <Link href={href}>{naam}</Link> : naam}</h2>
}

/** De balk onderaan die laat zien dat de uitkomst zo verdwijnt (alleen transform). */
function Aftellen({ duurMs }: { duurMs?: number }) {
  if (!duurMs) return null
  return <span className="club-checkin-aftellen" style={{ animationDuration: `${duurMs}ms` }} aria-hidden />
}

export function Uitkomst({ lid, antwoord, bezig, onToch, onNiet, duurMs, lidHref }: UitkomstProps) {
  const t = useTekst(CHECKIN).uitkomst
  if (antwoord.soort === 'vorm_waarschuwing') {
    return (
      <article className="club-checkin-uitkomst club-checkin-uitkomst--let-op" role="alert">
        <p className="club-checkin-uitkomst-woord">{t.letOp}</p>
        <Naam naam={lid.naam} href={lidHref} />
        <p>{t.nogNiet(antwoord.reden)}</p>
        <div className="club-checkin-uitkomst-knoppen">
          <button type="button" className="club-knop club-knop--primair" onClick={onToch} disabled={bezig}>
            {t.toch}
          </button>
          <button type="button" className="club-knop club-knop--stil" onClick={onNiet} disabled={bezig}>
            {t.niet}
          </button>
        </div>
      </article>
    )
  }
  if (antwoord.soort === 'niet_actief') {
    return (
      <article className="club-checkin-uitkomst club-checkin-uitkomst--niet" role="status">
        <p className="club-checkin-uitkomst-woord">{t.nietActief}</p>
        <Naam naam={lid.naam} href={lidHref} />
        <p>{t.nietActiefTekst(antwoord.statusLabel.toLowerCase())}</p>
        <Aftellen duurMs={duurMs} />
      </article>
    )
  }
  if (antwoord.soort === 'geen_toegang') {
    return (
      <article className="club-checkin-uitkomst club-checkin-uitkomst--niet" role="status">
        <p className="club-checkin-uitkomst-woord">{t.geenToegang}</p>
        <Naam naam={lid.naam} href={lidHref} />
        <p>{t.geenToegangTekst(antwoord.vestigingLabel)}</p>
        <Aftellen duurMs={duurMs} />
      </article>
    )
  }
  if (antwoord.soort === 'dubbel') {
    return (
      <article className="club-checkin-uitkomst club-checkin-uitkomst--dubbel" role="status">
        <p className="club-checkin-uitkomst-woord">{t.alBinnen}</p>
        <Naam naam={lid.naam} href={lidHref} />
        <p>{t.alBinnenTekst(tijd(antwoord.op))}</p>
        <Aftellen duurMs={duurMs} />
      </article>
    )
  }
  return (
    <article className="club-checkin-uitkomst club-checkin-uitkomst--welkom" role="status">
      <p className="club-checkin-uitkomst-woord">{t.welkom}</p>
      <Naam naam={lid.naam} href={lidHref} />
      <p>
        {t.ingecheckt(tijd(antwoord.op))}
        {lid.andereVestiging ? t.lidVan(lid.vestigingLabel) : ''}
        {antwoord.les ? t.aanwezigBij(antwoord.les.naam, tijd(antwoord.les.start)) : lid.les ? t.vandaagLes(lid.les.naam, tijd(lid.les.start)) : ''}
      </p>
      <Aftellen duurMs={duurMs} />
    </article>
  )
}

interface ResultatenProps {
  id: string
  leden: BalieLid[]
  gekozen: number
  onKies: (index: number) => void
}

/** De treffers als keuzelijst bij het zoekveld (combobox): pijltjes of klikken. */
export function Resultaten({ id, leden, gekozen, onKies }: ResultatenProps) {
  const t = useTekst(CHECKIN).kaart
  return (
    <ul id={id} className="club-checkin-resultaten" role="listbox" aria-label={t.gevonden}>
      {leden.map((l, i) => (
        <li
          key={l.id}
          id={`checkin-optie-${i}`}
          role="option"
          aria-selected={i === gekozen}
          className="club-checkin-resultaat"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onKies(i)}
        >
          <Avatar naam={l.naam} initialen={l.initialen} foto={{ soort: 'lid', id: l.id, versie: l.foto }} />
          <span className="club-rij-hoofd">
            <span className="club-rij-titel">{l.naam}</span>
            <span className="club-rij-sub">
              {[l.lidnummer, l.andereVestiging ? t.lidVan(l.vestigingLabel) : null, l.les ? `${l.les.naam} ${tijd(l.les.start)}` : null].filter(Boolean).join(' · ')}
            </span>
          </span>
          <span className={`club-chip ${l.magTrainen ? 'club-chip--ok' : 'club-chip--let-op'}`}>{l.geenToegang ? t.geenToegang : l.statusLabel}</span>
        </li>
      ))}
    </ul>
  )
}
