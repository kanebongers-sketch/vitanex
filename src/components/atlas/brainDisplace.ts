import * as THREE from 'three'

// Mirror of GLSL gyriPattern — keeps particles on the same surface as the mesh
function gyriPattern(nx: number, ny: number, nz: number): number {
  const g1 = Math.abs(Math.sin(nx * 3.4 + nz * 2.2 + ny * 0.8)) *
             Math.abs(Math.cos(ny * 4.7 + nx * 1.9 + nz * 0.5))
  const g2 = Math.abs(Math.sin(nx * 7.8 + nz * 6.1 + ny * 2.4)) *
             Math.abs(Math.cos(ny * 8.9 + nz * 7.3 + nx * 3.6))
  const g3 = Math.sin(nx * 15.2 + nz * 12.8 + ny * 6.1) *
             Math.cos(ny * 17.3 + nx * 9.7  + nz * 13.4)
  return g1 * 0.115 + g2 * 0.065 + g3 * 0.022
}

export function displacePoint(ox: number, oy: number, oz: number): THREE.Vector3 {
  const bx = ox * 1.35, by = oy * 0.82, bz = oz * 1.02
  const bl = Math.sqrt(bx * bx + by * by + bz * bz) || 1
  const nx = bx / bl, ny = by / bl, nz = bz / bl

  // Bottom flattening (match vertex shader)
  const flatY = ny < -0.05 ? (-ny - 0.05) * 0.28 : 0

  const px = nx * 2.8, py = ny * 2.8, pz = nz * 2.8
  const fold = gyriPattern(px, py, pz)
  const fis  = Math.max(0, ny - 0.10) * (0.9 - 0.35 * nz * nz) *
               Math.exp(-nx * nx / 0.013) * 0.62
  const d = fold - fis

  return new THREE.Vector3(bx + nx * d, by - flatY + ny * d, bz + nz * d)
}

export function buildSurfacePoints(count: number): Float32Array {
  const geo = new THREE.IcosahedronGeometry(1.0, 4)
  const src = geo.attributes.position as THREE.BufferAttribute
  const step = Math.max(1, Math.floor(src.count / count))
  const out = new Float32Array(count * 3)
  let written = 0
  for (let i = 0; written < count && i < src.count; i += step) {
    const ox = src.getX(i), oy = src.getY(i), oz = src.getZ(i)
    if (Math.abs(ox) < 0.06 && oy > 0.35) continue
    const v = displacePoint(ox, oy, oz)
    out[written * 3]     = v.x + (Math.random() - 0.5) * 0.03
    out[written * 3 + 1] = v.y + (Math.random() - 0.5) * 0.03
    out[written * 3 + 2] = v.z + (Math.random() - 0.5) * 0.03
    written++
  }
  geo.dispose()
  return out.slice(0, written * 3)
}
