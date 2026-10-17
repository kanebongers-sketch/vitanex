'use client'

import { LID_STATUSSEN, LID_STATUS_LABEL } from '@/lib/club/kern/lid'
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
  return (
    <>
      <fieldset className="club-bericht-groep">
        <legend className="club-label">Vestigingen</legend>
        <div className="club-bericht-vinken">
          <label className="club-bericht-vink">
            <input type="checkbox" checked={alle} onChange={() => zet({ vestigingen: alle && vestigingen[0] ? [vestigingen[0].sleutel] : [] })} />
            Alle vestigingen
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
        <legend className="club-label">Alleen voor</legend>
        <div className="club-bericht-vinken">
          {LID_STATUSSEN.map((s) => (
            <label key={s} className="club-bericht-vink">
              <input type="checkbox" checked={concept.statussen.includes(s)} onChange={() => zet({ statussen: wissel(concept.statussen, s) })} />
              {LID_STATUS_LABEL[s]}
            </label>
          ))}
        </div>
        <p className="club-hint">Niets aangevinkt: alle leden zien het.</p>
      </fieldset>

      <label className="club-veld">
        <span>Tag (optioneel)</span>
        <input
          className="club-invoer"
          list="club-bericht-tags"
          maxLength={TAG_MAX}
          value={concept.tag}
          placeholder="Bijvoorbeeld Ochtendploeg"
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
