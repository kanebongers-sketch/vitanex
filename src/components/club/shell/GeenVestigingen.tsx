import Link from 'next/link'
import { clubToegang } from '@/lib/club/toegang'
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
  const magToevoegen = Boolean(t && VESTIGINGEN && magInstelPagina(VESTIGINGEN, instelKijker(t)))
  return (
    <section className="club-paginakop">
      <div>
        <h1>Nog geen vestigingen</h1>
        {magToevoegen ? (
          <>
            <p>Deze sportschool heeft nog geen vestigingen. Voeg er eerst een toe, dan werkt de rest van Club.</p>
            <p>
              <Link href="/clubkane/instellingen/vestigingen" className="club-knop club-knop--primair">
                Vestiging toevoegen
              </Link>
            </p>
          </>
        ) : (
          <p>Deze sportschool heeft nog geen vestigingen. Vraag de eigenaar om een vestiging toe te voegen.</p>
        )}
      </div>
    </section>
  )
}
