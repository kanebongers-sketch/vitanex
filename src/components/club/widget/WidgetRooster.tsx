'use client'

import { useMemo, useRef, useState } from 'react'
import { ArrowUpRight, Clock, MapPin, User } from 'lucide-react'
import { dagLabel, lestypenVan, perDag, type WidgetLes } from '@/lib/club/widget/rooster'
import { WidgetAanvraag } from './WidgetAanvraag'
import { useHoogteMelder } from './useHoogteMelder'
import { useTaal, useTekst } from '@/lib/aiyourgym/taal/client'
import { WIDGET } from '@/lib/aiyourgym/taal/woorden/club/widget'

// De boekingswidget op de website van een sportschool: het groepslesrooster
// van een vestiging voor de komende 7 dagen, met een filter op lestype. Een
// bezoeker vraagt een proefles in een les aan, of een kennismaking. Leden
// boeken in de ledenapp. Alleen openbare gegevens (zie src/lib/club/widget).

interface WidgetRoosterProps {
  organisatie: string
  vestiging: string
  lessen: WidgetLes[]
  /** Het moment van renderen (ISO), zodat server en browser dezelfde dagen tonen. */
  nu: string
  /** Waar een proefles-aanvraag heen gaat (een lead in Club); null zonder het pakket Groei: dan boekt een les via de ledenapp. */
  apiPad: string | null
  ledenappUrl: string
  privacyUrl: string | null
  voorbeeld: boolean
  fout: boolean
}

type RoosterTekst = (typeof WIDGET)['nl']['rooster']

function plekTekst(les: WidgetLes, t: RoosterTekst): string {
  if (les.plek === 'weinig') return t.nogPlekken(les.vrij ?? 0)
  return les.plek === 'vol' ? t.vol : t.plekVrij
}

function LesRegel({ les, onKies }: { les: WidgetLes; onKies: (les: WidgetLes) => void }) {
  const vol = les.plek === 'vol'
  const t = useTekst(WIDGET).rooster
  return (
    <li className={`ayg-w-les${vol ? ' is-vol' : ''}`}>
      <time className="ayg-w-tijd" dateTime={les.startOp}>{les.tijd}</time>
      <div className="ayg-w-lesinfo">
        <strong>{les.naam}</strong>
        <span className="ayg-w-meta">
          <span><Clock size={13} aria-hidden /> {t.minuten(les.duurMin)}</span>
          {les.zaal && <span><MapPin size={13} aria-hidden /> {les.zaal}</span>}
          {les.instructeur && <span><User size={13} aria-hidden /> {les.instructeur}</span>}
        </span>
      </div>
      <span className={`ayg-w-plek is-${les.plek}`}>{plekTekst(les, t)}</span>
      <button type="button" className="ayg-w-knop ayg-w-knop--klein" disabled={vol} onClick={() => onKies(les)} aria-label={t.proeflesAanvragen(les.naam, les.tijd)}>
        {vol ? t.vol : t.proefles}
      </button>
    </li>
  )
}

export function WidgetRooster(p: WidgetRoosterProps) {
  const root = useRef<HTMLDivElement>(null)
  const taal = useTaal()
  const t = useTekst(WIDGET).rooster
  useHoogteMelder(root)
  const dagen = useMemo(() => perDag(p.lessen, new Date(p.nu)), [p.lessen, p.nu])
  const lestypen = useMemo(() => lestypenVan(p.lessen), [p.lessen])
  const eersteMetLes = Math.max(0, dagen.findIndex((d) => d.lessen.length > 0))
  const [dagIndex, setDagIndex] = useState(eersteMetLes)
  const [filter, setFilter] = useState<string | null>(null)
  const [aanvraag, setAanvraag] = useState<{ les: WidgetLes | null } | null>(null)

  const dag = dagen[dagIndex] ?? dagen[0]
  const zichtbaar = (dag?.lessen ?? []).filter((l) => !filter || l.lestypeId === filter)
  const telling = (lessen: readonly WidgetLes[]) => lessen.filter((l) => !filter || l.lestypeId === filter).length

  return (
    <div ref={root} className="ayg-w">
      {p.voorbeeld && <p className="ayg-w-voorbeeld">{t.voorbeeld}</p>}
      <header className="ayg-w-kop">
        <div>
          <p className="ayg-w-boven">{p.organisatie}</p>
          <h1>{t.lesrooster} <span>{p.vestiging}</span></h1>
        </div>
        <a className="ayg-w-lidlink" href={p.ledenappUrl} target="_blank" rel="noopener">
          {t.alLid} <ArrowUpRight size={15} aria-hidden />
        </a>
      </header>

      {aanvraag && p.apiPad ? (
        <WidgetAanvraag
          les={aanvraag.les}
          organisatie={p.organisatie}
          apiPad={p.apiPad}
          privacyUrl={p.privacyUrl}
          voorbeeld={p.voorbeeld}
          onTerug={() => setAanvraag(null)}
        />
      ) : (
        <>
          <div className="ayg-w-dagen" role="tablist" aria-label={t.kiesDag}>
            {dagen.map((d, i) => {
              const [wd, nr] = dagLabel(d.dag, taal).split(' ')
              const aantal = telling(d.lessen)
              return (
                <button
                  key={d.dag}
                  type="button"
                  role="tab"
                  aria-selected={i === dagIndex}
                  className="ayg-w-dag"
                  onClick={() => setDagIndex(i)}
                  aria-label={t.dagLessen(dagLabel(d.dag, taal), aantal)}
                >
                  <span>{i === 0 ? t.vandaag : wd}</span>
                  <strong>{nr}</strong>
                  <i className={aantal > 0 ? 'is-les' : undefined} aria-hidden />
                </button>
              )
            })}
          </div>

          {lestypen.length > 1 && (
            <div className="ayg-w-filter" role="group" aria-label={t.filter}>
              <button type="button" aria-pressed={filter === null} onClick={() => setFilter(null)}>{t.alleLessen}</button>
              {lestypen.map((lt) => (
                <button key={lt.id} type="button" aria-pressed={filter === lt.id} onClick={() => setFilter(filter === lt.id ? null : lt.id)}>
                  {lt.naam}
                </button>
              ))}
            </div>
          )}

          <div role="tabpanel" aria-label={dag ? dagLabel(dag.dag, taal) : undefined}>
            {p.fout ? (
              <p className="ayg-w-leeg">{t.fout}</p>
            ) : zichtbaar.length === 0 ? (
              <p className="ayg-w-leeg">{filter ? t.nietOpDag : t.geenLessen}</p>
            ) : (
              <ul className="ayg-w-lessen">
                {zichtbaar.map((les) => <LesRegel key={les.id} les={les} onKies={(l) => (p.apiPad ? setAanvraag({ les: l }) : window.open(p.ledenappUrl, '_blank', 'noopener'))} />)}
              </ul>
            )}
          </div>

          {p.apiPad && <aside className="ayg-w-kennis">
            <div>
              <strong>{t.kennisKop}</strong>
              <span>{t.kennisTekst}</span>
            </div>
            <button type="button" className="ayg-w-knop ayg-w-knop--rustig" onClick={() => setAanvraag({ les: null })}>{t.kennisKnop}</button>
          </aside>}
        </>
      )}
    </div>
  )
}
