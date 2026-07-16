'use client'

import type { FormEvent } from 'react'
import { Plus } from 'lucide-react'
import { Kaart, NogNiets } from '@/components/lifeos/os/Kaart'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'
import { Knop } from '@/components/lifeos/os/Knop'
import { MAX_TEKST_LENGTE } from '@/lib/lifeos/notities/notities'
import { BrainDumpRij } from './BrainDumpRij'
import { isOnbevestigd, useBrainDump } from './useBrainDump'

// De brain dump. Vervangt Apple Notes / Google Keep openen.
//
// Het punt van deze kaart: één tik, idee weg uit je hoofd. Sorteren komt later.
// Geen categorieën, geen tags, geen mappen — dat is precies de wrijving waardoor
// mensen hun hoofd niet leegmaken. Als je hier ooit een dropdown aan toevoegt,
// heb je de functie gesloopt.
//
// Alle data-logica (laden, optimistisch toevoegen, rollback) zit in
// `useBrainDump`. Dit component tekent alleen.

export function BrainDumpKaart() {
  const { staat, actieFout, tekst, zetTekst, voegToe, haalWeg, opnieuw } = useBrainDump()

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

        {staat.fase === 'laden' ? <Skelet /> : null}

        {staat.fase === 'fout' ? <Foutmelding bericht={staat.bericht} opnieuw={opnieuw} /> : null}

        {/* Leeg is een dag, geen storing — en dus nadrukkelijk niet dezelfde
            component als de foutmelding hierboven. */}
        {staat.fase === 'ok' && staat.notities.length === 0 ? (
          <NogNiets wat="Niets in je hoofd vandaag" waarom="Of je hebt het al opgeschreven." />
        ) : null}

        {staat.fase === 'ok' && staat.notities.length > 0 ? (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {staat.notities.map((notitie) => (
              <BrainDumpRij
                key={notitie.id}
                notitie={notitie}
                onbevestigd={isOnbevestigd(notitie)}
                onWeg={haalWeg}
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
