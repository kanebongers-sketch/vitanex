import { FileSpreadsheet, FileText, Image as ImageIcon, Presentation, type LucideIcon } from 'lucide-react'
import { leesbareGrootte, soortVanMime } from '@/lib/lifeos/pt-dashboard/documenten'
import { groepeerPerCategorie, type PtDocument } from '@/lib/lifeos/pt-dashboard/documenten-lezers'
import { OpenDocumentLink } from './OpenDocumentLink'

// De documenten die Kane deelt, per categorie. Presentational (server): de
// enige interactie is de "Openen"-link, en die loopt via de pincode-API.

const ICOON: Record<string, LucideIcon> = { PDF: FileText, Word: FileText, PowerPoint: Presentation, Excel: FileSpreadsheet, Afbeelding: ImageIcon }

interface Props {
  code: string
  documenten: readonly PtDocument[]
}

export function DocumentenLijst({ code, documenten }: Props) {
  const groepen = groepeerPerCategorie(documenten)
  if (groepen.length === 0) {
    return <p className="ptd-leeg">Kane heeft nog geen documenten gedeeld.</p>
  }

  return (
    <>
      {groepen.map((g) => (
        <section key={g.categorie} className="ptd-sectie" aria-labelledby={`docs-${g.categorie}`}>
          <div className="ptd-sectiekop">
            <h2 id={`docs-${g.categorie}`}>{g.label}</h2>
            <span>
              {g.documenten.length} {g.documenten.length === 1 ? 'document' : 'documenten'}
            </span>
          </div>
          <ul className="ptd-lijst">
            {g.documenten.map((d) => {
              const label = soortVanMime(d.mime)?.label ?? 'Bestand'
              const Icoon = ICOON[label] ?? FileText
              return (
                <li key={d.id} className="ptd-rij ffdoc-rij">
                  <span className="ffdoc-icoon" aria-hidden="true">
                    <Icoon size={22} strokeWidth={1.8} />
                  </span>
                  <div className="ffdoc-tekst">
                    <h3 className="ptd-naam">{d.titel}</h3>
                    {d.beschrijving ? <p className="ptd-tekst">{d.beschrijving}</p> : null}
                    <div className="ptd-meta">
                      <span className="ptd-badge">{label}</span>
                      <span>{leesbareGrootte(d.grootte)}</span>
                    </div>
                  </div>
                  <OpenDocumentLink href={`/api/pt/${code}/documenten/${d.id}`} titel={d.titel} />
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </>
  )
}
