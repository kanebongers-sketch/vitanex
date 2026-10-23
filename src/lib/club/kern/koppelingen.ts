// ─── Club: koppelingen met hun echte stand (PUUR) ───────────────────────────
// Idee Kane (23-10-2026): onderaan Club een eigen hulpbalk, met daarin
// Koppelingen. Alleen wat echt in Club zit en werkt, met de stand zoals die
// nu is: geen winkel met beloftes, geen namen van andere systemen. Elke
// koppeling hoort bij een instel-pagina (of bij Rapporten) en volgt diens
// rechten: wie de pagina niet mag zien, ziet de koppeling ook niet.
// De stand wordt op de server gelezen (src/app/(aiyourgym)/(club)/club/koppelingen);
// hier staan alleen de regels, zodat ze te testen zijn.

import { magOnderdeel } from '@/lib/club/beheerders/rechten'
import { instelHref, instelPagina, magInstelPagina, type InstelKijker } from './instel-paginas'

export type KoppelingId = 'betalen' | 'widget' | 'ledenapp' | 'meldingen' | 'importeren' | 'exports'

export interface Koppeling {
  id: KoppelingId
  titel: string
  uitleg: string
  /** De instel-pagina waar je hem instelt; die geeft ook de rechten. Zonder: het menu-onderdeel `onderdeel`. */
  instel?: string
  /** Een menu-onderdeel in plaats van een instel-pagina (Rapporten). */
  onderdeel?: { sleutel: string; pad: string }
  /** De knop op de kaart. */
  knop: string
}

export const KOPPELINGEN: readonly Koppeling[] = [
  { id: 'betalen', titel: 'Betalen met Stripe', uitleg: 'Leden kopen in de app losse lessen, strippenkaarten, PT-pakketten en producten. Het geld komt rechtstreeks bij je sportschool.', instel: 'betalen', knop: 'Betalen instellen' },
  { id: 'widget', titel: 'Boekingswidget', uitleg: 'Je lesrooster op je eigen website. Bezoekers vragen een proefles aan en komen binnen bij Leads.', instel: 'widget', knop: 'Widget instellen' },
  { id: 'ledenapp', titel: 'Ledenapp', uitleg: 'Leden boeken lessen, plannen afspraken, volgen hun schema en checken in met hun telefoon.', instel: 'ledenapp', knop: 'Ledenapp instellen' },
  { id: 'meldingen', titel: 'Mail en meldingen', uitleg: 'Bevestigingen en herinneringen van lessen en afspraken, per mail en als melding op de telefoon.', instel: 'meldingen', knop: 'Meldingen instellen' },
  { id: 'importeren', titel: 'Ledenbestand inlezen', uitleg: 'Een export uit je huidige systeem of een spreadsheet als CSV inlezen. Je ziet eerst wat er verandert.', instel: 'importeren', knop: 'Bestand inlezen' },
  { id: 'exports', titel: 'Exports', uitleg: 'Leden, bezoek, lessen, leads, afspraken en uren per kalendermaand als CSV voor je administratie.', onderdeel: { sleutel: 'rapporten', pad: '/rapporten' }, knop: 'Naar Rapporten' },
]

/**
 * Mag deze persoon de koppeling zien? Betalen telt ook als het nog niet
 * beschikbaar is (de eigenaar ziet dan eerlijk dat het nog niet klaar staat).
 */
export function magKoppeling(k: Koppeling, kijker: InstelKijker): boolean {
  if (k.onderdeel) return magOnderdeel(kijker.toegestaan, k.onderdeel.sleutel)
  const p = k.instel ? instelPagina(k.instel) : undefined
  if (!p) return false
  if (p.module && kijker.uit.includes(p.module)) return false
  return magInstelPagina(p, { ...kijker, betalenAan: true })
}

export function zichtbareKoppelingen(kijker: InstelKijker): Koppeling[] {
  return KOPPELINGEN.filter((k) => magKoppeling(k, kijker))
}

/** De link naar de pagina waar je hem instelt, of null als die er (nog) niet is. */
export function koppelingHref(k: Koppeling, kijker: InstelKijker, vestiging: string | null): string | null {
  if (k.onderdeel) return vestiging ? `/club${k.onderdeel.pad}?v=${encodeURIComponent(vestiging)}` : `/club${k.onderdeel.pad}`
  const p = k.instel ? instelPagina(k.instel) : undefined
  if (!p || !magInstelPagina(p, kijker)) return null
  if (p.perVestiging && !vestiging) return null
  return instelHref(p, vestiging)
}

// ── De stand ────────────────────────────────────────────────────────────────
// aan = werkt nu, bezig = half ingesteld, uit = staat uit of nog niet gekoppeld,
// dicht = nog niet beschikbaar voor deze sportschool, onbekend = kon niet worden gelezen.

export type KoppelStand = 'aan' | 'bezig' | 'uit' | 'dicht' | 'onbekend'

export interface KoppelStatus {
  stand: KoppelStand
  tekst: string
}

export const STAND_LABEL: Record<KoppelStand, string> = {
  aan: 'Werkt',
  bezig: 'Bijna klaar',
  uit: 'Staat uit',
  dicht: 'Nog niet beschikbaar',
  onbekend: 'Onbekend',
}

const ONBEKEND: KoppelStatus = { stand: 'onbekend', tekst: 'De stand kon niet worden gelezen. Probeer het later opnieuw.' }

export interface BetaalStandInvoer {
  /** Betalen in de ledenapp bestaat (CLUB_BETALEN_ACTIEF). */
  actief: boolean
  /** De sleutel van het platform is ingesteld. */
  sleutelGezet: boolean
  /** Het account van de sportschool; null bij een leesfout. */
  account: { stripeAccountId: string | null; chargesAan: boolean; gegevensCompleet: boolean; betalenAan: boolean } | null
}

export function betaalStand({ actief, sleutelGezet, account }: BetaalStandInvoer): KoppelStatus {
  if (!actief || !sleutelGezet) return { stand: 'dicht', tekst: 'Betalen in de ledenapp staat nog niet open voor je sportschool.' }
  if (!account) return ONBEKEND
  if (!account.stripeAccountId) return { stand: 'uit', tekst: 'Nog niet gekoppeld. Koppel je eigen Stripe-account om te beginnen.' }
  if (!account.gegevensCompleet || !account.chargesAan) return { stand: 'bezig', tekst: 'Gekoppeld, Stripe controleert nog je gegevens.' }
  if (!account.betalenAan) return { stand: 'uit', tekst: 'Gekoppeld en goedgekeurd. Kopen in de app staat nog uit.' }
  return { stand: 'aan', tekst: 'Gekoppeld. Leden kunnen betalen in de app.' }
}

export interface WidgetStandInvoer {
  /** De widget is zichtbaar op websites (CLUB_WIDGET_ACTIEF). */
  actief: boolean
  /** Heeft de sportschool een adres gekozen? */
  adres: boolean
  /** Op hoeveel vestigingen staat hij aan; null bij een leesfout. */
  aanOp: number | null
  vestigingen: number
}

export function widgetStand({ actief, adres, aanOp, vestigingen }: WidgetStandInvoer): KoppelStatus {
  if (aanOp === null) return ONBEKEND
  if (!adres) return { stand: 'uit', tekst: 'Kies eerst een adres voor je sportschool; de widget gebruikt dat in de link.' }
  if (aanOp === 0) return { stand: 'uit', tekst: 'Staat op geen enkele vestiging aan.' }
  const waar = vestigingen > 1 ? `Aan op ${aanOp} van ${vestigingen} vestigingen` : 'Aan'
  if (!actief) return { stand: 'bezig', tekst: `${waar}, maar nog niet zichtbaar voor bezoekers van je website.` }
  return { stand: 'aan', tekst: `${waar}. Bezoekers zien je rooster op je website.` }
}

export function ledenappStand({ open, qr }: { open: boolean; qr: boolean }): KoppelStatus {
  if (!open) return { stand: 'dicht', tekst: 'De ledenapp is nog niet open voor leden.' }
  return { stand: 'aan', tekst: qr ? 'Open voor leden, inchecken met de QR-code in de app staat aan.' : 'Open voor leden. Inchecken met de QR-code in de app staat uit.' }
}

export function meldingenStand({ mail, push }: { mail: boolean; push: boolean }): KoppelStatus {
  if (mail && push) return { stand: 'aan', tekst: 'Per mail en als melding op de telefoon.' }
  if (mail) return { stand: 'aan', tekst: 'Per mail. Meldingen op de telefoon staan nog uit.' }
  if (push) return { stand: 'bezig', tekst: 'Als melding op de telefoon. Mail staat nog uit.' }
  return { stand: 'dicht', tekst: 'Mail en meldingen op de telefoon staan nog niet aan.' }
}

export const ALTIJD: Record<'importeren' | 'exports', KoppelStatus> = {
  importeren: { stand: 'aan', tekst: 'Altijd beschikbaar. CSV met een rij per lid.' },
  exports: { stand: 'aan', tekst: 'Altijd beschikbaar, per kalendermaand.' },
}
