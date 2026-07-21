'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { haalJson, haalJsonGedeeld, leesNiets } from '@/lib/lifeos/api/http'
import { luisterOpWijziging, meldWijziging } from '@/lib/lifeos/events'
import {
  leesProjectAntwoord,
  leesProjectenAntwoord,
  type Project,
} from '@/lib/lifeos/projecten/projecten'
import { leesTakenAntwoord, type Taak } from '@/lib/lifeos/taken/taken'
import type { ProjectMaakUitkomst } from '@/components/lifeos/taken/useProjecten'

// Alle bediening van het projectenbord op één plek: de projecten én álle taken
// laden, en een project toevoegen, hernoemen, (de)archiveren of verwijderen. De
// container (`ProjectenBord`) bezit deze hook en geeft de brokjes aan de
// presentational kaarten door — zelfde vorm als `useTaken`.
//
// Beide bronnen moeten slagen: een bord dat "0/8 klaar" toont terwijl de taken
// niet laadden, liegt over je werk. Faalt er één, dan is het hele bord een fout
// (met een weg terug), geen halve lijst.

export type BordStaat =
  | { fase: 'laden' }
  | { fase: 'fout'; bericht: string }
  | { fase: 'ok'; projecten: Project[]; taken: Taak[] }

/** De uitkomst van een beheer-actie. Een unie, geen boolean: bij een fout hoort
 *  de gebruiker de reden (bv. "Je hebt al een project met die naam"). */
export type ActieUitkomst = { ok: true } | { ok: false; fout: string }

export interface BordBediening {
  staat: BordStaat
  opnieuw: () => void
  voegToe: (naam: string) => Promise<ProjectMaakUitkomst>
  hernoem: (project: Project, naam: string) => Promise<ActieUitkomst>
  zetActief: (project: Project, actief: boolean) => Promise<ActieUitkomst>
  verwijder: (project: Project) => Promise<ActieUitkomst>
}

/** Zelfde volgorde als de API na een schrijf, zodat een net toegevoegd of
 *  hernoemd project meteen op zijn plek staat: actief eerst, dan op naam. */
function opVolgorde(projecten: readonly Project[]): Project[] {
  return [...projecten].sort((a, b) => {
    if (a.actief !== b.actief) return a.actief ? -1 : 1
    return a.naam.localeCompare(b.naam, 'nl', { sensitivity: 'base' })
  })
}

export function useProjectenBord(): BordBediening {
  const [staat, setStaat] = useState<BordStaat>({ fase: 'laden' })

  // Generatieteller als in `useTaken`: een vlucht die bij unmount of na een
  // retry nog loopt, mag niets meer zetten.
  const generatie = useRef(0)

  const laad = useCallback((): Promise<void> => {
    const mijn = ++generatie.current
    return Promise.all([
      haalJson('/api/lifeos/projecten', leesProjectenAntwoord),
      // Gedeeld: VangOp/ProductiviteitDomein halen dezelfde takenlijst. In-flight
      // coalescing, geen cache — een refresh ná een schrijf krijgt verse data.
      haalJsonGedeeld('/api/lifeos/taken?alle=1', leesTakenAntwoord),
    ]).then(([pr, tk]) => {
      if (mijn !== generatie.current) return
      if (!pr.ok) {
        setStaat({ fase: 'fout', bericht: pr.fout })
        return
      }
      if (!tk.ok) {
        setStaat({ fase: 'fout', bericht: tk.fout })
        return
      }
      setStaat({ fase: 'ok', projecten: pr.waarde, taken: tk.waarde })
    })
  }, [])

  const verval = useCallback(() => {
    generatie.current++
  }, [])

  useEffect(() => {
    void laad()
    return verval
  }, [laad, verval])

  // Herlaad zodra een taak elders wijzigt (afvinken, toevoegen, verwijderen): de
  // voortgangsbalken rekenen met dezelfde taken en zouden anders achterlopen.
  useEffect(() => luisterOpWijziging('taken', () => void laad()), [laad])

  const opnieuw = useCallback(() => {
    setStaat({ fase: 'laden' })
    void laad()
  }, [laad])

  /** Vervang één project in de lijst en herorden — voor hernoemen en (de)archiveren. */
  const vervangProject = useCallback((bijgewerkt: Project) => {
    setStaat((h) =>
      h.fase === 'ok'
        ? { ...h, projecten: opVolgorde(h.projecten.map((p) => (p.id === bijgewerkt.id ? bijgewerkt : p))) }
        : h,
    )
  }, [])

  const patch = useCallback(
    async (project: Project, wijziging: Record<string, unknown>): Promise<ActieUitkomst> => {
      const uitkomst = await haalJson(`/api/lifeos/projecten/${project.id}`, leesProjectAntwoord, {
        method: 'PATCH',
        body: JSON.stringify(wijziging),
      })
      if (!uitkomst.ok) return { ok: false, fout: uitkomst.fout }
      vervangProject(uitkomst.waarde)
      return { ok: true }
    },
    [vervangProject],
  )

  const voegToe = useCallback(async (naam: string): Promise<ProjectMaakUitkomst> => {
    const uitkomst = await haalJson('/api/lifeos/projecten', leesProjectAntwoord, {
      method: 'POST',
      body: JSON.stringify({ naam }),
    })
    if (!uitkomst.ok) return { ok: false, fout: uitkomst.fout }

    const nieuw = uitkomst.waarde
    setStaat((h) =>
      h.fase === 'ok'
        ? {
            ...h,
            projecten: h.projecten.some((p) => p.id === nieuw.id)
              ? h.projecten
              : opVolgorde([...h.projecten, nieuw]),
          }
        : h,
    )
    return { ok: true, project: nieuw }
  }, [])

  const hernoem = useCallback(
    (project: Project, naam: string) => patch(project, { naam }),
    [patch],
  )

  const zetActief = useCallback(
    (project: Project, actief: boolean) => patch(project, { actief }),
    [patch],
  )

  const verwijder = useCallback(async (project: Project): Promise<ActieUitkomst> => {
    const uitkomst = await haalJson(`/api/lifeos/projecten/${project.id}`, leesNiets, {
      method: 'DELETE',
    })
    if (!uitkomst.ok) return { ok: false, fout: uitkomst.fout }

    // Weg uit de lijst; de taken van dit project vallen server-side terug op
    // "geen project" (on delete set null). Lokaal doen we hetzelfde, zodat ze
    // meteen in "Zonder project" verschijnen i.p.v. te verdwijnen.
    setStaat((h) =>
      h.fase === 'ok'
        ? {
            ...h,
            projecten: h.projecten.filter((p) => p.id !== project.id),
            taken: h.taken.map((t) => (t.projectId === project.id ? { ...t, projectId: null } : t)),
          }
        : h,
    )
    // Andere kaarten rekenen met dezelfde taken (hun project_id veranderde). Ná
    // de geslaagde schrijf, nooit optimistisch.
    meldWijziging('taken')
    return { ok: true }
  }, [])

  return { staat, opnieuw, voegToe, hernoem, zetActief, verwijder }
}
