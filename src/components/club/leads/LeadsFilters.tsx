import Link from 'next/link'
import { LEAD_BRONNEN, LEAD_BRON_LABEL } from '@/lib/club/leads/model'
import { PERIODES, PERIODE_LABEL, filterParams, heeftFilters, type LeadFilters } from '@/lib/club/leads/filters'
import { clubPad, VESTIGING_PARAM, type Vestiging } from '@/lib/club/gedeeld/vestiging'

interface LeadsFiltersProps {
  vestiging: Vestiging
  filters: LeadFilters
  medewerkers: { id: string; naam: string }[]
}

// Filters als gewoon GET-formulier: werkt zonder JavaScript, staat in de URL en
// is dus deelbaar. De weergave (pijplijn of lijst) zijn twee links.
export function LeadsFilters({ vestiging, filters, medewerkers }: LeadsFiltersProps) {
  const pad = (extra: Record<string, string>) => clubPad('/leads', vestiging, extra)
  const zonderWeergave = { ...filters, weergave: 'pijplijn' as const }
  return (
    <section className="club-leads-filterbalk" aria-label="Filters en weergave">
      <form method="get" action="/clubkane/leads" className="club-leads-filters">
        <input type="hidden" name={VESTIGING_PARAM} value={vestiging} />
        {filters.weergave === 'lijst' && <input type="hidden" name="weergave" value="lijst" />}
        <label className="club-veld">
          <span>Bron</span>
          <select name="bron" defaultValue={filters.bron ?? ''} className="club-invoer">
            <option value="">Alle bronnen</option>
            {LEAD_BRONNEN.map((b) => (
              <option key={b} value={b}>
                {LEAD_BRON_LABEL[b]}
              </option>
            ))}
          </select>
        </label>
        <label className="club-veld">
          <span>Medewerker</span>
          <select name="mw" defaultValue={filters.medewerker ?? ''} className="club-invoer">
            <option value="">Iedereen</option>
            <option value="geen">Niet toegewezen</option>
            {medewerkers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.naam}
              </option>
            ))}
          </select>
        </label>
        <label className="club-veld">
          <span>Binnengekomen</span>
          <select name="periode" defaultValue={filters.periode} className="club-invoer">
            {PERIODES.map((p) => (
              <option key={p} value={p}>
                {PERIODE_LABEL[p]}
              </option>
            ))}
          </select>
        </label>
        <div className="club-leads-filterknoppen">
          <button type="submit" className="club-knop">
            Toon
          </button>
          {heeftFilters(filters) && (
            <Link href={pad(filters.weergave === 'lijst' ? { weergave: 'lijst' } : {})} className="club-knop club-knop--stil">
              Wis filters
            </Link>
          )}
        </div>
      </form>
      <nav className="club-segment" aria-label="Weergave">
        <Link href={pad(filterParams(zonderWeergave))} aria-current={filters.weergave === 'pijplijn' ? 'page' : undefined}>
          Pijplijn
        </Link>
        <Link href={pad(filterParams({ ...filters, weergave: 'lijst' }))} aria-current={filters.weergave === 'lijst' ? 'page' : undefined}>
          Lijst
        </Link>
      </nav>
    </section>
  )
}
