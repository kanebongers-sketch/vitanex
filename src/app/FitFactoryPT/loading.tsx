import { barlow, inter } from '@/app/fonts/fit-factory'

// Laden van de team-ingang of het inlogscherm: een rustig skelet in de Fit
// Factory-stijl, i.p.v. het algemene laadscherm van de app.

export default function FfLaden() {
  return (
    <main className={`lifeos-root ff ${barlow.variable} ${inter.variable}`} aria-busy="true" aria-live="polite">
      <span className="sr-only">Laden…</span>
      <div className="ptd ff-smal">
        <div className="ptd-lijst" aria-hidden>
          {Array.from({ length: 5 }, (_, i) => <div key={i} className="ptd-skelet ptd-skelet--rij" />)}
        </div>
      </div>
    </main>
  )
}
