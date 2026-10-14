import { eisClubToegang } from '@/lib/club/toegang'
import { kiesVestiging, VESTIGING_LABEL, type ZoekParams } from '@/lib/club/gedeeld/vestiging'

// Vandaag: tijdelijke startpagina tot het dashboard er staat.

export default async function ClubVandaag({ searchParams }: { searchParams: ZoekParams }) {
  await eisClubToegang()
  const vestiging = kiesVestiging((await searchParams).v)
  return (
    <section className="club-paginakop">
      <div>
        <p className="club-boventitel">{VESTIGING_LABEL[vestiging]}</p>
        <h1>Vandaag</h1>
        <p>De clubsoftware wordt opgebouwd.</p>
      </div>
    </section>
  )
}
