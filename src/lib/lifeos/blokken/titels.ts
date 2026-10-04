// ─── LifeOS — herken blokken die LifeOS zélf in je agenda zette (PUUR) ──────
// "Bouwblok: PT uitbouwen" bevat het woord PT, maar is geen PT-sessie met een
// klant. Zonder deze herkenning hield de PT-logica het voor een onbekende klant
// ("Bouwblok Uitbouwen") en voegde die automatisch toe. Eén bron voor alle titels
// die `plan.ts`/`nu.ts` schrijven.

const EIGEN_BLOK = /^\s*(taak\s*:|bouwblok\s*:|mail afhandelen\b)/i

export function isLifeosBlok(titel: string | null | undefined): boolean {
  return typeof titel === 'string' && EIGEN_BLOK.test(titel)
}
