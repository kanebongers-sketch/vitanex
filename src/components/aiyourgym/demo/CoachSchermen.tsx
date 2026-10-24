import { Trophy } from 'lucide-react'
import { QrBeeld } from '@/components/aiyourgym/mockups/AppSchermen'
import { Toestel, Venster } from '@/components/aiyourgym/mockups/kaders'
import { OefTegel } from '@/components/aiyourgym/mockups/OefTegel'
import { Oefenbeeld } from '@/components/aiyourgym/mockups/Oefenbeeld'
import { formatGetal } from '@/lib/aiyourgym/taal/formaat'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { DEMO_SCHERM } from '@/lib/aiyourgym/taal/woorden/website/demo'
import type { Coaching } from '@/lib/club/training/coaching/typen'
import type { DemoApp, DemoCijfers, DemoOefening, DemoSchema } from '@/lib/aiyourgym/demo/model'
import { dagKort, maandAlleen, maandJaar } from './datums'

// De coaching-, cijfer- en app-schermen van de demo. Coaching komt uit de
// oefenbibliotheek van Club zelf (coachingVoor op de server); de uitgelichte
// oefening is ons eigen 3D-figuur, in lijsten staat een tegel met beginletters.
// Labels in de taal van de pagina (DEMO_SCHERM); de gegevens en de coaching zijn
// die van de Voorbeeld Gym (Nederlands). Groepen en tabbladen geven we met hun
// Nederlandse naam aan de kaders, die vertalen ze zelf.

/** "60 sec rust" uit het model in de taal van de pagina. */
function rustIn(rust: string, taal: Taal): string {
  return rust.replace(DEMO_SCHERM.nl.secRust, DEMO_SCHERM[taal].secRust)
}

interface SchemaProps {
  schema: DemoSchema
  uitgelicht: DemoOefening | null
  coaching: Coaching | null
  taal: Taal
}

export function SchemaScherm({ schema, uitgelicht, coaching, taal }: SchemaProps) {
  const t = DEMO_SCHERM[taal]
  return (
    <Venster actief="Coaching">
      <div className="aygm-rooster-kop">
        <div>
          <p className="aygm-boven">
            {t.trainingsschema}
            {schema.weken ? t.weken(schema.weken) : ''}
            {schema.doel ? t.doel(schema.doel) : ''}
          </p>
          <p className="aygm-kop">{schema.naam}</p>
        </div>
      </div>
      <div className="aygd-schema">
        <div className="aygd-stapel">
          {schema.dagen.map((d) => (
            <div key={d.titel} className="aygm-kaart aygd-blok">
              <p className="aygm-boven">{d.titel}</p>
              <div className="aygd-lijst">
                {d.oefeningen.map((o) => (
                  <div key={`${d.titel}-${o.naam}`} className="aygd-oef" data-uit={o.naam === uitgelicht?.naam ? '' : undefined}>
                    <OefTegel naam={o.naam} maat={40} />
                    <span className="aygm-rij-tekst">
                      <b>{o.naam}</b>
                      <span>
                        {o.dosis}
                        {o.rust ? ` · ${rustIn(o.rust, taal)}` : ''}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        {uitgelicht && coaching && (
          <div className="aygm-oefening aygd-coaching">
            <div className="aygm-beeld">
              <Oefenbeeld naam={uitgelicht.naam} label={t.alsBeeld(uitgelicht.naam)} className="ayg-3d--vul" />
            </div>
            <div className="aygm-coaching">
              <p className="aygm-coaching-titel">{uitgelicht.naam}</p>
              <ol className="aygm-kernpunten">
                {coaching.kernpunten.slice(0, 4).map((k) => (
                  <li key={k.punt}>
                    <div>
                      <b>{k.punt}</b>
                      <span>{k.uitleg}</span>
                    </div>
                  </li>
                ))}
              </ol>
              {coaching.fouten[0] && (
                <div className="aygd-fout">
                  <p className="aygm-boven">{t.veelgemaakt}</p>
                  <b>{coaching.fouten[0].fout}</b>
                  <span>{coaching.fouten[0].beter}</span>
                </div>
              )}
              <div className="aygm-feiten">
                <div>
                  <p className="aygm-boven">{t.ademhaling}</p>
                  <span>{coaching.ademhaling}</span>
                </div>
                <div>
                  <p className="aygm-boven">{t.tempo}</p>
                  <span>{coaching.tempo}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Venster>
  )
}

interface CijfersProps {
  cijfers: DemoCijfers
  peildag: string
  taal: Taal
}

export function CijfersMaandScherm({ cijfers, peildag, taal }: CijfersProps) {
  const t = DEMO_SCHERM[taal]
  const bronLabel: Record<string, string> = Object.fromEntries(Object.keys(t.bron).map((k) => [DEMO_SCHERM.nl.bron[k as keyof typeof t.bron], t.bron[k as keyof typeof t.bron]]))
  const tegels = [
    { label: t.bezoeken, waarde: formatGetal(cijfers.bezoeken, taal) },
    { label: t.actieveLeden, waarde: formatGetal(cijfers.actieveLeden, taal) },
    { label: t.bezetting, waarde: cijfers.bezettingPct === null ? t.geenLessen : `${cijfers.bezettingPct}%` },
    { label: t.nietGekomen, waarde: formatGetal(cijfers.noShows, taal) },
  ]
  const hoogste = Math.max(1, ...cijfers.perDag.map((d) => d.aantal))
  const totaalBron = cijfers.perBron.reduce((s, b) => s + b.aantal, 0)
  return (
    <Venster actief="Beheer">
      <div className="aygm-rooster-kop">
        <div>
          <p className="aygm-boven">{t.cijfersVan(maandAlleen(cijfers.maand, taal), dagKort(peildag, taal))}</p>
          <p className="aygm-kop">{maandJaar(cijfers.maand, taal)}</p>
        </div>
        <span className="aygm-chip">{t.nieuweLeden(cijfers.nieuweLeden)}</span>
      </div>
      <div className="aygm-tegels">
        {tegels.map((tegel) => (
          <div key={tegel.label} className="aygm-tegel">
            <p className="aygm-boven">{tegel.label}</p>
            <p className="aygm-getal">{tegel.waarde}</p>
          </div>
        ))}
      </div>
      <div className="aygd-twee aygd-twee--breed">
        <div className="aygm-kaart aygd-blok">
          <p className="aygm-boven">{t.perDag(cijfers.perDag.length)}</p>
          <div className="aygd-staven">
            {cijfers.perDag.map((d, i) => (
              <span key={d.dag} title={`${dagKort(d.dag, taal)}: ${d.aantal}`} data-nu={i === cijfers.perDag.length - 1 ? '' : undefined}>
                <i style={{ transform: `scaleY(${Math.max(d.aantal / hoogste, 0.02)})` }} />
              </span>
            ))}
          </div>
        </div>
        <div className="aygm-kaart aygd-blok">
          <p className="aygm-boven">{t.zoInchecken}</p>
          <div className="aygd-bronnen">
            {cijfers.perBron.map((b) => (
              <div key={b.bron}>
                <span className="aygm-macro-tekst">
                  <span>{bronLabel[b.bron] ?? b.bron}</span>
                  <b>{totaalBron ? Math.round((b.aantal / totaalBron) * 100) : 0}%</b>
                </span>
                <span className="aygm-balk">
                  <span style={{ transform: `scaleX(${totaalBron ? b.aantal / totaalBron : 0})` }} />
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Venster>
  )
}

export function AppHomeDemo({ app, taal }: { app: DemoApp; taal: Taal }) {
  const t = DEMO_SCHERM[taal]
  return (
    <Toestel tab="Home">
      <p className="aygm-hallo">{t.hoi(app.voornaam)}</p>
      {app.volgendeLes ? (
        <div className="aygm-volgende">
          <span className="aygm-boven">{t.volgendeLes}</span>
          <b>{app.volgendeLes.naam}</b>
          <span>
            {app.volgendeLes.wanneer}
            {app.volgendeLes.zaal ? ` · ${app.volgendeLes.zaal}` : ''}
          </span>
        </div>
      ) : (
        <div className="aygm-kaart">
          <p className="aygm-boven">{t.geenLes}</p>
        </div>
      )}
      <div className="aygm-duo">
        <div className="aygm-kaart">
          <p className="aygm-boven">{t.dezeMaand}</p>
          <p className="aygm-getal">{app.bezoekenMaand}</p>
          <p className="aygm-boven">{t.bezoekenKlein}</p>
        </div>
        <div className="aygm-kaart">
          <p className="aygm-boven">{t.opRij}</p>
          <p className="aygm-getal">{app.wekenOpRij}</p>
          <p className="aygm-boven">{t.wekenKlein}</p>
        </div>
      </div>
      <div className="aygm-kaart aygm-qr">
        <QrBeeld />
        <div>
          <p className="aygm-kop">{t.inchecken}</p>
          <p className="aygm-boven">{t.laatZien}</p>
        </div>
      </div>
      {app.challenge && (
        <div className="aygm-kaart">
          <div className="aygm-rij-tekst" style={{ marginBottom: 8 }}>
            <b>
              <Trophy size={13} aria-hidden /> {app.challenge.titel}
            </b>
            <span>{t.vanDoel(app.challenge.stand, app.challenge.doel)}</span>
          </div>
          <div className="aygm-balk">
            <span style={{ transform: `scaleX(${app.challenge.doel ? app.challenge.stand / app.challenge.doel : 0})` }} />
          </div>
        </div>
      )}
    </Toestel>
  )
}

export function AppSchemaDemo({ schema, taal }: { schema: DemoSchema; taal: Taal }) {
  const t = DEMO_SCHERM[taal]
  const dag = schema.dagen[0]
  return (
    <Toestel tab="Schema">
      <p className="aygm-hallo">{t.schema}</p>
      <div className="aygm-dagen">
        {schema.dagen.map((d, i) => (
          <span key={d.titel} data-actief={i === 0 ? '' : undefined}>
            <b>{t.dag(d.titel.replace(/^.*\s(\S+)$/, '$1'))}</b>
          </span>
        ))}
      </div>
      <div className="aygm-lijst">
        {dag?.oefeningen.map((o) => (
          <div key={o.naam} className="aygm-oef">
            <OefTegel naam={o.naam} maat={52} />
            <div className="aygm-rij-tekst">
              <b>{o.naam}</b>
              <span>{o.dosis}</span>
            </div>
            <span className="aygm-vink" />
          </div>
        ))}
      </div>
    </Toestel>
  )
}

export function AppVoedingDemo({ voeding, taal }: { voeding: NonNullable<DemoApp['voeding']>; taal: Taal }) {
  const t = DEMO_SCHERM[taal]
  const totaal = voeding.eiwit * 4 + voeding.kh * 4 + voeding.vet * 9
  const macros = [
    { naam: t.eiwit, gram: voeding.eiwit, kcal: voeding.eiwit * 4 },
    { naam: t.koolhydraten, gram: voeding.kh, kcal: voeding.kh * 4 },
    { naam: t.vet, gram: voeding.vet, kcal: voeding.vet * 9 },
  ]
  return (
    <Toestel tab="Voeding">
      <p className="aygm-hallo">{t.voeding}</p>
      <div className="aygm-kaart aygm-voeding">
        <div>
          <p className="aygm-boven">{voeding.doel ? t.voedingDoel(voeding.doel) : t.jePlan}</p>
          <p className="aygm-getal">{formatGetal(voeding.kcal, taal)}</p>
          <p className="aygm-boven">{t.kcalPerDag}</p>
        </div>
        <div className="aygm-macros">
          {macros.map((m) => (
            <div key={m.naam}>
              <span className="aygm-macro-tekst">
                <span>{m.naam}</span>
                <b>{m.gram} g</b>
              </span>
              <span className="aygm-balk">
                <span style={{ transform: `scaleX(${totaal ? m.kcal / totaal : 0})` }} />
              </span>
            </div>
          ))}
        </div>
      </div>
    </Toestel>
  )
}
