import { FfLogo } from '@/components/lifeos/pt-dashboard/FfLogo'
import { barlow, inter } from '@/app/fonts/fit-factory'

// Het Fit Factory-laadscherm: logo bovenin en een rustig skelet, i.p.v. het
// algemene laadscherm van de app. Ook gebruikt door src/app/loading.tsx op
// fitfactorypt.nl, zodat je bij verversen nooit iets anders ziet.

export default function FfLaden() {
  return (
    <main className={`lifeos-root ff ${barlow.variable} ${inter.variable}`} aria-busy="true" aria-live="polite">
      <header className="ff-balk">
        <FfLogo prioriteit />
      </header>
      <span className="sr-only">Laden…</span>
      <div className="ptd ff-smal">
        <div className="ptd-lijst" aria-hidden>
          {Array.from({ length: 5 }, (_, i) => <div key={i} className="ptd-skelet ptd-skelet--rij" />)}
        </div>
      </div>
    </main>
  )
}
