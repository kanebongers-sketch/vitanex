import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { abonnementRegel, laatsteDag, type PtKlant } from '@/lib/lifeos/pt-dashboard/abonnementen'
import { dagKort } from '@/lib/lifeos/pt-dashboard/datum'
import { KlantBadge } from '../KlantKaart'

// Kop van het klantdossier: terug naar de lijst, naam, abonnement en status. De
// prijs alleen voor wie meekijkt (eigenaar); PT'ers zien geen bedragen. Puur.

export function DossierKop({ code, klant: k, vandaag, toonPrijs = false }: { code: string; klant: PtKlant; vandaag: string; toonPrijs?: boolean }) {
  return (
    <header className="ffdos-kop">
      <Link href={`/${code}/klanten`} className="ptd-link ffdos-terug">
        <ChevronLeft size={16} aria-hidden /> Alle klanten
      </Link>
      <div className="ptd-rij-kop">
        <h1 className="ffdos-naam">
          {k.naam}
          {k.duoPartner ? <span className="ptd-zacht"> &amp; {k.duoPartner}</span> : null}
        </h1>
        <KlantBadge klant={k} vandaag={vandaag} />
      </div>
      <div className="ptd-meta">
        <span>{abonnementRegel(k, toonPrijs)}</span>
        <span>Start {dagKort(k.startdatum)}</span>
        {k.status === 'opgezegd' && k.opgezegdOp ? <span>Loopt t/m {dagKort(laatsteDag(k.startdatum, k.opgezegdOp))}</span> : null}
        {k.status === 'gestopt' && k.opgezegdOp ? <span>Gestopt {dagKort(k.opgezegdOp)}</span> : null}
      </div>
    </header>
  )
}
