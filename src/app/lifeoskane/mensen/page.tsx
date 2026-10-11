import { MensenBord } from '@/components/lifeos/crm/MensenBord'
import { LkPaginaKop } from '@/components/lifeos/os/LkKop'

// Het mensen-bord: Kane's CRM voor zijn PT-klanten en zijn twee teams. Alleen voor
// Kane, net als de rest van LifeOS; de echte gate zit server-side op elke
// /api/lifeos/crm-route. De data leeft in de aparte LifeOS-database, want dit zijn
// persoonsgegevens van derden (klanten, teamleden) die niet in de B2B-database
// horen die medewerkers anonimiteit belooft. Zie src/lib/lifeos/admin.ts.
//
// Eigen route in plaats van een sectie in de cockpit: een kanban heeft horizontale
// breedte en een eigen scroll nodig die de verticale cockpit-flow niet geeft.

export const metadata = { title: 'Mensen' }

export default function MensenPagina() {
  return (
    <div className="lifeos-root">
      <main className="os-schil os-schil--breed">
        <LkPaginaKop
          titel="Mensen"
          intro="Je PT-klanten en je teams. Sleep een kaart naar een andere kolom om de status te wijzigen, of open een kaart voor de geschiedenis en bijzonderheden."
        />
        <MensenBord />
      </main>
    </div>
  )
}
