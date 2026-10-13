import Link from 'next/link'
import { ChevronRight, TrendingUp } from 'lucide-react'

// Het groeiplan in het kort op het beginscherm: de focus en een link naar het hele plan.

export function GroeiplanKaart({ code, focus }: { code: string; focus: string }) {
  return (
    <section className="ptd-sectie" aria-labelledby="gp-kaart-kop">
      <Link href={`/${code}/groeiplan`} className="ptd-kaart gp-kaart">
        <TrendingUp size={20} aria-hidden />
        <span>
          <span className="ptd-label" id="gp-kaart-kop">Groeiplan</span>
          <span className="gp-kaart-focus">{focus}</span>
        </span>
        <ChevronRight size={18} aria-hidden />
      </Link>
    </section>
  )
}
