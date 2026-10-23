import Link from 'next/link'
import { ArrowRight, Check, Globe, Printer, ScanLine, Send } from 'lucide-react'
import type { LiveActie } from '@/lib/club/start/eerste-dag'
import type { Thema } from '@/lib/club/kern/huisstijl'
import { KopieerKnop } from './KopieerKnop'
import { LedenappVoorbeeld } from './LedenappVoorbeeld'

// Bovenaan de laatste stap: wat er nu echt live staat. Het eigen adres van de
// sportschool (ledenapp en inloggen voor het team) met een kopieerknop, en de
// ledenapp in de eigen kleur en met het eigen logo. Na Afronden wordt dit het
// moment "Je sportschool staat live", met de drie dingen voor dag 1 (poster,
// leden uitnodigen, check-in). Rustig, zonder confetti. Alleen echte adressen
// en bestaande pagina's, niets beloofd.

export interface LiveAdressen {
  /** Zoals we het tonen, zonder https:// (aiyourgym.com/naam). */
  basis: string
  ledenapp: string
  inloggen: string
}

interface StapLiveProps {
  afgerond: boolean
  af: number
  totaal: number
  /** null = er is nog geen eigen adres gekozen. */
  adressen: LiveAdressen | null
  /** Waar je het adres kiest (Huisstijl). */
  adresKiezenPad: string
  naam: string
  kleur: string
  thema: Thema
  logo: string | null
  /** Wat je op dag 1 doet; alleen wat kan met de onderdelen die aan staan. */
  acties: readonly LiveActie[]
}

const ACTIE_ICOON = { poster: Printer, uitnodigen: Send, checkin: ScanLine } as const

function DagEen({ acties }: { acties: readonly LiveActie[] }) {
  if (acties.length === 0) return null
  return (
    <section className="club-start-dageen" aria-labelledby="start-dageen-kop">
      <div className="club-start-dageen-kop">
        <p className="club-boventitel">Je eerste dag</p>
        <h2 id="start-dageen-kop">Zet je leden op de app</h2>
      </div>
      <ol className="club-start-dageen-lijst" role="list">
        {acties.map((a, i) => {
          const Icoon = ACTIE_ICOON[a.id]
          return (
            <li key={a.id}>
              <span className="club-start-dageen-nr club-getal" aria-hidden>{i + 1}</span>
              <span className="club-start-dageen-tekst">
                <strong>{a.titel}</strong>
                <span className="club-zacht">{a.uitleg}</span>
              </span>
              <Link href={a.pad} className={`club-knop${i === 0 ? ' club-knop--primair' : ''}`}>
                <Icoon aria-hidden size={16} /> {a.knop}
              </Link>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

function zonderProtocol(url: string): string {
  return url.replace(/^https:\/\//, '')
}

function Adres({ titel, uitleg, url }: { titel: string; uitleg: string; url: string }) {
  return (
    <div className="club-start-live-adres">
      <dt>{titel}</dt>
      <dd>
        <span className="club-start-live-url">
          <code>{zonderProtocol(url)}</code>
          <KopieerKnop tekst={url} label={`adres: ${titel.toLowerCase()}`} />
        </span>
        <span className="club-zacht">{uitleg}</span>
      </dd>
    </div>
  )
}

export function StapLive({ afgerond, af, totaal, adressen, adresKiezenPad, naam, kleur, thema, logo, acties }: StapLiveProps) {
  return (
    <>
      <section className="club-start-live" data-afgerond={afgerond || undefined} aria-labelledby="start-live-kop">
        <div className="club-start-live-tekst">
          <span className="club-start-live-icoon" aria-hidden>
            {afgerond ? <Check size={22} strokeWidth={3} /> : <Globe size={22} />}
          </span>
          <p className="club-boventitel">{afgerond ? 'Afgerond' : `${af} van ${totaal} stappen af`}</p>
          <h2 id="start-live-kop">{afgerond ? `${naam || 'Je sportschool'} staat live` : 'Dit staat al live'}</h2>
          {adressen && <p className="club-start-live-basis club-getal">{adressen.basis}</p>}
          <p className="club-start-live-intro">
            {afgerond
              ? 'Je omgeving is ingericht. Hieronder je eigen adressen, wat je op je eerste dag doet en wat je nog even naloopt.'
              : 'Je eigen adres werkt al. Rond de wizard af als alles klopt; je kunt daarna alles nog aanpassen.'}
          </p>
          {adressen ? (
            <dl className="club-start-live-adressen">
              <Adres titel="Ledenapp" uitleg="Leden activeren hun account met de link of QR-code van je sportschool en loggen daarna in met hun e-mailadres en wachtwoord." url={adressen.ledenapp} />
              <Adres titel="Inloggen voor je team" uitleg="Je medewerkers krijgen een uitnodiging per e-mail en loggen daarna hier in met hun e-mailadres en wachtwoord." url={adressen.inloggen} />
            </dl>
          ) : (
            <p className="club-melding">
              Je hebt nog geen eigen adres. <Link href={adresKiezenPad}>Kies het bij Huisstijl</Link>, dan vinden je leden en team je.
            </p>
          )}
          {afgerond && (
            <Link href="/club" className="club-knop club-knop--groot club-start-live-door">
              Naar Club <ArrowRight aria-hidden size={18} />
            </Link>
          )}
        </div>
        <div className="club-start-live-tel">
          <LedenappVoorbeeld naam={naam} kleur={kleur} thema={thema} logo={logo} />
        </div>
      </section>
      {afgerond && <DagEen acties={acties} />}
    </>
  )
}
