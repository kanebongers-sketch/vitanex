'use client'

import { useId, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2 } from 'lucide-react'
import { stuur } from '@/components/club/leden/stuur'
import { PRODUCT_TYPEN, PRODUCT_TYPE_LABEL, euro, productInhoud, type Product, type ProductType } from '@/lib/club/betalen/model'

// Producten van de sportschool: lijst met grote prijs, rechts het formulier
// voor nieuw of wijzigen. Prijs in euro's ingevuld, opgeslagen in centen incl. btw.

interface VestigingKeuze {
  sleutel: string
  naam: string
}

interface Props {
  producten: Product[]
  vestigingen: VestigingKeuze[]
}

interface Concept {
  id: string | null
  naam: string
  omschrijving: string
  type: ProductType
  prijs: string
  btw: '9' | '21'
  tegoeden: string
  geldig: string
  vestigingen: string[]
  actief: boolean
}

function leeg(alle: string[]): Concept {
  return { id: null, naam: '', omschrijving: '', type: 'strippenkaart', prijs: '', btw: '21', tegoeden: '10', geldig: '180', vestigingen: alle, actief: true }
}

function uitProduct(p: Product, alle: string[]): Concept {
  return {
    id: p.id,
    naam: p.naam,
    omschrijving: p.omschrijving ?? '',
    type: p.type,
    prijs: (p.prijsCent / 100).toFixed(2).replace('.', ','),
    btw: p.btwProcent === 9 ? '9' : '21',
    tegoeden: p.tegoeden ? String(p.tegoeden) : '',
    geldig: p.geldigDagen ? String(p.geldigDagen) : '',
    vestigingen: p.vestigingen ?? alle,
    actief: p.actief,
  }
}

/** "12,50" of "12.50" naar 1250 centen; NaN als het geen bedrag is. */
function naarCenten(tekst: string): number {
  const schoon = tekst.trim().replace(/\s|€/g, '').replace(',', '.')
  return /^\d{1,5}(\.\d{1,2})?$/.test(schoon) ? Math.round(Number(schoon) * 100) : NaN
}

function body(c: Concept) {
  return {
    naam: c.naam,
    omschrijving: c.omschrijving || null,
    type: c.type,
    prijsCent: naarCenten(c.prijs),
    btwProcent: Number(c.btw),
    tegoeden: c.tegoeden ? Number(c.tegoeden) : null,
    geldigDagen: c.geldig ? Number(c.geldig) : null,
    vestigingen: c.vestigingen,
    actief: c.actief,
  }
}

export function ProductenBeheer({ producten, vestigingen }: Props) {
  const id = useId()
  const router = useRouter()
  const alle = vestigingen.map((v) => v.sleutel)
  const [c, setC] = useState<Concept>(() => leeg(alle))
  const [bezig, start] = useTransition()
  const [bericht, setBericht] = useState<{ tekst: string; fout: boolean } | null>(null)
  const zet = (veld: Partial<Concept>) => setC((oud) => ({ ...oud, ...veld }))

  function bewaar(e: React.FormEvent) {
    e.preventDefault()
    if (Number.isNaN(naarCenten(c.prijs))) return setBericht({ tekst: 'Vul een prijs in, bijvoorbeeld 12,50.', fout: true })
    start(async () => {
      const uit = c.id ? await stuur(`/api/club/betalen/producten/${c.id}`, 'PATCH', body(c)) : await stuur('/api/club/betalen/producten', 'POST', body(c))
      if (!uit.ok) return setBericht({ tekst: uit.fout, fout: true })
      setBericht({ tekst: c.id ? 'Product opgeslagen.' : 'Product toegevoegd.', fout: false })
      setC(leeg(alle))
      router.refresh()
    })
  }

  function weg(p: Product) {
    if (!window.confirm(`${p.naam} verwijderen? Is er al van verkocht, dan gaat het alleen uit de verkoop.`)) return
    start(async () => {
      const uit = await stuur(`/api/club/betalen/producten/${p.id}`, 'DELETE')
      if (!uit.ok) return setBericht({ tekst: uit.fout, fout: true })
      const uitkomst = (uit.data as { uitkomst?: unknown } | null)?.uitkomst
      setBericht({ tekst: uitkomst === 'uit' ? `${p.naam} is uit de verkoop gehaald (er is al van verkocht).` : `${p.naam} is verwijderd.`, fout: false })
      router.refresh()
    })
  }

  const metTegoed = c.type === 'strippenkaart' || c.type === 'pt_pakket'
  return (
    <section aria-labelledby={`${id}-kop`}>
      <h2 id={`${id}-kop`} className="club-betalen-kop">Producten</h2>
      <div className="club-betalen-werkvlak">
        <div>
          {producten.length === 0 ? (
            <p className="club-hint">Nog geen producten. Begin bijvoorbeeld met een strippenkaart van 10 lessen of een PT-pakket van 5 sessies.</p>
          ) : (
            <ul className="club-betalen-lijst">
              {producten.map((p) => (
                <li key={p.id} className="club-betalen-product" data-actief={p.actief}>
                  <div>
                    <h3>{p.naam}</h3>
                    <p>{PRODUCT_TYPE_LABEL[p.type]} · {productInhoud(p)}{p.actief ? '' : ' · Niet te koop'}</p>
                  </div>
                  <div className="club-betalen-prijs">
                    {euro(p.prijsCent)}
                    <small>incl. {p.btwProcent}% btw</small>
                  </div>
                  <div className="club-betalen-acties">
                    <button type="button" className="club-knop club-knop--klein" onClick={() => setC(uitProduct(p, alle))} disabled={bezig}>
                      <Pencil size={14} aria-hidden /> Wijzigen
                    </button>
                    <button type="button" className="club-knop club-knop--klein club-knop--gevaar" onClick={() => weg(p)} disabled={bezig}>
                      <Trash2 size={14} aria-hidden /> Verwijderen
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <form className="club-betalen-formulier" onSubmit={bewaar} aria-labelledby={`${id}-form`}>
          <h3 id={`${id}-form`} className="club-boventitel">{c.id ? 'Product wijzigen' : 'Nieuw product'}</h3>
          <label className="club-veld"><span>Soort</span>
            <select className="club-invoer" value={c.type} onChange={(e) => zet({ type: e.target.value as ProductType, tegoeden: e.target.value === 'pt_pakket' ? '5' : e.target.value === 'strippenkaart' ? '10' : '' })}>
              {PRODUCT_TYPEN.map((t) => <option key={t} value={t}>{PRODUCT_TYPE_LABEL[t]}</option>)}
            </select>
          </label>
          <label className="club-veld"><span>Naam</span>
            <input className="club-invoer" required minLength={2} maxLength={80} value={c.naam} onChange={(e) => zet({ naam: e.target.value })} placeholder="Strippenkaart 10 lessen" />
          </label>
          <label className="club-veld"><span>Omschrijving (optioneel)</span>
            <textarea className="club-invoer" rows={2} maxLength={300} value={c.omschrijving} onChange={(e) => zet({ omschrijving: e.target.value })} />
          </label>
          <div className="club-betalen-rij">
            <label className="club-veld"><span>Prijs incl. btw (euro)</span>
              <input className="club-invoer" inputMode="decimal" required value={c.prijs} onChange={(e) => zet({ prijs: e.target.value })} placeholder="99,00" />
            </label>
            <label className="club-veld"><span>Btw</span>
              <select className="club-invoer" value={c.btw} onChange={(e) => zet({ btw: e.target.value === '9' ? '9' : '21' })}>
                <option value="21">21 procent</option>
                <option value="9">9 procent</option>
              </select>
            </label>
          </div>
          {c.type !== 'product' && (
            <div className="club-betalen-rij">
              {metTegoed && (
                <label className="club-veld"><span>{c.type === 'pt_pakket' ? 'Sessies' : 'Lessen'}</span>
                  <input className="club-invoer" type="number" min={c.type === 'strippenkaart' ? 2 : 1} max={200} required value={c.tegoeden} onChange={(e) => zet({ tegoeden: e.target.value })} />
                </label>
              )}
              <label className="club-veld"><span>Geldig (dagen, leeg = onbeperkt)</span>
                <input className="club-invoer" type="number" min={1} max={1095} value={c.geldig} onChange={(e) => zet({ geldig: e.target.value })} />
              </label>
            </div>
          )}
          {vestigingen.length > 1 && (
            <fieldset className="club-betalen-vinkjes">
              <legend>Te koop in</legend>
              {vestigingen.map((v) => (
                <label key={v.sleutel}>
                  <input type="checkbox" checked={c.vestigingen.includes(v.sleutel)} onChange={(e) => zet({ vestigingen: e.target.checked ? [...c.vestigingen, v.sleutel] : c.vestigingen.filter((x) => x !== v.sleutel) })} /> {v.naam}
                </label>
              ))}
            </fieldset>
          )}
          <label><input type="checkbox" checked={c.actief} onChange={(e) => zet({ actief: e.target.checked })} /> Te koop in de ledenapp</label>
          <p className="club-hint">Btw: de prijs is inclusief btw. Welk tarief klopt (9 of 21 procent) bepaal je met je boekhouder.</p>
          <div className="club-acties">
            <button type="submit" className="club-knop club-knop--primair" disabled={bezig}>{c.id ? 'Opslaan' : 'Toevoegen'}</button>
            {c.id && <button type="button" className="club-knop" onClick={() => setC(leeg(alle))} disabled={bezig}>Annuleren</button>}
          </div>
          <div aria-live="polite">{bericht && <p className={`club-melding ${bericht.fout ? 'club-melding--fout' : ''}`} role="status">{bericht.tekst}</p>}</div>
        </form>
      </div>
    </section>
  )
}
