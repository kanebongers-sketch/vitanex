// ─── Club, intakevragen: schrijven (SERVER-ONLY) ────────────────────────────
// Configuratie van de sportschool, geen ledendata. Bij de eerste wijziging
// zetten we de kernvragen in de database, zodat ook die een vast id krijgen.
// Antwoorden in bestaande intakes hebben een kopie van de vraag, dus wijzigen
// of verwijderen raakt oude intakes niet.

import { logActie, type ClubToegang } from '@/lib/club/toegang'
import { gelukt, mislukt, type Resultaat } from '@/lib/club/rooster/basis-opslag'
import { kernDef, standaardSleutel } from './kern'
import { leesVraagInvoer, type Verplaatsing } from './invoer'
import { hernummerAlles, verplaatsSectie, verplaatsVraag, volgordeVoorNieuw, type Volgorde } from './lijst'
import { haalIntakeVragen } from './lezen'
import { naarRij } from './rij'
import { MAX_VRAGEN, isEigen, type IntakeVraag } from './soorten'

const NIET_GELUKT = 'Opslaan is niet gelukt. Probeer het opnieuw.'
const ONBEKEND = 'Deze vraag bestaat niet (meer).'

/** Zet ontbrekende kernvragen in de database en geef de hele set terug. */
async function zorgVoorSet(t: ClubToegang): Promise<IntakeVraag[] | null> {
  const huidig = await haalIntakeVragen(t.admin, t.userId)
  if (!huidig) return null
  const ontbrekend = huidig.vragen.filter((v) => v.sleutel !== null && standaardSleutel(v.id) !== null)
  if (ontbrekend.length === 0) return huidig.vragen
  const rijen = ontbrekend.map((v) => ({ user_id: t.userId, sleutel: v.sleutel, ...naarRij(v), volgorde: v.volgorde }))
  const { error } = await t.admin.from('club_intakevragen').upsert(rijen, { onConflict: 'user_id,sleutel', ignoreDuplicates: true })
  if (error) {
    console.error('[club] standaard intakevragen opslaan mislukt', error.message)
    return null
  }
  const opnieuw = await haalIntakeVragen(t.admin, t.userId)
  return opnieuw?.vragen ?? null
}

/** De vraag bij een id; een kern:-id wordt eerst een echt id. */
function zoek(vragen: readonly IntakeVraag[], id: string): IntakeVraag | null {
  const sleutel = standaardSleutel(id)
  return vragen.find((v) => (sleutel ? v.sleutel === sleutel : v.id === id)) ?? null
}

async function bewaarVolgorde(t: ClubToegang, volgorde: readonly Volgorde[]): Promise<boolean> {
  const uitslagen = await Promise.all(
    volgorde.map((v) => t.admin.from('club_intakevragen').update({ volgorde: v.volgorde }).eq('user_id', t.userId).eq('id', v.id)),
  )
  const fout = uitslagen.find((u) => u.error)?.error
  if (fout) console.error('[club] volgorde intakevragen opslaan mislukt', fout.message)
  return !fout
}

export async function voegVraagToe(t: ClubToegang, body: unknown): Promise<Resultaat<{ id: string }>> {
  const invoer = leesVraagInvoer(body, null)
  if (!invoer.ok) return mislukt(invoer.fout, 400)
  const set = await zorgVoorSet(t)
  if (!set) return mislukt(NIET_GELUKT, 500)
  if (set.length >= MAX_VRAGEN) return mislukt(`Je hebt al ${MAX_VRAGEN} vragen. Zet er een uit of verwijder een eigen vraag.`, 400)
  const v = invoer.waarde
  const { data, error } = await t.admin
    .from('club_intakevragen')
    .insert({ user_id: t.userId, sleutel: null, ...naarRij(v), volgorde: volgordeVoorNieuw(set, v.sectie) })
    .select('id')
    .single()
  if (error || typeof data?.id !== 'string') {
    if (error) console.error('[club] intakevraag toevoegen mislukt', error.message)
    return mislukt(NIET_GELUKT, 500)
  }
  const na = await haalIntakeVragen(t.admin, t.userId)
  if (na) await bewaarVolgorde(t, hernummerAlles(na.vragen))
  await logActie(t, 'Intakevraag toegevoegd', v.vraag, null)
  return gelukt({ id: data.id })
}

export async function wijzigVraag(t: ClubToegang, id: string, body: unknown): Promise<Resultaat<{ id: string }>> {
  const set = await zorgVoorSet(t)
  if (!set) return mislukt(NIET_GELUKT, 500)
  const vraag = zoek(set, id)
  if (!vraag) return mislukt(ONBEKEND, 404)
  const invoer = leesVraagInvoer(body, kernDef(vraag.sleutel))
  if (!invoer.ok) return mislukt(invoer.fout, 400)
  const { data, error } = await t.admin.from('club_intakevragen').update(naarRij(invoer.waarde)).eq('user_id', t.userId).eq('id', vraag.id).select('id')
  if (error) {
    console.error('[club] intakevraag wijzigen mislukt', error.message)
    return mislukt(NIET_GELUKT, 500)
  }
  if (!data || data.length === 0) return mislukt(ONBEKEND, 404)
  if (invoer.waarde.sectie !== vraag.sectie) {
    const na = await haalIntakeVragen(t.admin, t.userId)
    if (na) await bewaarVolgorde(t, hernummerAlles(na.vragen))
  }
  await logActie(t, 'Intakevraag aangepast', invoer.waarde.vraag, null)
  return gelukt({ id: vraag.id })
}

export async function verwijderVraag(t: ClubToegang, id: string): Promise<Resultaat<{ verwijderd: true }>> {
  if (standaardSleutel(id)) return mislukt('Een vaste vraag zet je uit in plaats van te verwijderen.', 400)
  const { data, error } = await t.admin.from('club_intakevragen').select('id, sleutel, vraag').eq('user_id', t.userId).eq('id', id).maybeSingle()
  if (error) {
    console.error('[club] intakevraag lezen mislukt', error.message)
    return mislukt('Verwijderen is niet gelukt. Probeer het opnieuw.', 500)
  }
  if (!data) return mislukt(ONBEKEND, 404)
  if (!isEigen({ sleutel: typeof data.sleutel === 'string' ? data.sleutel : null })) {
    return mislukt('Een vaste vraag zet je uit in plaats van te verwijderen.', 400)
  }
  const weg = await t.admin.from('club_intakevragen').delete().eq('user_id', t.userId).eq('id', id)
  if (weg.error) {
    console.error('[club] intakevraag verwijderen mislukt', weg.error.message)
    return mislukt('Verwijderen is niet gelukt. Probeer het opnieuw.', 500)
  }
  await logActie(t, 'Intakevraag verwijderd', String(data.vraag), null)
  return gelukt({ verwijderd: true })
}

export async function verplaats(t: ClubToegang, v: Verplaatsing): Promise<Resultaat<{ verplaatst: true }>> {
  const set = await zorgVoorSet(t)
  if (!set) return mislukt(NIET_GELUKT, 500)
  let volgorde: Volgorde[] | null
  if (v.wat === 'vraag') {
    const vraag = zoek(set, v.id)
    if (!vraag) return mislukt(ONBEKEND, 404)
    volgorde = verplaatsVraag(set, vraag.id, v.richting)
  } else {
    volgorde = verplaatsSectie(set, v.sectie, v.richting)
  }
  if (!volgorde) return mislukt(v.richting === 'omhoog' ? 'Staat al bovenaan.' : 'Staat al onderaan.', 400)
  if (!(await bewaarVolgorde(t, volgorde))) return mislukt(NIET_GELUKT, 500)
  return gelukt({ verplaatst: true })
}
