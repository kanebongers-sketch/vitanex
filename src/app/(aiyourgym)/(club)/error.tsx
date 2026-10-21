'use client' // Error boundaries moeten Client Components zijn (Next 16.2.4)

import { NEUTRALE_KNOP, Neutraal } from '../neutraal'

// Foutscherm van Club, de ledenapp, de widget en de inlogpagina's. Zonder
// merknaam en zonder interne foutdetails; de digest staat in de server-logs.
// Zelfde vorm als ../(website)/error.tsx: { error, retry }.
export default function ClubFout({
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  return (
    <Neutraal titel="Er ging iets mis" tekst="Probeer het opnieuw. Blijft het misgaan, kom dan later nog eens terug.">
      <button type="button" onClick={() => retry()} style={NEUTRALE_KNOP}>
        Probeer opnieuw
      </button>
    </Neutraal>
  )
}
