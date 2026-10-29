'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useState } from 'react'
import { BookmarkPlus, Check, UserPlus } from 'lucide-react'
import { BASIS_SJABLONEN, type BasisSjabloon } from '@/lib/club/training/sjablonen/basis'
import { dagLetter } from '@/lib/club/training/typen'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { CLUB_TRAINING, basisTekst } from '@/lib/aiyourgym/taal/woorden/club/training'
import { TRAINING_LABELS } from '@/lib/aiyourgym/taal/woorden/club/training-labels'
import { idUit, stuur } from './api'
import { LidKiezer, type GekozenLid } from './LidKiezer'
import { Zijpaneel } from './Zijpaneel'
import './schemas.css'

interface BasisSjablonenProps {
  vestiging: string
  lid: { id: string; naam: string } | null
  /** Sleutels van startschema's die al als eigen sjabloon bestaan. */
  alOpgeslagen: string[]
  editorHref: string
}

function aantalOefeningen(s: BasisSjabloon): number {
  return s.dagen.reduce((n, d) => n + d.regels.length, 0)
}

/** De basisset: goede startschema's om in een klik op een lid te zetten of als eigen sjabloon te bewaren. */
export function BasisSjablonen({ vestiging, lid, alOpgeslagen, editorHref }: BasisSjablonenProps) {
  const router = useRouter()
  const tt = useTekst(CLUB_TRAINING)
  const t = tt.basis
  const l = useTekst(TRAINING_LABELS)
  const [kiesLidVoor, setKiesLidVoor] = useState<BasisSjabloon | null>(null)
  const [bezig, setBezig] = useState<string | null>(null)
  const [fout, setFout] = useState<{ sleutel: string; tekst: string } | null>(null)
  const sluit = useCallback(() => setKiesLidVoor(null), [])

  async function maak(s: BasisSjabloon, lidId: string | null) {
    setBezig(s.sleutel)
    setFout(null)
    const u = await stuur('/sjablonen/basis', 'POST', { sleutel: s.sleutel, lidId })
    const id = u.ok ? idUit(u.data) : null
    if (!id) {
      setBezig(null)
      return setFout({ sleutel: s.sleutel, tekst: u.ok ? t.geenSchema : u.fout })
    }
    router.push(editorHref.replace('__id__', id))
  }

  return (
    <section className="club-training-basis" aria-labelledby="basis-kop">
      <header className="club-training-basis-kop">
        <div>
          <p className="club-boventitel">{t.boventitel}</p>
          <h2 id="basis-kop">{t.titel}</h2>
        </div>
        <p className="club-hint">{t.uitleg}</p>
      </header>
      <ul className="club-training-basis-raster">
        {BASIS_SJABLONEN.map((s) => {
          const opgeslagen = alOpgeslagen.includes(s.sleutel)
          const bt = basisTekst(tt, s.sleutel)
          return (
            <li key={s.sleutel} className="club-training-basis-kaart">
              <div className="club-training-basis-meta">
                <span>{l.doel[s.doel]}</span>
                <span>{l.niveau[s.niveau]}</span>
                <span>{t.weken(s.weken)}</span>
              </div>
              <h3>{bt?.naam ?? s.naam}</h3>
              <p className="club-training-basis-uitleg">{bt?.uitleg ?? s.uitleg}</p>
              <ol className="club-training-basis-dagen" aria-label={t.dagenLabel}>
                {s.dagen.map((d, i) => (
                  <li key={d.titel}>
                    <b aria-hidden>{dagLetter(i + 1)}</b> {bt?.dagen[i] ?? d.titel} <span className="club-zacht">{d.regels.length}</span>
                  </li>
                ))}
              </ol>
              <p className="club-zacht club-training-klein">{bt?.perWeek ?? s.perWeek} · {t.oefeningen(aantalOefeningen(s))}</p>
              <div className="club-training-basis-acties">
                <button
                  type="button" className="club-knop club-knop--klein club-training-knop-merk" disabled={bezig !== null}
                  onClick={() => (lid ? maak(s, lid.id) : setKiesLidVoor(s))}
                >
                  <UserPlus aria-hidden size={15} /> {lid ? t.op(lid.naam.split(' ')[0]) : t.opEenLid}
                </button>
                <button type="button" className="club-knop club-knop--stil club-knop--klein" disabled={bezig !== null || opgeslagen} onClick={() => maak(s, null)}>
                  {opgeslagen ? <><Check aria-hidden size={15} /> {t.bijSjablonen}</> : <><BookmarkPlus aria-hidden size={15} /> {t.alsEigen}</>}
                </button>
              </div>
              {bezig === s.sleutel && <p className="club-hint" role="status">{t.bezig}</p>}
              {fout?.sleutel === s.sleutel && <p className="club-fout" role="alert">{fout.tekst}</p>}
            </li>
          )
        })}
      </ul>
      {kiesLidVoor && (
        <Zijpaneel titel={basisTekst(tt, kiesLidVoor.sleutel)?.naam ?? kiesLidVoor.naam} boventitel={t.paneel} onSluit={sluit}>
          <p className="club-hint">{t.paneelUitleg}</p>
          <LidKiezer vestiging={vestiging} onKies={(l: GekozenLid) => maak(kiesLidVoor, l.id)} autoFocus />
          {fout?.sleutel === kiesLidVoor.sleutel && <p className="club-fout" role="alert">{fout.tekst}</p>}
        </Zijpaneel>
      )}
    </section>
  )
}
