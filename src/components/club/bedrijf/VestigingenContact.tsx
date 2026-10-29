import Link from 'next/link'
import { ArrowRight, Mail, MapPin, Phone } from 'lucide-react'
import type { VestigingContact } from '@/lib/club/bedrijf/opslag'
import { clubTekst } from '@/lib/aiyourgym/taal/server'
import { BEDRIJF } from '@/lib/aiyourgym/taal/woorden/club/bedrijf'

// Overzicht: adres, telefoon en e-mail per vestiging. Alleen lezen; aanpassen
// hoort bij Instellingen, Vestigingen (daar staan ze echt, niet dubbel).

interface VestigingenContactProps {
  vestigingen: VestigingContact[] | null
  href: string
}

export async function VestigingenContact({ vestigingen, href }: VestigingenContactProps) {
  const t = (await clubTekst(BEDRIJF)).contact
  return (
    <section className="club-bedrijf-vestigingen" aria-labelledby="bedrijf-vestigingen-kop">
      <div className="club-bedrijf-sectiekop">
        <div>
          <h2 id="bedrijf-vestigingen-kop">{t.kop}</h2>
          <p className="club-hint">{t.uitleg}</p>
        </div>
        <Link href={href} className="club-knop club-knop--klein">
          {t.naar} <ArrowRight size={14} aria-hidden />
        </Link>
      </div>
      {vestigingen === null ? (
        <p className="club-melding club-melding--fout" role="alert">{t.laadFout}</p>
      ) : vestigingen.length === 0 ? (
        <p className="club-leeg">{t.leeg}</p>
      ) : (
        <ul className="club-bedrijf-vlijst">
          {vestigingen.map((v) => (
            <li key={v.sleutel}>
              <strong>{v.naam}</strong>
              <span className={v.adres ? undefined : 'is-leeg'}>
                <MapPin size={14} aria-hidden /> {v.adres ?? t.geenAdres}
              </span>
              <span className={v.telefoon ? undefined : 'is-leeg'}>
                <Phone size={14} aria-hidden /> {v.telefoon ?? t.geenTelefoon}
              </span>
              <span className={v.email ? undefined : 'is-leeg'}>
                <Mail size={14} aria-hidden /> {v.email ?? t.geenEmail}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
