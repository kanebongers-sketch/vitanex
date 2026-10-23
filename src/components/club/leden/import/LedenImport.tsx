'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import type { CsvTabel } from '@/lib/club/leden/import/csv'
import { IMPORT_VELD_LABEL, ontbrekendeVelden, pasKoppelingToe, raadKoppeling, type ImportVeld, type Koppeling } from '@/lib/club/leden/import/kolommen'
import { MAX_IMPORT_RIJEN } from '@/lib/club/leden/import/verzoek'
import { clubPad, type Vestiging } from '@/lib/club/kern/vestiging'
import { stuur } from '@/components/club/leden/stuur'
import { BestandKiezer } from './BestandKiezer'
import { KolomKoppeling } from './KolomKoppeling'
import { ImportOverzicht, type Controle } from './ImportOverzicht'

// Ledenbestand inlezen in drie stappen: bestand, kolommen, controleren en inlezen.
// Elke wijziging in bestand of kolommen maakt de controle ongeldig, zodat er
// altijd wordt ingelezen wat als laatste is gecontroleerd.

interface LedenImportProps {
  vestiging: Vestiging
  vestigingLabel: string
  /** Kwam de eigenaar uit de startwizard? Dan na het inlezen een knop terug. */
  terugNaarStart?: string | null
}

interface Klaar {
  toegevoegd: number
  bijgewerkt: number
  mislukt: { regel: number; naam: string }[]
}

type Bezig = 'controleren' | 'inlezen' | null

function leesControle(data: unknown): Controle | null {
  if (typeof data !== 'object' || data === null || !('telling' in data) || !('rijen' in data)) return null
  return data as Controle
}

function leesKlaar(data: unknown): Klaar | null {
  if (typeof data !== 'object' || data === null || !('toegevoegd' in data)) return null
  return data as Klaar
}

export function LedenImport({ vestiging, vestigingLabel, terugNaarStart = null }: LedenImportProps) {
  const [bestand, setBestand] = useState<{ naam: string; tabel: CsvTabel } | null>(null)
  const [koppeling, setKoppeling] = useState<Koppeling | null>(null)
  const [controle, setControle] = useState<Controle | null>(null)
  const [klaar, setKlaar] = useState<Klaar | null>(null)
  const [bezig, setBezig] = useState<Bezig>(null)
  const [fout, setFout] = useState<string | null>(null)

  const ontbreekt = koppeling ? ontbrekendeVelden(koppeling) : []
  const rijen = useMemo(
    () => (bestand && koppeling ? bestand.tabel.rijen.map((r, i) => ({ regel: bestand.tabel.regels[i], ...pasKoppelingToe(r, koppeling) })) : []),
    [bestand, koppeling],
  )

  function nieuwBestand(naam: string, tabel: CsvTabel) {
    setControle(null)
    setKlaar(null)
    if (tabel.koppen.length === 0 || tabel.rijen.length === 0) {
      setBestand(null)
      setKoppeling(null)
      setFout('Dit bestand is leeg of heeft alleen een kopregel.')
      return
    }
    setFout(
      tabel.rijen.length > MAX_IMPORT_RIJEN
        ? `Dit bestand heeft ${tabel.rijen.length} regels. Maximaal ${MAX_IMPORT_RIJEN} per keer: splits het bestand.`
        : tabel.onafgesloten
          ? 'Let op: ergens in het bestand staat een aanhalingsteken dat niet wordt gesloten. De regels daarna kunnen verkeerd zijn gelezen.'
          : null,
    )
    setBestand({ naam, tabel })
    setKoppeling(raadKoppeling(tabel.koppen))
  }

  function wijzigKolom(veld: ImportVeld, kolom: number | null) {
    if (!koppeling) return
    setControle(null)
    setKoppeling({ ...koppeling, [veld]: kolom })
  }

  async function verstuur(opslaan: boolean) {
    setBezig(opslaan ? 'inlezen' : 'controleren')
    setFout(null)
    const uit = await stuur('/api/club/leden/import', 'POST', { vestiging, opslaan, rijen })
    setBezig(null)
    if (!uit.ok) return setFout(uit.fout)
    if (opslaan) {
      setKlaar(leesKlaar(uit.data))
      setControle(null)
    } else setControle(leesControle(uit.data))
  }

  if (klaar) return <ImportKlaar klaar={klaar} vestiging={vestiging} vestigingLabel={vestigingLabel} terugNaarStart={terugNaarStart} />

  const teGroot = rijen.length > MAX_IMPORT_RIJEN
  const teVeranderen = controle ? controle.telling.nieuw + controle.telling.bijwerken : 0
  return (
    <div className="club-import">
      <section className="club-import-stap" aria-labelledby="stap-bestand">
        <h2 id="stap-bestand"><span className="club-import-nummer">1</span> Bestand</h2>
        <BestandKiezer bestandsnaam={bestand ? `${bestand.naam} · ${bestand.tabel.rijen.length} regels` : null} onGelezen={nieuwBestand} />
      </section>

      {bestand && koppeling && (
        <section className="club-import-stap" aria-labelledby="stap-kolommen">
          <h2 id="stap-kolommen"><span className="club-import-nummer">2</span> Kolommen</h2>
          <p className="club-hint">Herkende kolommen staan al goed. Controleer ze en kies bij een veld de juiste kolom als het niet klopt.</p>
          <KolomKoppeling koppen={bestand.tabel.koppen} eersteRij={bestand.tabel.rijen[0] ?? null} koppeling={koppeling} onWijzig={wijzigKolom} />
        </section>
      )}

      {bestand && koppeling && (
        <section className="club-import-stap" aria-labelledby="stap-controle">
          <h2 id="stap-controle"><span className="club-import-nummer">3</span> Controleren en inlezen</h2>
          {ontbreekt.length > 0 && (
            <p className="club-melding">Kies eerst een kolom voor: {ontbreekt.map((v) => IMPORT_VELD_LABEL[v]).join(' en ')}. Staat de hele naam in een kolom? Kies die dan bij Volledige naam.</p>
          )}
          {controle && <ImportOverzicht controle={controle} />}
          <div className="club-acties">
            {!controle ? (
              <button type="button" className="club-knop club-knop--primair" disabled={ontbreekt.length > 0 || teGroot || bezig !== null} onClick={() => void verstuur(false)}>
                {bezig === 'controleren' ? 'Controleren...' : 'Controleren'}
              </button>
            ) : (
              <button type="button" className="club-knop club-knop--primair" disabled={teVeranderen === 0 || bezig !== null} onClick={() => void verstuur(true)}>
                {bezig === 'inlezen' ? 'Inlezen...' : teVeranderen === 0 ? 'Niets te veranderen' : `${teVeranderen} leden inlezen in ${vestigingLabel}`}
              </button>
            )}
          </div>
        </section>
      )}

      {fout && <p className="club-melding club-melding--fout" role="alert">{fout}</p>}
    </div>
  )
}

function ImportKlaar({ klaar, vestiging, vestigingLabel, terugNaarStart }: { klaar: Klaar; vestiging: Vestiging; vestigingLabel: string; terugNaarStart: string | null }) {
  const kop = useRef<HTMLHeadingElement>(null)
  // Het resultaat verschijnt in een keer: zet de focus erop, dan leest een schermlezer het voor.
  useEffect(() => kop.current?.focus(), [])
  return (
    <section className="club-kaart club-import-klaar">
      <h2 ref={kop} tabIndex={-1}>Ledenbestand ingelezen</h2>
      <p>
        {vestigingLabel}: {klaar.toegevoegd} nieuwe leden toegevoegd en {klaar.bijgewerkt} bijgewerkt.
      </p>
      {klaar.mislukt.length > 0 && (
        <p className="club-melding club-melding--fout" role="alert">
          {klaar.mislukt.length} lukten niet: {klaar.mislukt.slice(0, 8).map((m) => `${m.naam} (regel ${m.regel})`).join(', ')}
          {klaar.mislukt.length > 8 ? ' en meer' : ''}. Controleer die regels en lees het bestand nog eens in; wat al goed staat verandert dan niet.
        </p>
      )}
      <div className="club-acties">
        {/* In de startwizard blijf je in de wizard: geen weg naar Leden. */}
        {terugNaarStart ? (
          <Link href={terugNaarStart} className="club-knop club-knop--primair">Verder met de startwizard</Link>
        ) : (
          <Link href={clubPad('/leden', vestiging)} className="club-knop club-knop--primair">Naar de leden</Link>
        )}
      </div>
    </section>
  )
}
