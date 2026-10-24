import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { Check } from 'lucide-react'
import '@/components/aiyourgym/schemas/schemas.css'
import { SCHEMA_STAPPEN, type SchemaStapSleutel } from '@/components/aiyourgym/inhoud/trainingsschemas'
import { aantalMetCoaching, voorbeeldOefeningen, type VoorbeeldOefening } from '@/components/aiyourgym/inhoud/voorbeeldschema'
import { Figuur } from '@/components/aiyourgym/mockups/kaders'
import { CoachingDemo } from '@/components/aiyourgym/schemas/CoachingDemo'
import { SchemaToestel } from '@/components/aiyourgym/schemas/SchemaToestel'
import { StapScherm } from '@/components/aiyourgym/schemas/StapScherm'
import { EditorScherm, IntakeScherm, VoorstelScherm } from '@/components/aiyourgym/schemas/SchermenTrainer'
import { BibliotheekScherm, CoachtekstScherm, OefeningToestel, VoortgangToestel } from '@/components/aiyourgym/schemas/SchermenBibliotheek'
import { GERUST_BIJ_KNOP, Geruststelling, TweeRoutes, SectieActie } from '@/components/aiyourgym/site/Actie'
import { AanmeldBand } from '@/components/aiyourgym/site/AanmeldBand'
import { PaginaKop, SectieKop, Vragen } from '@/components/aiyourgym/site/bouwstenen'
import { taalAlternates } from '@/lib/aiyourgym/taal/metadata'
import { getSiteTaal } from '@/lib/aiyourgym/taal/server'
import { SCHEMAS_PAGINA } from '@/lib/aiyourgym/taal/woorden/website/trainingsschemas'

// De teksten staan in SCHEMAS_PAGINA (Nederlands uit inhoud/trainingsschemas.ts).
// De coaching in de schermen komt uit de bibliotheek van Club en blijft voorlopig
// Nederlands, ook op de Engelse pagina (zie woorden/website/schemas.ts).

export async function generateMetadata(): Promise<Metadata> {
  const taal = await getSiteTaal()
  const t = SCHEMAS_PAGINA[taal]
  return { title: t.metaTitel, description: t.metaOmschrijving, alternates: taalAlternates('/trainingsschemas', taal) }
}

function Beeld({ sleutel, oefeningen, aantal }: { sleutel: SchemaStapSleutel; oefeningen: readonly VoorbeeldOefening[]; aantal: number }): ReactNode {
  const eerste = oefeningen[0]
  switch (sleutel) {
    case 'intake':
      return <IntakeScherm />
    case 'voorstel':
      return <VoorstelScherm oefeningen={oefeningen} />
    case 'editor':
      return <EditorScherm oefeningen={oefeningen} />
    case 'bibliotheek':
      return <BibliotheekScherm oefeningen={oefeningen} aantal={aantal} />
    case 'eigen':
      return eerste ? <CoachtekstScherm oefening={eerste} /> : null
    case 'ledenapp':
      return (
        <div className="ayg-ss-duo">
          <SchemaToestel oefeningen={oefeningen} gekozen={0} />
          {eerste && <OefeningToestel oefening={eerste} />}
        </div>
      )
    case 'voortgang':
      return <VoortgangToestel />
  }
}

export default async function TrainingsschemasPagina() {
  const t = SCHEMAS_PAGINA[await getSiteTaal()]
  const oefeningen = voorbeeldOefeningen()
  const aantal = aantalMetCoaching()
  return (
    <>
      <PaginaKop label={t.label} titel={t.titel} tekst={t.tekst}>
        <TweeRoutes />
        <Geruststelling aantal={GERUST_BIJ_KNOP} onder />
      </PaginaKop>

      <nav className="ayg-wrap ayg-ss-route" aria-label={t.routeLabel}>
        <ol>
          {SCHEMA_STAPPEN.map((s, i) => (
            <li key={s.sleutel}>
              <a href={`#${s.sleutel}`}>
                <span>{String(i + 1).padStart(2, '0')}</span>
                {t.stappen[s.sleutel].naam}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <section className="ayg-sectie ayg-sectie--krap" aria-labelledby="probeer-titel">
        <div className="ayg-wrap">
          <SectieKop id="probeer-titel" label={t.probeer.label} titel={t.probeer.titel} tekst={t.probeer.tekst} />
          <CoachingDemo oefeningen={oefeningen} />
          <p className="ayg-klein ayg-ruim-boven">{t.probeer.voorbeeld}</p>
        </div>
      </section>

      {SCHEMA_STAPPEN.map(({ sleutel }, i) => {
        const s = t.stappen[sleutel]
        return (
          <section key={sleutel} id={sleutel} className="ayg-sectie ayg-ss-stap" aria-labelledby={`${sleutel}-titel`} data-om={i % 2 === 1 ? '' : undefined}>
            <div className="ayg-wrap ayg-ss-stap-raster">
              <div className="ayg-stapel">
                <p className="ayg-label ayg-label--accent">
                  {String(i + 1).padStart(2, '0')} · {s.naam}
                </p>
                <h2 className="ayg-h2" id={`${sleutel}-titel`}>
                  {s.kop}
                </h2>
                <p className="ayg-lead">{s.tekst}</p>
                <ul className="ayg-vinklijst">
                  {s.punten.map((p) => (
                    <li key={p}>
                      <Check size={16} aria-hidden />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <StapScherm naam={t.schermNaam[sleutel]}>
                <Figuur className="ayg-onthul" label={t.beeldLabel[sleutel]}>
                  <Beeld sleutel={sleutel} oefeningen={oefeningen} aantal={aantal} />
                </Figuur>
              </StapScherm>
            </div>
          </section>
        )
      })}

      <section className="ayg-sectie" aria-labelledby="schemavragen-titel">
        <div className="ayg-wrap ayg-ss-vragen">
          <SectieKop id="schemavragen-titel" label={t.vragenLabel} titel={t.vragenTitel} />
          <Vragen vragen={t.vragen} />
          <SectieActie zin={t.vragenActie} />
        </div>
      </section>

      <AanmeldBand titel={t.band} />
    </>
  )
}
