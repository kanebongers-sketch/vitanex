// ─── Fit Factory Club, 3D-oefenbeelden: materialen van het figuur ───────────
// Huid, stof, schoenen en haar met vertexkleuren. Werkende spieren krijgen
// naast de accentkleur een zachte gloed (eigen attribuut `spier`), zodat ze
// ook in de schaduw herkenbaar blijven. De huid krijgt een lichte
// randverzachting (zoals licht dat net onder de huid verstrooit).

import { Color, MeshStandardMaterial, type Material } from 'three'

export interface FiguurMaterialen {
  readonly huid: Material
  readonly stof: Material
  readonly schoen: Material
  readonly haar: Material
}

interface Opties {
  readonly ruwheid: number
  readonly gloed: Color
  /** Zachte rand die de eigen kleur volgt (huid: licht onder de huid). */
  readonly rand?: Color
  /** Vaste lichte rand, zodat donkere stof loskomt van een donkere achtergrond. */
  readonly glans?: Color
}

function metGloed(o: Opties): MeshStandardMaterial {
  const m = new MeshStandardMaterial({ vertexColors: true, roughness: o.ruwheid, metalness: 0 })
  const rand = o.rand ?? new Color(0, 0, 0)
  const glans = o.glans ?? new Color(0, 0, 0)
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uGloed = { value: o.gloed }
    shader.uniforms.uRand = { value: rand }
    shader.uniforms.uGlans = { value: glans }
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float spier;\nvarying float vSpier;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvSpier = spier;')
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform vec3 uGloed;\nuniform vec3 uRand;\nuniform vec3 uGlans;\nvarying float vSpier;')
      .replace(
        '#include <emissivemap_fragment>',
        [
          '#include <emissivemap_fragment>',
          'float fr = 1.0 - clamp(dot(normalize(vNormal), normalize(vViewPosition)), 0.0, 1.0);',
          'totalEmissiveRadiance += uGloed * vSpier * (0.18 + 2.6 * fr * fr);',
          'totalEmissiveRadiance += uRand * diffuseColor.rgb * fr * fr + uGlans * fr * fr * fr;',
        ].join('\n'),
      )
  }
  return m
}

export interface StofKleuren {
  readonly accent: Color
  /** Sterkte van de gloed op werkende spieren. */
  readonly gloed: number
  /** Sterkte van de lichte rand op stof en schoenen. */
  readonly glans: number
}

export function maakFiguurMaterialen(k: StofKleuren): FiguurMaterialen {
  const gloed = k.accent.clone().multiplyScalar(k.gloed)
  const glans = new Color(0.62, 0.66, 0.74).multiplyScalar(k.glans)
  return {
    huid: metGloed({ ruwheid: 0.52, gloed: gloed.clone().multiplyScalar(1.5), rand: new Color(0.5, 0.22, 0.14) }),
    stof: metGloed({ ruwheid: 0.88, gloed, glans }),
    schoen: metGloed({ ruwheid: 0.62, gloed, glans }),
    haar: new MeshStandardMaterial({ vertexColors: true, roughness: 0.82, metalness: 0 }),
  }
}

export function ruimMaterialenOp(m: FiguurMaterialen): void {
  for (const x of [m.huid, m.stof, m.schoen, m.haar]) x.dispose()
}
