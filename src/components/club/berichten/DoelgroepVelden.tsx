'use client'

import { LID_STATUSSEN, lidStatusLabel } from '@/lib/club/kern/lid'
import { useTaal, useTekst } from '@/lib/aiyourgym/taal/client'
import { BERICHTEN } from '@/lib/aiyourgym/taal/woorden/club/berichten'
import { TAG_MAX } from '@/lib/club/berichten/model'
import type { VestigingInfo } from '@/lib/club/kern/vestigingen'
import { wissel, type Concept } from './concept'

// Voor wie het bericht is: vestigingen, lidstatus en optioneel een tag.

interface Props {
  concept: Concept
  vestigingen: readonly VestigingInfo[]
  tags: readonly string[]
  zet: (patch: Partial<Concept>) => void
}

export function DoelgroepVelden({ concept, vestigingen, tags, zet }: Props) {
  const alle = concept.vestigingen.length === 0
  const taal = useTaal()
  const t = useTekst(BERICHTEN).doelgroepVelden
  return (
    <>
      <fieldset className="club-bericht-groep">
        <legend className="club-label">{t.vestigingen}</legend>
        <div className="club-bericht-vinken">
          <label className="club-bericht-vink">
            <input type="checkbox" checked={alle} onChange={() => zet({ vestigingen: alle && vestigingen[0] ? [vestigingen[0].sleutel] : [] })} />
            {t.alleVestigingen}
          </label>
          {vestigingen.map((v) => (
            <label key={v.sleutel} className="club-bericht-vink">
              <input
                type="checkbox"
                checked={alle || concept.vestigingen.includes(v.sleutel)}
                onChange={() => {
                  // Minstens een vestiging: de laatste uitvinken kan niet (dan "Alle vestigingen" kiezen).
                  const nieuw = wissel(alle ? vestigingen.map((x) => x.sleutel) : concept.vestigingen, v.sleutel)
                  if (nieuw.length > 0) zet({ vestigingen: nieuw.length === vestigingen.length ? [] : nieuw })
                }}
              />
              {v.naam}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="club-bericht-groep">
        <legend className="club-label">{t.alleenVoor}</legend>
        <div className="club-bericht-vinken">
          {LID_STATUSSEN.map((s) => (
            <label key={s} className="club-bericht-vink">
              <input type="checkbox" checked={concept.statussen.includes(s)} onChange={() => zet({ statussen: wissel(concept.statussen, s) })} />
              {lidStatusLabel(s, taal)}
            </label>
          ))}
        </div>
        <p className="club-hint">{t.nietsAangevinkt}</p>
      </fieldset>

      <label className="club-veld">
        <span>{t.tag}</span>
        <input
          className="club-invoer"
          list="club-bericht-tags"
          maxLength={TAG_MAX}
          value={concept.tag}
          placeholder={t.tagVoorbeeld}
          onChange={(e) => zet({ tag: e.target.value })}
        />
        <datalist id="club-bericht-tags">
          {tags.map((t) => (
            <option key={t} value={t} />
          ))}
        </datalist>
      </label>
    </>
  )
}
