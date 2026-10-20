'use client'

import { useMemo, useRef, useState } from 'react'
import { ArrowUpRight, Clock, MapPin, User } from 'lucide-react'
import { dagLabel, lestypenVan, perDag, type WidgetLes } from '@/lib/club/widget/rooster'
import { WidgetAanvraag } from './WidgetAanvraag'
import { useHoogteMelder } from './useHoogteMelder'

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
  apiPad: string
  ledenappUrl: string
  privacyUrl: string | null
  voorbeeld: boolean
  fout: boolean
}

const PLEK_TEKST = { vol: 'Vol', weinig: '', vrij: 'Plek vrij' } as const

function plekTekst(les: WidgetLes): string {
  if (les.plek === 'weinig') return les.vrij === 1 ? 'Nog 1 plek' : `Nog ${les.vrij} plekken`
  return PLEK_TEKST[les.plek]
}

function LesRegel({ les, onKies }: { les: WidgetLes; onKies: (les: WidgetLes) => void }) {
  const vol = les.plek === 'vol'
  return (
    <li className={`ayg-w-les${vol ? ' is-vol' : ''}`}>
      <time className="ayg-w-tijd" dateTime={les.startOp}>{les.tijd}</time>
      <div className="ayg-w-lesinfo">
        <strong>{les.naam}</strong>
        <span className="ayg-w-meta">
          <span><Clock size={13} aria-hidden /> {les.duurMin} min</span>
          {les.zaal && <span><MapPin size={13} aria-hidden /> {les.zaal}</span>}
          {les.instructeur && <span><User size={13} aria-hidden /> {les.instructeur}</span>}
        </span>
      </div>
      <span className={`ayg-w-plek is-${les.plek}`}>{plekTekst(les)}</span>
      <button type="button" className="ayg-w-knop ayg-w-knop--klein" disabled={vol} onClick={() => onKies(les)} aria-label={`Proefles aanvragen: ${les.naam} om ${les.tijd}`}>
        {vol ? 'Vol' : 'Proefles'}
      </button>
    </li>
  )
}

export function WidgetRooster(p: WidgetRoosterProps) {
  const root = useRef<HTMLDivElement>(null)
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
      {p.voorbeeld && <p className="ayg-w-voorbeeld">Voorvertoning. Aanvragen worden niet verstuurd.</p>}
      <header className="ayg-w-kop">
        <div>
          <p className="ayg-w-boven">{p.organisatie}</p>
          <h1>Lesrooster <span>{p.vestiging}</span></h1>
        </div>
        <a className="ayg-w-lidlink" href={p.ledenappUrl} target="_blank" rel="noopener">
          Al lid? Boek in de ledenapp <ArrowUpRight size={15} aria-hidden />
        </a>
      </header>

      {aanvraag ? (
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
          <div className="ayg-w-dagen" role="tablist" aria-label="Kies een dag">
            {dagen.map((d, i) => {
              const [wd, nr] = dagLabel(d.dag).split(' ')
              const aantal = telling(d.lessen)
              return (
                <button
                  key={d.dag}
                  type="button"
                  role="tab"
                  aria-selected={i === dagIndex}
                  className="ayg-w-dag"
                  onClick={() => setDagIndex(i)}
                  aria-label={`${dagLabel(d.dag)}, ${aantal} ${aantal === 1 ? 'les' : 'lessen'}`}
                >
                  <span>{i === 0 ? 'Vandaag' : wd}</span>
                  <strong>{nr}</strong>
                  <i className={aantal > 0 ? 'is-les' : undefined} aria-hidden />
                </button>
              )
            })}
          </div>

          {lestypen.length > 1 && (
            <div className="ayg-w-filter" role="group" aria-label="Filter op les">
              <button type="button" aria-pressed={filter === null} onClick={() => setFilter(null)}>Alle lessen</button>
              {lestypen.map((t) => (
                <button key={t.id} type="button" aria-pressed={filter === t.id} onClick={() => setFilter(filter === t.id ? null : t.id)}>
                  {t.naam}
                </button>
              ))}
            </div>
          )}

          <div role="tabpanel" aria-label={dag ? dagLabel(dag.dag) : undefined}>
            {p.fout ? (
              <p className="ayg-w-leeg">Het rooster kon niet worden geladen. Probeer het later opnieuw.</p>
            ) : zichtbaar.length === 0 ? (
              <p className="ayg-w-leeg">{filter ? 'Deze les staat niet op deze dag.' : 'Geen groepslessen op deze dag.'}</p>
            ) : (
              <ul className="ayg-w-lessen">
                {zichtbaar.map((les) => <LesRegel key={les.id} les={les} onKies={(l) => setAanvraag({ les: l })} />)}
              </ul>
            )}
          </div>

          <aside className="ayg-w-kennis">
            <div>
              <strong>Liever eerst kennismaken?</strong>
              <span>Een rondleiding en een gesprek, zonder verplichtingen.</span>
            </div>
            <button type="button" className="ayg-w-knop ayg-w-knop--rustig" onClick={() => setAanvraag({ les: null })}>Kennismaking aanvragen</button>
          </aside>
        </>
      )}
    </div>
  )
}
