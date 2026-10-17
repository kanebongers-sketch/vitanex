import Link from 'next/link'

/** Voor een sportschool zonder vestigingen: geen crash, wel een duidelijke weg verder. */
export function GeenVestigingen() {
  return (
    <section className="club-paginakop">
      <div>
        <h1>Nog geen vestigingen</h1>
        <p>Deze sportschool heeft nog geen vestigingen. Voeg er eerst een toe, dan werkt de rest van Club.</p>
        <p>
          <Link href="/clubkane/instellingen?tab=vestigingen" className="club-knop club-knop--primair">
            Vestiging toevoegen
          </Link>
        </p>
      </div>
    </section>
  )
}
