import { ChevronDown, FileText } from 'lucide-react'
import { ingevuldeTeksten, TEKST_LABEL, type Teksten } from '@/lib/club/bedrijf/model'
import { JuridischeTekst } from './JuridischeTekst'
import './bedrijf.css'

// In de ledenapp (tabblad Profiel): de huisregels, voorwaarden en privacy van
// de sportschool als uitklapbare blokken. Alleen wat is ingevuld; is er niets,
// dan toont dit niets. Werkt zonder JavaScript (<details>).

interface LedenappJuridischProps {
  teksten: Teksten
  sportschool: string
}

export function LedenappJuridisch({ teksten, sportschool }: LedenappJuridischProps) {
  const lijst = ingevuldeTeksten(teksten)
  if (lijst.length === 0) return null
  return (
    <section className="club-bedrijf-lidapp" aria-labelledby="lidapp-juridisch">
      <h3 id="lidapp-juridisch">
        <FileText aria-hidden size={16} /> Regels van {sportschool}
      </h3>
      {lijst.map(({ soort, tekst }) => (
        <details key={soort} className="club-bedrijf-lidapp-blok">
          <summary>
            <span>{TEKST_LABEL[soort]}</span>
            <ChevronDown aria-hidden size={18} />
          </summary>
          <JuridischeTekst tekst={tekst} kopNiveau={4} />
        </details>
      ))}
    </section>
  )
}
