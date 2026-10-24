import type { Metadata } from 'next'
import type { CSSProperties } from 'react'
import '@/components/aiyourgym/demo/demo.css'
import { CijfersMaandScherm, AppHomeDemo, AppSchemaDemo, AppVoedingDemo, SchemaScherm } from '@/components/aiyourgym/demo/CoachSchermen'
import { DemoStap } from '@/components/aiyourgym/demo/DemoStap'
import { dagLang, hoofdletter, weekdag } from '@/components/aiyourgym/demo/datums'
import { LidScherm, RoosterWeekScherm, VandaagScherm } from '@/components/aiyourgym/demo/WerkSchermen'
import { AanmeldBand } from '@/components/aiyourgym/site/AanmeldBand'
import { Geruststelling } from '@/components/aiyourgym/site/Actie'
import { Knop, PaginaKop } from '@/components/aiyourgym/site/bouwstenen'
import { SITE_PADEN } from '@/components/aiyourgym/site/paden'
import { getSiteTaal, siteTekst } from '@/lib/aiyourgym/taal/server'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { DEMO } from '@/lib/aiyourgym/taal/woorden/website/demo'
import { haalDemo } from '@/lib/aiyourgym/demo/bron'
import { bouwApp, bouwCijfers, bouwLidKaart, bouwSchema, bouwVandaag, bouwWeek, type DemoRuw } from '@/lib/aiyourgym/demo/model'
import { PROEFDAGEN } from '@/lib/aiyourgym/pakketten'
import { huisstijlVariabelen } from '@/lib/club/kern/huisstijl'
import { oefening3dOpNaam } from '@/lib/club/training/3d'
import { coachingVoor } from '@/lib/club/training/coaching'
import { clubDatabase } from '@/lib/club/kern/database'

// De live demo: een alleen-lezen rondleiding langs de echte schermen van de
// Voorbeeld Gym, server-side getekend uit haar demo-rijen (src/lib/aiyourgym/demo).
// Geen inlog, geen schrijf-API, geen andere sportscholen. Zolang de website-
// schakelaar uit staat valt deze pagina onder de poort van ../../layout.tsx.

export async function generateMetadata(): Promise<Metadata> {
  const t = await siteTekst(DEMO)
  return { title: t.metaTitel, description: t.metaOmschrijving }
}

async function laadDemo(): Promise<DemoRuw | null> {
  try {
    return await haalDemo(clubDatabase())
  } catch (fout) {
    console.error('[aiyourgym/demo] demo laden mislukt', fout)
    return null
  }
}

// De schermen in de demo volgen het flessengroen van de website (dezelfde tint als de
// productbeelden in mockups.css), los van de accentkleur die de Voorbeeld Gym in
// Club heeft: een eigen kleur van een sportschool vloekt hier met de website.
const DEMO_ACCENT = '#2F6153'

function NietBeschikbaar({ taal }: { taal: Taal }) {
  const t = DEMO[taal]
  return (
    <PaginaKop label={t.label} titel={t.nietKop} tekst={t.nietTekst(PROEFDAGEN)}>
      <Knop href={SITE_PADEN.AANMELDEN} soort="accent" pijl>
        {t.startProef}
      </Knop>
    </PaginaKop>
  )
}

export default async function DemoPagina() {
  const [ruw, taal] = await Promise.all([laadDemo(), getSiteTaal()])
  if (!ruw) return <NietBeschikbaar taal={taal} />
  const t = DEMO[taal]
  const b = t.beeld
  const S = t.stappen

  const hoofd = ruw.vestigingen.find((v) => v.standaard) ?? ruw.vestigingen[0]
  const huisstijl = huisstijlVariabelen(DEMO_ACCENT, ruw.organisatie.thema) as CSSProperties
  const vandaag = bouwVandaag(ruw, hoofd.vestiging)
  const week = bouwWeek(ruw)
  const kaart = bouwLidKaart(ruw)
  const schema = bouwSchema(ruw)
  const cijfers = bouwCijfers(ruw)
  const app = bouwApp(ruw, kaart, (dag) => hoofdletter(weekdag(dag, taal)))
  const alleOefeningen = schema?.dagen.flatMap((d) => d.oefeningen) ?? []
  const uitgelicht = alleOefeningen.find((o) => coachingVoor(o.naam) && oefening3dOpNaam(o.naam)) ?? null
  const coaching = uitgelicht ? coachingVoor(uitgelicht.naam) : null
  const stappen = Object.values(S)

  return (
    <>
      <PaginaKop
        label={t.label}
        titel={t.titel}
        tekst={`${t.tekst.voor}${ruw.organisatie.naam}${t.tekst.na}${dagLang(ruw.peildag, taal)}.${t.gegevensNederlands}`}
      >
        <div className="ayg-knoppen">
          <Knop href={SITE_PADEN.AANMELDEN} soort="accent" pijl>
            {t.startProef}
          </Knop>
          <Knop href={`#${S.vandaag.sleutel}`} soort="rand">
            {t.begin}
          </Knop>
        </div>
        <div className="ayg-ruim-boven">
          <Geruststelling />
        </div>
      </PaginaKop>
      <nav className="aygd-gids" aria-label={t.gids}>
        <ol className="ayg-wrap">
          {stappen.map((s, i) => (
            <li key={s.sleutel}>
              <a href={`#${s.sleutel}`}>
                <span aria-hidden>{String(i + 1).padStart(2, '0')}</span>
                {s.label}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <DemoStap stap={S.vandaag} nr={1} taal={taal} huisstijl={huisstijl} beeldLabel={b.vandaag(hoofd.naam, vandaag.binnen, vandaag.lessen.length)}>
        <VandaagScherm data={vandaag} vestiging={hoofd.naam} taal={taal} />
      </DemoStap>
      <DemoStap stap={S.rooster} nr={2} taal={taal} huisstijl={huisstijl} beeldLabel={b.rooster(hoofd.naam)}>
        <RoosterWeekScherm week={week} vestiging={hoofd.naam} taal={taal} />
      </DemoStap>
      <DemoStap stap={S.lid} nr={3} taal={taal} huisstijl={huisstijl} beeldLabel={b.lid(kaart.naam)}>
        <LidScherm kaart={kaart} taal={taal} />
      </DemoStap>
      {schema && (
        <DemoStap stap={S.schema} nr={4} donker taal={taal} huisstijl={huisstijl} beeldLabel={b.schema(schema.naam, uitgelicht?.naam ?? b.eenOefening)}>
          <SchemaScherm schema={schema} uitgelicht={uitgelicht} coaching={coaching} taal={taal} />
        </DemoStap>
      )}
      <DemoStap stap={S.cijfers} nr={5} taal={taal} huisstijl={huisstijl} beeldLabel={b.cijfers(cijfers.bezoeken, cijfers.actieveLeden)}>
        <CijfersMaandScherm cijfers={cijfers} peildag={ruw.peildag} taal={taal} />
      </DemoStap>
      <DemoStap stap={S.app} nr={6} taal={taal} huisstijl={huisstijl} beeldLabel={b.app(kaart.voornaam)}>
        <div className="aygd-toestellen">
          <AppHomeDemo app={app} taal={taal} />
          {schema && <AppSchemaDemo schema={schema} taal={taal} />}
          {app.voeding && <AppVoedingDemo voeding={app.voeding} taal={taal} />}
        </div>
      </DemoStap>
      <AanmeldBand titel={t.band} />
    </>
  )
}
