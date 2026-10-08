'use client'

import { RefreshProvider } from '@/components/lifeos/os/RefreshContext'
import { PtGesprekkenKaart } from '@/components/lifeos/pt/PtGesprekkenKaart'

// De coachgesprekken met het PT-team (inplannen, verslag, pincodes van PT'ers
// goedkeuren) — voor de beheerder op de Coach-pagina van de PT-app.

export function CoachgesprekkenBeheer() {
  return (
    <section className="ptd-sectie" aria-labelledby="beheer-gesprekken-kop">
      <div className="ptd-sectiekop">
        <h2 id="beheer-gesprekken-kop">Jouw coachgesprekken</h2>
        <span>inplannen, verslag en pincodes</span>
      </div>
      <RefreshProvider>
        <PtGesprekkenKaart />
      </RefreshProvider>
    </section>
  )
}
