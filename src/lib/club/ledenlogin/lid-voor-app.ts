// ─── Club, ledenapp: wat de app van het lid en de vestiging laat zien (PUUR) ─
// De server kent het volledige Lid (met geboortedatum, geslacht, tags, coach,
// Sportivity-id en meer). De componenten van /mijn krijgen alleen wat ze tonen,
// zodat er niets extra in de pagina belandt dat het lid niet hoeft te zien.

import type { Lid } from '@/lib/club/kern/lid'

/** Het lid zoals de ledenapp het toont: naam, status, contact en lidmaatschap. */
export type LidVoorApp = Pick<Lid, 'id' | 'vestiging' | 'voornaam' | 'achternaam' | 'lidnummer' | 'email' | 'telefoon' | 'status' | 'abonnement' | 'lidSinds'>

/** Alleen de velden die de app toont; nooit meer. */
export function lidVoorApp(lid: Lid): LidVoorApp {
  return {
    id: lid.id,
    vestiging: lid.vestiging,
    voornaam: lid.voornaam,
    achternaam: lid.achternaam,
    lidnummer: lid.lidnummer,
    email: lid.email,
    telefoon: lid.telefoon,
    status: lid.status,
    abonnement: lid.abonnement,
    lidSinds: lid.lidSinds,
  }
}

/** Hoe een lid de eigen vestiging bereikt (uit club_vestigingen). */
export interface VestigingContact {
  naam: string
  telefoon: string | null
  email: string | null
}

function tekst(v: unknown, max: number): string | null {
  return typeof v === 'string' && v.trim() !== '' ? v.trim().slice(0, max) : null
}

/** Systeemgrens: een rij uit club_vestigingen naar contactgegevens. */
export function contactUitRij(rij: unknown, naam: string): VestigingContact {
  const r = typeof rij === 'object' && rij !== null ? (rij as Record<string, unknown>) : {}
  const email = tekst(r.email, 160)
  return { naam, telefoon: tekst(r.telefoon, 40), email: email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null }
}

/** Een tel:-link: alleen cijfers en een plus vooraan; null als er geen nummer overblijft. */
export function belLink(telefoon: string | null): string | null {
  if (!telefoon) return null
  const schoon = telefoon.replace(/[^\d+]/g, '').replace(/(?!^)\+/g, '')
  return schoon.replace('+', '').length >= 6 ? `tel:${schoon}` : null
}
