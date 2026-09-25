import { formatEuro } from '@/components/lifeos/finance/finance'
import type { LabelWaarde, ProductMetMarge, ProductRol } from '@/lib/lifeos/sportmerk/types'

// ─── Sportmerk — marge per order ────────────────────────────────────────────
// Presentational: de uitgerekende unit economics per product, met de aannames
// er direct onder. De maatstaf is "na ads", niet het margepercentage.
//
// Negatief krijgt een minteken én de status-kleur: betekenis nooit via kleur
// alleen (accessibility.md). Op smalle schermen wordt elke rij een kaartje
// (CSS + `data-label`), zodat de bedragen niet achter een horizontale scroll
// verdwijnen; de wrapper blijft focusbaar voor wie tóch moet scrollen.

const ROL_LABEL: Record<ProductRol, string> = {
  hoofdproduct: 'Hoofdproduct',
  hoofdaanbod: 'Hoofdaanbod',
  margemotor: 'Margemotor',
  'add-on': 'Add-on',
  later: 'Later',
  reserve: 'Reserve',
  vergelijking: 'Vergelijking',
}

interface MargeTabelProps {
  producten: ProductMetMarge[]
  aannames: LabelWaarde[]
}

export function MargeTabel({ producten, aannames }: MargeTabelProps) {
  return (
    <div className="spm__marge">
      <div className="spm__tabel-wrap" tabIndex={0} role="region" aria-label="Marge per product, horizontaal scrollbaar">
        <table className="spm__tabel">
          <caption className="spm__sr">Geschatte marge per order, per product</caption>
          <thead>
            <tr>
              <th scope="col">Product</th>
              <th scope="col">Rol</th>
              <th scope="col" className="spm__num">Prijs</th>
              <th scope="col" className="spm__num">Kostprijs</th>
              <th scope="col" className="spm__num">Vóór ads</th>
              <th scope="col" className="spm__num">Na ads</th>
              <th scope="col">Retour</th>
            </tr>
          </thead>
          <tbody>
            {producten.map((p) => (
              <tr key={p.id}>
                <th scope="row">
                  <span className="spm__product">{p.naam}</span>
                  <span className="spm__toelichting">{p.toelichting}</span>
                </th>
                <td data-label="Rol">
                  <span className={`spm__rol${isKern(p.rol) ? ' spm__rol--kern' : ''}`}>{ROL_LABEL[p.rol]}</span>
                </td>
                <td className="spm__num" data-label="Prijs">{formatEuro(p.prijsInclBtw)}</td>
                <td className="spm__num" data-label="Kostprijs">
                  {formatEuro(p.kostprijs.min)}–{formatEuro(p.kostprijs.max)}
                </td>
                <td className="spm__num" data-label="Vóór ads">{formatEuro(p.marge.overVoorAds)}</td>
                <td data-label="Na ads" className={`spm__num${p.marge.naAds < 0 ? ' spm__verlies' : ' spm__winst'}`}>
                  {p.marge.naAds < 0 ? '−' : '+'}
                  {formatEuro(Math.abs(p.marge.naAds))}
                </td>
                <td data-label="Retour">{p.retourRisico}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <dl className="spm__aannames">
        {aannames.map((a) => (
          <div key={a.label}>
            <dt>{a.label}</dt>
            <dd>{a.waarde}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

function isKern(rol: ProductRol): boolean {
  return rol === 'hoofdproduct' || rol === 'hoofdaanbod' || rol === 'margemotor'
}
