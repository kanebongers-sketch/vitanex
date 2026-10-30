import type { Metadata } from 'next'
import Link from 'next/link'
import { Eye } from 'lucide-react'
import { magBeheerdersBeheren, magOnderdeel } from '@/lib/club/beheerders/rechten'
import { haalLidSchemaInstelling } from '@/lib/club/training/lid-schemas/opslag'
import { pakketZichtbaar } from '@/lib/club/kern/pakketten'
import { LidSchemaInstelling } from '@/components/club/beheer/LidSchemaInstelling'
import { eisModule, eisOnderdeel } from '@/lib/club/toegang'
import { LedenappFormulier } from '@/components/club/beheer/LedenappFormulier'
import '@/components/club/beheer/beheer.css'
import { InstelKruimel } from '@/components/club/beheer/InstelKruimel'
import { instelKop, instelMetadata } from '@/components/club/beheer/instel-metadata'
import { clubTekst } from '@/lib/aiyourgym/taal/server'
import { BEHEER } from '@/lib/aiyourgym/taal/woorden/club/beheer'

export async function generateMetadata(): Promise<Metadata> {
  return instelMetadata('ledenapp')
}

export default async function LedenappInstellenPagina() {
  await eisOnderdeel('beheer')
  const t = await eisModule('app')
  const kop = await instelKop('ledenapp')
  const tekst = (await clubTekst(BEHEER)).ledenapp
  // Eigen schema's van leden horen bij het pakket Training en coaching.
  const lidSchemas = pakketZichtbaar(t.organisatie.uit, 'training') ? await haalLidSchemaInstelling(t.admin, t.organisatie.id) : null
  return (
    <>
      <InstelKruimel id="ledenapp" />
      <header className="club-paginakop">
        <div>
          <p className="club-boventitel">{t.organisatie.naam}</p>
          <h1>{kop.titel}</h1>
          <p>{tekst.intro}</p>
        </div>
        {magOnderdeel(t.onderdelen, 'app') && (
          <div className="club-acties">
            <Link href="/club/app" className="club-knop">
              <Eye size={16} aria-hidden /> {tekst.bekijken}
            </Link>
          </div>
        )}
      </header>
      <LedenappFormulier begin={t.organisatie.instellingen.ledenapp} />
      {lidSchemas && <LidSchemaInstelling begin={lidSchemas.trainerAanpassen} magAanpassen={magBeheerdersBeheren(t)} />}
    </>
  )
}
