'use client'

import { useCallback, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { secties, sectieNamen, volgordeVoorNieuw, type Richting } from '@/lib/club/intakevragen/lijst'
import type { IntakeVraag } from '@/lib/club/intakevragen/soorten'
import { stuurVraag, type Antwoord } from './api'
import { IntakeVoorbeeld } from './IntakeVoorbeeld'
import { VraagFormulier } from './VraagFormulier'
import { VragenLijst } from './VragenLijst'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { INTAKE } from '@/lib/aiyourgym/taal/woorden/club/intake'

interface IntakeVragenBeheerProps {
  vragen: IntakeVraag[]
  standaard: boolean
  vandaag: string
}

function nieuweVraag(vragen: readonly IntakeVraag[], standaardSectie: string): IntakeVraag {
  const sectie = secties(vragen)[0]?.naam ?? standaardSectie
  return { id: 'nieuw', sleutel: null, vraag: '', uitleg: null, soort: 'kort', opties: [], verplicht: false, gezondheid: false, sectie, volgorde: volgordeVoorNieuw(vragen, sectie), actief: true }
}

/** Het concept in de lijst voor het voorbeeld: vervangen, of achteraan in zijn sectie erbij. */
function metConcept(vragen: readonly IntakeVraag[], concept: IntakeVraag | null): IntakeVraag[] {
  if (!concept || !concept.vraag.trim()) return [...vragen]
  const zonder = vragen.filter((v) => v.id !== concept.id)
  const oud = vragen.find((v) => v.id === concept.id)
  const volgorde = oud && oud.sectie === concept.sectie ? oud.volgorde : volgordeVoorNieuw(zonder, concept.sectie)
  return [...zonder, { ...concept, volgorde }]
}

const naarBody = (v: IntakeVraag) => ({
  vraag: v.vraag, uitleg: v.uitleg, soort: v.soort, opties: v.opties, verplicht: v.verplicht, gezondheid: v.gezondheid, sectie: v.sectie, actief: v.actief,
})

/** Het werkvlak: links de vragen per sectie en het formulier, rechts het live voorbeeld. */
export function IntakeVragenBeheer({ vragen, standaard, vandaag }: IntakeVragenBeheerProps) {
  const router = useRouter()
  const t = useTekst(INTAKE).beheer
  const [bewerk, setBewerk] = useState<IntakeVraag | null>(null)
  const [concept, setConcept] = useState<IntakeVraag | null>(null)
  const [bezig, setBezig] = useState(false)
  const [melding, setMelding] = useState<{ ok: boolean; tekst: string } | null>(null)
  const delen = useMemo(() => secties(vragen), [vragen])
  const voorbeeld = useMemo(() => metConcept(vragen, bewerk ? concept : null), [vragen, bewerk, concept])
  const onConcept = useCallback((v: IntakeVraag) => setConcept(v), [])

  async function doe(actie: Promise<Antwoord>, gelukt: string): Promise<boolean> {
    setBezig(true)
    const u = await actie
    setBezig(false)
    setMelding(u.ok ? { ok: true, tekst: gelukt } : { ok: false, tekst: u.fout })
    if (u.ok) router.refresh()
    return u.ok
  }

  async function opslaan(v: IntakeVraag) {
    const nieuw = v.id === 'nieuw'
    const ok = await doe(nieuw ? stuurVraag('', 'POST', naarBody(v)) : stuurVraag(`/${encodeURIComponent(v.id)}`, 'PATCH', naarBody(v)), nieuw ? t.toegevoegd : t.opgeslagen)
    if (ok) setBewerk(null)
  }

  const verplaatsVraag = (v: IntakeVraag, richting: Richting) => doe(stuurVraag('/verplaats', 'POST', { wat: 'vraag', id: v.id, richting }), t.volgorde)
  const verplaatsSectie = (sectie: string, richting: Richting) => doe(stuurVraag('/verplaats', 'POST', { wat: 'sectie', sectie, richting }), t.volgordeSecties)
  const aanUit = (v: IntakeVraag) =>
    doe(stuurVraag(`/${encodeURIComponent(v.id)}`, 'PATCH', { ...naarBody(v), actief: !v.actief }), v.actief ? t.staatUit(v.vraag) : t.staatAan(v.vraag))
  const verwijder = (v: IntakeVraag) => {
    if (!window.confirm(t.verwijderVraag(v.vraag))) return
    void doe(stuurVraag(`/${encodeURIComponent(v.id)}`, 'DELETE'), t.verwijderd)
  }

  return (
    <>
      <div role="status" aria-live="polite" className="club-intakevragen-status">
        {melding && <p className={`club-melding ${melding.ok ? 'club-melding--ok' : 'club-melding--fout'}`}>{melding.tekst}</p>}
      </div>
      <div className="club-intakevragen-werkvlak">
        <div className="club-intakevragen-hoofd">
          {standaard && (
            <p className="club-melding">{t.standaard}</p>
          )}
          <div className="club-intakevragen-balk">
            <button type="button" className="club-knop club-knop--primair" disabled={bezig || bewerk !== null} onClick={() => setBewerk(nieuweVraag(vragen, t.nieuweSectie))}>
              <Plus size={16} aria-hidden /> {t.toevoegen}
            </button>
            <span className="club-hint">{t.telling(vragen.filter((v) => v.actief).length, vragen.length, delen.length)}</span>
          </div>
          {bewerk && (
            <VraagFormulier
              key={bewerk.id}
              vraag={bewerk}
              sectieNamen={sectieNamen(vragen)}
              bezig={bezig}
              onConcept={onConcept}
              onOpslaan={opslaan}
              onAnnuleer={() => setBewerk(null)}
            />
          )}
          <VragenLijst
            secties={delen}
            bezig={bezig}
            bewerkt={bewerk?.id ?? null}
            onVerplaatsVraag={verplaatsVraag}
            onVerplaatsSectie={verplaatsSectie}
            onAanUit={aanUit}
            onBewerk={setBewerk}
            onVerwijder={verwijder}
          />
        </div>
        <IntakeVoorbeeld vragen={voorbeeld} vandaag={vandaag} />
      </div>
    </>
  )
}
