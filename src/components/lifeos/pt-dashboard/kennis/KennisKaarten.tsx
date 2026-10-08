import Link from 'next/link'
import { ChevronRight, FolderOpen } from 'lucide-react'
import { CATEGORIE_UITLEG, perCategorie, type KennisItemKort } from '@/lib/lifeos/pt-dashboard/kennis'

// De kaarten van de kennisbank-hub: eerst de prominente kaart naar de originele
// bestanden, daarna de leesbare items per categorie. Puur weergave.

export function DocumentenKaart({ code }: { code: string }) {
  return (
    <Link href={`/${code}/bibliotheek/documenten`} className="ffk-documenten">
      <FolderOpen className="ffk-documenten-icoon" size={28} strokeWidth={1.75} aria-hidden />
      <span className="ffk-documenten-tekst">
        <span className="ffk-documenten-titel">Documenten</span>
        <span className="ffk-documenten-uitleg">De originele bestanden openen: PDF&apos;s, presentaties en formulieren.</span>
      </span>
      <ChevronRight className="ffk-pijl" size={20} aria-hidden />
    </Link>
  )
}

function KennisKaart({ code, item }: { code: string; item: KennisItemKort }) {
  const onderdelen = `${item.aantalSecties} ${item.aantalSecties === 1 ? 'onderdeel' : 'onderdelen'}`
  return (
    <li>
      <Link href={`/${code}/bibliotheek/${item.slug}`} className="ffk-kaart">
        <span className="ffk-kaart-titel">{item.titel}</span>
        {item.ondertitel ? <span className="ffk-kaart-sub ptd-kort">{item.ondertitel}</span> : null}
        <span className="ffk-kaart-meta">{onderdelen}</span>
      </Link>
    </li>
  )
}

export function KennisKaarten({ code, items }: { code: string; items: KennisItemKort[] }) {
  return (
    <>
      {perCategorie(items).map((groep) => (
        <section key={groep.categorie} className="ptd-sectie" aria-labelledby={`ffk-cat-${groep.categorie}`}>
          <div className="ptd-sectiekop">
            <h2 id={`ffk-cat-${groep.categorie}`}>{groep.label}</h2>
            <span>{CATEGORIE_UITLEG[groep.categorie]}</span>
          </div>
          <ul className="ffk-kaarten">
            {groep.items.map((item) => (
              <KennisKaart key={item.slug} code={code} item={item} />
            ))}
          </ul>
        </section>
      ))}
    </>
  )
}
