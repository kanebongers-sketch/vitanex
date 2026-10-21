import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { Check } from 'lucide-react'
import '@/components/aiyourgym/schemas/schemas.css'
import { SCHEMA_STAPPEN, type SchemaStapSleutel } from '@/components/aiyourgym/inhoud/trainingsschemas'
import { aantalMetCoaching, voorbeeldOefeningen, type VoorbeeldOefening } from '@/components/aiyourgym/inhoud/voorbeeldschema'
import { Figuur } from '@/components/aiyourgym/mockups/kaders'
import { CoachingDemo } from '@/components/aiyourgym/schemas/CoachingDemo'
import { SchemaToestel } from '@/components/aiyourgym/schemas/SchemaToestel'
import { EditorScherm, IntakeScherm, VoorstelScherm } from '@/components/aiyourgym/schemas/SchermenTrainer'
import { BibliotheekScherm, CoachtekstScherm, OefeningToestel, VoortgangToestel } from '@/components/aiyourgym/schemas/SchermenBibliotheek'
import { TweeRoutes, SectieActie } from '@/components/aiyourgym/site/Actie'
import { AanmeldBand } from '@/components/aiyourgym/site/AanmeldBand'
import { PaginaKop, SectieKop, Vragen } from '@/components/aiyourgym/site/bouwstenen'

export const metadata: Metadata = {
  title: 'Trainingsschema’s',
  description:
    'Trainingsschema’s in AI Your Gym: van intake en schemavoorstel tot editor, een bibliotheek met coaching per oefening, eigen coachteksten, het schema in de ledenapp en voortgang.',
}

const BEELD_LABEL: Record<SchemaStapSleutel, string> = {
  intake: 'Het intakescherm: doelen, niveau, dagen en minuten, metingen en drie gezondheidsvragen met toestemming',
  voorstel: 'Het schemavoorstel: full body in drie dagen, een waarschuwing over de gezondheidsvragen en de oefeningen van dag A',
  editor: 'De schema-editor: dag A met per oefening sets, herhalingen, gewicht, rust en notitie, en knoppen voor opslaan, printen en sjabloon',
  bibliotheek: 'De oefenbibliotheek met zoeken, filters en oefeningen met het aantal kernpunten',
  eigen: 'De coaching van een oefening aanpassen: eigen kernpunten, opslaan of terug naar de standaard',
  ledenapp: 'De ledenapp: het schema van dag A en een geopende oefening met het 3D-beeld en de kernpunten',
  voortgang: 'De voortgang in de ledenapp: weken op rij, trainingen per week, gewicht in een lijn en de volgende mijlpaal',
}

const VRAGEN = [
  {
    vraag: 'Is het schemavoorstel AI?',
    antwoord:
      'Nee. Het voorstel volgt vaste vakregels: welke indeling bij hoeveel dagen past, welke sets en herhalingen bij welk doel, en welke oefeningen weg moeten bij een blessure. Daardoor is het voorspelbaar en kost het niets extra. De trainer past het daarna aan.',
  },
  {
    vraag: 'Kan ik eigen oefeningen toevoegen?',
    antwoord: 'Ja. Je voegt eigen oefeningen toe aan de bibliotheek van je sportschool en schrijft er zelf de coaching bij, met dezelfde opbouw als de standaard.',
  },
  {
    vraag: 'Moeten mijn trainers de standaardteksten gebruiken?',
    antwoord: 'Nee. De standaard is een start. Je herschrijft kernpunten, stappen en fouten in de taal van je eigen trainers, en kunt altijd terug naar de standaardtekst.',
  },
  {
    vraag: 'En leden zonder smartphone?',
    antwoord: 'Elk schema is te printen. Het lid traint dan met papier, de trainer houdt het schema en de metingen bij in AI Your Gym.',
  },
  {
    vraag: 'Wat ziet een lid van de intake?',
    antwoord: 'Het eigen schema met coaching en de eigen lichaamsmaten en trainingen. Gezondheidsgegevens, bloeddruk en notities van de trainer blijven bij het team.',
  },
] as const

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

export default function TrainingsschemasPagina() {
  const oefeningen = voorbeeldOefeningen()
  const aantal = aantalMetCoaching()
  return (
    <>
      <PaginaKop
        label="Trainingsschema’s"
        titel={<>Schema&rsquo;s zoals een trainer ze geeft.</>}
        tekst="Van de intake tot de voortgang: een route die je trainers kennen van de vloer. Met coaching bij elke oefening, voor het lid altijd bij de hand in de app."
      >
        <TweeRoutes />
      </PaginaKop>

      <nav className="ayg-wrap ayg-ss-route" aria-label="De route van een schema">
        <ol>
          {SCHEMA_STAPPEN.map((s, i) => (
            <li key={s.sleutel}>
              <a href={`#${s.sleutel}`}>
                <span>{String(i + 1).padStart(2, '0')}</span>
                {s.naam}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <section className="ayg-sectie ayg-sectie--krap" aria-labelledby="probeer-titel">
        <div className="ayg-wrap">
          <SectieKop
            id="probeer-titel"
            label="Probeer het zelf"
            titel="Een oefening zoals je lid hem ziet."
            tekst="Kies een oefening, speel de beweging van het 3D-figuur af of zet hem stil op begin of eind. Dit is de echte tekst uit de bibliotheek."
          />
          <CoachingDemo oefeningen={oefeningen} />
          <p className="ayg-klein ayg-ruim-boven">Schermvoorbeeld met voorbeeldgegevens</p>
        </div>
      </section>

      {SCHEMA_STAPPEN.map((s, i) => (
        <section key={s.sleutel} id={s.sleutel} className="ayg-sectie ayg-ss-stap" aria-labelledby={`${s.sleutel}-titel`} data-om={i % 2 === 1 ? '' : undefined}>
          <div className="ayg-wrap ayg-ss-stap-raster">
            <div className="ayg-stapel">
              <p className="ayg-label ayg-label--accent">
                {String(i + 1).padStart(2, '0')} · {s.naam}
              </p>
              <h2 className="ayg-h2" id={`${s.sleutel}-titel`}>
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
            <Figuur className="ayg-onthul" label={BEELD_LABEL[s.sleutel]}>
              <Beeld sleutel={s.sleutel} oefeningen={oefeningen} aantal={aantal} />
            </Figuur>
          </div>
        </section>
      ))}

      <section className="ayg-sectie" aria-labelledby="schemavragen-titel">
        <div className="ayg-wrap ayg-ss-vragen">
          <SectieKop id="schemavragen-titel" label="Vragen" titel="Wat trainers vaak vragen." />
          <Vragen vragen={VRAGEN} />
          <SectieActie zin="Laat je trainers het zelf proberen." />
        </div>
      </section>

      <AanmeldBand titel="Geef je leden een trainer in hun broekzak." />
    </>
  )
}
