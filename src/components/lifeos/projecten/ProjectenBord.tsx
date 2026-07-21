'use client'

import { FolderKanban } from 'lucide-react'
import { NieuwProjectVeld } from '@/components/lifeos/taken/NieuwProjectVeld'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'
import { groepeerPerProject, voortgang } from '@/lib/lifeos/projecten/voortgang'
import type { Project } from '@/lib/lifeos/projecten/projecten'
import type { Taak } from '@/lib/lifeos/taken/taken'
import { useProjectenBord, type BordBediening } from './useProjectenBord'
import { ProjectKaart } from './ProjectKaart'
import { Voortgangsbalk } from './Voortgangsbalk'
import { TakenLijst } from './TakenLijst'
import { BORD_STYLE } from './bord-style'

// Het projectenbord: elk project met zijn taken en voortgang, plus het beheer.
// Container-eiland — het bezit de hook en verdeelt de brokjes over de
// presentational kaarten. Laden = rustige skeleton, fout = de gedeelde
// Foutmelding (met weg terug), leeg = een eerlijke lege staat.

export function ProjectenBord() {
  const bord = useProjectenBord()
  const { staat, opnieuw } = bord

  return (
    <section className="proj" aria-labelledby="proj-titel">
      <header className="proj-kop">
        <p className="proj-eyebrow">
          <FolderKanban size={14} strokeWidth={2.2} aria-hidden="true" /> Projecten
        </p>
        <h1 className="proj-titel" id="proj-titel">
          Je projecten
        </h1>
        <p className="proj-meta">Elk project met zijn taken en voortgang — de context achter je werk.</p>
      </header>

      {staat.fase === 'laden' ? <Skelet /> : null}
      {staat.fase === 'fout' ? <Foutmelding bericht={staat.bericht} opnieuw={opnieuw} /> : null}
      {staat.fase === 'ok' ? (
        <Inhoud projecten={staat.projecten} taken={staat.taken} bord={bord} />
      ) : null}

      <style>{BORD_STYLE}</style>
    </section>
  )
}

interface InhoudProps {
  projecten: Project[]
  taken: Taak[]
  bord: BordBediening
}

function Inhoud({ projecten, taken, bord }: InhoudProps) {
  const { groepen, zonderProject } = groepeerPerProject(projecten, taken)

  return (
    <div className="proj-inhoud">
      <div className="proj-toevoegen">
        {/* Hergebruikt het bestaande veld: hetzelfde POST-pad, dezelfde nette
            fout bij een dubbele naam. `voegToe` zet het verse project meteen in
            de lijst, dus na aanmaken is er niets meer te doen. */}
        <NieuwProjectVeld onMaak={bord.voegToe} onGemaakt={() => undefined} />
      </div>

      {projecten.length === 0 ? <LegeStaat /> : null}

      {groepen.length > 0 ? (
        <div className="proj-grid">
          {groepen.map(({ project, taken: projectTaken }) => (
            <ProjectKaart
              key={project.id}
              project={project}
              taken={projectTaken}
              onHernoem={bord.hernoem}
              onZetActief={bord.zetActief}
              onVerwijder={bord.verwijder}
            />
          ))}
        </div>
      ) : null}

      {zonderProject.length > 0 ? <ZonderProject taken={zonderProject} /> : null}
    </div>
  )
}

function LegeStaat() {
  return (
    <div className="proj-leeg">
      <p className="proj-leeg-titel">Nog geen projecten</p>
      <p className="proj-leeg-uitleg">
        Maak je eerste project hierboven. Een project bundelt taken die bij elkaar horen — de context
        achter je werk.
      </p>
    </div>
  )
}

function ZonderProject({ taken }: { taken: Taak[] }) {
  return (
    <section className="proj-kaart proj-kaart--zonder" aria-label="Taken zonder project">
      <header className="proj-kaart-kop">
        <div className="proj-kaart-titelblok">
          <h2 className="proj-kaart-titel">Zonder project</h2>
        </div>
      </header>
      <p className="proj-kaart-omschrijving">Taken die (nog) niet bij een project horen.</p>
      <Voortgangsbalk voortgang={voortgang(taken)} />
      <TakenLijst taken={taken} />
    </section>
  )
}

function Skelet() {
  return (
    <div className="proj-skelet" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <div key={i} className="proj-skelet-kaart">
          <div className="proj-skelet-balk proj-skelet-balk--titel" />
          <div className="proj-skelet-balk proj-skelet-balk--bar" />
          <div className="proj-skelet-balk" />
          <div className="proj-skelet-balk proj-skelet-balk--kort" />
        </div>
      ))}
    </div>
  )
}
