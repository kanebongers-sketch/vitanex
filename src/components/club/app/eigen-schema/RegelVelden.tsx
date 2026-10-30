'use client'

import { useId } from 'react'
import { Info, Link2, Minus, Plus, Trash2, Unlink2 } from 'lucide-react'
import type { EditorRegel } from '@/lib/club/training/editor'
import { RUST_KEUZES, stap } from '@/lib/club/training/lid-schemas/bewerken'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { EIGEN_SCHEMA } from '@/lib/aiyourgym/taal/woorden/ledenapp/eigen-schema'
import type { KaartActies } from './RegelKaart'

// De velden van een oefening, gemaakt voor de duim: sets met min en plus,
// herhalingen of tijd, gewicht met het cijfertoetsenbord, rust met een tik,
// tempo als vier cijfers. Superset met de oefening erboven in een tik.

interface Props {
  regel: EditorRegel
  oefeningId: string
  isEerste: boolean
  acties: KaartActies
}

export function RegelVelden({ regel: r, oefeningId, isEerste, acties: a }: Props) {
  const t = useTekst(EIGEN_SCHEMA).editor
  const id = useId()
  const rust = Number.parseInt(r.rustSec, 10)
  return (
    <div className="club-es-velden">
      <div className="club-es-veld">
        <span className="club-lidapp-label" id={`${id}-sets`}>{t.sets}</span>
        <div className="club-es-stapper" role="group" aria-labelledby={`${id}-sets`}>
          <button type="button" onClick={() => a.onWijzig(r.sleutel, 'sets', stap(r.sets, -1, 1, 20))} aria-label={t.minder}><Minus aria-hidden size={18} /></button>
          <input inputMode="numeric" pattern="[0-9]*" value={r.sets} onChange={(e) => a.onWijzig(r.sleutel, 'sets', e.target.value.replace(/\D/g, '').slice(0, 2))} aria-labelledby={`${id}-sets`} />
          <button type="button" onClick={() => a.onWijzig(r.sleutel, 'sets', stap(r.sets, 1, 1, 20))} aria-label={t.meer}><Plus aria-hidden size={18} /></button>
        </div>
      </div>

      <div className="club-es-veld">
        <div className="club-es-wissel" role="group" aria-label={`${t.herhalingen} / ${t.tijd}`}>
          <button type="button" aria-pressed={r.maat === 'herhalingen'} onClick={() => a.onMaat(r.sleutel, 'herhalingen')}>{t.herhalingen}</button>
          <button type="button" aria-pressed={r.maat === 'tijd'} onClick={() => a.onMaat(r.sleutel, 'tijd')}>{t.tijd}</button>
        </div>
        {r.maat === 'tijd' ? (
          <label className="club-es-invoer">
            <span className="club-sr">{t.seconden}</span>
            <input inputMode="numeric" pattern="[0-9]*" value={r.tijdSec} placeholder="30" onChange={(e) => a.onWijzig(r.sleutel, 'tijdSec', e.target.value.replace(/\D/g, '').slice(0, 4))} />
            <span aria-hidden>s</span>
          </label>
        ) : (
          <label className="club-es-invoer">
            <span className="club-sr">{t.herhalingen}</span>
            <input value={r.herhalingen} placeholder="10" maxLength={20} onChange={(e) => a.onWijzig(r.sleutel, 'herhalingen', e.target.value)} />
          </label>
        )}
      </div>

      <label className="club-es-veld">
        <span className="club-lidapp-label">{t.kg}</span>
        <span className="club-es-invoer">
          <input inputMode="decimal" value={r.gewichtKg} placeholder="0" maxLength={6} onChange={(e) => a.onWijzig(r.sleutel, 'gewichtKg', e.target.value.replace(/[^0-9.,]/g, ''))} />
          <span aria-hidden>kg</span>
        </span>
      </label>

      <div className="club-es-veld club-es-veld--breed">
        <span className="club-lidapp-label" id={`${id}-rust`}>{t.rust}</span>
        <div className="club-es-chips" role="group" aria-labelledby={`${id}-rust`}>
          {RUST_KEUZES.map((s) => (
            <button key={s} type="button" aria-pressed={rust === s} onClick={() => a.onWijzig(r.sleutel, 'rustSec', String(s))}>{t.rustSec(s)}</button>
          ))}
        </div>
      </div>

      <label className="club-es-veld club-es-veld--breed">
        <span className="club-lidapp-label">{t.tempo}</span>
        <span className="club-es-invoer">
          <input inputMode="numeric" value={r.tempo} placeholder="3110" maxLength={4} onChange={(e) => a.onWijzig(r.sleutel, 'tempo', e.target.value.toUpperCase().replace(/[^0-9X]/g, '').slice(0, 4))} aria-describedby={`${id}-tempo`} />
        </span>
        <small id={`${id}-tempo`} className="club-es-hint">{t.tempoUitleg}</small>
      </label>

      <div className="club-es-acties">
        {r.groep !== null ? (
          <button type="button" className="club-lidapp-knop" onClick={() => a.onOntkoppel(r.sleutel)}><Unlink2 aria-hidden size={16} /> {t.losmaken}</button>
        ) : (
          !isEerste && <button type="button" className="club-lidapp-knop" onClick={() => a.onKoppel(r.sleutel)}><Link2 aria-hidden size={16} /> {t.superset}</button>
        )}
        <button type="button" className="club-lidapp-knop" onClick={() => a.onInfo(oefeningId)}><Info aria-hidden size={16} /> {t.info}</button>
        <button type="button" className="club-lidapp-knop club-lidapp-knop--stil club-es-weg" onClick={() => a.onVerwijder(r.sleutel)}><Trash2 aria-hidden size={16} /> {t.verwijder}</button>
      </div>
    </div>
  )
}
