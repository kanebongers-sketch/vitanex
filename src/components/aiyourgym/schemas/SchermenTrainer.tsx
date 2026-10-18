import { BookmarkPlus, Check, Plus, Printer, Save, TriangleAlert } from 'lucide-react'
import { PARQ_VRAGEN } from '@/lib/club/training/intake'
import { stelSchemaVoor } from '@/lib/club/training/voorstel'
import { DOEL_LABEL, DOELEN, NIVEAU_LABEL } from '@/lib/club/training/typen'
import { toonBereik, type VoorbeeldOefening } from '@/components/aiyourgym/inhoud/voorbeeldschema'
import { Venster } from '@/components/aiyourgym/mockups/kaders'

// De schermen van de trainer: intake, schemavoorstel en editor. Getekend in
// HTML en CSS; de labels, gezondheidsvragen en de tekst van het voorstel komen
// uit de code van Club zelf (stelSchemaVoor), de gegevens zijn een voorbeeld.

const VOORBEELD_INTAKE = {
  doelen: ['spiermassa' as const],
  niveau: 2 as const,
  dagenPerWeek: 3,
  minutenPerSessie: 60,
  voorkeuren: ['sportschool' as const],
  gezondheid: { blessures: [], blessureToelichting: null, klachten: null, medicatie: null, parqJa: ['gewricht' as const] },
}

const METINGEN = [
  ['Gewicht', '74,5', 'kg'],
  ['Lengte', '172', 'cm'],
  ['Vetpercentage', '24', '%'],
  ['Buikomtrek', '84', 'cm'],
] as const

export function IntakeScherm() {
  const vragen = PARQ_VRAGEN.slice(2, 5)
  return (
    <Venster actief="Coaching">
      <div className="ayg-ss-kop">
        <span>
          <b>Intake · Sanne de Vries</b>
          <i>Voorbeeld</i>
        </span>
      </div>
      <div className="ayg-ss-twee">
        <div className="ayg-ss-stapel">
          <p className="aygm-boven">Doelen</p>
          <span className="ayg-ss-chips">
            {DOELEN.slice(0, 5).map((d) => (
              <i key={d} data-aan={d === 'spiermassa' ? '' : undefined}>
                {DOEL_LABEL[d]}
              </i>
            ))}
          </span>
          <p className="aygm-boven">Niveau</p>
          <span className="ayg-ss-segment">
            {([1, 2, 3] as const).map((n) => (
              <i key={n} data-aan={n === 2 ? '' : undefined}>
                {NIVEAU_LABEL[n]}
              </i>
            ))}
          </span>
          <span className="ayg-ss-velden">
            <span>
              <small>Dagen per week</small>
              <b>3</b>
            </span>
            <span>
              <small>Minuten</small>
              <b>60</b>
            </span>
          </span>
          <p className="aygm-boven">Metingen</p>
          <span className="ayg-ss-velden ayg-ss-velden--vier">
            {METINGEN.map(([label, waarde, eenheid]) => (
              <span key={label}>
                <small>{label}</small>
                <b>
                  {waarde} <em>{eenheid}</em>
                </b>
              </span>
            ))}
          </span>
        </div>
        <div className="ayg-ss-stapel">
          <p className="aygm-boven">Gezondheidsvragen</p>
          {vragen.map((v) => (
            <span key={v.sleutel} className="ayg-ss-vraag">
              <span>{v.vraag}</span>
              <span className="ayg-ss-janee">
                <i data-aan={v.sleutel === 'gewricht' ? '' : undefined}>Ja</i>
                <i data-aan={v.sleutel !== 'gewricht' ? '' : undefined}>Nee</i>
              </span>
            </span>
          ))}
          <span className="ayg-ss-toestemming">
            <Check size={12} aria-hidden /> Het lid geeft toestemming om deze gezondheidsgegevens te bewaren
          </span>
          <span className="aygm-knopje ayg-ss-rechts">Voorstel maken</span>
        </div>
      </div>
    </Venster>
  )
}

export function VoorstelScherm({ oefeningen }: { oefeningen: readonly VoorbeeldOefening[] }) {
  const v = stelSchemaVoor(VOORBEELD_INTAKE, [])
  return (
    <Venster actief="Coaching">
      <div className="ayg-ss-kop">
        <span>
          <b>{v.naam}</b>
          <i>Voorstel</i>
        </span>
        <span className="aygm-knopje">Openen in de editor</span>
      </div>
      <p className="ayg-ss-uitleg">
        {v.weken} weken · {DOEL_LABEL[v.doel]} · {NIVEAU_LABEL[v.niveau]}
      </p>
      {v.waarschuwingen.map((w) => (
        <p key={w} className="ayg-ss-let-op">
          <TriangleAlert size={13} aria-hidden />
          <span>{w}</span>
        </p>
      ))}
      <span className="ayg-ss-dagtabs">
        {v.dagen.map((d, i) => (
          <i key={d.dag} data-aan={i === 0 ? '' : undefined}>
            {d.titel}
          </i>
        ))}
      </span>
      <ol className="ayg-ss-regels">
        {oefeningen.map((o) => (
          <li key={o.naam}>
            <img src={o.beeldStart} alt="" width={34} height={34} loading="lazy" decoding="async" />
            <b>{o.naam}</b>
            <span>{o.voorschrift}</span>
          </li>
        ))}
      </ol>
    </Venster>
  )
}

const KOLOMMEN = ['Oefening', 'Sets', 'Herh.', 'Kg', 'Rust', 'Notitie'] as const
const GEWICHT = ['16', '12', '14', '45']
const NOTITIE = ['Hielen op de grond', '', 'Rustig zakken', '']

export function EditorScherm({ oefeningen }: { oefeningen: readonly VoorbeeldOefening[] }) {
  return (
    <Venster actief="Coaching">
      <div className="ayg-ss-kop">
        <span>
          <b>Full body · Spiermassa</b>
          <i>Actief</i>
        </span>
        <span className="ayg-ss-werkbalk">
          <span className="aygm-knopje">
            <Save size={11} aria-hidden /> Opslaan
          </span>
          <span className="ayg-ss-knop">
            <Printer size={11} aria-hidden /> Printen
          </span>
          <span className="ayg-ss-knop">
            <BookmarkPlus size={11} aria-hidden /> Opslaan als sjabloon
          </span>
        </span>
      </div>
      <span className="ayg-ss-dagtabs">
        <i data-aan="">Dag A</i>
        <i>Dag B</i>
        <i>Dag C</i>
        <i>
          <Plus size={10} aria-hidden /> Dag
        </i>
      </span>
      <div className="ayg-ss-tabel" role="presentation">
        <span className="ayg-ss-tabel-kop">
          {KOLOMMEN.map((k) => (
            <i key={k}>{k}</i>
          ))}
        </span>
        {oefeningen.map((o, i) => {
          const [sets, rest] = o.voorschrift.split(' x ')
          const herh = toonBereik(rest.split(',')[0])
          const rust = o.voorschrift.split(', ')[1]?.replace(' rust', '') ?? ''
          return (
            <span key={o.naam} className="ayg-ss-tabel-rij">
              <span className="ayg-ss-oef">
                <img src={o.beeldStart} alt="" width={28} height={28} loading="lazy" decoding="async" />
                <b>{o.naam}</b>
              </span>
              <i>{sets}</i>
              <i>{herh}</i>
              <i>{GEWICHT[i]}</i>
              <i>{rust}</i>
              <i className="ayg-ss-notitie">{NOTITIE[i]}</i>
            </span>
          )
        })}
        <span className="ayg-ss-toevoegen">
          <Plus size={11} aria-hidden /> Oefening toevoegen
        </span>
      </div>
    </Venster>
  )
}
