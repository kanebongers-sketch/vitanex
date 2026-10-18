'use client'

import type { EditorRegel, EditorStaat } from '@/lib/club/training/editor'
import type { Oefening } from '@/lib/club/training/rijen'
import { dagLetter, DOEL_LABEL, type Doel } from '@/lib/club/training/typen'
import { BEELD_BRON, bronnenVan } from '@/lib/club/training/beeld'
import { REPDB_BRON } from '@/lib/club/training/beelden-repdb'
import { SPIER_INFO } from '@/lib/club/training/spieren'
import { BLOK_LABEL, blokken, regelLabels } from '@/lib/club/training/blokken'
import { toonHerhalingen, toonRust } from '@/lib/club/training/weergave'
import { OefeningBeeldPrint } from './OefeningBeeld'
import { useMerk } from '@/components/club/shell/MerkContext'
import { useKernpunten, type KernpuntenPerNaam } from './coaching/useKernpunten'

interface SchemaPrintProps {
  naam: string
  lidNaam: string | null
  doel: Doel | null
  weken: string
  trainer: string | null
  notitie: string
  staat: EditorStaat
  oefeningen: Map<string, Oefening>
}

/** Het schema op papier. Alleen zichtbaar bij afdrukken (zie training.css). */
export function SchemaPrint({ naam, lidNaam, doel, weken, trainer, notitie, staat, oefeningen }: SchemaPrintProps) {
  const bronnen = bronnenVan(staat.regels.map((r) => oefeningen.get(r.oefeningId)?.beeld))
  const metBeeld = bronnen.length > 0
  const merk = useMerk()
  const kernpunten = useKernpunten(staat.regels.flatMap((r) => oefeningen.get(r.oefeningId)?.naam ?? []))
  return (
    <article className="club-training-print" aria-hidden>
      <header>
        {merk.logoUrl ? <img src={merk.logoUrl} alt={merk.naam} className="club-training-print-logo" /> : <p>{merk.naam}</p>}
        <h1>{naam}</h1>
        <p>{[lidNaam, doel ? DOEL_LABEL[doel] : null, weken ? `${weken} weken` : null, trainer ? `Trainer: ${trainer}` : null].filter(Boolean).join(' · ')}</p>
        {notitie && <p className="club-training-print-notitie">{notitie}</p>}
      </header>
      {staat.dagTitels.map((titel, i) => {
        const dag = i + 1
        const regels = staat.regels.filter((r) => r.dag === dag)
        const labels = regelLabels(regels)
        const blokVan = new Map(blokken(regels).flatMap((b) => b.items.map((r, j) => [r.sleutel, j === 0 && b.items.length > 1 ? BLOK_LABEL[b.soort] : null] as const)))
        return (
          <section key={dag}>
            <h2>Dag {dagLetter(dag)} · {titel}</h2>
            <table>
              <thead>
                <tr>{metBeeld && <th>Uitvoering</th>}<th>Oefening</th><th>Sets</th><th>Herhalingen</th><th>Kg</th><th>Rust</th><th>Notitie</th></tr>
              </thead>
              <tbody>
                {regels.map((r) => (
                  <PrintRegel key={r.sleutel} regel={r} label={labels.get(r.sleutel) ?? ''} blok={blokVan.get(r.sleutel) ?? null} oefening={oefeningen.get(r.oefeningId)} metBeeld={metBeeld} kernpunten={kernpunten} />
                ))}
              </tbody>
            </table>
          </section>
        )
      })}
      {metBeeld && (
        <footer>
          {bronnen.includes('repdb') && <p>{REPDB_BRON.tekst}. {REPDB_BRON.vereist}</p>}
          {bronnen.includes('everkinetic') && <p>{BEELD_BRON.tekst} (github.com/everkinetic/data, creativecommons.org/licenses/by-sa/4.0)</p>}
        </footer>
      )}
    </article>
  )
}

interface PrintRegelProps {
  regel: EditorRegel
  label: string
  /** "Superset" of "Circuit" bij de eerste oefening van een blok. */
  blok: string | null
  oefening: Oefening | undefined
  metBeeld: boolean
  kernpunten: KernpuntenPerNaam
}

function PrintRegel({ regel: r, label, blok, oefening, metBeeld, kernpunten }: PrintRegelProps) {
  const naam = oefening?.naam ?? 'Onbekend'
  const punten = kernpunten[naam] ?? []
  return (
    <tr>
      {metBeeld && (
        <td className="club-training-print-beeld">
          <OefeningBeeldPrint naam={naam} beeld={oefening?.beeld ?? null} />
        </td>
      )}
      <td>
        {blok && <span className="club-training-print-spieren">{blok}: om en om</span>}
        <span className="club-training-print-oefnaam">{label}. {naam}</span>
        {oefening && oefening.spierenPrimair.length > 0 && (
          <span className="club-training-print-spieren">{oefening.spierenPrimair.map((s) => SPIER_INFO[s].naam).join(', ')}</span>
        )}
        {punten.length > 0 && (
          <span className="club-training-print-kern">{punten.map((p, i) => `${i + 1}. ${p}`).join('   ')}</span>
        )}
      </td>
      <td>{r.sets}</td>
      <td>{r.maat === 'tijd' ? (r.tijdSec ? `${r.tijdSec} sec` : '') : toonHerhalingen(r.herhalingen)}</td>
      <td>{[r.gewichtKg, r.inspanning !== 'geen' && r.inspanningWaarde ? `${r.inspanning.toUpperCase()} ${r.inspanningWaarde}` : ''].filter(Boolean).join(' · ')}</td>
      <td>{r.rustSec ? toonRust(Number(r.rustSec)) : ''}</td>
      <td>{[r.tempo ? `Tempo ${r.tempo}` : '', r.notitie].filter(Boolean).join('. ')}</td>
    </tr>
  )
}
