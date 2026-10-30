'use client'

import { useState, type FormEvent, type ReactNode } from 'react'
import { ArrowLeft, Check } from 'lucide-react'
import { stuur } from '@/components/club/app/verzoek'
import { FitFactoryLogo } from '@/components/club/shell/FitFactoryLogo'
import { LidFout, LidVeld } from '@/components/club/ledenlogin/LidVeld'
import { MAX_LENGTE, MIN_LENGTE, normaalEmail, wachtwoordFout } from '@/lib/club/kern/wachtwoord-regels'
import { useTaal } from '@/lib/aiyourgym/taal/client'
import { AANMELDEN } from '@/lib/aiyourgym/taal/woorden/ledenapp/aanmelden'
import './aanmelden.css'

// Zelf aanmelden met de link of QR van de sportschool, in hoogstens drie
// stappen: 1 gegevens (meteen gaat de code per mail), 2 lidmaatschap (alleen
// als de link dat niet vastlegt en de sportschool vormen heeft), 3 de code uit
// de mail plus een wachtwoord. Daarna is het lid ingelogd en opent de intake.
// Het scherm is altijd hetzelfde, ook als het adres al bij een lid hoort: dan
// staat er in de mail dat er al een account is.

export interface AanmeldVorm {
  id: string
  naam: string
  omschrijving: string
  groepslessen: boolean
  dalVan: string | null
  dalTot: string | null
}

interface Props {
  code: string
  sportschool: string
  fitFactory: boolean
  vormen: AanmeldVorm[]
  vastVorm: string | null
  mailKlaar: boolean
}

type Stap = 'gegevens' | 'vorm' | 'wachtwoord'

const LEEG = { voornaam: '', achternaam: '', email: '', telefoon: '', geboortedatum: '', website: '' }

function Voortgang({ nr, van, label }: { nr: number; van: number; label: string }) {
  return (
    <div className="club-am-voortgang" role="group" aria-label={label}>
      {Array.from({ length: van }, (_, i) => <span key={i} data-af={i < nr || undefined} />)}
      <small>{label}</small>
    </div>
  )
}

export function AanmeldFlow({ code, sportschool, fitFactory, vormen, vastVorm, mailKlaar }: Props) {
  const taal = useTaal()
  const t = AANMELDEN[taal]
  const metVorm = vormen.length > 0
  const van = metVorm ? 3 : 2
  const [stap, setStap] = useState<Stap>('gegevens')
  const [g, setG] = useState(LEEG)
  const [akkoord, setAkkoord] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [vormId, setVormId] = useState<string | null>(null)
  const [mailCode, setMailCode] = useState('')
  const [wachtwoord, setWachtwoord] = useState('')
  const [herhaal, setHerhaal] = useState('')
  const [fout, setFout] = useState<string | null>(null)
  const [melding, setMelding] = useState<string | null>(null)
  const [bezig, setBezig] = useState(false)
  const zet = (k: keyof typeof LEEG) => (w: string) => setG({ ...g, [k]: w })

  async function gegevensVerder(e: FormEvent) {
    e.preventDefault()
    if (bezig) return
    if (!g.voornaam.trim()) return setFout(t.fouten.voornaam)
    if (!g.achternaam.trim()) return setFout(t.fouten.achternaam)
    if (!normaalEmail(g.email)) return setFout(t.fouten.email)
    if (!akkoord) return setFout(t.fouten.akkoord)
    setBezig(true)
    setFout(null)
    const r = await stuur('/api/club/lid/aanmelden', 'POST', { code, ...g, akkoord })
    setBezig(false)
    if (!r.ok) return setFout(r.fout)
    const nieuw = typeof r.data.token === 'string' ? r.data.token : null
    if (!nieuw) return setFout(t.fouten.misgegaan)
    setToken(nieuw)
    setStap(metVorm ? 'vorm' : 'wachtwoord')
  }

  async function afronden(e: FormEvent) {
    e.preventDefault()
    if (bezig || !token) return
    const adres = normaalEmail(g.email) ?? ''
    const zwak = wachtwoordFout(wachtwoord, { email: adres, naam: `${g.voornaam} ${g.achternaam}`, taal })
    if (zwak) return setFout(zwak)
    if (wachtwoord !== herhaal) {
      setHerhaal('')
      return setFout(t.wachtwoord.ongelijk)
    }
    setBezig(true)
    setFout(null)
    const r = await stuur('/api/club/lid/aanmelden/afronden', 'POST', { token, mailCode, wachtwoord, vormId })
    if (r.ok) {
      // Vervangen: terug gaat niet naar de aanmeldlink. Meteen de korte intake.
      window.location.replace('/mijn/intake?nieuw=1')
      return
    }
    setBezig(false)
    setFout(r.fout)
  }

  async function nieuweCode() {
    if (!token) return
    setMelding(null)
    await stuur('/api/club/lid/aanmelden', 'POST', { token, opnieuw: true })
    setMelding(t.wachtwoord.opnieuwGestuurd)
  }

  const kop = (nr: number, titel: string, uitleg: ReactNode) => (
    <>
      <Voortgang nr={nr} van={van} label={t.stap(nr, van)} />
      <p className="club-mijn-inlog-boven">{t.boven(sportschool)}</p>
      <h1 id="mijn-inlog-kop">{titel}</h1>
      {uitleg ? <p>{uitleg}</p> : null}
    </>
  )

  return (
    <main className="club-mijn-inlog club-am">
      <div className="club-mijn-merk">{fitFactory ? <FitFactoryLogo /> : <span>{sportschool}</span>}</div>
      <section className="club-mijn-inlog-kaart" aria-labelledby="mijn-inlog-kop">
        {!mailKlaar ? (
          <>
            <h1 id="mijn-inlog-kop">{t.titel}</h1>
            <p className="club-mijn-inlog-fout" role="alert">{t.fouten.geenMail}</p>
          </>
        ) : stap === 'gegevens' ? (
          <form className="club-mijn-blok" onSubmit={(e) => void gegevensVerder(e)} noValidate>
            {kop(1, t.gegevens.kop, t.gegevens.uitleg)}
            <div className="club-am-twee">
              <LidVeld id="am-voornaam" label={t.gegevens.voornaam} autoComplete="given-name" maxLength={60} required waarde={g.voornaam} onWaarde={zet('voornaam')} fout={fout !== null} />
              <LidVeld id="am-achternaam" label={t.gegevens.achternaam} autoComplete="family-name" maxLength={80} required waarde={g.achternaam} onWaarde={zet('achternaam')} fout={fout !== null} />
            </div>
            <LidVeld id="am-email" label={t.gegevens.email} hint={t.gegevens.emailHint} type="email" inputMode="email" autoComplete="email" autoCapitalize="none" spellCheck={false} maxLength={120} required waarde={g.email} onWaarde={zet('email')} fout={fout !== null} />
            <div className="club-am-twee">
              <LidVeld id="am-telefoon" label={`${t.gegevens.telefoon} (${t.gegevens.optioneel})`} type="tel" inputMode="tel" autoComplete="tel" maxLength={30} waarde={g.telefoon} onWaarde={zet('telefoon')} fout={false} />
              <LidVeld id="am-geboortedatum" label={`${t.gegevens.geboortedatum} (${t.gegevens.optioneel})`} type="date" autoComplete="bday" waarde={g.geboortedatum} onWaarde={zet('geboortedatum')} fout={false} />
            </div>
            {/* Honingpot voor robots: onzichtbaar en niet bereikbaar met het toetsenbord. */}
            <input className="club-am-pot" tabIndex={-1} autoComplete="off" aria-hidden="true" name="website" value={g.website} onChange={(e) => zet('website')(e.target.value)} />
            <label className="club-am-akkoord">
              <input type="checkbox" checked={akkoord} onChange={(e) => setAkkoord(e.target.checked)} />
              <span>{t.gegevens.akkoord(sportschool)}<small>{t.gegevens.akkoordHint}</small></span>
            </label>
            {vastVorm && <p className="club-am-vast">{t.vorm.vast(vastVorm)}</p>}
            <LidFout fout={fout} />
            <button type="submit" className="club-lidapp-knop club-lidapp-knop--primair club-lidapp-knop--breed" disabled={bezig} aria-busy={bezig || undefined}>{bezig ? t.bezig : t.gegevens.knop}</button>
          </form>
        ) : stap === 'vorm' ? (
          <div className="club-mijn-blok">
            {kop(2, t.vorm.kop, t.vorm.uitleg)}
            <div className="club-am-vormen" role="radiogroup" aria-label={t.vorm.kop}>
              {vormen.map((v) => (
                <button key={v.id} type="button" role="radio" aria-checked={vormId === v.id} className="club-am-vorm" onClick={() => setVormId(v.id)}>
                  <span className="club-am-vorm-vink" aria-hidden>{vormId === v.id ? <Check size={16} /> : null}</span>
                  <span>
                    <strong>{v.naam}</strong>
                    <small>{[v.omschrijving || null, v.groepslessen ? t.vorm.groepslessen : t.vorm.vrij, v.dalVan && v.dalTot ? t.vorm.daluren(v.dalVan, v.dalTot) : null].filter(Boolean).join(' · ')}</small>
                  </span>
                </button>
              ))}
              <button type="button" role="radio" aria-checked={vormId === null} className="club-am-vorm club-am-vorm--stil" onClick={() => setVormId(null)}>
                <span className="club-am-vorm-vink" aria-hidden>{vormId === null ? <Check size={16} /> : null}</span>
                <span><strong>{t.vorm.weetNiet}</strong><small>{t.vorm.weetNietUitleg}</small></span>
              </button>
            </div>
            <p className="club-mijn-veld-hint">{t.vorm.betalen}</p>
            <button type="button" className="club-lidapp-knop club-lidapp-knop--primair club-lidapp-knop--breed" onClick={() => setStap('wachtwoord')}>{t.vorm.knop}</button>
          </div>
        ) : (
          <form className="club-mijn-blok" onSubmit={(e) => void afronden(e)} noValidate>
            {kop(van, t.wachtwoord.kop, t.wachtwoord.codeUitleg(normaalEmail(g.email) ?? g.email))}
            <LidVeld id="am-code" label={t.wachtwoord.code} inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]*" maxLength={6} required autoFocus waarde={mailCode} onWaarde={(w) => setMailCode(w.replace(/\D/g, '').slice(0, 6))} fout={fout !== null} className="club-am-code" />
            <LidVeld id="am-wachtwoord" label={t.wachtwoord.kies} hint={t.wachtwoord.kiesHint(MIN_LENGTE)} type="password" autoComplete="new-password" maxLength={MAX_LENGTE} required waarde={wachtwoord} onWaarde={setWachtwoord} fout={fout !== null} />
            <LidVeld id="am-herhaal" label={t.wachtwoord.herhaal} type="password" autoComplete="new-password" maxLength={MAX_LENGTE} required waarde={herhaal} onWaarde={setHerhaal} fout={fout !== null} />
            <LidFout fout={fout} />
            <button type="submit" className="club-lidapp-knop club-lidapp-knop--primair club-lidapp-knop--breed" disabled={bezig || mailCode.length !== 6} aria-busy={bezig || undefined}>{bezig ? t.wachtwoord.bezig : t.wachtwoord.knop}</button>
            <div className="club-am-onder">
              <button type="button" className="club-mijn-inlog-link" onClick={() => void nieuweCode()}>{t.wachtwoord.opnieuw}</button>
              <button type="button" className="club-mijn-inlog-link" onClick={() => { setStap('gegevens'); setToken(null); setMailCode(''); setFout(null) }}>
                <ArrowLeft size={14} aria-hidden /> {t.wachtwoord.anderAdres}
              </button>
            </div>
            <div aria-live="polite">{melding && <p className="club-mijn-veld-hint">{melding}</p>}</div>
          </form>
        )}
        {stap === 'vorm' && (
          <button type="button" className="club-mijn-inlog-link club-am-terug" onClick={() => setStap('gegevens')}><ArrowLeft size={14} aria-hidden /> {t.terug}</button>
        )}
      </section>
    </main>
  )
}
