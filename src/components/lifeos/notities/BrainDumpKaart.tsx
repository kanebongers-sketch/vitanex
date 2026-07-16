'use client'

import type { FormEvent } from 'react'
import { Plus, Search } from 'lucide-react'
import { Kaart, NogNiets } from '@/components/lifeos/os/Kaart'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'
import { Knop } from '@/components/lifeos/os/Knop'
import { MAX_TEKST_LENGTE } from '@/lib/lifeos/notities/notities'
import { BrainDumpRij } from './BrainDumpRij'
import { isOnbevestigd, useBrainDump } from './useBrainDump'

// De brain dump. Vervangt Apple Notes / Google Keep openen.
//
// De CAPTURE blijft één tik, zonder wrijving: het invoerveld hieronder heeft
// geen categorie-dropdown, geen verplichte tags. Dát is de functie — je hoeft
// niets in te delen om iets kwijt te kunnen.
//
// Tags, categorie en zoeken zijn POST-HOC: ze leven op de bestaande notities
// (zie BrainDumpRij) en op de zoekbalk, niet op de capture. Zo kun je terugvinden
// zonder dat het leegmaken zwaarder wordt.
//
// Alle data-logica (laden, zoeken, optimistisch toevoegen, tags, rollback) zit
// in `useBrainDump`. Dit component tekent alleen.

export function BrainDumpKaart() {
  const {
    staat, actieFout, tekst, zetTekst, voegToe, haalWeg, opnieuw,
    zoek, zetZoek, wijzigTag, categoriseer, bezigMetCategorie,
  } = useBrainDump()

  const aanHetZoeken = zoek.trim().length > 0

  // Enter = opslaan: dat is wat een form standaard doet met één tekstveld. Geen
  // eigen keydown-handler ernaast — die zou de submit-knop en het toetsenbord uit
  // elkaar laten lopen.
  function onSubmit(e: FormEvent) {
    e.preventDefault()
    voegToe()
  }

  return (
    <Kaart titel="Brain dump" vervangt="Apple Notes">
      <div style={{ display: 'grid', gap: 12 }}>
        {/* Het veld staat boven de lijst en is na elke tik weer leeg: dít is de
            functie. De lijst is het resultaat, niet de bediening. */}
        <form onSubmit={onSubmit} style={{ display: 'flex', gap: 8 }}>
          <label htmlFor="brain-dump-tekst" style={VERBORGEN}>
            Wat zit er in je hoofd?
          </label>
          <input
            id="brain-dump-tekst"
            value={tekst}
            onChange={(e) => zetTekst(e.target.value)}
            placeholder="Wat zit er in je hoofd?"
            maxLength={MAX_TEKST_LENGTE}
            autoComplete="off"
            disabled={staat.fase === 'fout'}
            style={INVOER}
          />
          <Knop type="submit" variant="primair" disabled={tekst.trim().length === 0}>
            <Plus size={14} strokeWidth={2.4} aria-hidden="true" />
            Kwijt
          </Knop>
        </form>

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
                onWeg={haalWeg}
                onTag={wijzigTag}
                onCategoriseer={categoriseer}
              />
            ))}
          </ul>
        ) : null}

        {actieFout ? <Foutmelding bericht={actieFout} /> : null}
      </div>
    </Kaart>
  )
}

/** Zichtbaar voor screenreaders, niet voor het oog. */
const VERBORGEN: React.CSSProperties = {
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

const INVOER: React.CSSProperties = {
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
