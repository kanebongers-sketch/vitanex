import Link from 'next/link'
import { ArrowRight, Check, Globe, Printer, ScanLine, Send } from 'lucide-react'
import type { LiveActie } from '@/lib/club/start/eerste-dag'
import type { HuisstijlExtra, Thema } from '@/lib/club/kern/huisstijl'
import { KopieerKnop } from './KopieerKnop'
import { LedenappVoorbeeld } from './LedenappVoorbeeld'
import { clubTekst } from '@/lib/aiyourgym/taal/server'
import { START } from '@/lib/aiyourgym/taal/woorden/club/start'

type LiveTekst = (typeof START)['nl']['live']

// Bovenaan de laatste stap: wat er nu echt live staat. Het eigen adres van de
// sportschool (ledenapp en inloggen voor het team) met een kopieerknop, en de
// ledenapp in de eigen kleur en met het eigen logo. Staat nog niet alles, dan
// zegt dit blok dat eerlijk en noemt het wat er nog open staat, met een knop
// naar die stap. Pas na Afronden, en alleen als alles staat, wordt dit het
// moment "Je sportschool staat live", met de drie dingen voor dag 1 (poster,
// leden uitnodigen, check-in). Rustig, zonder confetti. Alleen echte adressen
// en bestaande pagina's, niets beloofd.

export interface LiveAdressen {
  /** Zoals we het tonen, zonder https:// (aiyourgym.com/naam). */
  basis: string
  ledenapp: string
  inloggen: string
}

export interface OpenStap {
  nummer: number
  titel: string
  kort: string
  pad: string
}

interface StapLiveProps {
  afgerond: boolean
  /** De stappen die nog open staan (leeg = klaar om live te gaan). */
  open: readonly OpenStap[]
  af: number
  totaal: number
  /** null = er is nog geen eigen adres gekozen. */
  adressen: LiveAdressen | null
  /** Waar je het adres kiest (de stap Huisstijl). */
  adresKiezenPad: string
  naam: string
  kleur: string
  thema: Thema
  extra?: HuisstijlExtra
  logo: string | null
  /** De les in het voorbeeld van de ledenapp. */
  voorbeeldLes: string
  /** Wat je op dag 1 doet; alleen wat kan met de onderdelen die aan staan. */
  acties: readonly LiveActie[]
}

const ACTIE_ICOON = { poster: Printer, uitnodigen: Send, checkin: ScanLine } as const

function DagEen({ acties, t }: { acties: readonly LiveActie[]; t: LiveTekst }) {
  if (acties.length === 0) return null
  return (
    <section className="club-start-dageen" aria-labelledby="start-dageen-kop">
      <div className="club-start-dageen-kop">
        <p className="club-boventitel">{t.dagEenBoven}</p>
        <h2 id="start-dageen-kop">{t.dagEenKop}</h2>
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

function Adres({ titel, uitleg, url, t }: { titel: string; uitleg: string; url: string; t: LiveTekst }) {
  return (
    <div className="club-start-live-adres">
      <dt>{titel}</dt>
      <dd>
        <span className="club-start-live-url">
          <code>{zonderProtocol(url)}</code>
          <KopieerKnop tekst={url} label={t.adresLabel(titel.toLowerCase())} />
        </span>
        <span className="club-zacht">{uitleg}</span>
      </dd>
    </div>
  )
}

function NogOpen({ open, t }: { open: readonly OpenStap[]; t: LiveTekst }) {
  return (
    <ul className="club-start-nogopen" role="list">
      {open.map((s) => (
        <li key={s.nummer}>
          <span className="club-start-bol" aria-hidden>{s.nummer}</span>
          <span className="club-start-eerste-tekst">
            <strong>{s.titel}</strong>
            <span className="club-zacht">{s.kort}</span>
          </span>
          <Link href={s.pad} className="club-knop club-knop--klein" aria-label={t.naarStapLabel(s.nummer, s.titel)}>
            {t.naarStap(s.nummer)} <ArrowRight aria-hidden size={14} />
          </Link>
        </li>
      ))}
    </ul>
  )
}

/** Boventitel, kop en uitleg: alleen "staat live" als het echt zo is. */
function kopTekst(afgerond: boolean, klaar: boolean, af: number, totaal: number, naam: string, t: LiveTekst): { boven: string; kop: string; intro: string } {
  const wie = naam || t.jeSportschool
  if (afgerond && klaar) return { boven: t.afgerond, kop: t.staatLive(wie), intro: t.staatLiveIntro }
  if (klaar) return { boven: t.stappenAf(af, totaal), kop: t.klaarKop, intro: t.klaarIntro }
  return { boven: t.stappenAf(af, totaal), kop: t.nietLive(wie), intro: t.nietLiveIntro }
}

export async function StapLive({ afgerond, open, af, totaal, adressen, adresKiezenPad, naam, kleur, thema, extra, logo, voorbeeldLes, acties }: StapLiveProps) {
  const t = (await clubTekst(START)).live
  const klaar = open.length === 0
  const live = afgerond && klaar
  const tekst = kopTekst(afgerond, klaar, af, totaal, naam, t)
  return (
    <>
      <section className="club-start-live" data-afgerond={live || undefined} aria-labelledby="start-live-kop">
        <div className="club-start-live-tekst">
          <span className="club-start-live-icoon" aria-hidden>
            {live ? <Check size={22} strokeWidth={3} /> : <Globe size={22} />}
          </span>
          <p className="club-boventitel">{tekst.boven}</p>
          <h2 id="start-live-kop">{tekst.kop}</h2>
          {adressen && <p className="club-start-live-basis club-getal">{adressen.basis}</p>}
          <p className="club-start-live-intro">{tekst.intro}</p>
          {!klaar && <NogOpen open={open} t={t} />}
          {adressen ? (
            <dl className="club-start-live-adressen">
              <Adres titel={t.ledenapp} uitleg={t.ledenappUitleg} url={adressen.ledenapp} t={t} />
              <Adres titel={t.inloggen} uitleg={t.inloggenUitleg} url={adressen.inloggen} t={t} />
            </dl>
          ) : (
            <p className="club-melding">
              {t.geenAdres} <Link href={adresKiezenPad}>{t.geenAdresLink}</Link>{t.geenAdresNa}
            </p>
          )}
          {live && (
            <Link href="/club" className="club-knop club-knop--groot club-start-live-door">
              {t.naarClub} <ArrowRight aria-hidden size={18} />
            </Link>
          )}
        </div>
        <div className="club-start-live-tel">
          <LedenappVoorbeeld naam={naam} kleur={kleur} thema={thema} extra={extra} logo={logo} les={voorbeeldLes} />
        </div>
      </section>
      {live && <DagEen acties={acties} t={t} />}
    </>
  )
}
