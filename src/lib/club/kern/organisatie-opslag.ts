// ─── Club: sportscholen, huisstijl en logo opslaan (SERVER-ONLY) ────────────
// Alleen voor de actieve sportschool van de beheerder (ClubToegang): het id
// komt nooit van de pagina.

import { randomUUID } from 'node:crypto'
import type { ClubToegang } from '@/lib/club/toegang'
import { modulesNaarJson, type HuisstijlInvoer } from './organisatie-invoer'
import { LOGO_FIT_FACTORY } from './organisatie'

export const LOGO_BUCKET = 'club-logo'

export async function bewaarHuisstijl(t: ClubToegang, invoer: HuisstijlInvoer): Promise<boolean> {
  const { error } = await t.admin
    .from('club_organisaties')
    .update({
      naam: invoer.naam,
      slogan: invoer.slogan,
      kleur_accent: invoer.kleurAccent,
      thema: invoer.thema,
      modules: modulesNaarJson(invoer.uit),
      bijgewerkt_op: new Date().toISOString(),
    })
    .eq('id', t.organisatie.id)
    .eq('beheerder_id', t.beheerderId)
  if (error) console.error('[club] huisstijl opslaan mislukt', error.message)
  return !error
}

/** Zet een nieuw logo in de opslag en verwijst ernaar. Het oude bestand ruimen we op. */
export async function bewaarLogo(t: ClubToegang, bytes: ArrayBuffer, type: string, extensie: string): Promise<string | null> {
  const pad = `${t.organisatie.id}/logo-${Date.now().toString(36)}.${extensie}`
  const upload = await t.admin.storage.from(LOGO_BUCKET).upload(pad, bytes, { contentType: type, upsert: false, cacheControl: '31536000' })
  if (upload.error) {
    console.error('[club] logo uploaden mislukt', upload.error.message)
    return null
  }
  const vorige = t.organisatie.logo
  const { error } = await t.admin.from('club_organisaties').update({ logo: pad, bijgewerkt_op: new Date().toISOString() }).eq('id', t.organisatie.id).eq('beheerder_id', t.beheerderId)
  if (error) {
    console.error('[club] logo koppelen mislukt', error.message)
    await t.admin.storage.from(LOGO_BUCKET).remove([pad])
    return null
  }
  if (vorige && vorige !== LOGO_FIT_FACTORY) await ruimLogoOp(t, vorige)
  return pad
}

/** Logo weghalen: dan tonen we de naam als woordmerk. */
export async function verwijderLogo(t: ClubToegang): Promise<boolean> {
  const vorige = t.organisatie.logo
  const { error } = await t.admin.from('club_organisaties').update({ logo: null, bijgewerkt_op: new Date().toISOString() }).eq('id', t.organisatie.id).eq('beheerder_id', t.beheerderId)
  if (error) {
    console.error('[club] logo weghalen mislukt', error.message)
    return false
  }
  if (vorige && vorige !== LOGO_FIT_FACTORY) await ruimLogoOp(t, vorige)
  return true
}

async function ruimLogoOp(t: ClubToegang, pad: string): Promise<void> {
  if (!pad.startsWith(`${t.organisatie.id}/`)) return
  const { error } = await t.admin.storage.from(LOGO_BUCKET).remove([pad])
  if (error) console.error('[club] oud logo opruimen mislukt', error.message)
}

/** Kolommen van een oefening die een nieuwe sportschool als startbibliotheek krijgt. */
const OEFENING_KOPIE = 'naam, spiergroep, materiaal, niveau, uitleg, aandachtspunten, patroon, belast, beeld_start, beeld_eind, beeld_bron, beeld_licentie, spieren_primair, spieren_secundair'

/**
 * Een nieuwe sportschool: een eigen, lege omgeving met de beheerder als eigenaar
 * en de actieve oefenbibliotheek van de eigen sportschool als startpunt.
 * Vestigingen voegt de sportschool daarna zelf toe (Instellingen, Vestigingen).
 */
export async function maakOrganisatie(t: ClubToegang, naam: string): Promise<string | null> {
  if (t.organisaties.some((o) => o.naam.toLowerCase() === naam.toLowerCase())) return null
  const id = randomUUID()
  const { error } = await t.admin.from('club_organisaties').insert({ id, beheerder_id: t.beheerderId, naam, kleur_accent: '#B58E5C', thema: 'donker' })
  if (error) {
    console.error('[club] sportschool aanmaken mislukt', error.message)
    return null
  }
  const { data, error: leesFout } = await t.admin.from('club_oefeningen').select(OEFENING_KOPIE).eq('user_id', t.beheerderId).eq('actief', true)
  if (leesFout) console.error('[club] oefenbibliotheek lezen mislukt', leesFout.message)
  const rijen = (data ?? []).map((o) => ({ ...o, user_id: id, actief: true }))
  if (rijen.length > 0) {
    const { error: kopieFout } = await t.admin.from('club_oefeningen').insert(rijen)
    if (kopieFout) console.error('[club] oefenbibliotheek kopieren mislukt', kopieFout.message)
  }
  return id
}
