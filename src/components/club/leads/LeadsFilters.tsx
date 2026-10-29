import Link from 'next/link'
import { LEAD_BRONNEN } from '@/lib/club/leads/model'
import { PERIODES, filterParams, heeftFilters, type LeadFilters } from '@/lib/club/leads/filters'
import { clubTekst } from '@/lib/aiyourgym/taal/server'
import { LEADS } from '@/lib/aiyourgym/taal/woorden/club/leads'
import { clubPad, VESTIGING_PARAM, type Vestiging } from '@/lib/club/kern/vestiging'

interface LeadsFiltersProps {
  vestiging: Vestiging
  filters: LeadFilters
  medewerkers: { id: string; naam: string }[]
}

// Filters als gewoon GET-formulier: werkt zonder JavaScript, staat in de URL en
// is dus deelbaar. De weergave (pijplijn of lijst) zijn twee links.
export async function LeadsFilters({ vestiging, filters, medewerkers }: LeadsFiltersProps) {
  const tekst = await clubTekst(LEADS)
  const t = tekst.filters
  const pad = (extra: Record<string, string>) => clubPad('/leads', vestiging, extra)
  const zonderWeergave = { ...filters, weergave: 'pijplijn' as const }
  return (
    <section className="club-leads-filterbalk" aria-label={t.label}>
      <form method="get" action="/club/leads" className="club-leads-filters">
        <input type="hidden" name={VESTIGING_PARAM} value={vestiging} />
        {filters.weergave === 'lijst' && <input type="hidden" name="weergave" value="lijst" />}
        <label className="club-veld">
          <span>{t.bron}</span>
          <select name="bron" defaultValue={filters.bron ?? ''} className="club-invoer">
            <option value="">{t.alleBronnen}</option>
            {LEAD_BRONNEN.map((b) => (
              <option key={b} value={b}>
                {tekst.bron[b]}
              </option>
            ))}
          </select>
        </label>
        <label className="club-veld">
          <span>{t.medewerker}</span>
          <select name="mw" defaultValue={filters.medewerker ?? ''} className="club-invoer">
            <option value="">{t.iedereen}</option>
            <option value="geen">{t.nietToegewezen}</option>
            {medewerkers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.naam}
              </option>
            ))}
          </select>
        </label>
        <label className="club-veld">
          <span>{t.binnengekomen}</span>
          <select name="periode" defaultValue={filters.periode} className="club-invoer">
            {PERIODES.map((p) => (
              <option key={p} value={p}>
                {tekst.periode[p]}
              </option>
            ))}
          </select>
        </label>
        <div className="club-leads-filterknoppen">
          <button type="submit" className="club-knop">
            {t.toon}
          </button>
          {heeftFilters(filters) && (
            <Link href={pad(filters.weergave === 'lijst' ? { weergave: 'lijst' } : {})} className="club-knop club-knop--stil">
              {t.wis}
            </Link>
          )}
        </div>
      </form>
      <nav className="club-segment" aria-label={t.weergave}>
        <Link href={pad(filterParams(zonderWeergave))} aria-current={filters.weergave === 'pijplijn' ? 'page' : undefined}>
          {t.pijplijn}
        </Link>
        <Link href={pad(filterParams({ ...filters, weergave: 'lijst' }))} aria-current={filters.weergave === 'lijst' ? 'page' : undefined}>
          {t.lijst}
        </Link>
      </nav>
    </section>
  )
}
