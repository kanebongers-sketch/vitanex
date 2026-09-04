'use client'

import { useMemo, useState, type CSSProperties, type FormEvent } from 'react'
import { Kaart } from '@/components/lifeos/os/Kaart'
import { Knop } from '@/components/lifeos/os/Knop'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'
import { useTaken } from './useTaken'
import type { Taak } from '@/lib/lifeos/taken/taken'

// Een rustige afvinklijst à la Apple Notes: open taken, gegroepeerd onder je
// eigen categorie-kopjes (vrije "mapjes"), afvinken met één tik. Geen impact,
// deadline, tijdsinschatting of top-3 in beeld — die machinerie zat in de weg.
// Het gedrag (laden/wijzigen) komt uit `useTaken`; hier alleen de simpele weergave.

/** Taken zonder categorie vallen onder dit kopje — altijd onderaan. */
const OVERIG = 'Overig'

export function TakenApple() {
  const { staat, actieFout, bezig, opnieuw, vink, voegToe } = useTaken()
  const [titel, setTitel] = useState('')
  const [categorie, setCategorie] = useState('')

  // Open taken gegroepeerd per categorie; benoemde mapjes alfabetisch, "Overig"
  // achteraan.
  const groepen = useMemo<[string, Taak[]][]>(() => {
    if (staat.fase !== 'ok') return []
    const map = new Map<string, Taak[]>()
    for (const t of staat.taken) {
      if (t.klaar) continue
      const sleutel = (t.categorie ?? '').trim() || OVERIG
      const lijst = map.get(sleutel) ?? []
      lijst.push(t)
      map.set(sleutel, lijst)
    }
    return [...map.entries()].sort((a, b) => {
      if (a[0] === OVERIG) return 1
      if (b[0] === OVERIG) return -1
      return a[0].localeCompare(b[0], 'nl')
    })
  }, [staat])

  // Bestaande categorieën als suggesties (datalist), zodat je consequent in
  // dezelfde mapjes typt.
  const bestaande = useMemo<string[]>(() => {
    if (staat.fase !== 'ok') return []
    const set = new Set(staat.taken.map((t) => (t.categorie ?? '').trim()).filter(Boolean))
    return [...set].sort((a, b) => a.localeCompare(b, 'nl'))
  }, [staat])

  async function toevoegen(e: FormEvent) {
    e.preventDefault()
    const t = titel.trim()
    if (!t) return
    // De categorie laten we staan: zo zet je meerdere taken vlot in hetzelfde mapje.
    const gelukt = await voegToe(t, null, categorie.trim() || null)
    if (gelukt) setTitel('')
  }

  return (
    <Kaart titel="To-do’s" vervangt="Apple Notes">
      {staat.fase === 'laden' ? <Skelet /> : null}
      {staat.fase === 'fout' ? <Foutmelding bericht={staat.bericht} opnieuw={opnieuw} /> : null}

      {staat.fase === 'ok' ? (
        <div style={{ display: 'grid', gap: 16 }}>
          <form onSubmit={toevoegen} style={{ display: 'grid', gap: 8 }}>
            <input
              value={titel}
              onChange={(e) => setTitel(e.target.value)}
              placeholder="Nieuwe taak…"
              aria-label="Nieuwe taak"
              style={veld}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={categorie}
                onChange={(e) => setCategorie(e.target.value)}
                placeholder="Categorie (optioneel)"
                aria-label="Categorie"
                list="taak-categorieen"
                style={{ ...veld, flex: 1 }}
              />
              <datalist id="taak-categorieen">
                {bestaande.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
              <Knop type="submit" variant="primair" disabled={bezig || titel.trim().length === 0}>
                Toevoegen
              </Knop>
            </div>
            {actieFout ? <Foutmelding bericht={actieFout} /> : null}
          </form>

          {groepen.length === 0 ? (
            <p style={{ fontSize: 14, color: 'var(--text-3)', margin: 0, lineHeight: 1.5 }}>
              Geen open taken. Rustig.
            </p>
          ) : (
            groepen.map(([cat, taken]) => (
              <div key={cat} style={{ display: 'grid', gap: 4 }}>
                <p style={kopStijl}>{cat}</p>
                <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 1 }}>
                  {taken.map((t) => (
                    <li key={t.id}>
                      <label style={rijStijl}>
                        <input
                          type="checkbox"
                          checked={false}
                          onChange={() => vink(t)}
                          aria-label={`${t.titel} afvinken`}
                          style={{ marginTop: 3, cursor: 'pointer', flexShrink: 0 }}
                        />
                        <span style={{ fontSize: 14, color: 'var(--text-1)', lineHeight: 1.4 }}>{t.titel}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>
      ) : null}
    </Kaart>
  )
}

const veld: CSSProperties = {
  appearance: 'none',
  fontFamily: 'inherit',
  fontSize: 14,
  color: 'var(--text-1)',
  background: 'var(--bg-raised)',
  border: '1px solid var(--line)',
  borderRadius: 8,
  padding: '9px 11px',
}

const kopStijl: CSSProperties = {
  margin: 0,
  fontSize: 11.5,
  fontWeight: 700,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'var(--text-4)',
}

const rijStijl: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 9,
  padding: '6px 0',
  cursor: 'pointer',
  borderBottom: '1px solid var(--border)',
}

function Skelet() {
  return (
    <div aria-hidden style={{ display: 'grid', gap: 8 }}>
      <div style={{ height: 38, borderRadius: 8, background: 'var(--bg-raised)' }} />
      <div style={{ height: 13, width: '40%', borderRadius: 4, background: 'var(--bg-raised)' }} />
      <div style={{ height: 13, width: '70%', borderRadius: 4, background: 'var(--bg-raised)' }} />
    </div>
  )
}
