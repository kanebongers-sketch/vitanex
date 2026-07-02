// ─── Contactformulier-validatie ───────────────────────────────────────────────
// Pure validatielogica, losgetrokken van de route zodat hij unit-testbaar is
// (zie contact-validatie.test.ts). Handmatige validatie: zod zit niet in het
// project en de payload is klein genoeg om expliciet te checken.

export const ONDERWERP_LABELS: Record<string, string> = {
  demo: 'Demo aanvragen',
  pricing: 'Prijsinformatie',
  technisch: 'Technische vraag',
  privacy: 'Privacy & AVG',
  partnership: 'Partnership',
  anders: 'Overig',
}

export interface ContactPayload {
  onderwerp: string
  naam: string
  email: string
  organisatie: string
  teamgrootte: string
  bericht: string
}

/** Valideert de payload; retourneert een NL-foutmelding of de schone (getrimde) data. */
export function valideerContactPayload(
  body: unknown,
): { fout: string } | { data: ContactPayload } {
  if (typeof body !== 'object' || body === null) {
    return { fout: 'Ongeldige aanvraag.' }
  }
  const b = body as Record<string, unknown>

  const naam = typeof b.naam === 'string' ? b.naam.trim() : ''
  const email = typeof b.email === 'string' ? b.email.trim() : ''
  const bericht = typeof b.bericht === 'string' ? b.bericht.trim() : ''
  const onderwerp = typeof b.onderwerp === 'string' ? b.onderwerp.trim() : ''
  const organisatie = typeof b.organisatie === 'string' ? b.organisatie.trim() : ''
  const teamgrootte = typeof b.teamgrootte === 'string' ? b.teamgrootte.trim() : ''

  if (!naam) return { fout: 'Vul je naam in.' }
  if (naam.length > 120) return { fout: 'De naam mag maximaal 120 tekens zijn.' }
  if (!email) return { fout: 'Vul je e-mailadres in.' }
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { fout: 'Vul een geldig e-mailadres in.' }
  }
  if (!bericht) return { fout: 'Vul een bericht in.' }
  if (bericht.length > 5000) return { fout: 'Het bericht mag maximaal 5000 tekens zijn.' }
  if (onderwerp.length > 40 || organisatie.length > 200 || teamgrootte.length > 40) {
    return { fout: 'Ongeldige aanvraag.' }
  }

  return { data: { onderwerp, naam, email, organisatie, teamgrootte, bericht } }
}
