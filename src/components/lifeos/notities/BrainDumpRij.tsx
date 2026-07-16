'use client'

import { useState, type FormEvent } from 'react'
import { X, Sparkles, Plus } from 'lucide-react'
import type { Notitie } from '@/lib/lifeos/notities/notities'

/** 'YYYY-MM-DD' → kort NL-label ("14 jul"). Voor de datum bij zoekresultaten. */
function korteDatum(datum: string): string {
  const d = new Date(`${datum}T12:00:00`)
  if (Number.isNaN(d.getTime())) return datum
  return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
}

// Eén regel uit de brain dump. Presentational: krijgt props, geeft UI terug,
// weet niets van fetch of optimistische updates.
//
// De capture is elders frictieloos; hier, ná het opschrijven, kun je een notitie
// ordenen: een tag erop, of de AI een categorie laten voorstellen. Alles
// optioneel — een notitie zonder tags of categorie is de norm, niet onaf.

interface BrainDumpRijProps {
  notitie: Notitie
  onWeg: (notitie: Notitie) => void
  onTag: (notitie: Notitie, tag: string, actie: 'toevoegen' | 'weghalen') => void
  onCategoriseer: (notitie: Notitie) => void
  /** Optimistisch toegevoegd en nog niet bevestigd door de server. */
  onbevestigd?: boolean
  /** Toon de datum (bij zoeken over meerdere dagen). */
  metDatum?: boolean
  /** De AI is nu een categorie aan het bepalen voor déze notitie. */
  bezigMetCategorie?: boolean
}

export function BrainDumpRij({
  notitie,
  onWeg,
  onTag,
  onCategoriseer,
  onbevestigd = false,
  metDatum = false,
  bezigMetCategorie = false,
}: BrainDumpRijProps) {
  const [hover, setHover] = useState(false)
  const [tagOpen, setTagOpen] = useState(false)
  const [nieuweTag, setNieuweTag] = useState('')

  function voegTagToe(e: FormEvent) {
    e.preventDefault()
    const tag = nieuweTag.trim()
    if (tag.length === 0) return
    onTag(notitie, tag, 'toevoegen')
    setNieuweTag('')
    setTagOpen(false)
  }

  return (
    <li
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'grid',
        gap: 7,
        padding: '10px 2px 11px 0',
        borderBottom: '1px solid var(--line)',
        opacity: onbevestigd ? 0.55 : 1,
        transition: 'opacity 180ms var(--ease)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ minWidth: 0 }}>
          {metDatum ? (
            <p className="os-cijfer" style={{ margin: '0 0 3px', fontSize: 11, color: 'var(--text-4)' }}>
              {korteDatum(notitie.datum)}
            </p>
          ) : null}
          <p
            style={{
              margin: 0,
              fontSize: 13,
              lineHeight: 1.5,
              color: 'var(--text-2)',
              overflowWrap: 'anywhere',
              whiteSpace: 'pre-wrap',
            }}
          >
            {notitie.tekst}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onWeg(notitie)}
          disabled={onbevestigd}
          aria-label={`Verwijder notitie: ${notitie.tekst}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            width: 24,
            height: 24,
            padding: 0,
            borderRadius: 999,
            border: '1px solid transparent',
            background: 'transparent',
            color: hover ? 'var(--text-2)' : 'var(--text-4)',
            cursor: onbevestigd ? 'not-allowed' : 'pointer',
            opacity: onbevestigd ? 0.3 : hover ? 1 : 0.5,
            transition: 'opacity 180ms var(--ease), color 180ms var(--ease)',
          }}
        >
          <X size={13} strokeWidth={2.4} aria-hidden="true" />
        </button>
      </div>

      {/* Meta-rij: categorie + tags + acties. Alleen bij bevestigde notities —
          een optimistische rij heeft nog geen echt id om te taggen. */}
      {!onbevestigd ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
          {notitie.categorie ? <span style={CATEGORIE}>{notitie.categorie}</span> : null}

          {notitie.tags.map((tag) => (
            <span key={tag} style={TAG}>
              #{tag}
              <button
                type="button"
                onClick={() => onTag(notitie, tag, 'weghalen')}
                aria-label={`Verwijder tag ${tag}`}
                style={TAG_X}
              >
                <X size={10} strokeWidth={2.6} aria-hidden="true" />
              </button>
            </span>
          ))}

          {tagOpen ? (
            <form onSubmit={voegTagToe} style={{ display: 'inline-flex' }}>
              <label htmlFor={`tag-${notitie.id}`} style={{ position: 'absolute', left: -9999 }}>
                Nieuwe tag
              </label>
              <input
                id={`tag-${notitie.id}`}
                value={nieuweTag}
                onChange={(e) => setNieuweTag(e.target.value)}
                onBlur={() => !nieuweTag && setTagOpen(false)}
                placeholder="tag…"
                autoFocus
                maxLength={32}
                style={TAG_INVOER}
              />
            </form>
          ) : (
            <button type="button" onClick={() => setTagOpen(true)} style={ACTIE} aria-label="Tag toevoegen">
              <Plus size={11} strokeWidth={2.6} aria-hidden="true" /> tag
            </button>
          )}

          {/* AI-categorie: alleen zinvol als er nog geen categorie is. */}
          {!notitie.categorie ? (
            <button
              type="button"
              onClick={() => onCategoriseer(notitie)}
              disabled={bezigMetCategorie}
              style={{ ...ACTIE, opacity: bezigMetCategorie ? 0.5 : undefined }}
              aria-label="AI-categorie voorstellen"
            >
              <Sparkles size={11} strokeWidth={2.4} aria-hidden="true" />
              {bezigMetCategorie ? 'bezig…' : 'AI-categorie'}
            </button>
          ) : null}
        </div>
      ) : null}
    </li>
  )
}

const CATEGORIE: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  padding: '2px 8px',
  borderRadius: 999,
  background: 'var(--brand-soft)',
  color: 'var(--brand)',
}

const TAG: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 3,
  fontSize: 11,
  padding: '2px 4px 2px 8px',
  borderRadius: 999,
  border: '1px solid var(--line)',
  color: 'var(--text-3)',
}

const TAG_X: React.CSSProperties = {
  display: 'inline-flex',
  padding: 1,
  border: 'none',
  background: 'transparent',
  color: 'var(--text-4)',
  cursor: 'pointer',
}

const TAG_INVOER: React.CSSProperties = {
  width: 90,
  fontSize: 11,
  padding: '2px 8px',
  borderRadius: 999,
  border: '1px solid var(--brand)',
  background: 'var(--bg-raised)',
  color: 'var(--text-1)',
  fontFamily: 'inherit',
}

const ACTIE: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 3,
  fontSize: 11,
  fontWeight: 600,
  padding: '2px 8px',
  borderRadius: 999,
  border: '1px dashed var(--line)',
  background: 'transparent',
  color: 'var(--text-4)',
  cursor: 'pointer',
}
