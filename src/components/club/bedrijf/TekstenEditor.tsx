'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MAX_TEKST, TEKSTEN, type TekstSoort, type Teksten } from '@/lib/club/bedrijf/model'
import { useTaal } from '@/lib/aiyourgym/taal/client'
import { formatGetal } from '@/lib/aiyourgym/taal/formaat'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { BEDRIJF } from '@/lib/aiyourgym/taal/woorden/club/bedrijf'
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
  const taal = useTaal()
  const t = useTekst(BEDRIJF).teksten

  const tekst = teksten[actief]
  const aantal = telTekens(tekst)
  const teLang = TEKSTEN.find((s) => telTekens(teksten[s]) > MAX_TEKST)
  const gewijzigd = TEKSTEN.some((s) => teksten[s] !== bewaard[s])

  async function bewaar() {
    if (teLang) return setMelding({ ok: false, tekst: t.teLang(t.labels[teLang]) })
    setBezig(true)
    setMelding(null)
    const uit = await stuur('/api/club/bedrijf', 'PATCH', { soort: 'teksten', ...teksten })
    setBezig(false)
    if (!uit.ok) return setMelding({ ok: false, tekst: uit.fout })
    setBewaard(teksten)
    setMelding({ ok: true, tekst: t.opgeslagen })
    router.refresh()
  }

  return (
    <div className="club-bedrijf-teksten">
      <div className="club-segment" role="group" aria-label={t.welke}>
        {TEKSTEN.map((s) => (
          <button key={s} type="button" aria-pressed={s === actief} onClick={() => setActief(s)}>
            {t.labels[s]}
            {teksten[s] !== bewaard[s] && (
              <>
                <span className="club-bedrijf-stip" aria-hidden />
                <span className="club-sr"> {t.nietOpgeslagen}</span>
              </>
            )}
          </button>
        ))}
      </div>

      <div className="club-bedrijf-werkvlak">
        <div className="club-bedrijf-schrijf">
          <label className="club-veld" htmlFor="bedrijf-tekst">
            <span>{t.labels[actief]}</span>
            <small className="club-hint" id="bedrijf-tekst-uitleg">{t.uitleg[actief]}</small>
            <textarea
              id="bedrijf-tekst"
              className="club-invoer club-bedrijf-textarea"
              value={tekst}
              rows={18}
              spellCheck
              aria-describedby="bedrijf-tekst-uitleg bedrijf-tekst-opmaak bedrijf-tekst-teller"
              aria-invalid={aantal > MAX_TEKST || undefined}
              placeholder={t.voorbeeldInvoer}
              onChange={(e) => setTeksten({ ...teksten, [actief]: e.target.value })}
            />
          </label>
          <div className="club-bedrijf-onder">
            <p className="club-hint" id="bedrijf-tekst-opmaak">
              {t.opmaak.voor} <code>- </code> {t.opmaak.midden} <code># </code> {t.opmaak.na}
            </p>
            <p id="bedrijf-tekst-teller" className={`club-bedrijf-teller${aantal > MAX_TEKST ? ' is-te-lang' : aantal > MAX_TEKST * 0.9 ? ' is-bijna' : ''}`}>
              {t.teller(formatGetal(aantal, taal), formatGetal(MAX_TEKST, taal))}
            </p>
          </div>
        </div>

        <section className="club-bedrijf-voorbeeld" aria-labelledby="bedrijf-voorbeeld-kop">
          <h2 id="bedrijf-voorbeeld-kop">{t.zoZietLid}</h2>
          {tekst.trim() ? (
            <JuridischeTekst tekst={tekst} kopNiveau={3} />
          ) : (
            <p className="club-bedrijf-leeg">{t.leeg}</p>
          )}
        </section>
      </div>

      <div className="club-bedrijf-acties">
        <button type="button" className="club-knop club-knop--primair" disabled={bezig || !gewijzigd} onClick={() => void bewaar()}>
          {bezig ? t.bezig : t.opslaan}
        </button>
        <div role="status" aria-live="polite">
          {melding && <p className={`club-melding ${melding.ok ? 'club-melding--ok' : 'club-melding--fout'}`}>{melding.tekst}</p>}
          {!melding && gewijzigd && <p className="club-hint">{t.wijzigingen}</p>}
        </div>
      </div>
    </div>
  )
}
