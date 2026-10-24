'use client' // Error boundaries moeten Client Components zijn (Next 16.2.4)

import { useTekst } from '@/lib/aiyourgym/taal/client'
import { SCHERM } from '@/lib/aiyourgym/taal/woorden/website/scherm'
import { NEUTRALE_KNOP, Neutraal } from '../neutraal'

// Foutscherm van AI Your Gym. Zonder merknaam: het kan ook verschijnen zolang de
// site nog geheim is. Geen interne foutdetails; de digest staat in de server-logs.
// Zelfde vorm als src/app/(hoofd)/error.tsx: { error, retry }. In de taal van de
// pagina (SCHERM; de root layout zet AygTaal).
export default function AiYourGymFout({
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  const t = useTekst(SCHERM)
  return (
    <Neutraal titel={t.foutTitel} tekst={t.foutTekst}>
      <button type="button" onClick={() => retry()} style={NEUTRALE_KNOP}>
        {t.opnieuw}
      </button>
    </Neutraal>
  )
}
