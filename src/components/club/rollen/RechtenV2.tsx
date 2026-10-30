'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lock } from 'lucide-react'
import { stuur } from '@/components/club/leden/stuur'
import { useTaal, useTekst } from '@/lib/aiyourgym/taal/client'
import { ROLLEN_TEKST } from '@/lib/aiyourgym/taal/woorden/club/rollen'
import { rolNiveau } from '@/lib/club/rollen/model'
import { standaardRolrechten } from '@/lib/club/rollen/standaard'
import { NIVEAUS, ROLLEN, type Niveau, type Rol, type Rolrechten } from '@/lib/club/rollen/typen'
import type { Verborgen } from '@/lib/club/kern/pakketten'
import { rechtenGroepenV2, startKeuzes } from './rechten-rijen'
import { MenuVoorbeeld } from './MenuVoorbeeld'
import './rollen.css'

// Rechten per rol (rollen v2): per rol per onderdeel een van vier niveaus.
// Rijen met een slot zijn alleen voor de eigenaar (vast), rijen buiten het
// pakket zijn grijs. Per rol een startpagina en een voorvertoning van het menu.
// Met `onWijzig` (de startwizard) zonder eigen opslaanknop: de stap bewaart.

interface RechtenV2Props {
  begin: Rolrechten
  uit: readonly Verborgen[]
  onWijzig?: (rechten: Rolrechten) => void
  /** Compact in de wizard: zonder voorvertoning. */
  compact?: boolean
}

export function RechtenV2({ begin, uit, onWijzig, compact = false }: RechtenV2Props) {
  const router = useRouter()
  const taal = useTaal()
  const tekst = useTekst(ROLLEN_TEKST)
  const [rechten, setRechten] = useState<Rolrechten>(begin)
  const [bezig, setBezig] = useState(false)
  const [melding, setMelding] = useState<{ ok: boolean; tekst: string } | null>(null)
  const groepen = useMemo(() => rechtenGroepenV2(uit, taal), [uit, taal])
  const keuzes = useMemo(() => startKeuzes(taal), [taal])

  function zet(nieuw: Rolrechten) {
    setRechten(nieuw)
    setMelding(null)
    onWijzig?.(nieuw)
  }

  function zetNiveau(rol: Rol, sleutel: string, niveau: Niveau) {
    const kaart = { ...rechten.rollen[rol] }
    if (niveau === 'geen') delete kaart[sleutel]
    else kaart[sleutel] = niveau
    zet({ ...rechten, rollen: { ...rechten.rollen, [rol]: kaart } })
  }

  async function bewaar(nieuw: Rolrechten) {
    setBezig(true)
    setMelding(null)
    const uitslag = await stuur('/api/club/team/rechten', 'PATCH', { rollen: nieuw.rollen, start: nieuw.start })
    setBezig(false)
    if (!uitslag.ok) return setMelding({ ok: false, tekst: uitslag.fout })
    setMelding({ ok: true, tekst: tekst.rechten.opgeslagen })
    router.refresh()
  }

  return (
    <div className="club-rollen">
      <div className="club-beheer-matrix-wrap">
        <table className="club-beheer-matrix club-rollen-matrix">
          <caption className="club-sr">{tekst.rechten.caption}</caption>
          <thead>
            <tr>
              <th scope="col" style={{ textAlign: 'left' }}>{tekst.rechten.onderdeel}</th>
              {ROLLEN.map((rol) => <th key={rol} scope="col">{tekst.rollen[rol]}</th>)}
            </tr>
            <tr className="club-rollen-startrij">
              <th scope="row">
                {tekst.rechten.start}
                <small>{tekst.rechten.startUitleg}</small>
              </th>
              {ROLLEN.map((rol) => (
                <td key={rol}>
                  <select
                    className="club-rollen-start"
                    aria-label={tekst.rechten.startVan(tekst.rollen[rol])}
                    value={rechten.start[rol]}
                    onChange={(e) => zet({ ...rechten, start: { ...rechten.start, [rol]: e.target.value } })}
                  >
                    {keuzes.map((k) => <option key={k.sleutel} value={k.sleutel}>{k.label}</option>)}
                  </select>
                </td>
              ))}
            </tr>
          </thead>
          {groepen.map((g) => (
            <tbody key={g.sleutel}>
              <tr className="club-beheer-matrix-groep">
                <th scope="colgroup" colSpan={ROLLEN.length + 1}>{g.label}</th>
              </tr>
              {g.rijen.map((r) => (
                <tr key={r.sleutel} className={r.buiten ? 'club-rollen-buiten' : r.slot ? 'club-rollen-slot' : undefined}>
                  <th scope="row">
                    <span className="club-rollen-naam">
                      {r.slot && <Lock size={13} aria-label={tekst.rechten.slot} />}
                      {r.label}
                    </span>
                    <small>{r.buiten ? tekst.rechten.buitenPakket : r.slot ? tekst.rechten.slot : r.uitleg}</small>
                  </th>
                  {ROLLEN.map((rol) => {
                    const n = rolNiveau(rechten, rol, r.sleutel)
                    return (
                      <td key={rol}>
                        <select
                          className={`club-rollen-niveau club-rollen-niveau--${n}`}
                          aria-label={tekst.rechten.niveauVan(tekst.rollen[rol], r.label)}
                          value={n}
                          disabled={r.slot || r.buiten}
                          onChange={(e) => zetNiveau(rol, r.sleutel, e.target.value as Niveau)}
                        >
                          {NIVEAUS.map((x) => <option key={x} value={x}>{tekst.niveaus[x]}</option>)}
                        </select>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          ))}
        </table>
      </div>

      <dl className="club-rollen-legenda">
        {NIVEAUS.map((n) => (
          <div key={n}>
            <dt><span className={`club-rollen-stip club-rollen-niveau--${n}`} aria-hidden />{tekst.niveaus[n]}</dt>
            <dd>{tekst.niveauUitleg[n]}</dd>
          </div>
        ))}
      </dl>

      {!compact && <MenuVoorbeeld rechten={rechten} uit={uit} />}

      <div className="club-beheer-acties">
        {!onWijzig && (
          <button type="button" className="club-knop club-knop--primair" disabled={bezig} onClick={() => void bewaar(rechten)}>
            {bezig ? tekst.rechten.bezig : tekst.rechten.opslaan}
          </button>
        )}
        <button
          type="button"
          className="club-knop club-knop--stil"
          disabled={bezig}
          onClick={() => {
            const standaard = standaardRolrechten()
            zet(standaard)
            if (!onWijzig) void bewaar(standaard)
          }}
        >
          {tekst.rechten.standaard}
        </button>
        <div role="status" aria-live="polite">
          {melding && <p className={`club-melding ${melding.ok ? 'club-melding--ok' : 'club-melding--fout'}`}>{melding.tekst}</p>}
        </div>
      </div>
    </div>
  )
}
