'use client'

import { Veld } from '@/components/lifeos/pt-dashboard/velden'
import { BESCHRIJVING_MAX, CATEGORIEEN, CATEGORIE_LABEL, TITEL_MAX, VOLGORDE_MAX, type DocCategorie } from '@/lib/lifeos/pt-dashboard/documenten'
import { isCategorie, type PtDocument } from '@/lib/lifeos/pt-dashboard/documenten-lezers'

// De velden van een document — gedeeld door het uploadvoorstel en het
// bewerkformulier, zodat beide precies hetzelfde vragen.

export interface DocConcept {
  titel: string
  beschrijving: string
  categorie: DocCategorie
  /** Als tekst, zodat een leeg veld leeg mag blijven tijdens het typen. */
  volgorde: string
  zichtbaar: boolean
}

export function conceptVan(d: Pick<PtDocument, 'titel' | 'beschrijving' | 'categorie' | 'volgorde' | 'zichtbaar'>): DocConcept {
  return { titel: d.titel, beschrijving: d.beschrijving ?? '', categorie: d.categorie, volgorde: String(d.volgorde), zichtbaar: d.zichtbaar }
}

/** Naar de body van de API; de server valideert opnieuw. */
export function metaVan(c: DocConcept) {
  return {
    titel: c.titel,
    beschrijving: c.beschrijving.trim() || null,
    categorie: c.categorie,
    volgorde: c.volgorde.trim() === '' ? 0 : Number(c.volgorde),
    zichtbaar: c.zichtbaar,
  }
}

interface Props {
  id: string
  waarde: DocConcept
  onWijzig: (w: DocConcept) => void
  uit?: boolean
}

export function DocumentVelden({ id, waarde, onWijzig, uit = false }: Props) {
  const zet = <K extends keyof DocConcept>(k: K, v: DocConcept[K]) => onWijzig({ ...waarde, [k]: v })
  return (
    <>
      <Veld label="Titel" id={`${id}-titel`}>
        <input
          id={`${id}-titel`}
          className="ptd-invoer"
          value={waarde.titel}
          maxLength={TITEL_MAX}
          required
          disabled={uit}
          onChange={(e) => zet('titel', e.target.value)}
        />
      </Veld>
      <div className="ptd-raster">
        <Veld label="Categorie" id={`${id}-cat`}>
          <select id={`${id}-cat`} className="ptd-invoer" value={waarde.categorie} disabled={uit} onChange={(e) => isCategorie(e.target.value) && zet('categorie', e.target.value)}>
            {CATEGORIEEN.map((c) => (
              <option key={c} value={c}>
                {CATEGORIE_LABEL[c]}
              </option>
            ))}
          </select>
        </Veld>
        <Veld label="Volgorde" id={`${id}-volgorde`} hint="Lager staat hoger binnen de categorie.">
          <input
            id={`${id}-volgorde`}
            className="ptd-invoer"
            type="number"
            inputMode="numeric"
            min={0}
            max={VOLGORDE_MAX}
            step={1}
            value={waarde.volgorde}
            disabled={uit}
            onChange={(e) => zet('volgorde', e.target.value)}
          />
        </Veld>
      </div>
      <Veld label="Beschrijving (optioneel)" id={`${id}-beschrijving`} hint="Eén of twee zinnen: wat is het en wanneer gebruik je het.">
        <textarea
          id={`${id}-beschrijving`}
          className="ptd-invoer"
          value={waarde.beschrijving}
          maxLength={BESCHRIJVING_MAX}
          rows={2}
          disabled={uit}
          onChange={(e) => zet('beschrijving', e.target.value)}
        />
      </Veld>
      <label className="ptd-vinkje">
        <input type="checkbox" checked={waarde.zichtbaar} disabled={uit} onChange={(e) => zet('zichtbaar', e.target.checked)} />
        Zichtbaar voor de PT&apos;ers
      </label>
    </>
  )
}
