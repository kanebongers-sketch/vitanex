'use client'

import { useState } from 'react'
import { ArrowRightLeft } from 'lucide-react'
import { Knop } from '@/components/lifeos/os/Knop'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'
import { haalJson } from '@/lib/lifeos/api/http'
import { COACH_AGENDA_NAAM } from '@/lib/lifeos/pt-gesprek/coach-agenda'
import {
  leesUitvoering,
  leesVoorvertoning,
  vatSamen,
  type Samenvatting,
  type Voorvertoning,
} from '@/lib/lifeos/pt-gesprek/verplaatsen'
import { OvergeslagenLijst, SamenvattingBlok, VoorstelLijst } from './VerplaatsLijst'

// Container: in een keer alle coachgesprekken (18 maanden terug tot 12 vooruit) uit
// de gekozen agenda naar "Coachgesprekken PT". Eerst een voorvertoning met vinkjes,
// pas na "Uitvoeren" verandert er iets. Wat mislukt staat in de samenvatting.

const PAD = '/api/lifeos/pt-gesprekken/verplaatsen'

type Staat =
  | { fase: 'dicht' }
  | { fase: 'laden' }
  | { fase: 'fout'; bericht: string }
  | { fase: 'kiezen'; data: Voorvertoning; aangevinkt: ReadonlySet<string>; bezig: boolean; fout: string | null }
  | { fase: 'klaar'; samenvatting: Samenvatting }

export function CoachgesprekkenVerplaatsen() {
  const [staat, setStaat] = useState<Staat>({ fase: 'dicht' })

  async function laad() {
    setStaat({ fase: 'laden' })
    const uit = await haalJson(PAD, leesVoorvertoning)
    if (!uit.ok) {
      setStaat({ fase: 'fout', bericht: uit.fout })
      return
    }
    const aangevinkt = new Set(uit.waarde.voorstellen.map((v) => v.sleutel))
    setStaat({ fase: 'kiezen', data: uit.waarde, aangevinkt, bezig: false, fout: null })
  }

  function wissel(sleutel: string) {
    setStaat((s) => {
      if (s.fase !== 'kiezen') return s
      const aangevinkt = new Set(s.aangevinkt)
      if (aangevinkt.has(sleutel)) aangevinkt.delete(sleutel)
      else aangevinkt.add(sleutel)
      return { ...s, aangevinkt }
    })
  }

  async function voerUit() {
    if (staat.fase !== 'kiezen' || staat.aangevinkt.size === 0) return
    const sleutels = [...staat.aangevinkt]
    setStaat({ ...staat, bezig: true, fout: null })
    const uit = await haalJson(PAD, leesUitvoering, { method: 'POST', body: JSON.stringify({ sleutels }) })
    if (!uit.ok) {
      setStaat({ ...staat, bezig: false, fout: uit.fout })
      return
    }
    setStaat({ fase: 'klaar', samenvatting: vatSamen(uit.waarde.resultaten) })
  }

  return (
    <div style={{ display: 'grid', gap: 12, padding: '16px 18px', borderRadius: 14, border: '1px solid var(--line)', background: 'var(--bg-card, transparent)' }}>
      <div style={{ display: 'grid', gap: 4 }}>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--text-1)' }}>Coachgesprekken naar {COACH_AGENDA_NAAM}</p>
        <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-3)', lineHeight: 1.5 }}>
          Zet alle coachgesprekken van 18 maanden terug tot 12 maanden vooruit uit je gekozen agenda in de agenda {COACH_AGENDA_NAAM}. Je ziet eerst wat er gebeurt.
        </p>
      </div>

      {staat.fase === 'dicht' || staat.fase === 'fout' || staat.fase === 'klaar' ? (
        <div style={{ justifySelf: 'start' }}>
          <Knop variant={staat.fase === 'klaar' ? 'stil' : 'primair'} onClick={() => void laad()}>
            <ArrowRightLeft size={14} strokeWidth={2.2} aria-hidden />
            {staat.fase === 'klaar' ? 'Opnieuw controleren' : 'Coachgesprekken verplaatsen'}
          </Knop>
        </div>
      ) : null}

      {staat.fase === 'laden' ? <p style={{ margin: 0, fontSize: 13, color: 'var(--text-3)' }}>Je agenda wordt doorzocht…</p> : null}
      {staat.fase === 'fout' ? <Foutmelding bericht={staat.bericht} /> : null}
      {staat.fase === 'klaar' ? <SamenvattingBlok samenvatting={staat.samenvatting} /> : null}
      {staat.fase === 'kiezen' ? (
        <Kiezen staat={staat} onWissel={wissel} onUitvoeren={() => void voerUit()} onAnnuleer={() => setStaat({ fase: 'dicht' })} />
      ) : null}
    </div>
  )
}

interface KiezenProps {
  staat: Extract<Staat, { fase: 'kiezen' }>
  onWissel: (sleutel: string) => void
  onUitvoeren: () => void
  onAnnuleer: () => void
}

function Kiezen({ staat, onWissel, onUitvoeren, onAnnuleer }: KiezenProps) {
  const { data, aangevinkt, bezig, fout } = staat
  const aantal = data.voorstellen.length
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <p style={{ margin: 0, fontSize: 13, color: 'var(--text-2)' }}>
        {aantal === 0
          ? `Niets te verplaatsen: in ${data.vanAgenda} staan geen coachgesprekken meer.`
          : `${aantal} ${aantal === 1 ? 'afspraak' : 'afspraken'} in ${data.vanAgenda}. Vink uit wat moet blijven staan.`}
      </p>
      {aantal > 0 ? <VoorstelLijst voorstellen={data.voorstellen} aangevinkt={aangevinkt} onWissel={onWissel} uit={bezig} /> : null}
      <OvergeslagenLijst items={data.overgeslagen} />
      {fout ? <Foutmelding bericht={fout} /> : null}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {aantal > 0 ? (
          <Knop variant="primair" onClick={onUitvoeren} disabled={bezig || aangevinkt.size === 0}>
            {bezig ? 'Bezig, dit kan even duren…' : `Uitvoeren (${aangevinkt.size})`}
          </Knop>
        ) : null}
        <Knop onClick={onAnnuleer} disabled={bezig}>Sluiten</Knop>
      </div>
    </div>
  )
}
