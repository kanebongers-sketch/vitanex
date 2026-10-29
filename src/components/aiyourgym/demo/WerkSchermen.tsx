import { Users } from 'lucide-react'
import { Avatar } from '@/components/aiyourgym/mockups/Avatar'
import { Venster } from '@/components/aiyourgym/mockups/kaders'
import { formatGetal } from '@/lib/aiyourgym/taal/formaat'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { DEMO_SCHERM } from '@/lib/aiyourgym/taal/woorden/website/demo'
import type { DemoLes, DemoLidKaart, DemoVandaag, DemoWeek } from '@/lib/aiyourgym/demo/model'
import { dagKort, dagLang, hoofdletter, weekdag } from './datums'

// De schermen van de werkvloer in de demo: Vandaag, het lesrooster en een
// ledenkaart. Getekend uit de echte rijen van de demo-sportschool (zie
// src/lib/aiyourgym/demo), alleen om te bekijken. De labels in de taal van de
// pagina (DEMO_SCHERM); de gegevens zelf blijven die van de demo-sportschool (op de website Kernhal).

/** De paar teksten die het model zelf in het Nederlands maakt (model.ts), in de taal van de pagina. */
function dienstNaam(naam: string, taal: Taal): string {
  return naam === DEMO_SCHERM.nl.openDienst ? DEMO_SCHERM[taal].openDienst : naam
}

function dienstTijd(tijd: string, taal: Taal): string {
  return tijd.replace(DEMO_SCHERM.nl.tot, DEMO_SCHERM[taal].tot)
}

function Bezetting({ les, taal }: { les: DemoLes; taal: Taal }) {
  const deel = les.capaciteit > 0 ? Math.min(les.bezet / les.capaciteit, 1) : 0
  const vol = les.bezet >= les.capaciteit
  return (
    <span className="aygd-bezetting" data-vol={vol ? '' : undefined}>
      <span className="aygm-balk">
        <span style={{ transform: `scaleX(${deel})` }} />
      </span>
      <span>
        {les.bezet}/{les.capaciteit}
        {les.wachtlijst > 0 && DEMO_SCHERM[taal].wachtlijst(les.wachtlijst)}
      </span>
    </span>
  )
}

interface VandaagProps {
  data: DemoVandaag
  vestiging: string
  taal: Taal
}

export function VandaagScherm({ data, vestiging, taal }: VandaagProps) {
  const t = DEMO_SCHERM[taal]
  const leadStatus: Record<string, string> = t.leadStatus
  return (
    <Venster actief="Werkvloer">
      <div className="aygm-rooster-kop">
        <div>
          <p className="aygm-boven">
            {vestiging} · {t.vandaag}
          </p>
          <p className="aygd-dag">{hoofdletter(dagLang(data.dag, taal))}</p>
        </div>
      </div>
      <div className="aygm-tegels">
        <div className="aygm-tegel aygd-tegel--accent">
          <p className="aygm-boven">{t.bezoeken}</p>
          <p className="aygm-getal">{data.binnen}</p>
        </div>
        <div className="aygm-tegel">
          <p className="aygm-boven">{t.lessen}</p>
          <p className="aygm-getal">{data.lessen.length}</p>
        </div>
        <div className="aygm-tegel">
          <p className="aygm-boven">{t.diensten}</p>
          <p className="aygm-getal">{data.diensten.length}</p>
        </div>
        <div className="aygm-tegel">
          <p className="aygm-boven">{t.opTeVolgen}</p>
          <p className="aygm-getal">{data.leads.length}</p>
        </div>
      </div>
      <div className="aygd-twee">
        <div className="aygm-kaart aygd-blok">
          <p className="aygm-kop">{t.lessen}</p>
          {data.lessen.length === 0 && <p className="aygd-leeg">{t.geenLessenDag}</p>}
          <div className="aygd-lijst">
            {data.lessen.map((l) => (
              <div key={l.id} className="aygd-les">
                <span className="aygd-tijd">{l.tijd}</span>
                <span className="aygm-rij-tekst">
                  <b>{l.naam}</b>
                  <span>{l.zaal}</span>
                </span>
                <Bezetting les={l} taal={taal} />
              </div>
            ))}
          </div>
        </div>
        <div className="aygd-stapel">
          <div className="aygm-kaart aygd-blok">
            <p className="aygm-kop">{t.wieWerkt}</p>
            {data.diensten.length === 0 && <p className="aygd-leeg">{t.geenDiensten}</p>}
            {data.diensten.map((d) => (
              <div key={`${d.naam}-${d.tijd}`} className="aygm-wie aygd-regel">
                <Avatar naam={dienstNaam(d.naam, taal)} maat={26} className="aygm-avatar" />
                <span className="aygm-rij-tekst">
                  <b>{dienstNaam(d.naam, taal)}</b>
                  <span>{dienstTijd(d.tijd, taal)}</span>
                </span>
              </div>
            ))}
          </div>
          <div className="aygm-kaart aygd-blok">
            <p className="aygm-kop">{t.leadsOpvolgen}</p>
            {data.leads.map((l) => (
              <div key={l.naam} className="aygd-regel aygd-regel--uit">
                <span className="aygm-rij-tekst">
                  <b>{l.naam}</b>
                  <span>{t.via(l.bron)}</span>
                </span>
                <span className="aygm-chip">{leadStatus[l.status] ?? l.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Venster>
  )
}

interface RoosterProps {
  week: DemoWeek
  vestiging: string
  taal: Taal
}

export function RoosterWeekScherm({ week, vestiging, taal }: RoosterProps) {
  const t = DEMO_SCHERM[taal]
  return (
    <Venster actief="Planning">
      <div className="aygm-rooster-kop">
        <div>
          <p className="aygm-boven">{t.weekVan(dagKort(week.maandag, taal))}</p>
          <p className="aygm-kop">{t.lesrooster(vestiging)}</p>
        </div>
      </div>
      <div className="aygd-week">
        {week.dagen.map((d) => (
          <div key={d.dag} className="aygd-weekdag">
            <p className="aygd-weekdag-kop">
              <span>{weekdag(d.dag, taal).slice(0, 2)}</span> {dagKort(d.dag, taal)}
            </p>
            {d.lessen.length === 0 && <p className="aygd-leeg">{t.geenLessen}</p>}
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

export function LidScherm({ kaart, taal }: { kaart: DemoLidKaart; taal: Taal }) {
  const t = DEMO_SCHERM[taal]
  const lidStatus: Record<string, string> = t.lidStatus
  const feiten = [
    { label: t.bezoeken30, waarde: String(kaart.bezoeken30) },
    { label: t.wekenOpRij, waarde: String(kaart.wekenOpRij) },
    { label: t.laatsteBezoek, waarde: kaart.laatsteBezoek ? dagKort(kaart.laatsteBezoek, taal) : t.nogNiet },
    { label: t.lidSinds, waarde: kaart.lidSinds ? dagKort(kaart.lidSinds, taal) + ' ' + kaart.lidSinds.slice(0, 4) : t.onbekend },
  ]
  return (
    <Venster actief="Leden">
      <div className="aygd-lid-kop">
        <Avatar naam={kaart.naam} maat={52} className="aygd-lid-avatar" />
        <div className="aygd-stapel">
          <p className="aygd-dag">{kaart.naam}</p>
          <p className="aygd-chips">
            <span className="aygm-chip aygm-chip--ok">{lidStatus[kaart.status] ?? kaart.status}</span>
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
          <p className="aygm-boven">{t.trainingsschema}</p>
          <p className="aygm-kop">{kaart.schema ?? t.geenSchema}</p>
        </div>
        <div className="aygm-kaart aygd-blok">
          <p className="aygm-boven">
            {t.laatsteMeting}
            {kaart.meting ? ` · ${dagKort(kaart.meting.datum, taal)}` : ''}
          </p>
          {kaart.meting ? (
            <p className="aygm-kop">
              {kaart.meting.gewicht !== null && `${formatGetal(kaart.meting.gewicht, taal)} kg`}
              {kaart.meting.buik !== null && ` · ${t.buik} ${formatGetal(kaart.meting.buik, taal)} cm`}
            </p>
          ) : (
            <p className="aygm-kop">{t.geenMeting}</p>
          )}
        </div>
      </div>
    </Venster>
  )
}
