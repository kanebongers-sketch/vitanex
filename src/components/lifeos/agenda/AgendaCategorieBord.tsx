'use client'

// Het categorie-bord: je komende afspraken (2 weken) verdeeld over bakken —
// PT-klanten, PT-team, Management, Team Budel, Persoonlijk en Overig. Elke bak is
// een chip die je aan/uit kunt zetten; zo filter je "Overig" (of wat dan ook) weg.
//
// Read-only v1: de categorie komt uit de naam-koppeling (server). Zelf herindelen
// + laten leren is de volgende stap.

import { useCallback, useEffect, useState } from 'react'
import { haalJson, leesNiets } from '@/lib/lifeos/api/http'
import {
  CATEGORIE_VOLGORDE,
  categorieLabel,
  leesCategorieAntwoord,
  normaliseerTitel,
  type AgendaCategorie,
  type CategorieEventJson,
} from '@/lib/lifeos/agenda/categorie'

type Staat =
  | { fase: 'laden' }
  | { fase: 'fout'; bericht: string }
  | { fase: 'niet_gekoppeld' }
  | { fase: 'ok'; events: CategorieEventJson[] }

const DAG_TIJD = new Intl.DateTimeFormat('nl-NL', {
  timeZone: 'Europe/Amsterdam',
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

function tijdstip(event: CategorieEventJson): string {
  const d = new Date(event.startOp)
  if (Number.isNaN(d.getTime())) return ''
  if (event.heleDag) {
    return new Intl.DateTimeFormat('nl-NL', {
      timeZone: 'Europe/Amsterdam',
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    }).format(d)
  }
  return DAG_TIJD.format(d)
}

export function AgendaCategorieBord() {
  const [staat, setStaat] = useState<Staat>({ fase: 'laden' })
  const [verborgen, setVerborgen] = useState<ReadonlySet<AgendaCategorie>>(new Set())
  const [actieFout, setActieFout] = useState<string | null>(null)

  // `.then`-stijl (geen async-functie), gespiegeld aan `useMensen`: setState gebeurt
  // ná de fetch in de callback, nooit synchroon in het effect. De begintoestand is
  // al 'laden'; de retry hieronder zet 'm expliciet terug.
  const laad = useCallback((): Promise<void> => {
    return haalJson('/api/lifeos/agenda/categorieen', leesCategorieAntwoord).then((uitkomst) => {
      if (!uitkomst.ok) {
        setStaat({ fase: 'fout', bericht: uitkomst.fout })
        return
      }
      if (!uitkomst.waarde.gekoppeld) {
        setStaat({ fase: 'niet_gekoppeld' })
        return
      }
      setStaat({ fase: 'ok', events: uitkomst.waarde.events })
    })
  }, [])

  const opnieuw = useCallback(() => {
    setStaat({ fase: 'laden' })
    void laad()
  }, [laad])

  useEffect(() => {
    void laad()
  }, [laad])

  // Zelf herindelen + laten leren: alle afspraken met dezelfde titel verhuizen
  // optimistisch mee (de regel generaliseert), en de keuze wordt server-side
  // onthouden. Faalt het opslaan, dan draaien we terug én zeggen we het.
  const herindeel = useCallback(
    (event: CategorieEventJson, nieuw: AgendaCategorie) => {
      const norm = normaliseerTitel(event.titel)
      setActieFout(null)
      setStaat((s) =>
        s.fase === 'ok'
          ? {
              fase: 'ok',
              events: s.events.map((e) =>
                normaliseerTitel(e.titel) === norm ? { ...e, categorie: nieuw } : e,
              ),
            }
          : s,
      )
      void haalJson('/api/lifeos/agenda/categorieen/regel', leesNiets, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titel: event.titel, categorie: nieuw }),
      }).then((uitkomst) => {
        if (!uitkomst.ok) {
          setActieFout('Kon de wijziging niet opslaan — je verse stand is teruggezet.')
          void laad()
        }
      })
    },
    [laad],
  )

  const toggle = useCallback((categorie: AgendaCategorie) => {
    setVerborgen((huidig) => {
      const volgende = new Set(huidig)
      if (volgende.has(categorie)) volgende.delete(categorie)
      else volgende.add(categorie)
      return volgende
    })
  }, [])

  if (staat.fase === 'laden') {
    return <p style={{ color: 'var(--text-3)', fontSize: 14 }}>Je agenda wordt ingedeeld…</p>
  }
  if (staat.fase === 'fout') {
    return (
      <div style={vak}>
        <p style={{ color: 'var(--text-2)', fontSize: 14, margin: 0 }}>{staat.bericht}</p>
        <button type="button" onClick={opnieuw} style={knop}>
          Opnieuw
        </button>
      </div>
    )
  }
  if (staat.fase === 'niet_gekoppeld') {
    return (
      <div style={vak}>
        <p style={{ color: 'var(--text-2)', fontSize: 14, margin: 0 }}>
          Je agenda is niet gekoppeld. Koppel je agenda eerst, dan verschijnen je afspraken hier per categorie.
        </p>
      </div>
    )
  }

  // Tel per categorie en groepeer, in de vaste volgorde.
  const perCategorie = new Map<AgendaCategorie, CategorieEventJson[]>()
  for (const cat of CATEGORIE_VOLGORDE) perCategorie.set(cat, [])
  for (const event of staat.events) {
    perCategorie.get(event.categorie)?.push(event)
  }
  for (const lijst of perCategorie.values()) {
    lijst.sort((a, b) => a.startOp.localeCompare(b.startOp))
  }

  const zichtbaar = CATEGORIE_VOLGORDE.filter((c) => (perCategorie.get(c)?.length ?? 0) > 0)

  if (zichtbaar.length === 0) {
    return (
      <div style={vak}>
        <p style={{ color: 'var(--text-3)', fontSize: 14, margin: 0 }}>
          Geen afspraken in de komende twee weken.
        </p>
      </div>
    )
  }

  return (
    <div>
      {actieFout && (
        <p role="alert" style={foutBalk}>
          {actieFout}
        </p>
      )}
      {/* Filter-chips: klik om een categorie te verbergen (bv. "Overig"). */}
      <div role="group" aria-label="Filter categorieën" style={chipRij}>
        {zichtbaar.map((cat) => {
          const aantal = perCategorie.get(cat)?.length ?? 0
          const uit = verborgen.has(cat)
          return (
            <button
              key={cat}
              type="button"
              aria-pressed={!uit}
              onClick={() => toggle(cat)}
              style={{ ...chip, ...(uit ? chipUit : chipAan) }}
            >
              {categorieLabel(cat)}
              <span style={{ ...chipTelling, color: uit ? 'var(--text-4)' : 'var(--bg-app)' }}>{aantal}</span>
            </button>
          )
        })}
      </div>

      <div style={{ display: 'grid', gap: 'var(--ruimte-band)', marginTop: 'var(--ruimte-band)' }}>
        {zichtbaar
          .filter((c) => !verborgen.has(c))
          .map((cat) => {
            const events = perCategorie.get(cat) ?? []
            return (
              <section key={cat} aria-label={categorieLabel(cat)}>
                <h2 style={sectieKop}>
                  {categorieLabel(cat)}
                  <span style={{ color: 'var(--text-4)', fontWeight: 500, marginLeft: 8 }}>{events.length}</span>
                </h2>
                <ul style={lijstStijl}>
                  {events.map((event) => (
                    <li key={event.id} style={rij}>
                      <span style={{ color: 'var(--text-3)', fontSize: 13, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                        {tijdstip(event)}
                      </span>
                      <span style={{ color: 'var(--text-1)', fontSize: 14, flex: 1, minWidth: 0 }}>
                        {event.titel ?? '(zonder titel)'}
                      </span>
                      <select
                        aria-label={`Categorie van ${event.titel ?? 'afspraak'}`}
                        value={event.categorie}
                        onChange={(e) => {
                          const gekozen = CATEGORIE_VOLGORDE.find((c) => c === e.target.value)
                          if (gekozen) herindeel(event, gekozen)
                        }}
                        style={selectStijl}
                      >
                        {CATEGORIE_VOLGORDE.map((c) => (
                          <option key={c} value={c}>
                            {categorieLabel(c)}
                          </option>
                        ))}
                      </select>
                    </li>
                  ))}
                </ul>
              </section>
            )
          })}
      </div>
    </div>
  )
}

// ─── Stijl (LifeOS-tokens, geen hardcoded kleuren) ──────────────────────────
const vak: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: 12,
  padding: 'var(--ruimte-kaart)',
  background: 'var(--bg-card)',
  border: '1px solid var(--line)',
  borderRadius: 14,
}
const knop: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: 10,
  border: '1px solid var(--brand)',
  background: 'transparent',
  color: 'var(--brand)',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
}
const chipRij: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 8 }
const chip: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '7px 12px',
  borderRadius: 999,
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'opacity .15s var(--ease), background .15s var(--ease)',
}
const chipAan: React.CSSProperties = {
  background: 'var(--brand)',
  color: 'var(--bg-app)',
  border: '1px solid var(--brand)',
}
const chipUit: React.CSSProperties = {
  background: 'transparent',
  color: 'var(--text-3)',
  border: '1px solid var(--line-strong)',
}
const chipTelling: React.CSSProperties = {
  display: 'inline-flex',
  minWidth: 18,
  justifyContent: 'center',
  fontVariantNumeric: 'tabular-nums',
  fontWeight: 700,
}
const sectieKop: React.CSSProperties = {
  fontFamily: 'var(--font-grotesk)',
  fontSize: 15,
  color: 'var(--text-1)',
  margin: '0 0 10px',
  letterSpacing: '.01em',
}
const lijstStijl: React.CSSProperties = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'grid',
  gap: 1,
  background: 'var(--line)',
  border: '1px solid var(--line)',
  borderRadius: 12,
  overflow: 'hidden',
}
const rij: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 14,
  padding: '10px 14px',
  background: 'var(--bg-card)',
}
const selectStijl: React.CSSProperties = {
  flexShrink: 0,
  padding: '5px 8px',
  borderRadius: 8,
  border: '1px solid var(--line-strong)',
  background: 'var(--bg-raised)',
  color: 'var(--text-2)',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
}
const foutBalk: React.CSSProperties = {
  margin: '0 0 12px',
  padding: '10px 14px',
  borderRadius: 12,
  background: 'var(--status-danger-soft)',
  border: '1px solid var(--status-danger)',
  color: 'var(--text-1)',
  fontSize: 13,
}
