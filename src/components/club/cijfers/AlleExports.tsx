import Link from 'next/link'
import { ArrowUpRight, Download } from 'lucide-react'
import type { ExportBasis } from '@/lib/club/rapporten/exports'
import { alleExports } from '@/lib/club/rapporten/exports'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { CIJFERS } from '@/lib/aiyourgym/taal/woorden/club/cijfers'
import { RAPPORTEN_TEKST } from '@/lib/aiyourgym/taal/woorden/club/rapporten'

// Onderaan Cijfers (#exports): elk rapport van de maand en het bereik als CSV,
// per groep, met een link naar het voorbeeld op /club/rapporten. Rapporten zijn
// de cijfers als Excel; het volledige scherm met voorbeeld blijft bestaan.

interface Props {
  basis: ExportBasis
  /** "Budel" of "Alle vestigingen". */
  bereik: string
  /** De naam van de maand ("oktober 2026"). */
  maandNaam: string
  /** /club/rapporten met dezelfde maand en vestiging. */
  rapportenHref: string
  taal: Taal
}

export function AlleExports({ basis, bereik, maandNaam, rapportenHref, taal }: Props) {
  const t = CIJFERS[taal].exports
  const r = RAPPORTEN_TEKST[taal]
  return (
    <section id="exports" className="club-cijfers-exports" aria-labelledby="cijfers-exports">
      <header className="club-cijfers-exportskop">
        <div>
          <h2 id="cijfers-exports">{t.titel}</h2>
          <p>{t.sub(bereik, maandNaam)}</p>
        </div>
        <Link href={rapportenHref} className="club-knop club-knop--stil club-knop--klein">
          {t.alleRapporten} <ArrowUpRight aria-hidden size={14} />
        </Link>
      </header>
      <div className="club-cijfers-exportgroepen">
        {alleExports(basis).map(({ groep, links }) => (
          <section key={groep} className="club-cijfers-exportgroep" aria-labelledby={`exports-${groep}`}>
            <h3 id={`exports-${groep}`}>{r.groepen[groep]}</h3>
            <ul role="list">
              {links.map((l) => {
                const titel = r.rapporten[l.rapport].titel
                return (
                  <li key={l.rapport} className="club-cijfers-exportrij">
                    <Link href={l.voorbeeld} className="club-cijfers-exportnaam" aria-label={t.voorbeeldVan(titel)}>
                      {titel}
                    </Link>
                    <a href={l.href} download className="club-knop club-knop--stil club-knop--klein" aria-label={t.downloaden(titel)}>
                      <Download aria-hidden size={14} /> CSV
                    </a>
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </div>
    </section>
  )
}
