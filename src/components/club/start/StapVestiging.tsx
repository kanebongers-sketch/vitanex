'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, Plus } from 'lucide-react'
import { stuur } from '@/components/club/rooster/vraag'
import { controleerOpeningstijden, type Openingstijden } from '@/lib/club/rooster/openingstijden'
import { REGEL_DEFINITIES, REGEL_SLEUTELS, type RegelSleutel, type RoosterRegels } from '@/lib/club/rooster/regels'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { tekst as inTaal } from '@/lib/aiyourgym/taal/woordenboek'
import { START_LIB } from '@/lib/aiyourgym/taal/woorden/club/start-lib'
import { MAX_ADRES, MAX_VESTIGING_NAAM } from '@/lib/club/instellingen/vestigingen-invoer'
import { heeftOpenDag, legeWeek, standaardWeek, weekTekst } from '@/lib/club/start/soorten'
import { TijdenKiezer } from './TijdenKiezer'
import { StartVoet, type StartVoetProps } from './StartVoet'
import { useTaal, useTekst } from '@/lib/aiyourgym/taal/client'
import { START } from '@/lib/aiyourgym/taal/woorden/club/start'

// Stap Vestiging: adres, openingstijden en (met groepslessen) de regels voor
// reserveren van de vestiging, alles meteen in beeld. Zonder eigen tijden
// begint de week leeg (elke dag dicht): de eigenaar kiest zelf, bijvoorbeeld
// met een klik elke dag 06:00 tot 23:00 (besluit Kane 30-10-2026: niets
// automatisch klaarzetten). Opslaan gaat via
// dezelfde API's als Instellingen. Een tweede vestiging voeg je hier ook toe.
// Het adres is nodig om live te gaan (leden zien het in de app): zonder adres
// ga je niet verder, met een vriendelijke melding bij het veld. Stoppen mag wel.

interface StapVestigingProps {
  sleutel: string
  naam: string
  adres: string | null
  week: Openingstijden
  regels: RoosterRegels
  /** Heeft de vestiging zelf gekozen openingstijden (niet de plaatshouder van een nieuwe vestiging)? */
  eigenTijden: boolean
  /** Staan de groepslessen aan? Dan horen de regels voor reserveren erbij. */
  roosterAan: boolean
  voet: Omit<StartVoetProps, 'voorVerder' | 'primair'>
}

type RegelWaarden = Record<RegelSleutel, string>

function naarWaarden(r: RoosterRegels): RegelWaarden {
  return Object.fromEntries(REGEL_SLEUTELS.map((s) => [s, String(r[s])])) as RegelWaarden
}

/** De regels uit de invoer, of een foutmelding als een getal buiten de grenzen valt. */
function leesRegels(w: RegelWaarden, taal: Taal): { ok: true; regels: RoosterRegels } | { ok: false; fout: string } {
  const v = inTaal(START, taal).vestiging
  let uit: RoosterRegels = { annuleerUren: 0, noShowDrempel: 0, noShowBlokkadeDagen: 0, reserveerDagenVooruit: 0, maxOpenReserveringen: 0, checkinVensterMin: 0 }
  for (const s of REGEL_SLEUTELS) {
    const def = REGEL_DEFINITIES[s]
    const n = Number(w[s])
    if (!Number.isInteger(n) || n < def.min || n > def.max) return { ok: false, fout: v.regelFout(v.regels[s].label, def.min, def.max) }
    uit = { ...uit, [s]: n }
  }
  return { ok: true, regels: uit }
}

/** Een dag zonder open- of sluittijd, of met sluiten voor openen; dezelfde controle als controleerOpeningstijden, in de taal van de pagina. */
function tijdenFout(tijden: Openingstijden, taal: Taal): string | null {
  const v = inTaal(START, taal).vestiging
  const dagen = START_LIB[taal].week.dagLang
  for (const [i, d] of tijden.entries()) {
    if (!d) continue
    if (!d.van || !d.tot) return v.openFout(dagen[i])
    if (d.tot <= d.van) return v.sluitFout(dagen[i])
  }
  return null
}

function RegelsBlok({ waarden, onWijzig }: { waarden: RegelWaarden; onWijzig: (s: RegelSleutel, w: string) => void }) {
  const v = useTekst(START).vestiging
  return (
    <section className="club-start-blok" aria-labelledby="start-regels-kop">
      <h2 id="start-regels-kop">{v.reserverenKop}</h2>
      <p className="club-hint">{v.reserverenUitleg}</p>
      <div className="club-start-regels">
        {REGEL_SLEUTELS.map((s) => {
          const def = REGEL_DEFINITIES[s]
          return (
            <label key={s} className="club-veld">
              <span>{v.regels[s].label}</span>
              <input className="club-invoer" type="number" inputMode="numeric" min={def.min} max={def.max} value={waarden[s]} onChange={(e) => onWijzig(s, e.target.value)} />
              <small className="club-hint">{v.regels[s].uitleg}</small>
            </label>
          )
        })}
      </div>
    </section>
  )
}

export function StapVestiging({ sleutel, naam, adres, week, regels, eigenTijden, roosterAan, voet }: StapVestigingProps) {
  const router = useRouter()
  const heeftTijden = eigenTijden && heeftOpenDag(week)
  const taal = useTaal()
  const v = useTekst(START).vestiging
  const voetTekst = useTekst(START).voet
  const [nieuwAdres, setAdres] = useState(adres ?? '')
  const [tijden, setTijden] = useState<Openingstijden>(heeftTijden ? week : legeWeek())
  const [perDag, setPerDag] = useState(heeftTijden && weekTekst(week) !== weekTekst(standaardWeek()))
  const [regelWaarden, setRegelWaarden] = useState<RegelWaarden>(() => naarWaarden(regels))
  const [fout, setFout] = useState<string | null>(null)
  const [adresFout, setAdresFout] = useState<string | null>(null)
  const adresGewijzigd = nieuwAdres.trim() !== (adres ?? '')
  const regelsGewijzigd = REGEL_SLEUTELS.some((s) => regelWaarden[s] !== String(regels[s]))
  const tijdenGewijzigd = (heeftOpenDag(tijden) && (!heeftTijden || weekTekst(tijden) !== weekTekst(week))) || regelsGewijzigd

  function setFoutTerug(melding: string): false {
    setFout(melding)
    return false
  }

  async function voorVerder(doel: 'verder' | 'stoppen'): Promise<boolean> {
    setFout(null)
    setAdresFout(null)
    if (doel === 'verder' && !nieuwAdres.trim()) {
      setAdresFout(v.adresVerplicht(naam))
      document.getElementById('start-adres')?.focus()
      return false
    }
    if (doel === 'verder' && !heeftOpenDag(tijden)) return setFoutTerug(v.tijdenVerplicht)
    const dagFout = tijdenFout(tijden, taal)
    if (dagFout) return setFoutTerug(dagFout)
    const controle = controleerOpeningstijden(tijden)
    if (!controle.ok) return setFoutTerug(controle.fout)
    const nieuweRegels = leesRegels(regelWaarden, taal)
    if (!nieuweRegels.ok) return setFoutTerug(nieuweRegels.fout)
    if (adresGewijzigd && nieuwAdres.trim()) {
      const uit = await stuur(`/api/club/vestigingen/${encodeURIComponent(sleutel)}`, 'PATCH', { adres: nieuwAdres.trim() })
      if (!uit.ok) return setFoutTerug(uit.fout)
    }
    if (tijdenGewijzigd) {
      const uit = await stuur('/api/club/instellingen/regels', 'PUT', { vestiging: sleutel, regels: nieuweRegels.regels, openingstijden: tijden })
      if (!uit.ok) return setFoutTerug(uit.fout)
    }
    if (adresGewijzigd || tijdenGewijzigd) router.refresh()
    return true
  }

  return (
    <>
      <div className="club-start-stapel">
        <div className="club-start-twee">
          <div className="club-start-stapel">
            <section className="club-start-blok" aria-labelledby="start-adres-kop">
              <h2 id="start-adres-kop">{v.adresKop(naam)}</h2>
              <label className="club-veld" htmlFor="start-adres">
                <span>{v.adresVeld}</span>
                <span className="club-start-adresveld">
                  <MapPin aria-hidden size={16} />
                  <input
                    id="start-adres"
                    className="club-invoer"
                    required
                    aria-invalid={adresFout ? true : undefined}
                    aria-describedby="start-adres-uitleg"
                    value={nieuwAdres}
                    maxLength={MAX_ADRES}
                    autoComplete="street-address"
                    placeholder={v.adresPlaats}
                    onChange={(e) => {
                      setAdresFout(null)
                      setAdres(e.target.value)
                    }}
                  />
                </span>
              </label>
              <p id="start-adres-uitleg" className={adresFout ? 'club-melding club-melding--fout' : 'club-hint'} role={adresFout ? 'alert' : undefined}>
                {adresFout ?? v.adresUitleg}
              </p>
            </section>
            <section className="club-start-blok" aria-labelledby="start-tijden-kop">
              <h2 id="start-tijden-kop">{v.tijdenKop}</h2>
              <TijdenKiezer week={tijden} perDag={perDag} onWeek={setTijden} onPerDag={setPerDag} />
            </section>
          </div>
          <div className="club-start-stapel">
            {roosterAan && (
              <RegelsBlok
                waarden={regelWaarden}
                onWijzig={(s, w) => {
                  setFout(null)
                  setRegelWaarden((oud) => ({ ...oud, [s]: w }))
                }}
              />
            )}
            <NieuweVestiging />
          </div>
        </div>
        {fout && <p className="club-melding club-melding--fout" role="alert">{fout}</p>}
      </div>
      <StartVoet {...voet} voorVerder={voorVerder} primair={adresGewijzigd || tijdenGewijzigd ? voetTekst.opslaanVerder : undefined} />
    </>
  )
}

/** Nog een vestiging toevoegen: alleen naam en adres, de rest volgt. */
function NieuweVestiging() {
  const router = useRouter()
  const [naam, setNaam] = useState('')
  const [adres, setAdres] = useState('')
  const [bezig, setBezig] = useState(false)
  const [melding, setMelding] = useState<{ ok: boolean; tekst: string } | null>(null)
  const v = useTekst(START).vestiging

  async function voegToe(e: FormEvent) {
    e.preventDefault()
    setBezig(true)
    const uit = await stuur('/api/club/vestigingen', 'POST', { naam, adres })
    setBezig(false)
    if (!uit.ok) return setMelding({ ok: false, tekst: uit.fout })
    setMelding({ ok: true, tekst: v.toegevoegd(naam.trim()) })
    setNaam('')
    setAdres('')
    router.refresh()
  }

  return (
    <section className="club-start-blok" aria-labelledby="start-nieuwe-vestiging-kop">
      <h2 id="start-nieuwe-vestiging-kop">{v.nieuwKop}</h2>
      <form className="club-start-rij-form" onSubmit={(e) => void voegToe(e)}>
        <label className="club-veld">
          <span>{v.naam}</span>
          <input className="club-invoer" required value={naam} maxLength={MAX_VESTIGING_NAAM} onChange={(e) => setNaam(e.target.value)} placeholder={v.naamPlaats} />
        </label>
        <label className="club-veld">
          <span>{v.adres}</span>
          <input className="club-invoer" value={adres} maxLength={MAX_ADRES} onChange={(e) => setAdres(e.target.value)} />
        </label>
        <button type="submit" className="club-knop" disabled={bezig || !naam.trim()}>
          <Plus aria-hidden size={16} /> {bezig ? v.bezig : v.toevoegen}
        </button>
      </form>
      {melding && (
        <p className={`club-melding${melding.ok ? ' club-melding--ok' : ' club-melding--fout'}`} role={melding.ok ? 'status' : 'alert'}>
          {melding.tekst}
        </p>
      )}
    </section>
  )
}
