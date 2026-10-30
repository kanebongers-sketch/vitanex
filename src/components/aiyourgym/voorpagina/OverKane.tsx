import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { getSiteTaal } from '@/lib/aiyourgym/taal/server'
import { VOORPAGINA } from '@/lib/aiyourgym/taal/woorden/website/voorpagina'
import { SITE_PADEN } from '../site/paden'
import type { KaneFoto } from './kane-foto'
import { kaneFoto } from './kane-foto-server'

// Wie het bouwt, kort (besluit Kane 21-10-2026): een typografisch blok met de kop,
// Kane in zijn eigen woorden als groot citaat, wie hij is en wat je mag verwachten.
// Met een foto (public/aiyourgym/kane.jpg, zie kane-foto.ts) staat het portret links naast het citaat; zonder foto
// draagt het citaat het blok alleen. Fit Factory wordt niet genoemd.

function Portret({ foto, alt }: { foto: KaneFoto; alt: string }) {
  return (
    <div className="vp-kane-foto">
      <Image src={foto.src} alt={alt} width={foto.breedte} height={foto.hoogte} sizes="(min-width: 1024px) 30vw, 90vw" loading="lazy" />
    </div>
  )
}

export async function OverKane() {
  const t = VOORPAGINA[await getSiteTaal()].kane
  const foto = kaneFoto()
  return (
    <section className="vp-kane" data-foto={foto ? '' : undefined} aria-labelledby="vp-kane-titel">
      <h2 id="vp-kane-titel" className="vp-h2 vp-kane-titel vp-onthul">
        {t.titel.map((r) => (
          <span key={r} className="vp-blok">
            {r}
          </span>
        ))}
      </h2>
      {foto ? <Portret foto={foto} alt={t.fotoAlt} /> : null}
      <figure className="vp-kane-citaat vp-onthul">
        <blockquote>
          <p>{t.citaat}</p>
        </blockquote>
        <figcaption>
          <b>{t.naam}</b>
          <span>{t.rol}</span>
        </figcaption>
      </figure>
      <div className="vp-kane-verder vp-onthul">
        <p>{t.verwacht}</p>
        <Link href={SITE_PADEN.DEMO_AANVRAGEN} className="vp-knop vp-knop-vol">
          {t.knop} <ArrowRight size={18} aria-hidden />
        </Link>
      </div>
    </section>
  )
}
