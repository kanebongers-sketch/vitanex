import { Play, Trophy } from 'lucide-react'
import { QrBeeld } from '@/components/aiyourgym/mockups/AppSchermen'
import { Toestel, Venster } from '@/components/aiyourgym/mockups/kaders'
import { dagKort } from '@/lib/club/cijfers/tijd'
import type { Coaching } from '@/lib/club/training/coaching/typen'
import type { DemoApp, DemoCijfers, DemoOefening, DemoSchema } from '@/lib/aiyourgym/demo/model'

// De coaching-, cijfer- en app-schermen van de demo. Coaching komt uit de
// oefenbibliotheek van Club zelf (coachingVoor op de server).

const MAANDEN = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december']

function maandNaam(maandBegin: string): string {
  const m = MAANDEN[Number(maandBegin.slice(5, 7)) - 1] ?? ''
  return `${m[0]?.toUpperCase() ?? ''}${m.slice(1)} ${maandBegin.slice(0, 4)}`
}

interface SchemaProps {
  schema: DemoSchema
  uitgelicht: DemoOefening | null
  coaching: Coaching | null
}

export function SchemaScherm({ schema, uitgelicht, coaching }: SchemaProps) {
  return (
    <Venster actief="Coaching">
      <div className="aygm-rooster-kop">
        <div>
          <p className="aygm-boven">
            Trainingsschema{schema.weken ? ` · ${schema.weken} weken` : ''}
            {schema.doel ? ` · doel ${schema.doel}` : ''}
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
                    {o.beeldStart ? <img src={o.beeldStart} alt="" width={40} height={40} loading="lazy" decoding="async" /> : <span className="aygd-oef-leeg" />}
                    <span className="aygm-rij-tekst">
                      <b>{o.naam}</b>
                      <span>
                        {o.dosis}
                        {o.rust ? ` · ${o.rust}` : ''}
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
            {uitgelicht.beeldStart && (
              <div className="aygm-beeld">
                <img src={uitgelicht.beeldStart} alt="" width={512} height={512} loading="lazy" decoding="async" />
                {uitgelicht.beeldEind && <img className="aygm-beeld-eind" src={uitgelicht.beeldEind} alt="" width={512} height={512} loading="lazy" decoding="async" />}
                <div className="aygm-speler">
                  <i>
                    <Play size={12} aria-hidden />
                  </i>
                  <span>Begin</span>
                  <span className="aygm-balk">
                    <span />
                  </span>
                  <span>Eind</span>
                </div>
              </div>
            )}
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
                  <p className="aygm-boven">Veelgemaakte fout</p>
                  <b>{coaching.fouten[0].fout}</b>
                  <span>{coaching.fouten[0].beter}</span>
                </div>
              )}
              <div className="aygm-feiten">
                <div>
                  <p className="aygm-boven">Ademhaling</p>
                  <span>{coaching.ademhaling}</span>
                </div>
                <div>
                  <p className="aygm-boven">Tempo</p>
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

export function CijfersMaandScherm({ cijfers, peildag }: { cijfers: DemoCijfers; peildag: string }) {
  const tegels = [
    { label: 'Bezoeken', waarde: cijfers.bezoeken.toLocaleString('nl-NL') },
    { label: 'Actieve leden', waarde: cijfers.actieveLeden.toLocaleString('nl-NL') },
    { label: 'Bezetting lessen', waarde: cijfers.bezettingPct === null ? 'Geen lessen' : `${cijfers.bezettingPct}%` },
    { label: 'Niet gekomen', waarde: cijfers.noShows.toLocaleString('nl-NL') },
  ]
  const hoogste = Math.max(1, ...cijfers.perDag.map((d) => d.aantal))
  const totaalBron = cijfers.perBron.reduce((s, b) => s + b.aantal, 0)
  return (
    <Venster actief="Beheer">
      <div className="aygm-rooster-kop">
        <div>
          <p className="aygm-boven">Cijfers · 1 {MAANDEN[Number(cijfers.maand.slice(5, 7)) - 1]} tot en met {dagKort(peildag)}</p>
          <p className="aygm-kop">{maandNaam(cijfers.maand)}</p>
        </div>
        <span className="aygm-chip">{cijfers.nieuweLeden} nieuwe leden</span>
      </div>
      <div className="aygm-tegels">
        {tegels.map((t) => (
          <div key={t.label} className="aygm-tegel">
            <p className="aygm-boven">{t.label}</p>
            <p className="aygm-getal">{t.waarde}</p>
          </div>
        ))}
      </div>
      <div className="aygd-twee aygd-twee--breed">
        <div className="aygm-kaart aygd-blok">
          <p className="aygm-boven">Bezoeken per dag · laatste {cijfers.perDag.length} dagen</p>
          <div className="aygd-staven">
            {cijfers.perDag.map((d, i) => (
              <span key={d.dag} title={`${dagKort(d.dag)}: ${d.aantal}`} data-nu={i === cijfers.perDag.length - 1 ? '' : undefined}>
                <i style={{ transform: `scaleY(${Math.max(d.aantal / hoogste, 0.02)})` }} />
              </span>
            ))}
          </div>
        </div>
        <div className="aygm-kaart aygd-blok">
          <p className="aygm-boven">Zo checkten leden in</p>
          <div className="aygd-bronnen">
            {cijfers.perBron.map((b) => (
              <div key={b.bron}>
                <span className="aygm-macro-tekst">
                  <span>{b.bron}</span>
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

export function AppHomeDemo({ app }: { app: DemoApp }) {
  return (
    <Toestel tab="Home">
      <p className="aygm-hallo">Hoi {app.voornaam}</p>
      {app.volgendeLes ? (
        <div className="aygm-volgende">
          <span className="aygm-boven">Je volgende les</span>
          <b>{app.volgendeLes.naam}</b>
          <span>
            {app.volgendeLes.wanneer}
            {app.volgendeLes.zaal ? ` · ${app.volgendeLes.zaal}` : ''}
          </span>
        </div>
      ) : (
        <div className="aygm-kaart">
          <p className="aygm-boven">Nog geen les gereserveerd</p>
        </div>
      )}
      <div className="aygm-duo">
        <div className="aygm-kaart">
          <p className="aygm-boven">Deze maand</p>
          <p className="aygm-getal">{app.bezoekenMaand}</p>
          <p className="aygm-boven">bezoeken</p>
        </div>
        <div className="aygm-kaart">
          <p className="aygm-boven">Op rij</p>
          <p className="aygm-getal">{app.wekenOpRij}</p>
          <p className="aygm-boven">weken</p>
        </div>
      </div>
      <div className="aygm-kaart aygm-qr">
        <QrBeeld />
        <div>
          <p className="aygm-kop">Inchecken</p>
          <p className="aygm-boven">Laat je telefoon zien</p>
        </div>
      </div>
      {app.challenge && (
        <div className="aygm-kaart">
          <div className="aygm-rij-tekst" style={{ marginBottom: 8 }}>
            <b>
              <Trophy size={13} aria-hidden /> {app.challenge.titel}
            </b>
            <span>
              {app.challenge.stand} van {app.challenge.doel}
            </span>
          </div>
          <div className="aygm-balk">
            <span style={{ transform: `scaleX(${app.challenge.doel ? app.challenge.stand / app.challenge.doel : 0})` }} />
          </div>
        </div>
      )}
    </Toestel>
  )
}

export function AppSchemaDemo({ schema }: { schema: DemoSchema }) {
  const dag = schema.dagen[0]
  return (
    <Toestel tab="Schema">
      <p className="aygm-hallo">Schema</p>
      <div className="aygm-dagen">
        {schema.dagen.map((d, i) => (
          <span key={d.titel} data-actief={i === 0 ? '' : undefined}>
            <b>{d.titel.replace(/^.*\s(\S+)$/, 'Dag $1')}</b>
          </span>
        ))}
      </div>
      <div className="aygm-lijst">
        {dag?.oefeningen.map((o) => (
          <div key={o.naam} className="aygm-oef">
            {o.beeldStart ? <img src={o.beeldStart} alt="" width={52} height={52} loading="lazy" decoding="async" /> : <span className="aygd-oef-leeg" />}
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

export function AppVoedingDemo({ voeding }: { voeding: NonNullable<DemoApp['voeding']> }) {
  const totaal = voeding.eiwit * 4 + voeding.kh * 4 + voeding.vet * 9
  const macros = [
    { naam: 'Eiwit', gram: voeding.eiwit, kcal: voeding.eiwit * 4 },
    { naam: 'Koolhydraten', gram: voeding.kh, kcal: voeding.kh * 4 },
    { naam: 'Vet', gram: voeding.vet, kcal: voeding.vet * 9 },
  ]
  return (
    <Toestel tab="Voeding">
      <p className="aygm-hallo">Voeding</p>
      <div className="aygm-kaart aygm-voeding">
        <div>
          <p className="aygm-boven">{voeding.doel ? `Doel · ${voeding.doel}` : 'Je plan'}</p>
          <p className="aygm-getal">{voeding.kcal.toLocaleString('nl-NL')}</p>
          <p className="aygm-boven">kcal per dag</p>
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
