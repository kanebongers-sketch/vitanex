'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dumbbell, FilePlus2 } from 'lucide-react'
import { BASIS_SJABLONEN, type BasisSjabloon } from '@/lib/club/training/sjablonen/basis'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { LEDENKAART } from '@/lib/aiyourgym/taal/woorden/club/ledenkaart'
import { idUit, stuur } from '@/components/club/training/api'
import { NieuwSchemaKnop, SjabloonToepassen } from '@/components/club/training/SchemaActies'
import { VoorstelKnop } from '@/components/club/training/VoorstelKnop'
import { Zijpaneel } from '@/components/club/training/Zijpaneel'

// "Schema maken" vanaf het profiel: het lid staat al vast. Drie wegen, alle
// naar de bestaande editor (met ?van=lid, zodat hij daarna terug naar het
// profiel gaat): uit de laatste intake, uit een sjabloon of leeg.

export interface SjabloonKeuze {
  id: string
  naam: string
}

interface SchemaMakenProps {
  lid: { id: string; naam: string }
  vestiging: string
  /** Editorpad met __id__ en ?van=lid. */
  editorHref: string
  intake: { id: string; datum: string } | null
  sjablonen: SjabloonKeuze[]
  /** Meteen open (de knop Schema maken in de kop van de kaart). */
  beginOpen: boolean
  /** Primaire knop als er nog geen actief schema is. */
  primair: boolean
}

function oefeningen(s: BasisSjabloon): number {
  return s.dagen.reduce((n, d) => n + d.regels.length, 0)
}

export function SchemaMaken({ lid, vestiging, editorHref, intake, sjablonen, beginOpen, primair }: SchemaMakenProps) {
  const w = useTekst(LEDENKAART).schemaMaken
  const router = useRouter()
  const [open, setOpen] = useState(beginOpen)
  const [bezig, setBezig] = useState<string | null>(null)
  const [fout, setFout] = useState<string | null>(null)
  const sluit = useCallback(() => setOpen(false), [])

  async function uitBasis(s: BasisSjabloon) {
    setBezig(s.sleutel)
    setFout(null)
    const u = await stuur('/sjablonen/basis', 'POST', { sleutel: s.sleutel, lidId: lid.id })
    const id = u.ok ? idUit(u.data) : null
    if (!id) {
      setBezig(null)
      return setFout(u.ok ? w.fout : u.fout)
    }
    router.push(editorHref.replace('__id__', id))
  }

  return (
    <>
      <button type="button" className={`club-knop${primair ? ' club-knop--primair' : ''}`} onClick={() => setOpen(true)}>
        <FilePlus2 aria-hidden size={16} /> {w.titel}
      </button>
      {open && (
        <Zijpaneel titel={w.titel} boventitel={w.boventitel(lid.naam)} onSluit={sluit} breed>
          <div className="club-lidhub-maken">
            <p className="club-hint">{w.uitleg}</p>
            <section className="club-lidhub-maken-blok" aria-labelledby="maken-intake">
              <h3 id="maken-intake">{w.uitIntake}</h3>
              {intake ? (
                <>
                  <p className="club-hint">{w.uitIntakeUitleg(intake.datum)}</p>
                  <VoorstelKnop intakeId={intake.id} editorHref={editorHref} />
                </>
              ) : (
                <p className="club-hint">{w.geenIntake}</p>
              )}
            </section>
            <section className="club-lidhub-maken-blok" aria-labelledby="maken-leeg">
              <h3 id="maken-leeg">{w.leeg}</h3>
              <p className="club-hint">{w.leegUitleg}</p>
              <NieuwSchemaKnop lidId={lid.id} editorHref={editorHref} label={w.leeg} primair={false} />
            </section>
            <section className="club-lidhub-maken-blok" aria-labelledby="maken-eigen">
              <h3 id="maken-eigen">{w.eigen}</h3>
              {sjablonen.length ? (
                <ul className="club-lijst">
                  {sjablonen.map((s) => (
                    <li key={s.id} className="club-rij">
                      <span className="club-rij-hoofd"><span className="club-rij-titel">{s.naam}</span></span>
                      <SjabloonToepassen sjabloonId={s.id} sjabloonNaam={s.naam} vestiging={vestiging} lid={lid} editorHref={editorHref} />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="club-hint">{w.geenEigen}</p>
              )}
            </section>
            <section className="club-lidhub-maken-blok" aria-labelledby="maken-basis">
              <h3 id="maken-basis">{w.basis}</h3>
              <ul className="club-lijst">
                {BASIS_SJABLONEN.map((s) => (
                  <li key={s.sleutel} className="club-rij">
                    <span className="club-rij-hoofd">
                      <span className="club-rij-titel">{s.naam}</span>
                      <span className="club-rij-sub">{s.perWeek} · {w.perWeek(oefeningen(s))}</span>
                    </span>
                    <button type="button" className="club-knop club-knop--klein" disabled={bezig !== null} aria-busy={bezig === s.sleutel || undefined} onClick={() => void uitBasis(s)}>
                      <Dumbbell aria-hidden size={14} /> {bezig === s.sleutel ? w.bezig : w.kies}
                    </button>
                  </li>
                ))}
              </ul>
              {fout && <p className="club-fout" role="alert">{fout}</p>}
            </section>
          </div>
        </Zijpaneel>
      )}
    </>
  )
}
