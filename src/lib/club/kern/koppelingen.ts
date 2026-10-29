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
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { KOPPEL_TEKST } from '@/lib/aiyourgym/taal/woorden/club/koppelingen'

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

/** Een koppeling met titel, uitleg en knop in de gekozen taal. */
export function koppelingInTaal(k: Koppeling, taal: Taal): Koppeling {
  const t = KOPPEL_TEKST[taal].koppelingen[k.id]
  return { ...k, titel: t.titel, uitleg: t.uitleg, knop: t.knop }
}

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

/** Het label van een stand in de gekozen taal. */
export function standLabel(stand: KoppelStand, taal: Taal = 'nl'): string {
  return KOPPEL_TEKST[taal].standLabel[stand]
}

const S = (taal: Taal) => KOPPEL_TEKST[taal].stand

/** Kon de stand niet worden gelezen. */
export function onbekendeStand(taal: Taal = 'nl'): KoppelStatus {
  return { stand: 'onbekend', tekst: S(taal).onbekend }
}

export interface BetaalStandInvoer {
  /** Betalen in de ledenapp bestaat (CLUB_BETALEN_ACTIEF). */
  actief: boolean
  /** De sleutel van het platform is ingesteld. */
  sleutelGezet: boolean
  /** Het account van de sportschool; null bij een leesfout. */
  account: { stripeAccountId: string | null; chargesAan: boolean; gegevensCompleet: boolean; betalenAan: boolean } | null
}

export function betaalStand({ actief, sleutelGezet, account }: BetaalStandInvoer, taal: Taal = 'nl'): KoppelStatus {
  const t = S(taal)
  if (!actief || !sleutelGezet) return { stand: 'dicht', tekst: t.betaalDicht }
  if (!account) return onbekendeStand(taal)
  if (!account.stripeAccountId) return { stand: 'uit', tekst: t.betaalNietGekoppeld }
  if (!account.gegevensCompleet || !account.chargesAan) return { stand: 'bezig', tekst: t.betaalControle }
  if (!account.betalenAan) return { stand: 'uit', tekst: t.betaalUit }
  return { stand: 'aan', tekst: t.betaalAan }
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

export function widgetStand({ actief, adres, aanOp, vestigingen }: WidgetStandInvoer, taal: Taal = 'nl'): KoppelStatus {
  const t = S(taal)
  if (aanOp === null) return onbekendeStand(taal)
  if (!adres) return { stand: 'uit', tekst: t.widgetAdres }
  if (aanOp === 0) return { stand: 'uit', tekst: t.widgetNergens }
  const waar = vestigingen > 1 ? t.widgetAanOp(aanOp, vestigingen) : t.widgetAan
  if (!actief) return { stand: 'bezig', tekst: t.widgetNietZichtbaar(waar) }
  return { stand: 'aan', tekst: t.widgetZichtbaar(waar) }
}

export function ledenappStand({ open, qr }: { open: boolean; qr: boolean }, taal: Taal = 'nl'): KoppelStatus {
  const t = S(taal)
  if (!open) return { stand: 'dicht', tekst: t.ledenappDicht }
  return { stand: 'aan', tekst: qr ? t.ledenappQrAan : t.ledenappQrUit }
}

export function meldingenStand({ mail, push }: { mail: boolean; push: boolean }, taal: Taal = 'nl'): KoppelStatus {
  const t = S(taal)
  if (mail && push) return { stand: 'aan', tekst: t.meldingenBeide }
  if (mail) return { stand: 'aan', tekst: t.meldingenMail }
  if (push) return { stand: 'bezig', tekst: t.meldingenPush }
  return { stand: 'dicht', tekst: t.meldingenGeen }
}

export const ALTIJD: Record<'importeren' | 'exports', KoppelStatus> = {
  importeren: { stand: 'aan', tekst: 'Altijd beschikbaar. CSV met een rij per lid.' },
  exports: { stand: 'aan', tekst: 'Altijd beschikbaar, per kalendermaand.' },
}

/** Altijd beschikbaar (inlezen en exports), in de gekozen taal. */
export function altijdStand(id: 'importeren' | 'exports', taal: Taal = 'nl'): KoppelStatus {
  return { stand: 'aan', tekst: S(taal)[id] }
}
