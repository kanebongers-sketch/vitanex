'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, Plus } from 'lucide-react'
import { stuur } from '@/components/club/rooster/vraag'
import { controleerOpeningstijden, type Openingstijden } from '@/lib/club/rooster/openingstijden'
import type { RoosterRegels } from '@/lib/club/rooster/regels'
import { MAX_ADRES, MAX_VESTIGING_NAAM } from '@/lib/club/instellingen/vestigingen-invoer'
import { standaardWeek, weekTekst } from '@/lib/club/start/soorten'
import { Klaargezet } from './Klaargezet'
import { TijdenKiezer } from './TijdenKiezer'
import { StartVoet, type StartVoetProps } from './StartVoet'

// Stap 3: adres en openingstijden van de vestiging. Stonden de tijden al klaar
// (uit de soort), dan zie je dat bovenaan met Klopt of Aanpassen. Opslaan gaat
// via dezelfde API's als Instellingen. Een tweede vestiging voeg je hier ook toe.

interface StapVestigingProps {
  sleutel: string
  naam: string
  adres: string | null
  week: Openingstijden
  regels: RoosterRegels
  /** Waar de klaargezette tijden vandaan komen, of null als er nog geen tijden zijn. */
  bron: string | null
  voet: Omit<StartVoetProps, 'voorVerder' | 'primair'>
}

export function StapVestiging({ sleutel, naam, adres, week, regels, bron, voet }: StapVestigingProps) {
  const router = useRouter()
  const heeftTijden = week.some((d) => d !== null)
  const [nieuwAdres, setAdres] = useState(adres ?? '')
  const [tijden, setTijden] = useState<Openingstijden>(heeftTijden ? week : standaardWeek())
  const [perDag, setPerDag] = useState(heeftTijden && weekTekst(week) !== weekTekst(standaardWeek()))
  const [fout, setFout] = useState<string | null>(null)
  const adresGewijzigd = nieuwAdres.trim() !== (adres ?? '')
  const tijdenGewijzigd = !heeftTijden || weekTekst(tijden) !== weekTekst(week)

  async function voorVerder(): Promise<boolean> {
    setFout(null)
    const controle = controleerOpeningstijden(tijden)
    if (!controle.ok) {
      setFout(controle.fout)
      return false
    }
    if (adresGewijzigd) {
      const uit = await stuur(`/api/club/vestigingen/${encodeURIComponent(sleutel)}`, 'PATCH', { adres: nieuwAdres.trim() })
      if (!uit.ok) return setFoutTerug(uit.fout)
    }
    if (tijdenGewijzigd) {
      const uit = await stuur('/api/club/instellingen/regels', 'PUT', { vestiging: sleutel, regels, openingstijden: tijden })
      if (!uit.ok) return setFoutTerug(uit.fout)
    }
    if (adresGewijzigd || tijdenGewijzigd) router.refresh()
    return true
  }

  function setFoutTerug(melding: string): false {
    setFout(melding)
    return false
  }

  const formulier = (
    <div className="club-start-stapel">
      <section className="club-start-blok" aria-labelledby="start-adres-kop">
        <h2 id="start-adres-kop">Adres van {naam}</h2>
        <label className="club-veld">
          <span>Straat, huisnummer en plaats</span>
          <span className="club-start-adresveld">
            <MapPin aria-hidden size={16} />
            <input className="club-invoer" value={nieuwAdres} maxLength={MAX_ADRES} autoComplete="street-address" placeholder="Bijvoorbeeld Dorpsstraat 1, 1234 AB Plaatsnaam" onChange={(e) => setAdres(e.target.value)} />
          </span>
        </label>
      </section>
      <section className="club-start-blok" aria-labelledby="start-tijden-kop">
        <h2 id="start-tijden-kop">Openingstijden</h2>
        <TijdenKiezer week={tijden} perDag={perDag} onWeek={setTijden} onPerDag={setPerDag} />
      </section>
      {fout && <p className="club-melding club-melding--fout" role="alert">{fout}</p>}
      <NieuweVestiging />
    </div>
  )

  return (
    <>
      {heeftTijden && bron ? (
        <Klaargezet
          bron={bron}
          gang={voet}
          voorVerder={voorVerder}
          beginOpen={!adres}
          regels={[
            { titel: 'Openingstijden', tekst: weekTekst(week) },
            { titel: 'Adres', tekst: adres ?? 'Nog niet ingevuld. Vul het hieronder in, dan vinden leden je.' },
          ]}
        >
          {formulier}
        </Klaargezet>
      ) : (
        formulier
      )}
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
    setMelding({ ok: true, tekst: `${naam.trim()} is toegevoegd. Kies hem bovenaan om de tijden in te stellen.` })
    setNaam('')
    setAdres('')
    router.refresh()
  }

  return (
    <details className="club-start-uitklap">
      <summary>
        <Plus aria-hidden size={16} /> Nog een vestiging toevoegen
      </summary>
      <form className="club-start-rij-form" onSubmit={(e) => void voegToe(e)}>
        <label className="club-veld">
          <span>Naam</span>
          <input className="club-invoer" required value={naam} maxLength={MAX_VESTIGING_NAAM} onChange={(e) => setNaam(e.target.value)} placeholder="Bijvoorbeeld Centrum of de plaatsnaam" />
        </label>
        <label className="club-veld">
          <span>Adres (mag later)</span>
          <input className="club-invoer" value={adres} maxLength={MAX_ADRES} onChange={(e) => setAdres(e.target.value)} />
        </label>
        <button type="submit" className="club-knop" disabled={bezig || !naam.trim()}>
          {bezig ? 'Bezig...' : 'Toevoegen'}
        </button>
      </form>
      {melding && (
        <p className={`club-melding${melding.ok ? ' club-melding--ok' : ' club-melding--fout'}`} role={melding.ok ? 'status' : 'alert'}>
          {melding.tekst}
        </p>
      )}
    </details>
  )
}
