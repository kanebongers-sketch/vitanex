import { ProjectenBord } from '@/components/lifeos/projecten/ProjectenBord'

// /lifeoskane/projecten — Kane's projectenbord: elk project met zijn taken en
// voortgang. Toegang en menu regelt de LifeOS-layout.

export const metadata = { title: 'Projecten' }

export default function ProjectenPagina() {
  return (
    <div className="lifeos-root">
      <div className="os-sfeer" aria-hidden="true" />
      <main className="os-schil">
        <ProjectenBord />
      </main>
    </div>
  )
}
