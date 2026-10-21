// ─── Fit Factory Club, 3D-oefenbeelden: materialen van het figuur ───────────
// Huid, stof, schoenen en haar met vertexkleuren. Werkende spieren (eigen
// attribuut `spier`) krijgen op de huid een zachte gloed die vanuit de
// spierbuik naar de randen uitloopt. Op stof kleurt de werkende spier door de
// kleding heen (een zachte vlek in de accentkleur), zodat bijvoorbeeld de
// bilspieren door de broek zichtbaar zijn. Stof krijgt een fijne, onregelmatige
// structuur (golving en plooitjes) in plaats van een gladde plastic glans.

import { Color, MeshStandardMaterial, type Material } from 'three'
import { STOF_GLSL } from './stof-glsl'

export interface FiguurMaterialen {
  readonly huid: Material
  readonly stof: Material
  readonly schoen: Material
  readonly haar: Material
}

interface Opties {
  readonly ruwheid: number
  readonly gloed: Color
  /** Hoe sterk de gloed aan de rand van het silhouet toeneemt. */
  readonly gloedRand: number
  /** Zachte rand die de eigen kleur volgt (huid: licht onder de huid). */
  readonly rand?: Color
  /** Vaste lichte rand, zodat donkere stof loskomt van een donkere achtergrond. */
  readonly glans?: Color
  /** Kleur waar een werkende spier op de stof naartoe mengt (alleen stof). */
  readonly tint?: Color
  /** Sterkte van de stofstructuur (0 = glad). */
  readonly weefsel?: number
}

const ZWART = new Color(0, 0, 0)

function metGloed(o: Opties): MeshStandardMaterial {
  const m = new MeshStandardMaterial({ vertexColors: true, roughness: o.ruwheid, metalness: 0 })
  const stof = (o.weefsel ?? 0) > 0
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uGloed = { value: o.gloed }
    shader.uniforms.uRand = { value: o.rand ?? ZWART }
    shader.uniforms.uGlans = { value: o.glans ?? ZWART }
    shader.uniforms.uTint = { value: o.tint ?? ZWART }
    shader.uniforms.uWeefsel = { value: o.weefsel ?? 0 }
    shader.uniforms.uGloedRand = { value: o.gloedRand }
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float spier;\nvarying float vSpier;\nvarying vec3 vBind;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvSpier = spier;\nvBind = position;')
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        [
          '#include <common>',
          'uniform vec3 uGloed;\nuniform vec3 uRand;\nuniform vec3 uGlans;\nuniform vec3 uTint;\nuniform float uWeefsel;\nuniform float uGloedRand;',
          'varying float vSpier;\nvarying vec3 vBind;',
          stof ? STOF_GLSL : '',
        ].join('\n'),
      )
      .replace(
        '#include <color_fragment>',
        [
          '#include <color_fragment>',
          // Werkende spier op stof: zachte vlek in de accentkleur, door de kleding heen.
          stof ? 'diffuseColor.rgb = mix(diffuseColor.rgb, uTint, smoothstep(0.15, 0.95, vSpier) * 0.32);' : '',
        ].join('\n'),
      )
      .replace(
        '#include <normal_fragment_maps>',
        ['#include <normal_fragment_maps>', stof ? 'normal = stofNormaal(-vViewPosition, normal, vBind, uWeefsel, faceDirection);' : ''].join('\n'),
      )
      .replace(
        '#include <emissivemap_fragment>',
        [
          '#include <emissivemap_fragment>',
          'float fr = 1.0 - clamp(dot(normalize(vNormal), normalize(vViewPosition)), 0.0, 1.0);',
          // Op stof een zachte gloed die naar het midden van de spier sterker wordt (licht, geen modder).
          stof
            ? 'totalEmissiveRadiance += uGloed * vSpier * vSpier * (0.9 + 0.6 * (1.0 - fr));'
            : 'totalEmissiveRadiance += uGloed * vSpier * (0.22 + uGloedRand * fr * fr);',
          'totalEmissiveRadiance += uRand * diffuseColor.rgb * fr * fr + uGlans * fr * fr * fr;',
        ].join('\n'),
      )
  }
  // Stof heeft eigen shadercode; de rest deelt een programma (verschillen zitten in uniforms).
  m.customProgramCacheKey = () => (stof ? 'figuur-stof' : 'figuur-glad')
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
  // Op stof een heldere, verzadigde accentkleur plus gloed: leest als licht door de stof, niet als vlek.
  const tint = k.accent.clone().offsetHSL(0, 0.2, 0.06)
  return {
    huid: metGloed({ ruwheid: 0.5, gloed: gloed.clone().multiplyScalar(0.9), gloedRand: 0.9, rand: new Color(0.42, 0.23, 0.17) }),
    stof: metGloed({ ruwheid: 0.93, gloed: gloed.clone().multiplyScalar(1.7), gloedRand: 0, glans, tint, weefsel: 1 }),
    schoen: metGloed({ ruwheid: 0.62, gloed, gloedRand: 1.2, glans }),
    haar: new MeshStandardMaterial({ vertexColors: true, roughness: 0.82, metalness: 0 }),
  }
}

export function ruimMaterialenOp(m: FiguurMaterialen): void {
  for (const x of [m.huid, m.stof, m.schoen, m.haar]) x.dispose()
}
