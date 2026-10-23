'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, Plus } from 'lucide-react'
import { stuur } from '@/components/club/rooster/vraag'
import { controleerOpeningstijden, type Openingstijden } from '@/lib/club/rooster/openingstijden'
import { REGEL_DEFINITIES, REGEL_SLEUTELS, type RegelSleutel, type RoosterRegels } from '@/lib/club/rooster/regels'
import { MAX_ADRES, MAX_VESTIGING_NAAM } from '@/lib/club/instellingen/vestigingen-invoer'
import { standaardWeek, weekTekst, type SportschoolSoort } from '@/lib/club/start/soorten'
import { AlvastIngevuld } from './AlvastIngevuld'
import { TijdenKiezer } from './TijdenKiezer'
import { StartVoet, type StartVoetProps } from './StartVoet'

// Stap 3: adres, openingstijden en (met groepslessen) de regels voor
// reserveren van de vestiging, alles meteen in beeld. Stonden de tijden al
// klaar uit de soort, dan zegt een regel bovenaan dat. Opslaan gaat via
// dezelfde API's als Instellingen. Een tweede vestiging voeg je hier ook toe.
// Het adres is nodig om live te gaan (leden zien het in de app): zonder adres
// ga je niet verder, met een vriendelijke melding bij het veld. Stoppen mag wel.

interface StapVestigingProps {
  sleutel: string
  naam: string
  adres: string | null
  week: Openingstijden
  regels: RoosterRegels
  soort: SportschoolSoort | null
  /** Staan de groepslessen aan? Dan horen de regels voor reserveren erbij. */
  roosterAan: boolean
  voet: Omit<StartVoetProps, 'voorVerder' | 'primair'>
}

type RegelWaarden = Record<RegelSleutel, string>

function naarWaarden(r: RoosterRegels): RegelWaarden {
  return Object.fromEntries(REGEL_SLEUTELS.map((s) => [s, String(r[s])])) as RegelWaarden
}

/** De regels uit de invoer, of een foutmelding als een getal buiten de grenzen valt. */
function leesRegels(w: RegelWaarden): { ok: true; regels: RoosterRegels } | { ok: false; fout: string } {
  let uit: RoosterRegels = { annuleerUren: 0, noShowDrempel: 0, noShowBlokkadeDagen: 0, reserveerDagenVooruit: 0, maxOpenReserveringen: 0, checkinVensterMin: 0 }
  for (const s of REGEL_SLEUTELS) {
    const def = REGEL_DEFINITIES[s]
    const n = Number(w[s])
    if (!Number.isInteger(n) || n < def.min || n > def.max) return { ok: false, fout: `${def.label}: kies een getal van ${def.min} tot en met ${def.max}.` }
    uit = { ...uit, [s]: n }
  }
  return { ok: true, regels: uit }
}

function RegelsBlok({ waarden, onWijzig }: { waarden: RegelWaarden; onWijzig: (s: RegelSleutel, w: string) => void }) {
  return (
    <section className="club-start-blok" aria-labelledby="start-regels-kop">
      <h2 id="start-regels-kop">Reserveren</h2>
      <p className="club-hint">Zo boeken je leden een les. Deze regels zien ze ook in de app.</p>
      <div className="club-start-regels">
        {REGEL_SLEUTELS.map((s) => {
          const def = REGEL_DEFINITIES[s]
          return (
            <label key={s} className="club-veld">
              <span>{def.label}</span>
              <input className="club-invoer" type="number" inputMode="numeric" min={def.min} max={def.max} value={waarden[s]} onChange={(e) => onWijzig(s, e.target.value)} />
              <small className="club-hint">{def.uitleg}</small>
            </label>
          )
        })}
      </div>
    </section>
  )
}

export function StapVestiging({ sleutel, naam, adres, week, regels, soort, roosterAan, voet }: StapVestigingProps) {
  const router = useRouter()
  const heeftTijden = week.some((d) => d !== null)
  const [nieuwAdres, setAdres] = useState(adres ?? '')
  const [tijden, setTijden] = useState<Openingstijden>(heeftTijden ? week : standaardWeek())
  const [perDag, setPerDag] = useState(heeftTijden && weekTekst(week) !== weekTekst(standaardWeek()))
  const [regelWaarden, setRegelWaarden] = useState<RegelWaarden>(() => naarWaarden(regels))
  const [fout, setFout] = useState<string | null>(null)
  const [adresFout, setAdresFout] = useState<string | null>(null)
  const adresGewijzigd = nieuwAdres.trim() !== (adres ?? '')
  const regelsGewijzigd = REGEL_SLEUTELS.some((s) => regelWaarden[s] !== String(regels[s]))
  const tijdenGewijzigd = !heeftTijden || weekTekst(tijden) !== weekTekst(week) || regelsGewijzigd

  function setFoutTerug(melding: string): false {
    setFout(melding)
    return false
  }

  async function voorVerder(doel: 'verder' | 'stoppen'): Promise<boolean> {
    setFout(null)
    setAdresFout(null)
    if (doel === 'verder' && !nieuwAdres.trim()) {
      setAdresFout(`Vul het adres van ${naam} in. Je leden zien het in de app, dus het is nodig om live te gaan.`)
      document.getElementById('start-adres')?.focus()
      return false
    }
    const controle = controleerOpeningstijden(tijden)
    if (!controle.ok) return setFoutTerug(controle.fout)
    const nieuweRegels = leesRegels(regelWaarden)
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
        {heeftTijden && <AlvastIngevuld soort={soort} />}
        <div className="club-start-twee">
          <div className="club-start-stapel">
            <section className="club-start-blok" aria-labelledby="start-adres-kop">
              <h2 id="start-adres-kop">Adres van {naam}</h2>
              <label className="club-veld" htmlFor="start-adres">
                <span>Straat, huisnummer en plaats (verplicht)</span>
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
                    placeholder="Bijvoorbeeld Dorpsstraat 1, 1234 AB Plaatsnaam"
                    onChange={(e) => {
                      setAdresFout(null)
                      setAdres(e.target.value)
                    }}
                  />
                </span>
              </label>
              <p id="start-adres-uitleg" className={adresFout ? 'club-melding club-melding--fout' : 'club-hint'} role={adresFout ? 'alert' : undefined}>
                {adresFout ?? 'Je leden zien dit adres in de app.'}
              </p>
            </section>
            <section className="club-start-blok" aria-labelledby="start-tijden-kop">
              <h2 id="start-tijden-kop">Openingstijden</h2>
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
      <StartVoet {...voet} voorVerder={voorVerder} primair={adresGewijzigd || tijdenGewijzigd ? 'Opslaan en verder' : undefined} />
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

  async function voegToe(e: FormEvent) {
    e.preventDefault()
    setBezig(true)
    const uit = await stuur('/api/club/vestigingen', 'POST', { naam, adres })
    setBezig(false)
    if (!uit.ok) return setMelding({ ok: false, tekst: uit.fout })
    setMelding({ ok: true, tekst: `${naam.trim()} is toegevoegd. Kies hem bovenaan en stel zijn adres en tijden in.` })
    setNaam('')
    setAdres('')
    router.refresh()
  }

  return (
    <section className="club-start-blok" aria-labelledby="start-nieuwe-vestiging-kop">
      <h2 id="start-nieuwe-vestiging-kop">Nog een vestiging?</h2>
      <form className="club-start-rij-form" onSubmit={(e) => void voegToe(e)}>
        <label className="club-veld">
          <span>Naam</span>
          <input className="club-invoer" required value={naam} maxLength={MAX_VESTIGING_NAAM} onChange={(e) => setNaam(e.target.value)} placeholder="Bijvoorbeeld Centrum of de plaatsnaam" />
        </label>
        <label className="club-veld">
          <span>Adres</span>
          <input className="club-invoer" value={adres} maxLength={MAX_ADRES} onChange={(e) => setAdres(e.target.value)} />
        </label>
        <button type="submit" className="club-knop" disabled={bezig || !naam.trim()}>
          <Plus aria-hidden size={16} /> {bezig ? 'Bezig...' : 'Toevoegen'}
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
