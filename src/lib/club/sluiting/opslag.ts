// ─── Club, sluitingsdagen: schrijven (SERVER-ONLY) ──────────────────────────
// Toevoegen, wijzigen, verwijderen (configuratie, geen ledendata), de
// feestdagen in een keer, en de lessen annuleren op een dag die dicht gaat.
// Alles op user_id van de actieve sportschool.

import { logActie, type ClubToegang } from '@/lib/club/toegang'
import { gelukt, mislukt, type Resultaat } from '@/lib/club/rooster/basis-opslag'
import { annuleerLes } from '@/lib/club/rooster/opslag'
import { nederlandseFeestdagen } from './feestdagen'
import { haalSluiting, haalSluitingen, haalToekomstigeLessen } from './lezen'
import { geraakteLessen, nieuweFeestdagen, type NieuweSluiting } from './regels'
import type { FeestdagenInvoer } from './invoer'
import { soortTekst } from './weergave'

const DUBBEL = 'Op deze dag staat al een regel voor deze vestiging. Pas die aan in de lijst.'

function naarRij(userId: string, s: NieuweSluiting) {
  return { user_id: userId, vestiging: s.vestiging, datum: s.datum, soort: s.soort, open_van: s.van, open_tot: s.tot, reden: s.reden }
}

export async function voegSluitingToe(t: ClubToegang, s: NieuweSluiting): Promise<Resultaat<{ id: string }>> {
  const { data, error } = await t.admin.from('club_sluitingen').insert(naarRij(t.userId, s)).select('id').single()
  if (error) {
    if (error.code === '23505') return mislukt(DUBBEL, 409)
    console.error('[club] sluiting toevoegen mislukt', error.message)
    return mislukt('Opslaan is niet gelukt. Probeer het opnieuw.', 500)
  }
  await logActie(t, 'Sluitingsdag toegevoegd', `${s.datum}: ${s.reden} (${soortTekst(s)})`, s.vestiging)
  return gelukt({ id: String(data.id) })
}

export async function wijzigSluiting(t: ClubToegang, id: string, s: NieuweSluiting): Promise<Resultaat<{ id: string }>> {
  const { data, error } = await t.admin.from('club_sluitingen').update(naarRij(t.userId, s)).eq('user_id', t.userId).eq('id', id).select('id')
  if (error) {
    if (error.code === '23505') return mislukt(DUBBEL, 409)
    console.error('[club] sluiting wijzigen mislukt', error.message)
    return mislukt('Opslaan is niet gelukt. Probeer het opnieuw.', 500)
  }
  if (!data || data.length === 0) return mislukt('Deze sluitingsdag bestaat niet.', 404)
  await logActie(t, 'Sluitingsdag aangepast', `${s.datum}: ${s.reden} (${soortTekst(s)})`, s.vestiging)
  return gelukt({ id })
}

export async function verwijderSluiting(t: ClubToegang, id: string): Promise<Resultaat<{ verwijderd: true }>> {
  const { data, error } = await t.admin.from('club_sluitingen').delete().eq('user_id', t.userId).eq('id', id).select('datum, reden, vestiging')
  if (error) {
    console.error('[club] sluiting verwijderen mislukt', error.message)
    return mislukt('Verwijderen is niet gelukt. Probeer het opnieuw.', 500)
  }
  const rij = data?.[0]
  if (!rij) return mislukt('Deze sluitingsdag bestaat niet.', 404)
  await logActie(t, 'Sluitingsdag verwijderd', `${String(rij.datum)}: ${String(rij.reden)}`, typeof rij.vestiging === 'string' ? rij.vestiging : null)
  return gelukt({ verwijderd: true })
}

/** De gekozen feestdagen toevoegen; wat er al staat wordt overgeslagen. */
export async function voegFeestdagenToe(t: ClubToegang, invoer: FeestdagenInvoer): Promise<Resultaat<{ toegevoegd: number; overgeslagen: number }>> {
  const bestaande = await haalSluitingen(t.admin, t.userId, `${invoer.jaar}-01-01`, `${invoer.jaar}-12-31`)
  if (!bestaande) return mislukt('De bestaande sluitingsdagen konden niet worden gelezen.', 500)
  const nieuw = nieuweFeestdagen(nederlandseFeestdagen(invoer.jaar), invoer.keuzes, invoer.vestiging, bestaande)
  let toegevoegd = 0
  for (const s of nieuw) {
    const { error } = await t.admin.from('club_sluitingen').insert(naarRij(t.userId, s))
    if (!error) toegevoegd++
    else if (error.code !== '23505') {
      console.error('[club] feestdag toevoegen mislukt', error.message)
      return mislukt(`Na ${toegevoegd} feestdagen ging het mis. Probeer het opnieuw; wat er al staat wordt overgeslagen.`, 500)
    }
  }
  if (toegevoegd > 0) await logActie(t, 'Feestdagen toegevoegd', `${toegevoegd} feestdagen in ${invoer.jaar}`, invoer.vestiging)
  return gelukt({ toegevoegd, overgeslagen: invoer.keuzes.length - toegevoegd })
}

/** Annuleer de geplande lessen die door deze sluiting niet door kunnen gaan (met de gewone annuleerlogica). */
export async function annuleerLessenOpSluiting(t: ClubToegang, id: string, nu = new Date()): Promise<Resultaat<{ geannuleerd: number; mislukt: number }>> {
  const sluiting = await haalSluiting(t.admin, t.userId, id)
  if (!sluiting) return mislukt('Deze sluitingsdag bestaat niet.', 404)
  const [alle, lessen] = await Promise.all([
    haalSluitingen(t.admin, t.userId, sluiting.datum, sluiting.datum),
    haalToekomstigeLessen(t.admin, t.userId, sluiting.datum, sluiting.datum, nu, sluiting.vestiging),
  ])
  if (!alle || !lessen) return mislukt('De lessen konden niet worden gelezen.', 500)
  const reden = sluiting.soort === 'gesloten' ? `Gesloten: ${sluiting.reden}` : `Afwijkende openingstijden: ${sluiting.reden}`
  let geannuleerd = 0
  let fout = 0
  for (const les of geraakteLessen(sluiting, lessen, alle)) {
    const r = await annuleerLes(t, les.id, reden.slice(0, 200), nu)
    if (r.ok) geannuleerd++
    else fout++
  }
  return gelukt({ geannuleerd, mislukt: fout })
}
