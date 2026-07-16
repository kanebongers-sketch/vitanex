'use client'

import { Kaart } from '@/components/lifeos/os/Kaart'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'
import { gisterenTekst, MAX_TEKST_LENGTE } from '@/lib/lifeos/journal/journal'
import { OpslagIndicator } from './OpslagIndicator'
import { useJournal } from './useJournal'

// De journal. Vervangt je journal-app openen.
//
// Voor het Avond-moment: "Hoe ging het?" Twee minuten. Wat ging goed, wat
// schuurde. Eén tekstveld per dag dat je bijwerkt — geen invulformulier met
// drie verplichte vragen, want dan schrijf je niets.
//
// Auto-save met debounce, ÉN een zichtbare indicator. Die indicator is niet
// decoratief: zonder hem weet je niet of je reflectie bestaat. Mislukt het
// opslaan, dan zie je een echte foutmelding met een weg terug — nooit een
// stilte. Een journal die stil niet opslaat is erger dan geen journal.
//
// Wat hier bewust NIET staat: een streak. Geen teller, geen vlammetje, geen "je
// verliest je reeks". Verliesangst in een reflectie-tool laat je schrijven om de
// teller te redden in plaats van omdat je iets te verwerken hebt — dat dark
// pattern is in MentaForce opgeruimd en komt hier niet terug.
//
// Alle data-logica (laden, debounce, opslagstaat) zit in `useJournal`.

export function JournalKaart() {
  const { staat, tekst, opslag, opWijziging, opBlur, slaOp, opnieuwLaden } = useJournal()

  return (
    <Kaart titel="Journal" vervangt="Journal-app">
      {staat.fase === 'laden' ? <Skelet /> : null}

      {staat.fase === 'fout' ? <Foutmelding bericht={staat.bericht} opnieuw={opnieuwLaden} /> : null}

      {staat.fase === 'ok' ? (
        <div style={{ display: 'grid', gap: 10 }}>
          <label htmlFor="journal-tekst" style={LABEL}>
            Hoe ging het? Wat ging goed, wat schuurde.
          </label>
          <textarea
            id="journal-tekst"
            value={tekst}
            onChange={(e) => opWijziging(e.target.value)}
            onBlur={opBlur}
            placeholder="Twee minuten. Ongefilterd mag."
            maxLength={MAX_TEKST_LENGTE}
            rows={6}
            style={VELD}
          />

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            {/* Eén zin over gisteren. Geen teller, geen reeks — zie de kop. */}
            <p style={GISTEREN}>{gisterenTekst(staat.gisterenGeschreven)}</p>
            <OpslagIndicator status={opslag} />
          </div>

          {opslag.fase === 'mislukt' ? (
            <Foutmelding
              bericht={`${opslag.bericht} Je reflectie is nog niet opgeslagen — hij staat nog in het veld.`}
              opnieuw={slaOp}
            />
          ) : null}
        </div>
      ) : null}
    </Kaart>
  )
}

const LABEL: React.CSSProperties = {
  fontSize: 12,
  color: 'var(--text-3)',
  lineHeight: 1.4,
}

const VELD: React.CSSProperties = {
  width: '100%',
  minHeight: 116,
  padding: '11px 13px',
  borderRadius: 12,
  border: '1px solid var(--line)',
  background: 'var(--bg-raised)',
  color: 'var(--text-1)',
  fontFamily: 'inherit',
  fontSize: 13,
  lineHeight: 1.6,
  // Verticaal: horizontaal slepen breekt de kaartkolom.
  resize: 'vertical',
}

const GISTEREN: React.CSSProperties = {
  margin: 0,
  fontSize: 12,
  lineHeight: 1.4,
  color: 'var(--text-4)',
}

function Skelet() {
  return (
    <div aria-hidden="true" style={{ display: 'grid', gap: 11 }}>
      <div style={{ height: 12, width: '58%', borderRadius: 4, background: 'var(--bg-raised)' }} />
      <div style={{ height: 116, borderRadius: 12, background: 'var(--bg-raised)' }} />
    </div>
  )
}
