'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MAX_TEKST, TEKSTEN, TEKST_LABEL, TEKST_UITLEG, type TekstSoort, type Teksten } from '@/lib/club/bedrijf/model'
import { telTekens } from '@/lib/club/bedrijf/opmaak'
import { stuur } from '@/components/club/leden/stuur'
import { JuridischeTekst } from './JuridischeTekst'

// Tabblad Teksten: huisregels, voorwaarden en privacy. Links schrijven,
// rechts meteen zien hoe het lid het leest. Een knop bewaart alle drie.

function naarTekst(t: Teksten): Record<TekstSoort, string> {
  return { huisregels: t.huisregels ?? '', voorwaarden: t.voorwaarden ?? '', privacy: t.privacy ?? '' }
}

export function TekstenEditor({ begin }: { begin: Teksten }) {
  const router = useRouter()
  const [bewaard, setBewaard] = useState(() => naarTekst(begin))
  const [teksten, setTeksten] = useState(() => naarTekst(begin))
  const [actief, setActief] = useState<TekstSoort>('huisregels')
  const [bezig, setBezig] = useState(false)
  const [melding, setMelding] = useState<{ ok: boolean; tekst: string } | null>(null)

  const tekst = teksten[actief]
  const aantal = telTekens(tekst)
  const teLang = TEKSTEN.find((s) => telTekens(teksten[s]) > MAX_TEKST)
  const gewijzigd = TEKSTEN.some((s) => teksten[s] !== bewaard[s])

  async function bewaar() {
    if (teLang) return setMelding({ ok: false, tekst: `${TEKST_LABEL[teLang]} is te lang. Haal wat tekst weg.` })
    setBezig(true)
    setMelding(null)
    const uit = await stuur('/api/club/bedrijf', 'PATCH', { soort: 'teksten', ...teksten })
    setBezig(false)
    if (!uit.ok) return setMelding({ ok: false, tekst: uit.fout })
    setBewaard(teksten)
    setMelding({ ok: true, tekst: 'Opgeslagen. Je leden zien de nieuwe tekst in de app.' })
    router.refresh()
  }

  return (
    <div className="club-bedrijf-teksten">
      <div className="club-segment" role="group" aria-label="Welke tekst">
        {TEKSTEN.map((s) => (
          <button key={s} type="button" aria-pressed={s === actief} onClick={() => setActief(s)}>
            {TEKST_LABEL[s]}
            {teksten[s] !== bewaard[s] && (
              <>
                <span className="club-bedrijf-stip" aria-hidden />
                <span className="club-sr"> (niet opgeslagen)</span>
              </>
            )}
          </button>
        ))}
      </div>

      <div className="club-bedrijf-werkvlak">
        <div className="club-bedrijf-schrijf">
          <label className="club-veld" htmlFor="bedrijf-tekst">
            <span>{TEKST_LABEL[actief]}</span>
            <small className="club-hint" id="bedrijf-tekst-uitleg">{TEKST_UITLEG[actief]}</small>
            <textarea
              id="bedrijf-tekst"
              className="club-invoer club-bedrijf-textarea"
              value={tekst}
              rows={18}
              spellCheck
              aria-describedby="bedrijf-tekst-uitleg bedrijf-tekst-opmaak bedrijf-tekst-teller"
              aria-invalid={aantal > MAX_TEKST || undefined}
              placeholder={'# Tussenkop\nEen alinea met gewone tekst.\n\n- Een opsommingspunt\n- Nog een punt'}
              onChange={(e) => setTeksten({ ...teksten, [actief]: e.target.value })}
            />
          </label>
          <div className="club-bedrijf-onder">
            <p className="club-hint" id="bedrijf-tekst-opmaak">
              Opmaak: een lege regel begint een nieuwe alinea, <code>- </code> vooraan maakt een opsommingspunt en <code># </code> vooraan een tussenkop.
            </p>
            <p id="bedrijf-tekst-teller" className={`club-bedrijf-teller${aantal > MAX_TEKST ? ' is-te-lang' : aantal > MAX_TEKST * 0.9 ? ' is-bijna' : ''}`}>
              {aantal.toLocaleString('nl-NL')} van {MAX_TEKST.toLocaleString('nl-NL')} tekens
            </p>
          </div>
        </div>

        <section className="club-bedrijf-voorbeeld" aria-labelledby="bedrijf-voorbeeld-kop">
          <h2 id="bedrijf-voorbeeld-kop">Zo ziet je lid het</h2>
          {tekst.trim() ? (
            <JuridischeTekst tekst={tekst} kopNiveau={3} />
          ) : (
            <p className="club-bedrijf-leeg">Nog leeg. Lege teksten zie je niet in de ledenapp.</p>
          )}
        </section>
      </div>

      <div className="club-bedrijf-acties">
        <button type="button" className="club-knop club-knop--primair" disabled={bezig || !gewijzigd} onClick={() => void bewaar()}>
          {bezig ? 'Opslaan...' : 'Teksten opslaan'}
        </button>
        <div role="status" aria-live="polite">
          {melding && <p className={`club-melding ${melding.ok ? 'club-melding--ok' : 'club-melding--fout'}`}>{melding.tekst}</p>}
          {!melding && gewijzigd && <p className="club-hint">Je hebt wijzigingen die nog niet zijn opgeslagen.</p>}
        </div>
      </div>
    </div>
  )
}
