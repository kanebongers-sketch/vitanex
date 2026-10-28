import Link from 'next/link'
import type { ReactNode } from 'react'
import { ArrowRight } from 'lucide-react'
import { Figuur } from '@/components/aiyourgym/mockups/kaders'

// Een productblok van de voorpagina: links (of rechts, met `spiegel`) een korte
// kop, twee zinnen en drie punten met een link naar de subpagina; aan de andere
// kant groot het productscherm. Elk blok is een eigen vol merkvlak (vlak), tegen
// het volgende aan. Het scherm staat in een Figuur met het eerlijke bijschrift.

export type Vlak = 'racegroen' | 'papier' | 'fles' | 'papier-diep'

interface Props {
  id: string
  vlak: Vlak
  spiegel?: boolean
  kop: string
  tekst: string
  punten: readonly string[]
  link: { label: string; pad: string }
  beeldLabel: string
  /** Breed scherm (browservenster) of smal (telefoons). */
  vorm?: 'venster' | 'telefoon'
  children: ReactNode
}

export function Productblok({ id, vlak, spiegel, kop, tekst, punten, link, beeldLabel, vorm = 'venster', children }: Props) {
  return (
    <section className={`vp-product vp-vlak-${vlak}`} data-spiegel={spiegel || undefined} data-vorm={vorm} aria-labelledby={id}>
      <div className="vp-product-tekst vp-onthul">
        <h2 id={id} className="vp-product-kop">
          {kop}
        </h2>
        <p className="vp-product-lead">{tekst}</p>
        <ul className="vp-product-punten">
          {punten.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
        <Link href={link.pad} className="vp-pijl">
          {link.label} <ArrowRight size={18} aria-hidden />
        </Link>
      </div>
      <Figuur label={beeldLabel} className="vp-product-beeld vp-onthul">
        {children}
      </Figuur>
    </section>
  )
}
