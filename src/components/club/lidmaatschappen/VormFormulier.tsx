'use client'

import { useId, useState, type FormEvent } from 'react'
import { useVestigingen } from '@/components/club/shell/VestigingenContext'
import { stuur } from '@/components/club/leden/stuur'
import { MAX_LESSEN_PER_WEEK, MAX_NAAM, MAX_OMSCHRIJVING_VORM, type Kleur, type Lidmaatschapsvorm } from '@/lib/club/lidmaatschappen/model'
import { KleurKiezer } from './KleurKiezer'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { LIDMAATSCHAPPEN } from '@/lib/aiyourgym/taal/woorden/club/lidmaatschappen'

// Een lidmaatschapsvorm toevoegen of wijzigen: naam zoals in Sportivity,
// omschrijving, vestigingen, groepslessen (met maximum per week), daluren en
// kleur. Geen prijzen: die staan in Sportivity.

interface Props {
  begin?: Lidmaatschapsvorm
  onKlaar: (tekst: string) => void
  onAnnuleer?: () => void
}

interface Staat {
  naam: string
  omschrijving: string
  alle: boolean
  vestigingen: string[]
  groepslessen: boolean
  max: string
  daluren: boolean
  dalVan: string
  dalTot: string
  dalWeekendVrij: boolean
  kleur: Kleur
  actief: boolean
}

function beginStaat(v?: Lidmaatschapsvorm): Staat {
  return {
    naam: v?.naam ?? '',
    omschrijving: v?.omschrijving ?? '',
    alle: !v || v.vestigingen === null,
    vestigingen: v?.vestigingen ?? [],
    groepslessen: v?.groepslessen ?? true,
    max: v?.maxLessenPerWeek ? String(v.maxLessenPerWeek) : '',
    daluren: Boolean(v?.dalVan),
    dalVan: v?.dalVan ?? '09:00',
    dalTot: v?.dalTot ?? '16:00',
    dalWeekendVrij: v?.dalWeekendVrij ?? true,
    kleur: v?.kleur ?? 'amber',
    actief: v?.actief ?? true,
  }
}

function naarBody(s: Staat) {
  return {
    naam: s.naam,
    omschrijving: s.omschrijving,
    vestigingen: s.alle ? null : s.vestigingen,
    groepslessen: s.groepslessen,
    maxLessenPerWeek: s.groepslessen && s.max !== '' ? Number(s.max) : null,
    dalVan: s.daluren ? s.dalVan : null,
    dalTot: s.daluren ? s.dalTot : null,
    dalWeekendVrij: s.daluren && s.dalWeekendVrij,
    kleur: s.kleur,
    actief: s.actief,
  }
}

export function VormFormulier({ begin, onKlaar, onAnnuleer }: Props) {
  const vestigingen = useVestigingen()
  const id = useId()
  const [s, setS] = useState<Staat>(() => beginStaat(begin))
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)
  const tekst = useTekst(LIDMAATSCHAPPEN)
  const t = tekst.vorm
  const zet = <K extends keyof Staat>(k: K, v: Staat[K]) => setS((oud) => ({ ...oud, [k]: v }))
  const wissel = (slug: string) => zet('vestigingen', s.vestigingen.includes(slug) ? s.vestigingen.filter((x) => x !== slug) : [...s.vestigingen, slug])

  async function bewaar(e: FormEvent) {
    e.preventDefault()
    setBezig(true)
    setFout(null)
    const body = naarBody(s)
    const uit = begin ? await stuur(`/api/club/lidmaatschappen/vormen/${begin.id}`, 'PATCH', body) : await stuur('/api/club/lidmaatschappen/vormen', 'POST', body)
    setBezig(false)
    if (!uit.ok) return setFout(uit.fout)
    if (!begin) setS(beginStaat())
    onKlaar(begin ? t.aangepast(s.naam) : t.toegevoegd(s.naam))
  }

  return (
    <form className="club-lidm-form" onSubmit={(e) => void bewaar(e)} aria-describedby={fout ? `${id}-fout` : undefined}>
      <label className="club-veld">
        <span>{t.naam}</span>
        <input className="club-invoer" required maxLength={MAX_NAAM} value={s.naam} onChange={(e) => zet('naam', e.target.value)} placeholder={t.voorbeeld} />
      </label>
      <label className="club-veld">
        <span>{tekst.algemeen.omschrijving}</span>
        <textarea className="club-invoer" rows={2} maxLength={MAX_OMSCHRIJVING_VORM} value={s.omschrijving} onChange={(e) => zet('omschrijving', e.target.value)} />
      </label>

      <fieldset className="club-lidm-groep">
        <legend className="club-label">{t.vestigingen}</legend>
        <label className="club-lidm-vink">
          <input type="checkbox" checked={s.alle} onChange={(e) => zet('alle', e.target.checked)} /> {t.alleVestigingen}
        </label>
        {!s.alle && (
          <div className="club-lidm-vinkrij">
            {vestigingen.map((v) => (
              <label key={v.sleutel} className="club-lidm-vink">
                <input type="checkbox" checked={s.vestigingen.includes(v.sleutel)} onChange={() => wissel(v.sleutel)} /> {v.naam}
              </label>
            ))}
          </div>
        )}
      </fieldset>

      <fieldset className="club-lidm-groep">
        <legend className="club-label">{t.groepslessen}</legend>
        <label className="club-lidm-vink">
          <input type="checkbox" checked={s.groepslessen} onChange={(e) => zet('groepslessen', e.target.checked)} /> {t.magBoeken}
        </label>
        {s.groepslessen && (
          <label className="club-veld club-lidm-smal">
            <span>{t.maxPerWeek}</span>
            <input className="club-invoer" type="number" inputMode="numeric" min={1} max={MAX_LESSEN_PER_WEEK} value={s.max} onChange={(e) => zet('max', e.target.value)} placeholder={t.onbeperkt} />
          </label>
        )}
      </fieldset>

      <fieldset className="club-lidm-groep">
        <legend className="club-label">{t.daluren}</legend>
        <label className="club-lidm-vink">
          <input type="checkbox" checked={s.daluren} onChange={(e) => zet('daluren', e.target.checked)} /> {t.alleenTijden}
        </label>
        {s.daluren && (
          <>
            <div className="club-formrij club-lidm-tijden">
              <label className="club-veld">
                <span>{t.van}</span>
                <input className="club-invoer" type="time" required value={s.dalVan} onChange={(e) => zet('dalVan', e.target.value)} />
              </label>
              <label className="club-veld">
                <span>{t.tot}</span>
                <input className="club-invoer" type="time" required value={s.dalTot} onChange={(e) => zet('dalTot', e.target.value)} />
              </label>
            </div>
            <label className="club-lidm-vink">
              <input type="checkbox" checked={s.dalWeekendVrij} onChange={(e) => zet('dalWeekendVrij', e.target.checked)} /> {t.weekend}
            </label>
          </>
        )}
      </fieldset>

      <KleurKiezer naam={`${id}-kleur`} waarde={s.kleur} onKies={(k) => zet('kleur', k)} />
      <label className="club-lidm-vink">
        <input type="checkbox" checked={s.actief} onChange={(e) => zet('actief', e.target.checked)} /> {t.teKoop}
      </label>

      <div id={`${id}-fout`} role="alert">
        {fout && <p className="club-melding club-melding--fout">{fout}</p>}
      </div>
      <div className="club-lidm-formacties">
        <button type="submit" className="club-knop club-knop--primair" disabled={bezig}>
          {bezig ? tekst.algemeen.bezig : begin ? tekst.algemeen.opslaan : t.toevoegen}
        </button>
        {onAnnuleer && (
          <button type="button" className="club-knop club-knop--stil" onClick={onAnnuleer}>
            {tekst.algemeen.annuleren}
          </button>
        )}
      </div>
    </form>
  )
}
