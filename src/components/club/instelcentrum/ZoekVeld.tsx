'use client'

import { Search } from 'lucide-react'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { BEHEER } from '@/lib/aiyourgym/taal/woorden/club/beheer'
import { openClubZoeken } from '@/components/club/shell/ClubZoeken'

// Het zoekveld bovenaan het instellingencentrum: opent hetzelfde venster als
// Ctrl K in de balk, dat elke instel-pagina en elke categorie vindt.

export function ZoekVeld() {
  const t = useTekst(BEHEER).centrum
  return (
    <button type="button" className="club-ic-zoek" onClick={openClubZoeken} aria-haspopup="dialog" aria-keyshortcuts="Control+K">
      <Search aria-hidden size={17} />
      <span className="club-ic-zoek-tekst">{t.zoeken}</span>
      <kbd aria-hidden>{t.sneltoets}</kbd>
    </button>
  )
}
