'use client'

import { useState, type CSSProperties, type FormEvent, type ReactNode } from 'react'
import { X, Sparkles, Plus, Pencil } from 'lucide-react'
import type { Notitie, NotitieWijziging } from '@/lib/lifeos/notities/notities'
import { CategorieVoorstel } from './CategorieVoorstel'
import { NotitieTekst } from './NotitieTekst'
import { NotitieBewerker } from './NotitieBewerker'

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
// ordenen: een tag erop, een titel eraan (waarmee andere notities ernaar kunnen
// verwijzen), of de AI een categorie laten voorstellen. Alles optioneel — een
// notitie zonder titel, tags of categorie is de norm, niet onaf.

interface BrainDumpRijProps {
  notitie: Notitie
  onWeg: (notitie: Notitie) => void
  onTag: (notitie: Notitie, tag: string, actie: 'toevoegen' | 'weghalen') => void
  onCategoriseer: (notitie: Notitie) => void
  onBewerk: (notitie: Notitie, wijziging: NotitieWijziging) => void
  /** Zie `BrainDump.bestaandeTitels` — undefined = we weten het niet, dus claim niets. */
  bestaandeTitels?: ReadonlySet<string>
  /** Klik op een [[verwijzing]]. Weglaten = verwijzingen zijn tekst, geen knop. */
  onLinkKlik?: (titel: string) => void
  /** Optimistisch toegevoegd en nog niet bevestigd door de server. */
  onbevestigd?: boolean
  /** Toon de datum (bij zoeken over meerdere dagen). */
  metDatum?: boolean
  /** De AI is nu een categorie aan het bepalen voor déze notitie. */
  bezigMetCategorie?: boolean
  /** Het AI-voorstel dat op jouw ja/nee wacht (alleen voor deze notitie). */
  voorstel?: { categorie: string; vertrouwen: number }
  onVoorstelJa?: () => void
  onVoorstelNee?: () => void
}

export function BrainDumpRij({
  notitie,
  onWeg,
  onTag,
  onCategoriseer,
  onBewerk,
  bestaandeTitels,
  onLinkKlik,
  onbevestigd = false,
  metDatum = false,
  bezigMetCategorie = false,
  voorstel,
  onVoorstelJa,
  onVoorstelNee,
}: BrainDumpRijProps) {
  const [hover, setHover] = useState(false)
  const [tagOpen, setTagOpen] = useState(false)
  const [nieuweTag, setNieuweTag] = useState('')
  const [bewerken, setBewerken] = useState(false)

  function voegTagToe(e: FormEvent) {
    e.preventDefault()
    const tag = nieuweTag.trim()
    if (tag.length === 0) return
    onTag(notitie, tag, 'toevoegen')
    setNieuweTag('')
    setTagOpen(false)
  }

  function bewaar(wijziging: NotitieWijziging) {
    onBewerk(notitie, wijziging)
    setBewerken(false)
  }

  if (bewerken) {
    return (
      <li style={{ ...RIJ, opacity: 1 }}>
        <NotitieBewerker notitie={notitie} onBewaar={bewaar} onAnnuleer={() => setBewerken(false)} />
      </li>
    )
  }

  return (
    <li
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ ...RIJ, opacity: onbevestigd ? 0.55 : 1 }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          {metDatum ? (
            <p className="os-cijfer" style={{ margin: '0 0 3px', fontSize: 11, color: 'var(--text-4)' }}>
              {korteDatum(notitie.datum)}
            </p>
          ) : null}

          {/* De titel is de naam waaronder anderen naar deze notitie verwijzen.
              Alleen tonen als hij er is — geen leeg veld dat om invulling vraagt. */}
          {notitie.titel !== null ? <h3 style={TITEL}>{notitie.titel}</h3> : null}

          {/* De koppen in de tekst schuiven één niveau op als er een titel boven
              staat: h2 (kaart) → h3 (titel) → h4 (tekst). Zonder titel begint de
              tekst op h3 — anders springt de hiërarchie van h2 naar h4
              (accessibility.md: koppen in hiërarchie, geen sprongen). */}
          <NotitieTekst
            tekst={notitie.tekst}
            bestaandeTitels={bestaandeTitels}
            onLinkKlik={onLinkKlik}
            basisNiveau={notitie.titel !== null ? 4 : 3}
          />
        </div>

        <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
          {!onbevestigd ? (
            <IconKnop
              label={`Bewerk notitie: ${notitie.tekst.slice(0, 40)}`}
              zichtbaar={hover}
              onClick={() => setBewerken(true)}
            >
              <Pencil size={12} strokeWidth={2.2} aria-hidden="true" />
            </IconKnop>
          ) : null}
          <IconKnop
            label={`Verwijder notitie: ${notitie.tekst.slice(0, 40)}`}
            zichtbaar={hover}
            uit={onbevestigd}
            onClick={() => onWeg(notitie)}
          >
            <X size={13} strokeWidth={2.4} aria-hidden="true" />
          </IconKnop>
        </div>
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
              <label htmlFor={`tag-${notitie.id}`} style={VERBORGEN}>
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
          {!notitie.categorie && voorstel === undefined ? (
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

      {voorstel !== undefined && onVoorstelJa !== undefined && onVoorstelNee !== undefined ? (
        <CategorieVoorstel
          categorie={voorstel.categorie}
          vertrouwen={voorstel.vertrouwen}
          onJa={onVoorstelJa}
          onNee={onVoorstelNee}
        />
      ) : null}
    </li>
  )
}

/** Icoonknop met ontworpen hover — de focus-ring komt uit globals.css. */
function IconKnop({
  children,
  label,
  onClick,
  zichtbaar,
  uit = false,
}: {
  children: ReactNode
  label: string
  onClick: () => void
  zichtbaar: boolean
  uit?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={uit}
      aria-label={label}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 24,
        height: 24,
        padding: 0,
        borderRadius: 999,
        border: '1px solid transparent',
        background: 'transparent',
        color: zichtbaar ? 'var(--text-2)' : 'var(--text-4)',
        cursor: uit ? 'not-allowed' : 'pointer',
        opacity: uit ? 0.3 : zichtbaar ? 1 : 0.5,
        transition: 'opacity 180ms var(--ease), color 180ms var(--ease)',
      }}
    >
      {children}
    </button>
  )
}

const RIJ: CSSProperties = {
  display: 'grid',
  gap: 7,
  padding: '10px 2px 11px 0',
  borderBottom: '1px solid var(--line)',
  transition: 'opacity 180ms var(--ease)',
}

const TITEL: CSSProperties = {
  margin: '0 0 4px',
  fontSize: 13,
  fontWeight: 600,
  lineHeight: 1.35,
  letterSpacing: '-0.01em',
  color: 'var(--text-1)',
  overflowWrap: 'anywhere',
}

const CATEGORIE: CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  padding: '2px 8px',
  borderRadius: 999,
  background: 'var(--brand-soft)',
  color: 'var(--brand)',
}

const TAG: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 3,
  fontSize: 11,
  padding: '2px 4px 2px 8px',
  borderRadius: 999,
  border: '1px solid var(--line)',
  color: 'var(--text-3)',
}

const TAG_X: CSSProperties = {
  display: 'inline-flex',
  padding: 1,
  border: 'none',
  background: 'transparent',
  color: 'var(--text-4)',
  cursor: 'pointer',
}

const TAG_INVOER: CSSProperties = {
  width: 90,
  fontSize: 11,
  padding: '2px 8px',
  borderRadius: 999,
  border: '1px solid var(--brand)',
  background: 'var(--bg-raised)',
  color: 'var(--text-1)',
  fontFamily: 'inherit',
}

const ACTIE: CSSProperties = {
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

/** Zichtbaar voor screenreaders, niet voor het oog. */
const VERBORGEN: CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
  border: 0,
}
