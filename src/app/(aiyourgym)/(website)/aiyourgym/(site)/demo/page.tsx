import type { Metadata } from 'next'
import type { CSSProperties } from 'react'
import '@/components/aiyourgym/demo/demo.css'
import { CijfersMaandScherm, AppHomeDemo, AppSchemaDemo, AppVoedingDemo, SchemaScherm } from '@/components/aiyourgym/demo/CoachSchermen'
import { DemoStap } from '@/components/aiyourgym/demo/DemoStap'
import { DEMO_STAPPEN } from '@/components/aiyourgym/demo/stappen'
import { LidScherm, RoosterWeekScherm, VandaagScherm } from '@/components/aiyourgym/demo/WerkSchermen'
import { AanmeldBand } from '@/components/aiyourgym/site/AanmeldBand'
import { Geruststelling } from '@/components/aiyourgym/site/Actie'
import { Knop, PaginaKop } from '@/components/aiyourgym/site/bouwstenen'
import { AANMELDEN } from '@/components/aiyourgym/site/paden'
import { haalDemo } from '@/lib/aiyourgym/demo/bron'
import { bouwApp, bouwCijfers, bouwLidKaart, bouwSchema, bouwVandaag, bouwWeek, type DemoRuw } from '@/lib/aiyourgym/demo/model'
import { PROEFDAGEN } from '@/lib/aiyourgym/pakketten'
import { dagLang, weekdagNaam, weekdagVan } from '@/lib/club/cijfers/tijd'
import { huisstijlVariabelen } from '@/lib/club/kern/huisstijl'
import { oefening3dOpNaam } from '@/lib/club/training/3d'
import { coachingVoor } from '@/lib/club/training/coaching'
import { clubDatabase } from '@/lib/club/kern/database'

// De live demo: een alleen-lezen rondleiding langs de echte schermen van de
// Voorbeeld Gym, server-side getekend uit haar demo-rijen (src/lib/aiyourgym/demo).
// Geen inlog, geen schrijf-API, geen andere sportscholen. Zolang de website-
// schakelaar uit staat valt deze pagina onder de poort van ../../layout.tsx.

export const metadata: Metadata = {
  title: 'Live demo',
  description:
    'Kijk rond in AI Your Gym met de Voorbeeld Gym: Vandaag, het lesrooster, een ledenkaart, een schema met coaching, de cijfers en de ledenapp. Zonder account, met voorbeeldgegevens.',
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

function NietBeschikbaar() {
  return (
    <PaginaKop label="Live demo" titel="De demo is even niet beschikbaar." tekst={`Probeer het later nog eens, of start meteen je eigen omgeving en probeer alles ${PROEFDAGEN} dagen gratis.`}>
      <Knop href={AANMELDEN} soort="accent" pijl>
        Start je eigen proefperiode
      </Knop>
    </PaginaKop>
  )
}

function dagNaam(dag: string): string {
  const w = weekdagNaam(weekdagVan(dag))
  return w[0].toUpperCase() + w.slice(1)
}

export default async function DemoPagina() {
  const ruw = await laadDemo()
  if (!ruw) return <NietBeschikbaar />

  const hoofd = ruw.vestigingen.find((v) => v.standaard) ?? ruw.vestigingen[0]
  const huisstijl = huisstijlVariabelen(DEMO_ACCENT, ruw.organisatie.thema) as CSSProperties
  const vandaag = bouwVandaag(ruw, hoofd.vestiging)
  const week = bouwWeek(ruw)
  const kaart = bouwLidKaart(ruw)
  const schema = bouwSchema(ruw)
  const cijfers = bouwCijfers(ruw)
  const app = bouwApp(ruw, kaart, dagNaam)
  const alleOefeningen = schema?.dagen.flatMap((d) => d.oefeningen) ?? []
  const uitgelicht = alleOefeningen.find((o) => coachingVoor(o.naam) && oefening3dOpNaam(o.naam)) ?? null
  const coaching = uitgelicht ? coachingVoor(uitgelicht.naam) : null
  const stappen = Object.values(DEMO_STAPPEN)

  return (
    <>
      <PaginaKop
        label="Live demo"
        titel="Kijk rond in een echte sportschool."
        tekst={`Dit zijn de echte schermen van AI Your Gym, met de ${ruw.organisatie.naam}: een sportschool met voorbeeldgegevens. Alleen kijken, zonder account. Stand van ${dagLang(ruw.peildag)}.`}
      >
        <div className="ayg-knoppen">
          <Knop href={AANMELDEN} soort="accent" pijl>
            Start je eigen proefperiode
          </Knop>
          <Knop href={`#${DEMO_STAPPEN.vandaag.sleutel}`} soort="rand">
            Begin de rondleiding
          </Knop>
        </div>
        <div className="ayg-ruim-boven">
          <Geruststelling />
        </div>
      </PaginaKop>
      <nav className="aygd-gids" aria-label="Schermen in de demo">
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

      <DemoStap stap={DEMO_STAPPEN.vandaag} nr={1} huisstijl={huisstijl} beeldLabel={`Vandaag in ${hoofd.naam}: ${vandaag.binnen} bezoeken, ${vandaag.lessen.length} lessen, wie er werkt en leads om op te volgen`}>
        <VandaagScherm data={vandaag} vestiging={hoofd.naam} />
      </DemoStap>
      <DemoStap stap={DEMO_STAPPEN.rooster} nr={2} huisstijl={huisstijl} beeldLabel={`Het lesrooster van ${hoofd.naam} voor een week, met de bezetting per les`}>
        <RoosterWeekScherm week={week} vestiging={hoofd.naam} />
      </DemoStap>
      <DemoStap stap={DEMO_STAPPEN.lid} nr={3} huisstijl={huisstijl} beeldLabel={`De ledenkaart van ${kaart.naam}: status, lidmaatschap, bezoek, schema en laatste meting`}>
        <LidScherm kaart={kaart} />
      </DemoStap>
      {schema && (
        <DemoStap stap={DEMO_STAPPEN.schema} nr={4} donker huisstijl={huisstijl} beeldLabel={`Het schema ${schema.naam} met coaching bij ${uitgelicht?.naam ?? 'een oefening'}`}>
          <SchemaScherm schema={schema} uitgelicht={uitgelicht} coaching={coaching} />
        </DemoStap>
      )}
      <DemoStap stap={DEMO_STAPPEN.cijfers} nr={5} huisstijl={huisstijl} beeldLabel={`De cijfers van deze maand: ${cijfers.bezoeken} bezoeken, ${cijfers.actieveLeden} actieve leden`}>
        <CijfersMaandScherm cijfers={cijfers} peildag={ruw.peildag} />
      </DemoStap>
      <DemoStap stap={DEMO_STAPPEN.app} nr={6} huisstijl={huisstijl} beeldLabel={`De ledenapp van ${kaart.voornaam}: volgende les, bezoek, QR-code, challenge, schema en voeding`}>
        <div className="aygd-toestellen">
          <AppHomeDemo app={app} />
          {schema && <AppSchemaDemo schema={schema} />}
          {app.voeding && <AppVoedingDemo voeding={app.voeding} />}
        </div>
      </DemoStap>
      <AanmeldBand titel="Nu met jouw sportschool erin." />
    </>
  )
}
