import { Plus } from 'lucide-react'
import type { Product } from '@/lib/club/voeding/dagboek/model'
import type { VoedingDagboekTekst } from '@/lib/aiyourgym/taal/woorden/club/voeding-dagboek'

// Een product in een lijst: een letter als beeld (geen foto van een derde),
// naam, merk en kcal per 100 g. Tik op de rij = portie kiezen; met `onSnel`
// staat er rechts een plusknop die meteen toevoegt met de vorige portie.

interface ProductRijProps {
  product: Product
  t: VoedingDagboekTekst
  onKies: () => void
  onSnel?: () => void
  extra?: string | null
}

export function ProductRij({ product, t, onKies, onSnel, extra }: ProductRijProps) {
  const letter = product.naam.trim().charAt(0).toUpperCase()
  return (
    <div className="club-vd-product">
      <button type="button" className="club-vd-product-kies" onClick={onKies} aria-label={t.toevoegen.kiezen(product.naam)}>
        <span className="club-vd-product-letter" aria-hidden>{letter}</span>
        <span className="club-vd-product-tekst">
          <strong>{product.naam}</strong>
          <span>{[product.merk, extra ?? t.toevoegen.per100(Math.round(product.per100.kcal))].filter(Boolean).join(' · ')}</span>
        </span>
      </button>
      {onSnel && (
        <button type="button" className="club-vd-plus" onClick={onSnel} aria-label={t.toevoegen.snelToevoegen(product.naam)}>
          <Plus size={20} aria-hidden />
        </button>
      )}
    </div>
  )
}
