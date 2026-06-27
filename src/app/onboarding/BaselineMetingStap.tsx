'use client'

// ════════════════════════════════════════════════════════════════════════════
// BaselineMetingStap — 15 baseline-vragen verdeeld over 4 blokken.
// Opgeslitst uit IntakeStappen.tsx om onder de 800-regelgrens te blijven.
// Exporteert: BaselineMetingStap (component), BaselineMeting (type), LEGE_BASELINE.
// ════════════════════════════════════════════════════════════════════════════

import { type Dispatch, type SetStateAction } from 'react'
import { Veld, Knop, SkipLink } from './page'

// ─── Types ────────────────────────────────────────────────────────────────────
export interface BaselineMeting {
  energie_niveau: number | null
  stemming: number | null
  interesse_plezier: number | null
  lichaam_gevoel: number | null
  slaap_kwaliteit: number | null
  slaap_duur: number | null
  slaperigheid_overdag: number | null
  stress_controle: number | null
  stress_overweldigd: number | null
  herstel_ontspanning: number | null
  beweging_dagen: number | null
  voeding_kwaliteit: number | null
  gewoontes: string[]
  motivatoren: string[]
  zelfvertrouwen_verandering: number | null
}

export const LEGE_BASELINE: BaselineMeting = {
  energie_niveau: null,
  stemming: null,
  interesse_plezier: null,
  lichaam_gevoel: null,
  slaap_kwaliteit: null,
  slaap_duur: null,
  slaperigheid_overdag: null,
  stress_controle: null,
  stress_overweldigd: null,
  herstel_ontspanning: null,
  beweging_dagen: null,
  voeding_kwaliteit: null,
  gewoontes: [],
  motivatoren: [],
  zelfvertrouwen_verandering: null,
}

// ─── Constanten ───────────────────────────────────────────────────────────────
const GEWOONTE_OPTIES = [
  'Veel zitten', 'Weinig water', 'Veel cafeïne', 'Onregelmatig eten',
  'Veel schermtijd voor slaap', 'Roken', 'Alcohol meerdere keren/week',
  'Skip ontbijt', 'Snelle/kant-en-klaar maaltijden',
]

const MOTIVATOR_OPTIES = [
  'Meer energie', 'Beter slapen', 'Minder stress', 'Afvallen',
  'Fitter/sterker', 'Gezonder ouder worden', 'Mentaal rustiger',
  'Productiever op werk', 'Pijn/klachten verminderen',
]

const SLAAP_DUUR_OPTIES = ['<5u', '5-6u', '6-7u', '7-8u', '8-9u', '>9u']
const BEWEGING_OPTIES = ['0', '1', '2', '3', '4', '5+']

// ─── Primitieven ──────────────────────────────────────────────────────────────
function EmojiSchaal({
  vraag, emojis, waarde, onChange,
}: {
  vraag: string; emojis: string[]; waarde: number | null; onChange: (v: number) => void
}) {
  return (
    <div style={{ marginBottom: 20 }}>
      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--mf-text, #374151)', marginBottom: 10 }}>{vraag}</p>
      <div style={{ display: 'flex', gap: 6, justifyContent: 'space-between' }}>
        {emojis.map((emoji, i) => {
          const val = i + 1
          const geselecteerd = waarde === val
          return (
            <button
              key={val}
              type="button"
              onClick={() => onChange(val)}
              style={{
                flex: 1, padding: '9px 4px', borderRadius: 10,
                border: `2px solid ${geselecteerd ? 'var(--mf-green, #1D9E75)' : 'var(--mf-border, #E5E7EB)'}`,
                background: geselecteerd ? 'var(--mf-green-light, #E1F5EE)' : 'var(--mf-bg-subtle, #F9FAFB)',
                cursor: 'pointer', fontSize: 20, transition: 'all 0.15s',
                transform: geselecteerd ? 'scale(1.1)' : 'scale(1)',
                boxShadow: geselecteerd ? '0 2px 8px rgba(29,158,117,0.2)' : 'none',
              }}
            >
              {emoji}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function ChipSelectie({
  opties, geselecteerd, onToggle, multi = false, max,
}: {
  opties: string[]
  geselecteerd: string | string[] | number | null
  onToggle: (waarde: string) => void
  multi?: boolean
  max?: number
}) {
  function isActief(opt: string, index: number): boolean {
    if (multi) return Array.isArray(geselecteerd) && geselecteerd.includes(opt)
    if (typeof geselecteerd === 'number') return geselecteerd === index
    return geselecteerd === opt
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {opties.map((opt, i) => {
        const actief = isActief(opt, i)
        const limietBereikt = multi && max !== undefined && Array.isArray(geselecteerd) && geselecteerd.length >= max && !actief
        return (
          <button
            key={opt}
            type="button"
            onClick={() => { if (!limietBereikt) onToggle(opt) }}
            disabled={limietBereikt}
            style={{
              padding: '7px 14px', borderRadius: 9999, fontSize: 13, cursor: limietBereikt ? 'not-allowed' : 'pointer',
              fontWeight: actief ? 700 : 400, transition: 'all 0.12s', opacity: limietBereikt ? 0.4 : 1,
              border: `1.5px solid ${actief ? 'var(--mf-green, #1D9E75)' : 'var(--mf-border, #E5E7EB)'}`,
              background: actief ? 'var(--mf-green-light, #E1F5EE)' : 'var(--mf-surface, white)',
              color: actief ? 'var(--mf-green-dark, #0F6E56)' : 'var(--mf-text-muted, #6B7280)',
            }}
          >
            {opt}
          </button>
        )
      })}
    </div>
  )
}

function BlokKop({ nummer, titel, sub }: { nummer: string; titel: string; sub: string }) {
  return (
    <div style={{ marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--mf-border, #E5E7EB)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 22, height: 22, borderRadius: '50%', fontSize: 11, fontWeight: 800,
          background: 'var(--mf-green, #1D9E75)', color: 'white',
        }}>{nummer}</span>
        <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--mf-heading, #111827)' }}>{titel}</p>
      </div>
      <p style={{ fontSize: 12, color: 'var(--mf-text-muted, #9CA3AF)', paddingLeft: 30 }}>{sub}</p>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// Hoofd component
// ════════════════════════════════════════════════════════════════════════════
export function BaselineMetingStap({
  meting, setMeting, onVolgende, onTerug, onSlaan, bezig,
}: {
  meting: BaselineMeting
  setMeting: Dispatch<SetStateAction<BaselineMeting>>
  onVolgende: () => void
  onTerug: () => void
  onSlaan: () => void
  bezig: boolean
}) {
  const blok1Ingevuld =
    meting.energie_niveau !== null &&
    meting.stemming !== null &&
    meting.interesse_plezier !== null &&
    meting.lichaam_gevoel !== null

  const blok2Ingevuld =
    meting.slaap_kwaliteit !== null &&
    meting.slaap_duur !== null &&
    meting.slaperigheid_overdag !== null

  const kanVerder = blok1Ingevuld && blok2Ingevuld

  function toggleGewoonte(opt: string) {
    setMeting(m => ({
      ...m,
      gewoontes: m.gewoontes.includes(opt)
        ? m.gewoontes.filter(g => g !== opt)
        : [...m.gewoontes, opt],
    }))
  }

  function toggleMotivator(opt: string) {
    setMeting(m => {
      if (m.motivatoren.includes(opt)) {
        return { ...m, motivatoren: m.motivatoren.filter(v => v !== opt) }
      }
      if (m.motivatoren.length >= 3) return m
      return { ...m, motivatoren: [...m.motivatoren, opt] }
    })
  }

  return (
    <div className="mf-animate-up">
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>📊</div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--mf-heading, #111827)', marginBottom: 4, letterSpacing: '-0.02em' }}>
          Jouw startfoto
        </h2>
        <p style={{ fontSize: 13, color: 'var(--mf-text-muted, #9CA3AF)', lineHeight: 1.5 }}>
          15 korte vragen. We gebruiken deze om een persoonlijk Vitality Score en actieplan voor je te maken.
          Duurt circa 3-4 minuten.
        </p>
      </div>

      <BlokKop nummer="1" titel="Hoe voel je je?" sub="De afgelopen 2 weken gemiddeld" />

      <EmojiSchaal
        vraag="Hoeveel energie had je de afgelopen 2 weken gemiddeld?"
        emojis={['😴', '😕', '😐', '😊', '⚡']}
        waarde={meting.energie_niveau}
        onChange={v => setMeting(m => ({ ...m, energie_niveau: v }))}
      />
      <EmojiSchaal
        vraag="Hoe was je stemming de afgelopen 2 weken?"
        emojis={['😞', '😔', '😐', '🙂', '😄']}
        waarde={meting.stemming}
        onChange={v => setMeting(m => ({ ...m, stemming: v }))}
      />
      <EmojiSchaal
        vraag="Had je plezier in dingen die je normaal leuk vindt?"
        emojis={['😶', '😕', '😐', '😊', '🤩']}
        waarde={meting.interesse_plezier}
        onChange={v => setMeting(m => ({ ...m, interesse_plezier: v }))}
      />
      <EmojiSchaal
        vraag="Hoe voelt je lichaam zich fysiek? (fit ↔ uitgeput)"
        emojis={['🥵', '😮‍💨', '😐', '💪', '🔥']}
        waarde={meting.lichaam_gevoel}
        onChange={v => setMeting(m => ({ ...m, lichaam_gevoel: v }))}
      />

      <div style={{ marginTop: 24 }}>
        <BlokKop nummer="2" titel="Slaap & herstel" sub="De basis onder alles" />
      </div>

      <EmojiSchaal
        vraag="Hoe goed slaap je doorgaans?"
        emojis={['😫', '😕', '😐', '😊', '🤩']}
        waarde={meting.slaap_kwaliteit}
        onChange={v => setMeting(m => ({ ...m, slaap_kwaliteit: v }))}
      />
      <Veld label="Hoeveel uur slaap je gemiddeld per nacht?">
        <ChipSelectie
          opties={SLAAP_DUUR_OPTIES}
          geselecteerd={meting.slaap_duur}
          onToggle={opt => setMeting(m => ({ ...m, slaap_duur: SLAAP_DUUR_OPTIES.indexOf(opt) }))}
        />
      </Veld>
      <EmojiSchaal
        vraag="Val je overdag soms ongewild in slaap of vecht je tegen vermoeidheid?"
        emojis={['🚫', '🙂', '😐', '😪', '😴']}
        waarde={meting.slaperigheid_overdag}
        onChange={v => setMeting(m => ({ ...m, slaperigheid_overdag: v }))}
      />

      <div style={{ marginTop: 24 }}>
        <BlokKop nummer="3" titel="Stress & veerkracht" sub="De afgelopen 2 weken" />
      </div>

      <EmojiSchaal
        vraag="Hoe vaak voelde je dat je de belangrijke dingen in je leven onder controle had?"
        emojis={['😟', '😕', '😐', '🙂', '😌']}
        waarde={meting.stress_controle}
        onChange={v => setMeting(m => ({ ...m, stress_controle: v }))}
      />
      <EmojiSchaal
        vraag="Hoe vaak voelden problemen zich zo opstapelen dat je ze niet de baas kon?"
        emojis={['🚫', '😕', '😐', '😓', '😵']}
        waarde={meting.stress_overweldigd}
        onChange={v => setMeting(m => ({ ...m, stress_overweldigd: v }))}
      />
      <EmojiSchaal
        vraag="Lukt het je om écht te ontspannen en te herstellen op een dag?"
        emojis={['🚫', '😕', '😐', '😊', '🧘']}
        waarde={meting.herstel_ontspanning}
        onChange={v => setMeting(m => ({ ...m, herstel_ontspanning: v }))}
      />

      <div style={{ marginTop: 24 }}>
        <BlokKop nummer="4" titel="Leefstijl & gedrag" sub="Wat doe je al?" />
      </div>

      <Veld label="Op hoeveel dagen per week beweeg je intensief? (zweten / buiten adem)">
        <ChipSelectie
          opties={BEWEGING_OPTIES}
          geselecteerd={meting.beweging_dagen}
          onToggle={opt => setMeting(m => ({ ...m, beweging_dagen: BEWEGING_OPTIES.indexOf(opt) }))}
        />
      </Veld>
      <EmojiSchaal
        vraag="Hoe gezond eet je doorgaans?"
        emojis={['🍔', '🍕', '😐', '🥙', '🥗']}
        waarde={meting.voeding_kwaliteit}
        onChange={v => setMeting(m => ({ ...m, voeding_kwaliteit: v }))}
      />
      <Veld label="Wat speelt nu mee in jouw dag?" sub="Kies wat past — mag meerdere zijn">
        <ChipSelectie
          opties={GEWOONTE_OPTIES}
          geselecteerd={meting.gewoontes}
          onToggle={toggleGewoonte}
          multi
        />
      </Veld>
      <Veld
        label="Wat is voor jou de belangrijkste reden om hiermee bezig te zijn?"
        sub={`Kies maximaal 3 (${meting.motivatoren.length}/3)`}
      >
        <ChipSelectie
          opties={MOTIVATOR_OPTIES}
          geselecteerd={meting.motivatoren}
          onToggle={toggleMotivator}
          multi
          max={3}
        />
      </Veld>
      <EmojiSchaal
        vraag="Hoeveel vertrouwen heb je dat je dit kunt volhouden?"
        emojis={['😟', '😕', '😐', '🙂', '💪']}
        waarde={meting.zelfvertrouwen_verandering}
        onChange={v => setMeting(m => ({ ...m, zelfvertrouwen_verandering: v }))}
      />

      {!kanVerder && (
        <p style={{ fontSize: 12, color: 'var(--mf-text-muted, #9CA3AF)', marginBottom: 12, textAlign: 'center' }}>
          Vul blok 1 en 2 volledig in om door te gaan
        </p>
      )}

      <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
        <Knop onClick={onTerug} variant="ghost">← Terug</Knop>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
          <Knop onClick={onVolgende} disabled={!kanVerder || bezig}>
            {bezig ? 'Analyseren...' : 'Analyseer mijn startfoto →'}
          </Knop>
          <SkipLink onClick={onSlaan} label="Sla meting over" />
        </div>
      </div>
    </div>
  )
}
