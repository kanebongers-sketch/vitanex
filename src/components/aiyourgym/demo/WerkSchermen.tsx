import { Users } from 'lucide-react'
import { Venster } from '@/components/aiyourgym/mockups/kaders'
import { dagKort, dagLang, weekdagNaam, weekdagVan } from '@/lib/club/cijfers/tijd'
import type { DemoLes, DemoLidKaart, DemoVandaag, DemoWeek } from '@/lib/aiyourgym/demo/model'

// De schermen van de werkvloer in de demo: Vandaag, het lesrooster en een
// ledenkaart. Getekend uit de echte rijen van de Voorbeeld Gym (zie
// src/lib/aiyourgym/demo), alleen om te bekijken.

const LEAD_STATUS: Record<string, string> = { nieuw: 'Nieuw', contact: 'In contact', proefles: 'Proefles' }
const LID_STATUS: Record<string, string> = { actief: 'Actief', proef: 'Proeflid', gepauzeerd: 'Gepauzeerd', opgezegd: 'Opgezegd', gestopt: 'Gestopt' }

function hoofdletter(t: string): string {
  return t ? t[0].toUpperCase() + t.slice(1) : t
}

function initialen(naam: string): string {
  return naam
    .split(/\s+/)
    .map((d) => d[0] ?? '')
    .join('')
    .replace(/\W/g, '')
    .slice(0, 2)
    .toUpperCase()
}

function Bezetting({ les }: { les: DemoLes }) {
  const deel = les.capaciteit > 0 ? Math.min(les.bezet / les.capaciteit, 1) : 0
  const vol = les.bezet >= les.capaciteit
  return (
    <span className="aygd-bezetting" data-vol={vol ? '' : undefined}>
      <span className="aygm-balk">
        <span style={{ transform: `scaleX(${deel})` }} />
      </span>
      <span>
        {les.bezet}/{les.capaciteit}
        {les.wachtlijst > 0 && ` · wachtlijst ${les.wachtlijst}`}
      </span>
    </span>
  )
}

export function VandaagScherm({ data, vestiging }: { data: DemoVandaag; vestiging: string }) {
  return (
    <Venster actief="Werkvloer">
      <div className="aygm-rooster-kop">
        <div>
          <p className="aygm-boven">{vestiging} · vandaag</p>
          <p className="aygd-dag">{hoofdletter(dagLang(data.dag))}</p>
        </div>
      </div>
      <div className="aygm-tegels">
        <div className="aygm-tegel aygd-tegel--accent">
          <p className="aygm-boven">Bezoeken</p>
          <p className="aygm-getal">{data.binnen}</p>
        </div>
        <div className="aygm-tegel">
          <p className="aygm-boven">Lessen</p>
          <p className="aygm-getal">{data.lessen.length}</p>
        </div>
        <div className="aygm-tegel">
          <p className="aygm-boven">Diensten</p>
          <p className="aygm-getal">{data.diensten.length}</p>
        </div>
        <div className="aygm-tegel">
          <p className="aygm-boven">Op te volgen</p>
          <p className="aygm-getal">{data.leads.length}</p>
        </div>
      </div>
      <div className="aygd-twee">
        <div className="aygm-kaart aygd-blok">
          <p className="aygm-kop">Lessen</p>
          {data.lessen.length === 0 && <p className="aygd-leeg">Geen lessen op deze dag.</p>}
          <div className="aygd-lijst">
            {data.lessen.map((l) => (
              <div key={l.id} className="aygd-les">
                <span className="aygd-tijd">{l.tijd}</span>
                <span className="aygm-rij-tekst">
                  <b>{l.naam}</b>
                  <span>{l.zaal}</span>
                </span>
                <Bezetting les={l} />
              </div>
            ))}
          </div>
        </div>
        <div className="aygd-stapel">
          <div className="aygm-kaart aygd-blok">
            <p className="aygm-kop">Wie werkt er</p>
            {data.diensten.length === 0 && <p className="aygd-leeg">Geen diensten gepland.</p>}
            {data.diensten.map((d) => (
              <div key={`${d.naam}-${d.tijd}`} className="aygm-wie aygd-regel">
                <span className="aygm-avatar">{initialen(d.naam)}</span>
                <span className="aygm-rij-tekst">
                  <b>{d.naam}</b>
                  <span>{d.tijd}</span>
                </span>
              </div>
            ))}
          </div>
          <div className="aygm-kaart aygd-blok">
            <p className="aygm-kop">Leads opvolgen</p>
            {data.leads.map((l) => (
              <div key={l.naam} className="aygd-regel aygd-regel--uit">
                <span className="aygm-rij-tekst">
                  <b>{l.naam}</b>
                  <span>Via {l.bron}</span>
                </span>
                <span className="aygm-chip">{LEAD_STATUS[l.status] ?? l.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Venster>
  )
}

export function RoosterWeekScherm({ week, vestiging }: { week: DemoWeek; vestiging: string }) {
  return (
    <Venster actief="Planning">
      <div className="aygm-rooster-kop">
        <div>
          <p className="aygm-boven">Groepslessen · week van {dagKort(week.maandag)}</p>
          <p className="aygm-kop">Lesrooster {vestiging}</p>
        </div>
      </div>
      <div className="aygd-week">
        {week.dagen.map((d) => (
          <div key={d.dag} className="aygd-weekdag">
            <p className="aygd-weekdag-kop">
              <span>{weekdagNaam(weekdagVan(d.dag)).slice(0, 2)}</span> {dagKort(d.dag)}
            </p>
            {d.lessen.length === 0 && <p className="aygd-leeg">Geen lessen</p>}
            {d.lessen.map((l) => (
              <div key={l.id} className="aygm-les aygd-weekles" data-vol={l.bezet >= l.capaciteit ? '' : undefined}>
                <b>{l.naam}</b>
                <span>
                  {l.tijd} · {l.bezet}/{l.capaciteit}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </Venster>
  )
}

export function LidScherm({ kaart }: { kaart: DemoLidKaart }) {
  const feiten = [
    { label: 'Bezoeken 30 dagen', waarde: String(kaart.bezoeken30) },
    { label: 'Weken op rij', waarde: String(kaart.wekenOpRij) },
    { label: 'Laatste bezoek', waarde: kaart.laatsteBezoek ? dagKort(kaart.laatsteBezoek) : 'Nog niet' },
    { label: 'Lid sinds', waarde: kaart.lidSinds ? dagKort(kaart.lidSinds) + ' ' + kaart.lidSinds.slice(0, 4) : 'Onbekend' },
  ]
  return (
    <Venster actief="Leden">
      <div className="aygd-lid-kop">
        <span className="aygd-lid-avatar">{initialen(kaart.naam)}</span>
        <div className="aygd-stapel">
          <p className="aygd-dag">{kaart.naam}</p>
          <p className="aygd-chips">
            <span className="aygm-chip aygm-chip--ok">{LID_STATUS[kaart.status] ?? kaart.status}</span>
            <span className="aygm-chip">{kaart.abonnement}</span>
            <span className="aygm-chip">
              <Users size={11} aria-hidden /> {kaart.vestiging}
            </span>
          </p>
        </div>
      </div>
      <div className="aygm-tegels">
        {feiten.map((f) => (
          <div key={f.label} className="aygm-tegel">
            <p className="aygm-boven">{f.label}</p>
            <p className="aygm-getal aygd-getal--klein">{f.waarde}</p>
          </div>
        ))}
      </div>
      <div className="aygd-twee">
        <div className="aygm-kaart aygd-blok">
          <p className="aygm-boven">Trainingsschema</p>
          <p className="aygm-kop">{kaart.schema ?? 'Nog geen schema'}</p>
        </div>
        <div className="aygm-kaart aygd-blok">
          <p className="aygm-boven">Laatste meting{kaart.meting ? ` · ${dagKort(kaart.meting.datum)}` : ''}</p>
          {kaart.meting ? (
            <p className="aygm-kop">
              {kaart.meting.gewicht !== null && `${kaart.meting.gewicht.toLocaleString('nl-NL')} kg`}
              {kaart.meting.buik !== null && ` · buik ${kaart.meting.buik.toLocaleString('nl-NL')} cm`}
            </p>
          ) : (
            <p className="aygm-kop">Nog geen meting</p>
          )}
        </div>
      </div>
    </Venster>
  )
}
