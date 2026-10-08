import type { KennisBlok as Blok } from '@/lib/lifeos/pt-dashboard/kennis'

// Eén inhoudsblok van een kennisitem. Puur weergave; de vorm is al gevalideerd
// door `leesSecties`. Bloktitels zijn h3 (de sectiekop is h2, de pagina h1).

function BlokTitel({ titel }: { titel?: string }) {
  return titel ? <h3 className="ffk-bloktitel">{titel}</h3> : null
}

function Tabel({ blok }: { blok: Extract<Blok, { soort: 'tabel' }> }) {
  return (
    <div className="ffk-blok">
      <BlokTitel titel={blok.titel} />
      {/* Focusbaar zodat je ook met het toetsenbord horizontaal kunt scrollen. */}
      <div className="ffk-tabel-scroll" role="region" aria-label={blok.titel ?? `Tabel: ${blok.kolommen.join(', ')}`} tabIndex={0}>
        <table className="ffk-tabel">
          <thead>
            <tr>
              {blok.kolommen.map((k, i) => (
                <th key={i} scope="col">
                  {k}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {blok.rijen.map((rij, r) => (
              <tr key={r}>
                {rij.map((cel, c) =>
                  c === 0 ? (
                    <th key={c} scope="row">
                      {cel}
                    </th>
                  ) : (
                    <td key={c}>{cel}</td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function KennisBlok({ blok }: { blok: Blok }) {
  switch (blok.soort) {
    case 'tekst':
      return <p className="ffk-tekst">{blok.tekst}</p>
    case 'lijst':
      return (
        <div className="ffk-blok">
          <BlokTitel titel={blok.titel} />
          <ul className="ffk-lijst">
            {blok.items.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      )
    case 'stappen':
      return (
        <div className="ffk-blok">
          <BlokTitel titel={blok.titel} />
          <ol className="ffk-stappen">
            {blok.items.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ol>
        </div>
      )
    case 'tabel':
      return <Tabel blok={blok} />
    case 'tip':
      return (
        // role="note" i.p.v. <aside>: een lange guide zou anders tientallen landmarks krijgen.
        <div className="ffk-tip" role="note">
          {blok.titel ? <p className="ffk-tip-titel">{blok.titel}</p> : null}
          <p className="ffk-tip-tekst">{blok.tekst}</p>
        </div>
      )
  }
}
