'use client'

import { useId, useState, type FormEvent } from 'react'
import { MEDEWERKER_ROLLEN } from '@/lib/club/kern/medewerker'
import { REGEL_DEFINITIES, SJABLOON_MAX, wieWaarde, type Regel } from '@/lib/club/automatisering/regels'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { OPVOLGEN } from '@/lib/aiyourgym/taal/woorden/club/opvolgen'
import { OPVOLGREGELS } from '@/lib/aiyourgym/taal/woorden/club/opvolgregels'
import { onbekendeVelden, vulSjabloon } from '@/lib/club/automatisering/sjabloon'
import { stuur } from './stuur'

// Een regel instellen: aan of uit (slaat meteen op), drempel, wie het oppakt
// en de voorbeeldtekst met een voorbeeld hoe die er voor een lid uitziet.

interface Props {
  regel: Regel
  nummer: number
  medewerkers: readonly { id: string; naam: string }[]
  vestigingNaam: string
  onKlaar: (tekst: string, ok: boolean) => void
}

const URL = '/api/club/automatisering/regels'

/** De plekken in de voorbeeldtekst die Club zelf invult (namen van velden, geen tekst). */
const PLEKKEN = ['{voornaam}', '{vestiging}', '{dagen}', '{bezoeken}'] as const

export function RegelKaart({ regel, nummer, medewerkers, vestigingNaam, onKlaar }: Props) {
  const def = REGEL_DEFINITIES[regel.sleutel]
  const o = useTekst(OPVOLGEN)
  const w = useTekst(OPVOLGREGELS)
  const k = w.kaart
  const naam = o.regel[regel.sleutel]
  const drempelTekst = regel.sleutel in w.drempel ? w.drempel[regel.sleutel as keyof typeof w.drempel] : null
  const id = useId()
  const [aan, setAan] = useState(regel.aan)
  const [drempel, setDrempel] = useState(String(regel.drempel ?? ''))
  const [wie, setWie] = useState(wieWaarde(regel.wie))
  const [sjabloon, setSjabloon] = useState(regel.sjabloon)
  const [bezig, setBezig] = useState(false)

  const getal = drempel !== '' && Number.isFinite(Number(drempel)) ? Number(drempel) : (regel.drempel ?? 0)
  const voorbeeld = vulSjabloon(sjabloon, {
    voornaam: k.voorbeeldNaam,
    vestiging: vestigingNaam,
    dagen: regel.sleutel === 'welkom' ? 3 : getal,
    bezoeken: regel.sleutel === 'mijlpaal' ? getal : null,
  })
  const onbekend = onbekendeVelden(sjabloon)

  async function bewaar(body: Record<string, unknown>, gelukt: string) {
    setBezig(true)
    const uit = await stuur(URL, 'PUT', { sleutel: regel.sleutel, ...body })
    setBezig(false)
    onKlaar(uit.ok ? gelukt : uit.fout, uit.ok)
    return uit.ok
  }

  async function wissel() {
    const nieuw = !aan
    setAan(nieuw)
    const ok = await bewaar({ aan: nieuw, drempel: regel.drempel, wie: wieWaarde(regel.wie), sjabloon: regel.sjabloon }, nieuw ? k.staatAan(naam.titel) : k.staatUit(naam.titel))
    if (!ok) setAan(!nieuw)
  }

  function opslaan(e: FormEvent) {
    e.preventDefault()
    void bewaar({ aan, drempel: def.drempel ? Number(drempel) : null, wie, sjabloon }, k.opgeslagen(naam.titel))
  }

  return (
    <article className={`club-auto-regel${aan ? '' : ' club-auto-regel--uit'}`} aria-labelledby={`${id}-titel`}>
      <header className="club-auto-regelkop">
        <span className="club-auto-nummer" aria-hidden>{String(nummer).padStart(2, '0')}</span>
        <div className="club-auto-regeltekst">
          <h2 id={`${id}-titel`}>{naam.titel}</h2>
          <p>{w.uitleg[regel.sleutel](def.drempel ? String(getal) : '')}</p>
          <p className="club-hint">{naam.waarom}</p>
        </div>
        <button type="button" role="switch" aria-checked={aan} aria-labelledby={`${id}-titel`} className="club-auto-schakelaar" onClick={wissel} disabled={bezig}>
          <span aria-hidden className="club-auto-schakelaar-bol" />
          <span className="club-auto-schakelaar-tekst">{aan ? k.aan : k.uit}</span>
        </button>
      </header>

      <form className="club-auto-form" onSubmit={opslaan}>
        <div className="club-formrij">
          {def.drempel && (
            <label className="club-veld" htmlFor={`${id}-drempel`}>
              <span>{drempelTekst?.label ?? def.drempel.label}</span>
              <span className="club-auto-getal">
                <input id={`${id}-drempel`} className="club-invoer" type="number" inputMode="numeric" min={def.drempel.min} max={def.drempel.max} step={1} required value={drempel} onChange={(e) => setDrempel(e.target.value)} aria-describedby={`${id}-drempel-hint`} />
                <span id={`${id}-drempel-hint`} className="club-zacht">{k.bereik(drempelTekst?.eenheid ?? def.drempel.eenheid, def.drempel.min, def.drempel.max)}</span>
              </span>
            </label>
          )}
          <label className="club-veld" htmlFor={`${id}-wie`}>
            <span>{k.wie}</span>
            <select id={`${id}-wie`} className="club-invoer" value={wie} onChange={(e) => setWie(e.target.value)}>
              <option value="iedereen">{k.iedereen}</option>
              <optgroup label={k.functie}>
                {MEDEWERKER_ROLLEN.map((r) => <option key={r} value={`rol:${r}`}>{o.wie.rol[r]}</option>)}
              </optgroup>
              {medewerkers.length > 0 && (
                <optgroup label={k.vast}>
                  {medewerkers.map((m) => <option key={m.id} value={`mw:${m.id}`}>{m.naam}</option>)}
                </optgroup>
              )}
            </select>
          </label>
        </div>

        <label className="club-veld" htmlFor={`${id}-sjabloon`}>
          <span>{k.sjabloon}</span>
          <textarea id={`${id}-sjabloon`} className="club-invoer" value={sjabloon} maxLength={SJABLOON_MAX} required onChange={(e) => setSjabloon(e.target.value)} aria-describedby={`${id}-sjabloon-hint`} />
        </label>
        <p id={`${id}-sjabloon-hint`} className="club-hint">
          {k.plekken(`${PLEKKEN.slice(0, -1).join(', ')} ${k.en} ${PLEKKEN[PLEKKEN.length - 1]}`, sjabloon.length, SJABLOON_MAX)}
        </p>
        {onbekend.length > 0 && <p className="club-fout">{k.onbekend(onbekend.map((n) => `{${n}}`).join(', '))}</p>}

        <figure className="club-auto-voorbeeld">
          <figcaption>{k.voorbeeld(k.voorbeeldNaam)}</figcaption>
          <blockquote>{voorbeeld}</blockquote>
        </figure>

        <div className="club-acties">
          <button type="submit" className="club-knop club-knop--primair club-knop--klein" disabled={bezig}>{k.opslaan}</button>
        </div>
      </form>
    </article>
  )
}
