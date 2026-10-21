import { ProjectenBord } from '@/components/lifeos/projecten/ProjectenBord'

// /lifeoskane/projecten: Kane's projectenbord, elk project met zijn taken en
// voortgang. Toegang en menu regelt de LifeOS-layout; de kop zit in ProjectenBord en
// krijgt zijn Fit Factory-stijl uit globals.css.

export const metadata = { title: 'Projecten' }

export default function ProjectenPagina() {
  return (
    <div className="lifeos-root">
      <main className="os-schil">
        <ProjectenBord />
      </main>
    </div>
  )
}
