'use client'

import type { CSSProperties } from 'react'
import { Search } from 'lucide-react'
import { NogNiets } from '@/components/lifeos/os/Kaart'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'
import { BrainDumpRij } from './BrainDumpRij'
import { isOnbevestigd, type BrainDump } from './useBrainDump'

// De brain dump als INBEDBAAR blok: zoeken, tags, categoriseren en links op de
// bestaande notities — maar zónder eigen `Kaart`-wrapper en zónder de capture
// (die zit nu in de gedeelde "Vang op"-balk bovenaan, zie `vangop/VangOp.tsx`).
//
// Presentational: alle data-logica leeft in `useBrainDump`, die de container
// VangOp bezit en als `dump` doorgeeft. Dit blok tekent alleen.
//
// De kennisgrafiek-koppeling blijft intact: notities blijven notities, en het
// toevoegen/wijzigen/verwijderen meldt zich (via `useBrainDump`) op het
// `notities`-kanaal zodat de grafiek zichzelf herleest.

interface BrainDumpBodyProps {
  dump: BrainDump
}

export function BrainDumpBody({ dump }: BrainDumpBodyProps) {
  const {
    staat,
    actieFout,
    opnieuw,
    zoek,
    zetZoek,
    wijzigTag,
    bewerk,
    categoriseer,
    bezigMetCategorie,
    voorstel,
    bevestigVoorstel,
    verwerpVoorstel,
    bestaandeTitels,
    haalWeg,
  } = dump

  const aanHetZoeken = zoek.trim().length > 0

  // Klik op een [[verwijzing]] → zoek 'm op. De goedkoopste navigatie die echt
  // werkt: de zoekbalk staat er al, doet al precies dit, en werkt over alle dagen.
  const gaNaarTitel = (titel: string) => zetZoek(titel)

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {/* Zoeken: los van de capture. Gevuld → over alle dagen; leeg → vandaag. */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <Search
          size={14}
          strokeWidth={2.2}
          aria-hidden="true"
          style={{ position: 'absolute', left: 12, color: 'var(--text-4)' }}
        />
        <label htmlFor="brain-dump-zoek" style={VERBORGEN}>
          Zoek in je notities
        </label>
        <input
          id="brain-dump-zoek"
          type="search"
          value={zoek}
          onChange={(e) => zetZoek(e.target.value)}
          placeholder="Zoek in al je notities…"
          autoComplete="off"
          style={{ ...INVOER, paddingLeft: 34 }}
        />
      </div>

      {staat.fase === 'laden' ? <Skelet /> : null}

      {staat.fase === 'fout' ? <Foutmelding bericht={staat.bericht} opnieuw={opnieuw} /> : null}

      {/* Leeg heeft twee betekenissen: geen zoekresultaat, of een lege dag.
          Allebei geen storing — en dus niet dezelfde component als de fout. */}
      {staat.fase === 'ok' && staat.notities.length === 0 ? (
        aanHetZoeken ? (
          <NogNiets wat="Niets gevonden" waarom={`Geen notitie met "${zoek.trim()}".`} />
        ) : (
          <NogNiets wat="Niets in je hoofd vandaag" waarom="Of je hebt het al opgeschreven." />
        )
      ) : null}

      {staat.fase === 'ok' && staat.notities.length > 0 ? (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {staat.notities.map((notitie) => (
            <BrainDumpRij
              key={notitie.id}
              notitie={notitie}
              onbevestigd={isOnbevestigd(notitie)}
              metDatum={aanHetZoeken}
              bezigMetCategorie={bezigMetCategorie === notitie.id}
              bestaandeTitels={bestaandeTitels}
              voorstel={voorstel?.notitieId === notitie.id ? voorstel : undefined}
              onVoorstelJa={bevestigVoorstel}
              onVoorstelNee={verwerpVoorstel}
              onWeg={haalWeg}
              onTag={wijzigTag}
              onBewerk={bewerk}
              onCategoriseer={categoriseer}
              onLinkKlik={gaNaarTitel}
            />
          ))}
        </ul>
      ) : null}

      {/* Er zijn meer notities dan deze pagina. Zeggen, niet stil afkappen —
          anders lijkt een half zoekresultaat het hele antwoord. */}
      {staat.fase === 'ok' && staat.erIsMeer ? (
        <p style={NOOT}>
          Dit zijn de eerste {staat.notities.length}. Er zijn er meer — zoek gerichter om ze te vinden.
        </p>
      ) : null}

      {actieFout ? <Foutmelding bericht={actieFout} /> : null}
    </div>
  )
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

const INVOER: CSSProperties = {
  flex: 1,
  minWidth: 0,
  padding: '8px 12px',
  borderRadius: 999,
  border: '1px solid var(--line)',
  background: 'var(--bg-raised)',
  color: 'var(--text-1)',
  fontFamily: 'inherit',
  fontSize: 13,
}

const NOOT: CSSProperties = {
  margin: 0,
  fontSize: 11,
  lineHeight: 1.5,
  color: 'var(--text-4)',
}

function Skelet() {
  return (
    <div aria-hidden="true" style={{ display: 'grid', gap: 11 }}>
      {[70, 52].map((breedte) => (
        <div
          key={breedte}
          style={{ height: 14, width: `${breedte}%`, borderRadius: 4, background: 'var(--bg-raised)' }}
        />
      ))}
    </div>
  )
}
