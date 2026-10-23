// ─── Club, lidmaatschappen: schrijven (SERVER-ONLY) ─────────────────────────
// Vormen en labels toevoegen, wijzigen, verwijderen en overnemen uit de
// ledenlijst. Alles op user_id van de actieve sportschool. Een label hernoemen
// of met tags verwijderen gaat via een databasefunctie (migratie 417), zodat
// het label en de tags van alle leden in een transactie meegaan.

import { logActie, type ClubToegang } from '@/lib/club/toegang'
import { gelukt, mislukt, type Resultaat } from '@/lib/club/rooster/basis-opslag'
import { standaardKleur } from '@/lib/club/personeel/typen'
import type { LabelInvoer, VormInvoer } from './invoer'
import { haalLabels, haalLidKenmerken, haalVormen } from './lezen'
import { ledenTekst, losseAbonnementen, losseTags, telLeden } from './tellen'

const OPSLAAN_MIS = 'Opslaan is niet gelukt. Probeer het opnieuw.'
const VORM_DUBBEL = 'Er is al een vorm met deze naam.'
const LABEL_DUBBEL = 'Er is al een label met deze naam.'
const VORM_WEG = 'Deze lidmaatschapsvorm bestaat niet.'
const LABEL_WEG = 'Dit label bestaat niet.'

function vormRij(v: VormInvoer) {
  return {
    naam: v.naam,
    omschrijving: v.omschrijving,
    vestigingen: v.vestigingen,
    groepslessen: v.groepslessen,
    max_lessen_per_week: v.maxLessenPerWeek,
    daluren_van: v.dalVan,
    daluren_tot: v.dalTot,
    daluren_weekend_vrij: v.dalWeekendVrij,
    kleur: v.kleur,
    actief: v.actief,
  }
}

export async function voegVormToe(t: ClubToegang, v: VormInvoer): Promise<Resultaat<{ id: string }>> {
  const { data, error } = await t.admin.from('club_lidmaatschapsvormen').insert({ user_id: t.userId, ...vormRij(v) }).select('id').single()
  if (error) {
    if (error.code === '23505') return mislukt(VORM_DUBBEL, 409)
    console.error('[club] lidmaatschapsvorm toevoegen mislukt', error.message)
    return mislukt(OPSLAAN_MIS, 500)
  }
  await logActie(t, 'Lidmaatschapsvorm toegevoegd', v.naam, null)
  return gelukt({ id: String(data.id) })
}

export async function wijzigVorm(t: ClubToegang, id: string, v: VormInvoer): Promise<Resultaat<{ id: string }>> {
  const { data, error } = await t.admin
    .from('club_lidmaatschapsvormen')
    .update({ ...vormRij(v), bijgewerkt_op: new Date().toISOString() })
    .eq('user_id', t.userId)
    .eq('id', id)
    .select('id')
  if (error) {
    if (error.code === '23505') return mislukt(VORM_DUBBEL, 409)
    console.error('[club] lidmaatschapsvorm wijzigen mislukt', error.message)
    return mislukt(OPSLAAN_MIS, 500)
  }
  if (!data || data.length === 0) return mislukt(VORM_WEG, 404)
  await logActie(t, 'Lidmaatschapsvorm aangepast', v.naam, null)
  return gelukt({ id })
}

/** Alleen de vorm verdwijnt; het abonnement bij de leden (uit Sportivity) blijft staan. */
export async function verwijderVorm(t: ClubToegang, id: string): Promise<Resultaat<{ verwijderd: true }>> {
  const { data, error } = await t.admin.from('club_lidmaatschapsvormen').delete().eq('user_id', t.userId).eq('id', id).select('naam')
  if (error) {
    // 23503: er hangen plannen met prijs en contract aan deze vorm (lidgeld).
    if (error.code === '23503') return mislukt('Deze vorm heeft plannen met prijs en contract. Haal eerst de plannen weg, of zet de vorm op niet meer te koop.', 409)
    console.error('[club] lidmaatschapsvorm verwijderen mislukt', error.message)
    return mislukt('Verwijderen is niet gelukt. Probeer het opnieuw.', 500)
  }
  const rij = data?.[0]
  if (!rij) return mislukt(VORM_WEG, 404)
  await logActie(t, 'Lidmaatschapsvorm verwijderd', String(rij.naam), null)
  return gelukt({ verwijderd: true })
}

/** Elke abonnementsnaam uit de ledenlijst die nog geen vorm is, wordt een vorm (zonder beperkingen). */
export async function vormenOvernemen(t: ClubToegang): Promise<Resultaat<{ toegevoegd: number }>> {
  const [leden, vormen] = await Promise.all([haalLidKenmerken(t.admin, t.userId), haalVormen(t.admin, t.userId)])
  if (!leden || !vormen) return mislukt('De ledenlijst kon niet worden gelezen. Probeer het opnieuw.', 500)
  const nieuw = losseAbonnementen(telLeden(leden), vormen)
  let toegevoegd = 0
  for (const [i, los] of nieuw.entries()) {
    const { error } = await t.admin.from('club_lidmaatschapsvormen').insert({
      user_id: t.userId,
      naam: los.naam.slice(0, 80),
      omschrijving: `Overgenomen uit de ledenlijst (${ledenTekst(los.leden)}).`,
      kleur: standaardKleur(vormen.length + i),
    })
    if (!error) toegevoegd++
    else if (error.code !== '23505') {
      console.error('[club] vorm overnemen mislukt', error.message)
      return mislukt(`Na ${toegevoegd} vormen ging het mis. Probeer het opnieuw; wat er al staat wordt overgeslagen.`, 500)
    }
  }
  if (toegevoegd > 0) await logActie(t, 'Lidmaatschapsvormen overgenomen', `${toegevoegd} uit de ledenlijst`, null)
  return gelukt({ toegevoegd })
}

export async function voegLabelToe(t: ClubToegang, l: LabelInvoer): Promise<Resultaat<{ id: string }>> {
  const { data, error } = await t.admin.from('club_labels').insert({ user_id: t.userId, ...l }).select('id').single()
  if (error) {
    if (error.code === '23505') return mislukt(LABEL_DUBBEL, 409)
    console.error('[club] label toevoegen mislukt', error.message)
    return mislukt(OPSLAAN_MIS, 500)
  }
  await logActie(t, 'Label toegevoegd', l.naam, null)
  return gelukt({ id: String(data.id) })
}

/** Naam, omschrijving en kleur. Een nieuwe naam gaat ook mee in de tags van alle leden. */
export async function wijzigLabel(t: ClubToegang, id: string, l: LabelInvoer): Promise<Resultaat<{ geraakt: number }>> {
  const { data: geraakt, error } = await t.admin.rpc('club_label_hernoemen', { p_user: t.userId, p_id: id, p_nieuw: l.naam })
  if (error) {
    if (error.code === '23505') return mislukt(LABEL_DUBBEL, 409)
    console.error('[club] label hernoemen mislukt', error.message)
    return mislukt(OPSLAAN_MIS, 500)
  }
  if (typeof geraakt !== 'number' || geraakt < 0) return mislukt(LABEL_WEG, 404)
  const rest = await t.admin.from('club_labels').update({ omschrijving: l.omschrijving, kleur: l.kleur }).eq('user_id', t.userId).eq('id', id)
  if (rest.error) {
    console.error('[club] label wijzigen mislukt', rest.error.message)
    return mislukt('De naam is aangepast, maar de omschrijving of kleur niet. Probeer het opnieuw.', 500)
  }
  await logActie(t, 'Label aangepast', geraakt > 0 ? `${l.naam} (bij ${ledenTekst(geraakt)} hernoemd)` : l.naam, null)
  return gelukt({ geraakt })
}

export async function verwijderLabel(t: ClubToegang, id: string, tagsOok: boolean): Promise<Resultaat<{ geraakt: number }>> {
  const { data: geraakt, error } = await t.admin.rpc('club_label_verwijderen', { p_user: t.userId, p_id: id, p_tags_ook: tagsOok })
  if (error) {
    console.error('[club] label verwijderen mislukt', error.message)
    return mislukt('Verwijderen is niet gelukt. Probeer het opnieuw.', 500)
  }
  if (typeof geraakt !== 'number' || geraakt < 0) return mislukt(LABEL_WEG, 404)
  await logActie(t, 'Label verwijderd', tagsOok ? `ook bij ${ledenTekst(geraakt)} weggehaald` : 'tags bij leden blijven staan', null)
  return gelukt({ geraakt })
}

/** Elke geldige tag van leden die nog geen label is, wordt een label. */
export async function labelsOvernemen(t: ClubToegang): Promise<Resultaat<{ toegevoegd: number }>> {
  const [leden, labels] = await Promise.all([haalLidKenmerken(t.admin, t.userId), haalLabels(t.admin, t.userId)])
  if (!leden || !labels) return mislukt('De ledenlijst kon niet worden gelezen. Probeer het opnieuw.', 500)
  const nieuw = losseTags(telLeden(leden), labels)
  if (nieuw.length === 0) return gelukt({ toegevoegd: 0 })
  const rijen = nieuw.map((los, i) => ({ user_id: t.userId, naam: los.naam, kleur: standaardKleur(labels.length + i) }))
  const { data, error } = await t.admin.from('club_labels').upsert(rijen, { onConflict: 'user_id,naam', ignoreDuplicates: true }).select('id')
  if (error) {
    console.error('[club] labels overnemen mislukt', error.message)
    return mislukt(OPSLAAN_MIS, 500)
  }
  const toegevoegd = data?.length ?? 0
  if (toegevoegd > 0) await logActie(t, 'Labels overgenomen', `${toegevoegd} uit de ledenlijst`, null)
  return gelukt({ toegevoegd })
}
