import type { Instrumentation } from 'next'

// Serverfouten van Club, de ledenapp en AI Your Gym komen in club_fouten
// (zie src/lib/club/betrouwbaarheid/). Fouten van de rest van de app worden
// daar overgeslagen. Alleen op de Node-server: de database-client hoort niet
// in de edge-runtime. Het gewone gedrag van Next (loggen, error.tsx) blijft.

export const onRequestError: Instrumentation.onRequestError = async (fout, verzoek, context) => {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return
  try {
    const { meldVerzoekFout } = await import('@/lib/club/betrouwbaarheid/melden')
    await meldVerzoekFout(fout, verzoek, context)
  } catch {
    // Melden is best-effort en mag het afhandelen van de fout nooit verstoren.
  }
}
