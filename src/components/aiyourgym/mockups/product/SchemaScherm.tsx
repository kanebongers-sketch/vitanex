import { getSiteTaal } from '@/lib/aiyourgym/taal/server'
import { PRODUCTSCHERMEN } from '@/lib/aiyourgym/taal/woorden/website/mockups/productschermen'
import { Venster } from '../kaders'
import { PBlok, PCijfer } from './bouwstenen'

// Een trainingsschema in de schema-editor van Club, in de nieuwe stijl: de
// oefeningen als tabel met supersets (B1 en B2, C1 en C2), sets, kilo's, RIR, rust
// en tempo; rechts de kernpunten bij de gekozen oefening en het verloop van haar
// zwaarste set met de regel van dubbele progressie. Alleen oefeningen met een
// eigen render in Club (de Blender-oefeningen); geen oefenbeelden op de website.

interface Regel {
  code: string
  naam: string
  sets: string
  kg: string
  rir: string
  rust: string
  tempo: string
}

const REGELS: readonly Regel[] = [
  { code: 'A1', naam: 'Back squat', sets: '4 × 8', kg: '60', rir: '2', rust: '2:00', tempo: '3010' },
  { code: 'B1', naam: 'Barbell row', sets: '3 × 10', kg: '40', rir: '2', rust: '0:30', tempo: '2011' },
  { code: 'B2', naam: 'Overhead press', sets: '3 × 8', kg: '30', rir: '2', rust: '1:30', tempo: '2010' },
  { code: 'C1', naam: 'Glute bridge', sets: '3 × 12', kg: '50', rir: '3', rust: '0:30', tempo: '2111' },
  { code: 'C2', naam: 'Plank', sets: '3 × 40 s', kg: '', rir: '', rust: '1:00', tempo: '' },
]

/** De zwaarste set back squat over de laatste zes trainingen (kg). */
const ZWAARSTE = [50, 52.5, 52.5, 55, 57.5, 60] as const

export async function SchemaScherm() {
  const t = PRODUCTSCHERMEN[await getSiteTaal()].schema
  return (
    <Venster actief="Coaching" hier="Training">
      <div className="aygp">
        <div className="aygp-paginakop">
          <div>
            <p className="aygp-waar">{t.wie}</p>
            <p className="aygp-titel">{t.kop}</p>
          </div>
          <span className="aygp-knop">{t.opslaan}</span>
        </div>
        <div className="aygp-twee aygp-twee--schema">
          <div className="aygp-tabel">
            <div className="aygp-tabel-kop">
              {t.kolommen.map((k) => (
                <span key={k}>{k}</span>
              ))}
            </div>
            {REGELS.map((r, i) => {
              const groep = r.code[0]
              const nieuweGroep = i === 0 || REGELS[i - 1].code[0] !== groep
              return (
                <div key={r.code} className="aygp-tabel-rij" data-gekozen={i === 0 || undefined} data-groep-begin={nieuweGroep || undefined}>
                  <span className="aygp-oef">
                    <i>{r.code}</i>
                    <b>{r.naam}</b>
                  </span>
                  <span>{r.sets}</span>
                  <span>{r.kg}</span>
                  <span>{r.rir}</span>
                  <span>{r.rust}</span>
                  <span>{r.tempo}</span>
                </div>
              )
            })}
            <p className="aygp-tabel-voet">
              <span className="aygp-chip">{t.superset}</span> B1 + B2 · C1 + C2
            </p>
          </div>
          <div className="aygp-kolom">
            <PBlok titel={t.coaching} extra={REGELS[0].naam} className="aygp-blok--verhoogd">
              <ol className="aygp-punten">
                {t.kernpunten.map((k) => (
                  <li key={k}>{k}</li>
                ))}
              </ol>
            </PBlok>
            <PCijfer
              label={t.zwaarste}
              waarde={String(ZWAARSTE[ZWAARSTE.length - 1])}
              eenheid="kg"
              verschil={t.zwaarsteVerschil}
              sub={t.progressie}
              trend={{ waarden: ZWAARSTE, label: t.zwaarsteTrend }}
            />
          </div>
        </div>
      </div>
    </Venster>
  )
}
