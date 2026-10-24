import { BookmarkPlus, Check, Plus, Printer, Save, TriangleAlert, Undo2 } from 'lucide-react'
import { PARQ_VRAGEN } from '@/lib/club/training/intake'
import { stelSchemaVoor } from '@/lib/club/training/voorstel'
import { DOELEN } from '@/lib/club/training/typen'
import { toonBereik, type VoorbeeldOefening } from '@/components/aiyourgym/inhoud/voorbeeldschema'
import { Venster } from '@/components/aiyourgym/mockups/kaders'
import { VOORBEELD_INTAKE } from './voorbeeld-intake'
import { OefTegel } from '@/components/aiyourgym/mockups/OefTegel'
import { formatGetal } from '@/lib/aiyourgym/taal/formaat'
import { getSiteTaal } from '@/lib/aiyourgym/taal/server'
import { SCHEMA_SCHERMEN } from '@/lib/aiyourgym/taal/woorden/website/schemas'

// De schermen van de trainer: intake, schemavoorstel en editor. Getekend in
// HTML en CSS; de gezondheidsvragen en het voorstel komen uit de code van Club
// zelf (PARQ_VRAGEN, stelSchemaVoor), met het Engels ernaast in SCHEMA_SCHERMEN.
// De gegevens zijn een voorbeeld.

const METINGEN = [
  ['gewicht', 74.5, 'kg'],
  ['lengte', 172, 'cm'],
  ['vet', 24, '%'],
  ['buik', 84, 'cm'],
] as const

export async function IntakeScherm() {
  const taal = await getSiteTaal()
  const s = SCHEMA_SCHERMEN[taal]
  const t = s.intake
  const vragen = PARQ_VRAGEN.slice(2, 5)
  return (
    <Venster actief="Coaching">
      <div className="ayg-ss-kop">
        <span>
          <b>{t.kop}</b>
          <i>{t.voorbeeld}</i>
        </span>
      </div>
      <div className="ayg-ss-twee">
        <div className="ayg-ss-stapel">
          <p className="aygm-boven">{t.doelen}</p>
          <span className="ayg-ss-chips">
            {DOELEN.slice(0, 5).map((d) => (
              <i key={d} data-aan={d === 'spiermassa' ? '' : undefined}>
                {s.doel[d]}
              </i>
            ))}
          </span>
          <p className="aygm-boven">{t.niveau}</p>
          <span className="ayg-ss-segment">
            {([1, 2, 3] as const).map((n) => (
              <i key={n} data-aan={n === 2 ? '' : undefined}>
                {s.niveau[n]}
              </i>
            ))}
          </span>
          <span className="ayg-ss-velden">
            <span>
              <small>{t.dagenPerWeek}</small>
              <b>3</b>
            </span>
            <span>
              <small>{t.minuten}</small>
              <b>60</b>
            </span>
          </span>
          <p className="aygm-boven">{t.metingen}</p>
          <span className="ayg-ss-velden ayg-ss-velden--vier">
            {METINGEN.map(([sleutel, waarde, eenheid]) => (
              <span key={sleutel}>
                <small>{t.meting[sleutel]}</small>
                <b>
                  {formatGetal(waarde, taal)} <em>{eenheid}</em>
                </b>
              </span>
            ))}
          </span>
        </div>
        <div className="ayg-ss-stapel">
          <p className="aygm-boven">{t.gezondheidsvragen}</p>
          {vragen.map((v) => (
            <span key={v.sleutel} className="ayg-ss-vraag">
              <span>{t.parq[v.sleutel]}</span>
              <span className="ayg-ss-janee">
                <i data-aan={v.sleutel === 'gewricht' ? '' : undefined}>{t.ja}</i>
                <i data-aan={v.sleutel !== 'gewricht' ? '' : undefined}>{t.nee}</i>
              </span>
            </span>
          ))}
          <span className="ayg-ss-toestemming">
            <Check size={12} aria-hidden /> {t.toestemming}
          </span>
          <span className="aygm-knopje ayg-ss-rechts">{t.voorstelMaken}</span>
        </div>
      </div>
    </Venster>
  )
}

export async function VoorstelScherm({ oefeningen }: { oefeningen: readonly VoorbeeldOefening[] }) {
  const s = SCHEMA_SCHERMEN[await getSiteTaal()]
  const t = s.voorstel
  const v = stelSchemaVoor(VOORBEELD_INTAKE, [])
  return (
    <Venster actief="Coaching">
      <div className="ayg-ss-kop">
        <span>
          <b>{t.naam}</b>
          <i>{t.voorstel}</i>
        </span>
        <span className="aygm-knopje">{t.openen}</span>
      </div>
      <p className="ayg-ss-uitleg">
        {t.weken(v.weken)} · {s.doel[v.doel]} · {s.niveau[v.niveau]}
      </p>
      {t.waarschuwingen.map((w) => (
        <p key={w} className="ayg-ss-let-op">
          <TriangleAlert size={13} aria-hidden />
          <span>{w}</span>
        </p>
      ))}
      <span className="ayg-ss-dagtabs">
        {t.dagen.map((dag, i) => (
          <i key={dag} data-aan={i === 0 ? '' : undefined}>
            {dag}
          </i>
        ))}
      </span>
      <ol className="ayg-ss-regels">
        {oefeningen.map((o) => (
          <li key={o.naam}>
            <OefTegel naam={o.naam} maat={34} />
            <b>{o.naam}</b>
            <span>{s.voorschrift(o.voorschrift)}</span>
          </li>
        ))}
      </ol>
    </Venster>
  )
}

const GEWICHT = ['16', '12', '14', '45']

export async function EditorScherm({ oefeningen }: { oefeningen: readonly VoorbeeldOefening[] }) {
  const s = SCHEMA_SCHERMEN[await getSiteTaal()]
  const t = s.editor
  return (
    <Venster actief="Coaching">
      <div className="ayg-ss-kop">
        <span>
          <b>{t.naam}</b>
          <i>{t.actief}</i>
        </span>
        <span className="ayg-ss-werkbalk">
          <span className="aygm-knopje">
            <Save size={11} aria-hidden /> {t.opslaan}
          </span>
          <span className="ayg-ss-knop">
            <Undo2 size={11} aria-hidden /> {t.ongedaan}
          </span>
          <span className="ayg-ss-knop">
            <Printer size={11} aria-hidden /> {t.printen}
          </span>
          <span className="ayg-ss-knop">
            <BookmarkPlus size={11} aria-hidden /> {t.sjabloon}
          </span>
        </span>
      </div>
      <span className="ayg-ss-dagtabs">
        {t.dagen.map((dag, i) => (
          <i key={dag} data-aan={i === 0 ? '' : undefined}>
            {dag}
          </i>
        ))}
        <i>
          <Plus size={10} aria-hidden /> {t.dag}
        </i>
      </span>
      <div className="ayg-ss-tabel" role="presentation">
        <span className="ayg-ss-tabel-kop">
          {t.kolommen.map((k) => (
            <i key={k}>{k}</i>
          ))}
        </span>
        {oefeningen.map((o, i) => {
          const [sets, rest] = o.voorschrift.split(' x ')
          const herh = s.voorschrift(toonBereik(rest.split(',')[0]))
          const rust = s.voorschrift(o.voorschrift.split(', ')[1]?.replace(' rust', '') ?? '')
          return (
            <span key={o.naam} className="ayg-ss-tabel-rij">
              <span className="ayg-ss-oef">
                <OefTegel naam={o.naam} maat={28} />
                <b>{o.naam}</b>
              </span>
              <i>{sets}</i>
              <i>{herh}</i>
              <i>{GEWICHT[i]}</i>
              <i>{rust}</i>
              <i className="ayg-ss-notitie">{t.notities[i]}</i>
            </span>
          )
        })}
        <span className="ayg-ss-toevoegen">
          <Plus size={11} aria-hidden /> {t.toevoegen}
        </span>
      </div>
    </Venster>
  )
}
