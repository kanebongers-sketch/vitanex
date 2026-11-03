import type { Metadata } from 'next'
import { eisModule } from '@/lib/club/toegang'
import { type ZoekParams } from '@/lib/club/kern/vestiging'
import { kiesUit, naamVan } from '@/lib/club/kern/vestigingen'
import { GeenVestigingen } from '@/components/club/shell/GeenVestigingen'
import { haalRapport } from '@/lib/club/cijfers/haal-rapport'
import { kiesMaand, maandNaam } from '@/lib/club/cijfers/maand'
import { kiesBereik } from '@/lib/club/cijfers/periode'
import { dagSleutel } from '@/lib/club/cijfers/tijd'
import { CijferKop } from '@/components/club/cijfers/CijferKop'
import { Kerncijfers } from '@/components/club/cijfers/Kerncijfers'
import { LedenHoofdstuk } from '@/components/club/cijfers/LedenHoofdstuk'
import { BezoekHoofdstuk } from '@/components/club/cijfers/BezoekHoofdstuk'
import { LessenHoofdstuk } from '@/components/club/cijfers/LessenHoofdstuk'
import { LeadsHoofdstuk, Vergelijking } from '@/components/club/cijfers/LeadsEnVergelijking'
import { Maandoverzicht } from '@/components/club/cijfers/Maandoverzicht'
import { bereikNaam, type CijferContext, type HoofdstukExport } from '@/components/club/cijfers/context'
import { AlleExports } from '@/components/club/cijfers/AlleExports'
import { clubPad } from '@/lib/club/kern/vestiging'
import { magOnderdeel } from '@/lib/club/beheerders/rechten'
import { zichtbaar as pakketZichtbaar } from '@/lib/club/kern/pakketten'
import { CIJFER_HOOFDSTUKKEN, hoofdstukExports, type CijferHoofdstuk, type ExportBasis } from '@/lib/club/rapporten/exports'
import { RAPPORTEN_TEKST } from '@/lib/aiyourgym/taal/woorden/club/rapporten'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { getTaal } from '@/lib/aiyourgym/taal/server'
import { CIJFERS } from '@/lib/aiyourgym/taal/woorden/club/cijfers'
import { WelkomVoorRol } from '@/components/club/welkom/WelkomVoorRol'
import '@/components/club/cijfers/cijfers.css'

// Cijfers: een maandrapport per vestiging of voor alle vestigingen samen. Altijd per
// kalendermaand (de 1e tot en met de laatste dag, besluit Kane), vergeleken
// met de vorige maand en dezelfde maand vorig jaar. Maand en bereik staan in
// de URL (?maand=2026-10&bereik=alle). Bij elk cijfer staat hoe het geteld is.
// Met recht op Rapporten (ontwerp 03-11-2026): de hoofdactie Exporteren, een
// exportknop per hoofdstuk en onderaan Alle exports (#exports), elk dezelfde
// CSV als /club/rapporten.

/** De exportknoppen per hoofdstuk, met de naam van het rapport in de taal. */
function exportKnoppen(basis: ExportBasis, taal: Taal): Record<CijferHoofdstuk, HoofdstukExport[]> {
  const per = hoofdstukExports(basis)
  const namen = RAPPORTEN_TEKST[taal].rapporten
  return Object.fromEntries(CIJFER_HOOFDSTUKKEN.map((h) => [h, per[h].map((l) => ({ label: namen[l.rapport].titel, href: l.href }))])) as Record<CijferHoofdstuk, HoofdstukExport[]>
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: CIJFERS[await getTaal()].titel }
}

export default async function ClubCijfers({ searchParams }: { searchParams: ZoekParams }) {
  const t = await eisModule('cijfers')
  const taal = await getTaal()
  const zoek = await searchParams
  const nu = new Date()
  const vestiging = kiesUit(t.vestigingen, zoek.v)
  if (!vestiging) return <GeenVestigingen />
  const maand = kiesMaand(zoek.maand, dagSleutel(nu))
  const bereik = kiesBereik(zoek.bereik)
  const { rapport, vandaag, meldingen } = await haalRapport(t.admin, t.userId, t.vestigingen, vestiging, maand, bereik, nu)
  const vestigingNaam = naamVan(t.vestigingen, vestiging)
  // Exporteren alleen met recht op Rapporten en het onderdeel aan (de CSV-route vraagt hetzelfde).
  const magExport = magOnderdeel(t.onderdelen, 'rapporten') && pakketZichtbaar(t.organisatie.uit, { sleutel: 'rapporten' })
  const basis: ExportBasis = { maand, vestigingen: bereik === 'alle' ? t.vestigingen.map((v) => v.sleutel) : [vestiging], alle: bereik === 'alle' }
  const c: CijferContext = { rapport, maand, vestiging, vestigingNaam, bereik, vandaag, taal, exports: magExport ? exportKnoppen(basis, taal) : null }
  // De meldingen van de bronnen zijn Nederlands; in het Engels een algemene melding.
  const zichtbaar = taal === 'nl' ? meldingen : meldingen.length > 0 ? [CIJFERS.en.meldingAlgemeen] : []
  return (
    <>
      <CijferKop vestiging={vestiging} vestigingNaam={vestigingNaam} aantalVestigingen={t.vestigingen.length} maand={maand} bereik={bereik} venster={rapport.huidig.venster} vandaag={vandaag} taal={taal} exporteren={magExport} />
      <WelkomVoorRol t={t} vestiging={vestiging} pagina="cijfers" />
      {zichtbaar.map((m) => (
        <p key={m} className="club-melding club-melding--fout" role="status">
          {m}
        </p>
      ))}
      <Kerncijfers c={c} />
      <LedenHoofdstuk c={c} />
      <BezoekHoofdstuk c={c} />
      <LessenHoofdstuk c={c} />
      <LeadsHoofdstuk c={c} />
      <Vergelijking c={c} />
      <Maandoverzicht c={c} />
      {magExport && <AlleExports basis={basis} bereik={bereikNaam(c)} maandNaam={maandNaam(maand, taal)} rapportenHref={clubPad('/rapporten', vestiging, { maand, ...(bereik === 'alle' ? { vs: 'alle' } : {}) })} taal={taal} />}
    </>
  )
}
