import Link from 'next/link'
import { ArrowLeft, FileText } from 'lucide-react'
import { CATEGORIE_LABEL, taalVan, type KennisItem } from '@/lib/lifeos/pt-dashboard/kennis'
import { KennisBlok } from './KennisBlok'

// De lezer van één kennisitem: kop met bron, inhoudsopgave als chips die naar
// de secties springen, en de secties zelf. Puur weergave; de pagina haalt op.

function Kop({ code, item, taal }: { code: string; item: KennisItem; taal: string }) {
  return (
    <header className="ffk-kop">
      <Link href={`/${code}/bibliotheek`} className="ptd-link ffk-terug">
        <ArrowLeft size={16} aria-hidden />
        Kennisbank
      </Link>
      <p className="ff-boventitel">{CATEGORIE_LABEL[item.categorie]}</p>
      <h1 className="ffk-titel" lang={taal}>
        {item.titel}
      </h1>
      <hr className="ff-streep" />
      {item.ondertitel ? (
        <p className="ffk-ondertitel" lang={taal}>
          {item.ondertitel}
        </p>
      ) : null}
      {item.bron || item.documentId ? (
        <div className="ffk-bronregel">
          {item.bron ? <p className="ptd-hint">Bron: {item.bron}</p> : null}
          {item.documentId ? (
            <a href={`/api/pt/${code}/documenten/${item.documentId}`} className="ptd-knop ptd-knop--klein" target="_blank" rel="noopener">
              <FileText size={16} aria-hidden />
              Origineel openen
            </a>
          ) : null}
        </div>
      ) : null}
    </header>
  )
}

function Inhoud({ secties, taal }: { secties: KennisItem['secties']; taal: string }) {
  if (secties.length < 2) return null
  return (
    <nav className="ffk-inhoud" aria-label="Inhoud">
      <p className="ffk-inhoud-label">Inhoud</p>
      <ol className="ffk-chips" lang={taal}>
        {secties.map((s) => (
          <li key={s.id}>
            <a href={`#${s.id}`} className="ptd-chip ffk-chip">
              {s.kop}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}

export function KennisLezer({ code, item }: { code: string; item: KennisItem }) {
  // De Engelse Fit Guide krijgt lang="en" op de inhoud (niet op de NL-bediening),
  // zodat een schermlezer hem met de juiste uitspraak voorleest.
  const taal = taalVan(item.slug)
  return (
    <article className="ffk-lezer">
      <Kop code={code} item={item} taal={taal} />
      {item.secties.length === 0 ? (
        <p className="ptd-leeg">Dit onderdeel heeft nog geen inhoud. Kane vult het binnenkort aan.</p>
      ) : (
        <>
          <Inhoud secties={item.secties} taal={taal} />
          {item.secties.map((s) => (
            <section key={s.id} id={s.id} className="ffk-sectie" aria-labelledby={`${s.id}-kop`} lang={taal}>
              <h2 id={`${s.id}-kop`} className="ffk-sectiekop">
                {s.kop}
              </h2>
              {s.blokken.map((b, i) => (
                <KennisBlok key={i} blok={b} />
              ))}
            </section>
          ))}
        </>
      )}
    </article>
  )
}
