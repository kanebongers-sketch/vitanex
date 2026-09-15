import type { ReactNode } from 'react'
import Navbar from '@/components/layout/Navbar'

// Alle LifeOS-schermen delen dezelfde app-shell als de rest van de app: de vaste
// sidebar links (Navbar) staat er áltijd. Zonder deze layout renderde elke
// /lifeos-pagina een kále schil zónder sidebar — dan verdween je navigatie zodra je
// vanuit het dashboard naar Mensen/Geld/Kennis/Categorieën sprong.
//
// De Navbar zet zélf de body-class `mf-has-sidebar` (zie globals.css), die de hele
// pagina-inhoud 240px naar rechts schuift naast de vaste sidebar — we hoeven hier
// dus alleen de sidebar naast de pagina te hangen. Bewust BUITEN `.lifeos-root`
// (die zit in `children`), zodat de LifeOS-tokens de sidebar niet herkleuren; dit
// spiegelt hoe /kanebongers het al deed.
export default function LifeosLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mf-mesh-bg" style={{ minHeight: '100vh' }}>
      <Navbar />
      {children}
    </div>
  )
}
