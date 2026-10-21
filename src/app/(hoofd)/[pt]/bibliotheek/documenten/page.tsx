import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { ptSessie } from '@/lib/lifeos/pt-dashboard/sessie'
import { haalDocumenten } from '@/lib/lifeos/pt-dashboard/documenten-opslag'
import { DocumentenLijst } from '@/components/lifeos/pt-dashboard/DocumentenLijst'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'

// /<naam>/bibliotheek/documenten — de Fit Factory PT-documenten die Kane deelt
// (protocol, intake, abonnementen, Fit Guide, PT Academy, handleiding). De
// bestanden staan in een privé opslag; "Openen" geeft na de pincode-check een
// link van 5 minuten. Niet ingelogd → de layout toont het pincodescherm.

interface Props {
  params: Promise<{ pt: string }>
}

export default async function DocumentenPagina({ params }: Props) {
  const { pt } = await params
  const s = await ptSessie(pt)
  if (!s?.ingelogd) return null
  const docs = await haalDocumenten(s.admin, s.link.userId, { alleenZichtbaar: true })

  return (
    <>
      <header className="ffdoc-kop">
        <Link href={`/${s.link.code}/bibliotheek`} className="ptd-tekstknop ffdoc-terug">
          <ArrowLeft size={16} aria-hidden="true" />
          Kennis
        </Link>
        <h1>Documenten</h1>
        <p className="ptd-sub">
          Protocollen, formulieren en presentaties van Fit Factory Personal Training. Alleen voor jou als PT&apos;er — deel wat
          &ldquo;voor klanten&rdquo; is, de rest blijft intern.
        </p>
      </header>
      {docs.ok ? (
        <DocumentenLijst code={s.link.code} documenten={docs.waarde} />
      ) : (
        <Foutmelding bericht="De documenten konden niet geladen worden. Vernieuw de pagina." />
      )}
    </>
  )
}
