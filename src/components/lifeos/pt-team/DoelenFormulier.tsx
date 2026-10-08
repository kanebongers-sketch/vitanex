'use client'

import { useMemo, useState, type FormEvent } from 'react'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'
import { haalJson } from '@/lib/lifeos/api/http'
import { DOEL_MAX, NOTITIE_MAX, heeftDoelen, leesDoelen, voortgang, type DoelSoort, type PtDoelen } from '@/lib/lifeos/pt-dashboard/doelen'
import type { Lead } from '@/lib/lifeos/leads/leads'
import type { PtKlant } from '@/lib/lifeos/pt-dashboard/abonnementen'
import { DoelLijst } from '@/components/lifeos/pt-dashboard/DoelVoortgang'
import { Veld } from '@/components/lifeos/pt-dashboard/velden'

// Kane zet de doelen van één PT'er. De sectie toont de voortgang zoals de PT'er
// die op /<naam> ziet, met daaronder het bewerkformulier.

interface SectieProps {
  persoonId: string
  naam: string
  doelen: PtDoelen | null
  leads: readonly Lead[]
  klanten: readonly PtKlant[]
  vandaag: string
  onOpgeslagen: (d: PtDoelen) => void
}

export function DoelenSectie({ persoonId, naam, doelen, leads, klanten, vandaag, onOpgeslagen }: SectieProps) {
  const [bewerken, setBewerken] = useState(false)
  const items = useMemo(() => (doelen ? voortgang(doelen, leads, klanten, vandaag) : []), [doelen, leads, klanten, vandaag])
  const gezet = heeftDoelen(doelen)

  return (
    <section className="ptd-sectie" aria-labelledby="doelen-kop">
      <div className="ptd-sectiekop">
        <h2 id="doelen-kop">Doelen</h2>
        <span>{gezet ? `${naam} ziet deze op het eigen dashboard` : 'nog niets gezet'}</span>
      </div>
      {gezet && doelen.notitie ? <p className="ptd-doel-notitie">{doelen.notitie}</p> : null}
      {items.length > 0 ? <DoelLijst items={items} /> : null}
      {bewerken ? (
        <DoelenFormulier
          persoonId={persoonId}
          naam={naam}
          doelen={doelen}
          onOpgeslagen={(d) => {
            setBewerken(false)
            onOpgeslagen(d)
          }}
          onAnnuleer={() => setBewerken(false)}
        />
      ) : (
        <div className="ptd-acties">
          <button type="button" className="ptd-knop" onClick={() => setBewerken(true)}>
            {gezet ? 'Doelen aanpassen' : 'Doelen zetten'}
          </button>
        </div>
      )}
    </section>
  )
}

interface FormProps {
  persoonId: string
  naam: string
  doelen: PtDoelen | null
  onOpgeslagen: (d: PtDoelen) => void
  onAnnuleer: () => void
}

type Concept = Record<DoelSoort, string> & { notitie: string }

const VELDEN: { soort: DoelSoort; label: string; hint: string }[] = [
  { soort: 'leadsPerWeek', label: 'Leads per week', hint: 'Gesproken leads, maandag t/m zondag.' },
  { soort: 'klantenPerMaand', label: 'Klanten per maand', hint: 'Leads die klant werden, gesproken in deze kalendermaand.' },
  { soort: 'abonnementen', label: 'Lopende abonnementen', hint: 'Het aantal lopende PT-abonnementen (incl. bevroren).' },
]

function naarConcept(d: PtDoelen | null): Concept {
  const tekst = (n: number | null | undefined) => (n ? String(n) : '')
  return {
    leadsPerWeek: tekst(d?.leadsPerWeek),
    klantenPerMaand: tekst(d?.klantenPerMaand),
    abonnementen: tekst(d?.abonnementen),
    notitie: d?.notitie ?? '',
  }
}

export function DoelenFormulier({ persoonId, naam, doelen, onOpgeslagen, onAnnuleer }: FormProps) {
  const [v, setV] = useState<Concept>(() => naarConcept(doelen))
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)
  const zet = (k: keyof Concept, w: string) => setV((x) => ({ ...x, [k]: w }))

  async function opslaan(e: FormEvent) {
    e.preventDefault()
    if (bezig) return
    setBezig(true)
    setFout(null)
    const uit = await haalJson(`/api/lifeos/pt-team/${encodeURIComponent(persoonId)}/doelen`, leesDoelen, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(v),
    })
    setBezig(false)
    if (!uit.ok) return setFout(uit.fout)
    onOpgeslagen(uit.waarde)
  }

  return (
    <form className="ptd-form" onSubmit={(e) => void opslaan(e)} aria-labelledby="doelen-form-kop">
      <h3 id="doelen-form-kop">Doelen voor {naam}</h3>
      <p className="ptd-hint">Leeg laten of 0 = geen doel. De voortgang rekent het dashboard zelf uit met wat {naam} invult.</p>
      <div className="ptd-raster">
        {VELDEN.map((f) => (
          <Veld key={f.soort} label={f.label} id={`doel-invoer-${f.soort}`} hint={f.hint}>
            <input
              id={`doel-invoer-${f.soort}`}
              className="ptd-invoer"
              type="number"
              inputMode="numeric"
              min={0}
              max={DOEL_MAX[f.soort]}
              step={1}
              value={v[f.soort]}
              onChange={(e) => zet(f.soort, e.target.value)}
            />
          </Veld>
        ))}
      </div>
      <Veld label="Toelichting voor de PT'er" id="doel-notitie" hint={`Optioneel, max. ${NOTITIE_MAX} tekens. ${naam} ziet dit bij de doelen.`}>
        <textarea
          id="doel-notitie"
          className="ptd-invoer"
          value={v.notitie}
          onChange={(e) => zet('notitie', e.target.value)}
          maxLength={NOTITIE_MAX}
          placeholder="Bijv. deze maand: na elke intake om een referral vragen."
        />
      </Veld>
      <div className="ptd-acties">
        <button type="submit" className="ptd-knop ptd-knop--primair" disabled={bezig}>{bezig ? 'Opslaan…' : 'Doelen opslaan'}</button>
        <button type="button" className="ptd-knop" onClick={onAnnuleer} disabled={bezig}>Annuleren</button>
      </div>
      {fout ? <Foutmelding bericht={fout} /> : null}
    </form>
  )
}
