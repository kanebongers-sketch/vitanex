import { KennisGrafiekKaart } from '@/components/lifeos/notities/KennisGrafiekKaart'
import { LkPaginaKop } from '@/components/lifeos/os/LkKop'

// Kennis: Kane's notities- en kennisgrafiek. Founder-only, net als de rest van
// LifeOS; de echte gate zit server-side op elke /api/lifeos-route. Eigen route in
// plaats van een sectie in de cockpit: het dashboard blijft op vandaag gericht, de
// kennisgrafiek krijgt hier de ruimte die hij verdient.

export const metadata = { title: 'Kennis' }

export default function KennisPagina() {
  return (
    <div className="lifeos-root">
      <main className="os-schil">
        <LkPaginaKop
          titel="Kennis"
          intro="De notities en verbanden die je opbouwt: je eigen kennisgrafiek, los van de waan van de dag."
        />
        <KennisGrafiekKaart />
      </main>
    </div>
  )
}
