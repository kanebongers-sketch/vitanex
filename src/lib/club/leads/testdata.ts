// Alleen voor tests: een lead met verstandige standaardwaarden.
import type { Lead } from './model'

let teller = 0

export function maakLead(over: Partial<Lead> = {}): Lead {
  teller += 1
  return {
    id: `00000000-0000-4000-8000-${String(teller).padStart(12, '0')}`,
    vestiging: 'budel',
    naam: 'Sanne de Vries',
    email: 'sanne@voorbeeld.nl',
    telefoon: '0612345678',
    bron: 'website',
    interesse: null,
    status: 'nieuw',
    proeflesOp: null,
    proeflesLesId: null,
    opvolgenOp: null,
    verlorenReden: null,
    medewerkerId: null,
    lidId: null,
    toestemmingContact: true,
    demo: true,
    aangemaaktOp: '2026-10-01T10:00:00Z',
    bijgewerktOp: '2026-10-01T10:00:00Z',
    geanonimiseerdOp: null,
    ...over,
  }
}
