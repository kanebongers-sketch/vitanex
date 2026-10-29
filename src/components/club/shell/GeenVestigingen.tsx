import Link from 'next/link'
import { clubToegang } from '@/lib/club/toegang'
import { clubTekst } from '@/lib/aiyourgym/taal/server'
import { MENU } from '@/lib/aiyourgym/taal/woorden/club/menu'
import { instelKijker } from '@/lib/club/instel-toegang'
import { INSTEL_PAGINAS, magInstelPagina } from '@/lib/club/kern/instel-paginas'

const VESTIGINGEN = INSTEL_PAGINAS.find((p) => p.id === 'vestigingen')

/**
 * Voor een sportschool zonder vestigingen: geen crash, wel een duidelijke weg
 * verder. De knop naar de vestigingen alleen voor wie ze mag instellen; de
 * rest krijgt het advies om het aan de eigenaar te vragen.
 */
export async function GeenVestigingen() {
  const t = await clubToegang()
  const tekst = (await clubTekst(MENU)).geenVestigingen
  const magToevoegen = Boolean(t && VESTIGINGEN && magInstelPagina(VESTIGINGEN, instelKijker(t)))
  return (
    <section className="club-paginakop">
      <div>
        <h1>{tekst.titel}</h1>
        {magToevoegen ? (
          <>
            <p>{tekst.toevoegenUitleg}</p>
            <p>
              <Link href="/club/instellingen/vestigingen" className="club-knop club-knop--primair">
                {tekst.toevoegen}
              </Link>
            </p>
          </>
        ) : (
          <p>{tekst.vraagEigenaar}</p>
        )}
      </div>
    </section>
  )
}
