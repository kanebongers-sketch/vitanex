import type { Project } from '@/lib/lifeos/projecten/projecten'
import type { Taak } from '@/lib/lifeos/taken/taken'
import { voortgang } from '@/lib/lifeos/projecten/voortgang'
import { Voortgangsbalk } from './Voortgangsbalk'
import { TakenLijst } from './TakenLijst'
import { ProjectBeheer } from './ProjectBeheer'
import type { ActieUitkomst } from './useProjectenBord'

// Eén project op het bord: naam + status, de beheer-hoek, een omschrijving als
// die er is, de voortgang, en de taken. Presentationeel — het weet niets van de
// server, alleen dat de callbacks het werk doen.

interface ProjectKaartProps {
  project: Project
  taken: Taak[]
  onHernoem: (project: Project, naam: string) => Promise<ActieUitkomst>
  onZetActief: (project: Project, actief: boolean) => Promise<ActieUitkomst>
  onVerwijder: (project: Project) => Promise<ActieUitkomst>
}

export function ProjectKaart({ project, taken, onHernoem, onZetActief, onVerwijder }: ProjectKaartProps) {
  return (
    <section
      className={`proj-kaart${project.actief ? '' : ' proj-kaart--archief'}`}
      aria-label={`Project ${project.naam}`}
    >
      <header className="proj-kaart-kop">
        <div className="proj-kaart-titelblok">
          <h2 className="proj-kaart-titel">{project.naam}</h2>
          {project.actief ? null : <span className="proj-tag">Gearchiveerd</span>}
        </div>
        <ProjectBeheer
          project={project}
          onHernoem={(naam) => onHernoem(project, naam)}
          onZetActief={(actief) => onZetActief(project, actief)}
          onVerwijder={() => onVerwijder(project)}
        />
      </header>

      {project.omschrijving ? (
        <p className="proj-kaart-omschrijving">{project.omschrijving}</p>
      ) : null}

      <Voortgangsbalk voortgang={voortgang(taken)} />
      <TakenLijst taken={taken} />
    </section>
  )
}
