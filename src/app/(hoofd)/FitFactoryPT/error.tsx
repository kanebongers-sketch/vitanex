'use client' // Error boundaries moeten Client Components zijn.

// Onverwachte fout op de team-ingang of het inlogscherm: een rustige melding in
// de Fit Factory-stijl, zonder interne details (de digest staat in de logs) en
// zonder het algemene foutscherm van de app.

export default function FfFout({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <main className="lifeos-root ff">
      <div className="ptd ff-smal">
        <section className="ptd-form ptd-smal" role="alert" aria-labelledby="ff-fout-kop">
          <h2 id="ff-fout-kop">Dit lukte even niet</h2>
          <p className="ptd-tekst">De pagina kon niet geladen worden. Probeer het opnieuw; blijft het misgaan, laat het Kane weten.</p>
          <div className="ptd-acties">
            <button type="button" className="ptd-knop ptd-knop--primair" onClick={() => retry()}>
              Opnieuw proberen
            </button>
          </div>
        </section>
      </div>
    </main>
  )
}
