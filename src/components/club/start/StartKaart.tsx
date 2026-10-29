import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { ClubToegang } from '@/lib/club/toegang'
import { magBeheerdersBeheren } from '@/lib/club/beheerders/rechten'
import { AANTAL_STAPPEN, aantalAf, minutenOver, minutenTekst, startPad, stappenStand, streefStand, toonStartKaart, volgendeOpen } from '@/lib/club/start/stappen'
import { nlDelen } from '@/lib/club/rooster/tijd'
import { haalStartVoorPagina, haalStartFeiten } from '@/lib/club/start/opslag'
import { Proefperiode } from './Proefperiode'
import { clubTekst, getTaal } from '@/lib/aiyourgym/taal/server'
import { START } from '@/lib/aiyourgym/taal/woorden/club/start'
import './start.css'

// Op Vandaag, zolang de startwizard loopt: een opvallende kaart met de stand
// en de volgende open stap, plus de streefdatum als de eigenaar die koos
// ("Live op 1 november, nog 3 stappen"). Alleen voor Kane en de eigenaar.
// Na de wizard staat hier alleen nog de proefregel, als het einde bekend is.

export async function StartKaart({ t, vestiging }: { t: ClubToegang; vestiging: string | null }) {
  if (!magBeheerdersBeheren(t)) return null
  const gelezen = await haalStartVoorPagina(t)
  // Wizard klaar (of niet te lezen): de kaart verdwijnt, de rustige proefregel blijft.
  if (!gelezen.ok || !toonStartKaart(gelezen.voortgang)) {
    return (
      <div className="club-proef-los">
        <Proefperiode t={t} />
      </div>
    )
  }
  const taal = await getTaal()
  const tk = (await clubTekst(START)).startKaart
  const stand = stappenStand(gelezen.voortgang, await haalStartFeiten(t), taal)
  const af = aantalAf(stand)
  const volgende = stand[volgendeOpen(stand) - 1]
  const streefdatum = gelezen.voortgang?.streefdatum ?? null
  const streef = streefdatum ? streefStand(streefdatum, nlDelen(new Date()).datum, AANTAL_STAPPEN - af, taal) : null
  return (
    <section className="club-startkaart" aria-labelledby="startkaart-kop">
      <div className="club-startkaart-tekst">
        <p className="club-boventitel">{tk.boven}</p>
        <h2 id="startkaart-kop">
          {tk.kop} <span className="club-startkaart-stand">{tk.stand(af, AANTAL_STAPPEN)}</span>
        </h2>
        <p>
          {tk.volgende} <strong>{volgende.titel}</strong>. {volgende.kort}.
        </p>
        {streef && (
          <p className="club-startkaart-streef">
            <strong>{streef.kop}</strong>
            <span>{streef.dagen}</span>
          </p>
        )}
        <p className="club-startkaart-tijd">{tk.tijd(minutenTekst(minutenOver(stand), taal))}</p>
        <Proefperiode t={t} />
      </div>
      <div className="club-startkaart-balk" role="progressbar" aria-label={tk.voortgang} aria-valuemin={0} aria-valuemax={AANTAL_STAPPEN} aria-valuenow={af}>
        {stand.map((s) => (
          <span key={s.sleutel} data-af={s.af || undefined} />
        ))}
      </div>
      <Link href={startPad(volgende.nummer, vestiging)} className="club-knop club-knop--primair club-knop--groot">
        {tk.verder(volgende.nummer)} <ArrowRight aria-hidden size={18} />
      </Link>
    </section>
  )
}
