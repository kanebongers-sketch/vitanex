'use client' // Error boundaries moeten Client Components zijn (Next 16.2.4)

import { NEUTRALE_KNOP, Neutraal } from '../neutraal'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { CLUB_INLOGGEN } from '@/lib/aiyourgym/taal/woorden/club/inloggen'

// Foutscherm van Club, de ledenapp, de widget en de inlogpagina's. Zonder
// merknaam en zonder interne foutdetails; de digest staat in de server-logs.
// Zelfde vorm als ../(website)/error.tsx: { error, retry }.
export default function ClubFout({
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  const t = useTekst(CLUB_INLOGGEN).fout
  return (
    <Neutraal titel={t.titel} tekst={t.tekst}>
      <button type="button" onClick={() => retry()} style={NEUTRALE_KNOP}>
        {t.opnieuw}
      </button>
    </Neutraal>
  )
}
