import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { voorbeeldOefeningen } from '@/components/aiyourgym/inhoud/voorbeeldschema'
import { aygPad } from '@/components/aiyourgym/site/paden'
import { getSiteTaal } from '@/lib/aiyourgym/taal/server'
import { SCHEMAS } from '@/lib/aiyourgym/taal/woorden/website/home'
import { SchemaBlikvanger, type BlikOefening } from './SchemaBlikvanger'

// Trainingsschema's zoals een trainer ze geeft, met ons eigen 3D-figuur als
// blikvanger. De coaching is de echte tekst uit de bibliotheek van Club; de
// hele route (intake, voorstel, editor, ledenapp) staat op /trainingsschemas.
// Teksten in de taal van de pagina (woordenboek SCHEMAS). De kernpunten komen uit
// de coachingbibliotheek van Club en zijn nog Nederlands; de vertaling volgt met Club.

const KERNPUNTEN = 3

export async function Schemas() {
  const taal = await getSiteTaal()
  const t = SCHEMAS[taal]
  const bereik = (herhalingen: string) => herhalingen.replace(/(\d+)\s*-\s*(\d+)/g, (_, van: string, tot: string) => t.bereik(Number(van), Number(tot)))
  const oefeningen: BlikOefening[] = voorbeeldOefeningen().map((o) => ({
    naam: o.naam,
    kort: o.kort,
    voorschrift: t.voorschrift(o.dosering.sets, bereik(o.dosering.herhalingen), o.dosering.rustSec),
    kernpunten: o.coaching.kernpunten.slice(0, KERNPUNTEN).map((k) => ({ punt: k.punt, uitleg: k.uitleg })),
  }))
  return (
    <section className="ayg-sectie ayg-podium ayg-podium--rond ayg-schemas" aria-labelledby="schemas-titel">
      <div className="ayg-wrap">
        <SchemaBlikvanger
          oefeningen={oefeningen}
          kop={
            <>
              <p className="ayg-label ayg-label--accent">{t.label}</p>
              <h2 className="ayg-h2" id="schemas-titel">
                {t.titel.voor}
                <mark className="ayg-markeer">{t.titel.accent}</mark>
                {t.titel.na}
              </h2>
              <p className="ayg-lead">{t.lead}</p>
            </>
          }
          onder={
            <>
              <p className="ayg-klein">{t.onder}</p>
              <Link href={aygPad('/trainingsschemas')} className="ayg-pijllink">
                {t.link} <ArrowRight size={16} aria-hidden />
              </Link>
            </>
          }
        />
      </div>
    </section>
  )
}
