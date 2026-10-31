// ─── Fit Factory Club: leads en proeflessen, het model (PUUR) ───────────────
// Een lead is iemand die interesse heeft (website, balie, telefoon, social,
// verwijzing, actie). De pijplijn: Nieuw, Contact, Proefles gepland, Proefles
// geweest, Lid, Verloren. Alles hier is puur en getest; de database-grens
// (leadUitRij, historieUitRij) narrowt elke rij zonder casts op de velden.

import type { Vestiging } from '@/lib/club/kern/vestiging'
import { isVestigingSlug } from '@/lib/club/kern/vestigingen'
import { isLeadUitkomst, type LeadUitkomst } from '@/lib/club/behoud/uitkomst'

export const LEAD_STATUSSEN = ['nieuw', 'contact', 'proefles', 'proefles_geweest', 'lid', 'verloren'] as const
export type LeadStatus = (typeof LEAD_STATUSSEN)[number]

export const LEAD_STATUS_LABEL: Record<LeadStatus, string> = {
  nieuw: 'Nieuw',
  contact: 'Contact',
  proefles: 'Proefles gepland',
  proefles_geweest: 'Proefles geweest',
  lid: 'Lid',
  verloren: 'Verloren',
}

/** De volgende stap die we per kolom voorstellen op de kaart. */
export const VOLGENDE_STAP: Record<LeadStatus, string> = {
  nieuw: 'Eerste contact leggen',
  contact: 'Proefles inplannen',
  proefles: 'Proefles laten doen',
  proefles_geweest: 'Lid maken of nabellen',
  lid: 'Inschrijving afronden in je ledenadministratie',
  verloren: 'Afgesloten',
}

export const LEAD_BRONNEN = ['website', 'balie', 'telefoon', 'social', 'verwijzing', 'actie', 'overig'] as const
export type LeadBron = (typeof LEAD_BRONNEN)[number]

export const LEAD_BRON_LABEL: Record<LeadBron, string> = {
  website: 'Website',
  balie: 'Balie',
  telefoon: 'Telefoon',
  social: 'Social media',
  verwijzing: 'Verwijzing',
  actie: 'Actie',
  overig: 'Overig',
}

export const HISTORIE_SOORTEN = ['notitie', 'status', 'gebeld', 'gemaild', 'proefles'] as const
export type HistorieSoort = (typeof HISTORIE_SOORTEN)[number]

export const HISTORIE_LABEL: Record<HistorieSoort, string> = {
  notitie: 'Notitie',
  status: 'Status',
  gebeld: 'Gebeld',
  gemaild: 'Gemaild',
  proefles: 'Proefles',
}

/** Een stap die het zijpaneel meteen opent (?stap=proefles): kan niet met een klik in de pijplijn. */
export type PaneelStap = 'proefles' | 'lid' | 'verloren'

export function isPaneelStap(v: unknown): v is PaneelStap {
  return v === 'proefles' || v === 'lid' || v === 'verloren'
}

/** Statussen waarin een lead klaar is: geen opvolging meer. */
export const AFGESLOTEN: readonly LeadStatus[] = ['lid', 'verloren']

export interface Lead {
  id: string
  vestiging: Vestiging
  naam: string
  email: string | null
  telefoon: string | null
  bron: LeadBron
  interesse: string | null
  status: LeadStatus
  proeflesOp: string | null
  proeflesLesId: string | null
  opvolgenOp: string | null
  verlorenReden: string | null
  medewerkerId: string | null
  lidId: string | null
  toestemmingContact: boolean
  demo: boolean
  aangemaaktOp: string
  bijgewerktOp: string
  /** Gewist op verzoek of na de bewaartermijn (AVG, migratie 449); null = niet gewist. */
  geanonimiseerdOp: string | null
}

export interface HistorieRegel {
  id: string
  soort: HistorieSoort
  tekst: string | null
  /** Wat het contactmoment opleverde (migratie 482), of null. */
  uitkomst: LeadUitkomst | null
  auteur: string | null
  op: string
}

export const LEAD_KOLOMMEN =
  'id, vestiging, naam, email, telefoon, bron, interesse, status, proefles_op, proefles_les_id, opvolgen_op, verloren_reden, medewerker_id, lid_id, toestemming_contact, demo, aangemaakt_op, bijgewerkt_op, geanonimiseerd_op'

export const HISTORIE_KOLOMMEN = 'id, soort, tekst, uitkomst, auteur, op'

function uit<T extends string>(lijst: readonly T[], v: unknown): v is T {
  return typeof v === 'string' && (lijst as readonly string[]).includes(v)
}

export const isLeadStatus = (v: unknown): v is LeadStatus => uit(LEAD_STATUSSEN, v)
export const isLeadBron = (v: unknown): v is LeadBron => uit(LEAD_BRONNEN, v)
export const isHistorieSoort = (v: unknown): v is HistorieSoort => uit(HISTORIE_SOORTEN, v)

function tekst(v: unknown): string | null {
  return typeof v === 'string' && v.trim() !== '' ? v : null
}

function alsObject(rij: unknown): Record<string, unknown> | null {
  return typeof rij === 'object' && rij !== null ? (rij as Record<string, unknown>) : null
}

/** Systeemgrens: een databaserij naar een Lead, of null als de rij onbruikbaar is. */
export function leadUitRij(rij: unknown): Lead | null {
  const r = alsObject(rij)
  if (!r) return null
  const id = tekst(r.id)
  const naam = tekst(r.naam)
  const aangemaaktOp = tekst(r.aangemaakt_op)
  if (!id || !naam || !aangemaaktOp || !isVestigingSlug(r.vestiging)) return null
  return {
    id,
    vestiging: r.vestiging,
    naam,
    email: tekst(r.email),
    telefoon: tekst(r.telefoon),
    bron: isLeadBron(r.bron) ? r.bron : 'overig',
    interesse: tekst(r.interesse),
    status: isLeadStatus(r.status) ? r.status : 'nieuw',
    proeflesOp: tekst(r.proefles_op),
    proeflesLesId: tekst(r.proefles_les_id),
    opvolgenOp: tekst(r.opvolgen_op),
    verlorenReden: tekst(r.verloren_reden),
    medewerkerId: tekst(r.medewerker_id),
    lidId: tekst(r.lid_id),
    toestemmingContact: r.toestemming_contact === true,
    demo: r.demo === true,
    aangemaaktOp,
    bijgewerktOp: tekst(r.bijgewerkt_op) ?? aangemaaktOp,
    geanonimiseerdOp: tekst(r.geanonimiseerd_op),
  }
}

/** Systeemgrens in de browser: een Lead zoals de API hem als JSON teruggeeft (camelCase). */
export function leadUitJson(v: unknown): Lead | null {
  const r = alsObject(v)
  if (!r) return null
  return leadUitRij({
    id: r.id, vestiging: r.vestiging, naam: r.naam, email: r.email, telefoon: r.telefoon, bron: r.bron,
    interesse: r.interesse, status: r.status, proefles_op: r.proeflesOp, proefles_les_id: r.proeflesLesId,
    opvolgen_op: r.opvolgenOp, verloren_reden: r.verlorenReden, medewerker_id: r.medewerkerId, lid_id: r.lidId,
    toestemming_contact: r.toestemmingContact, demo: r.demo, aangemaakt_op: r.aangemaaktOp, bijgewerkt_op: r.bijgewerktOp,
    geanonimiseerd_op: r.geanonimiseerdOp,
  })
}

/** Systeemgrens: een rij uit club_lead_historie, of null. */
export function historieUitRij(rij: unknown): HistorieRegel | null {
  const r = alsObject(rij)
  if (!r) return null
  const id = tekst(r.id)
  const op = tekst(r.op)
  if (!id || !op || !isHistorieSoort(r.soort)) return null
  return { id, soort: r.soort, tekst: tekst(r.tekst), uitkomst: isLeadUitkomst(r.uitkomst) ? r.uitkomst : null, auteur: tekst(r.auteur), op }
}

/** Initialen voor de avatar op een kaart: "Sanne van der Berg" wordt "SB". */
export function leadInitialen(naam: string): string {
  const delen = naam.trim().split(/\s+/).filter(Boolean)
  if (delen.length === 0) return '?'
  const eerste = delen[0].charAt(0)
  const laatste = delen.length > 1 ? delen[delen.length - 1].charAt(0) : ''
  return `${eerste}${laatste}`.toUpperCase()
}
