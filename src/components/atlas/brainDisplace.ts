import * as THREE from 'three'

function foldNoise(x: number, y: number, z: number): number {
  const a = Math.sin(x * 4.13 + z * 2.71 + y * 1.37) * Math.cos(y * 3.91 + x * 1.13)
  const b = Math.sin(y * 7.33 + x * 3.17) * Math.cos(z * 5.73 + y * 2.31) * 0.5
  const c = Math.cos(z * 11.13 + x * 5.37) * Math.sin(x * 8.71 + z * 4.13) * 0.25
  return a + b + c
}

export function displacePoint(ox: number, oy: number, oz: number): THREE.Vector3 {
  const bx = ox * 1.52, by = oy * 0.87, bz = oz * 1.05
  const bl = Math.sqrt(bx * bx + by * by + bz * bz) || 1
  const nx = bx / bl, ny = by / bl, nz = bz / bl
  const fold = foldNoise(nx * 2.9, ny * 2.9, nz * 2.9) * 0.10
  const fis = Math.max(0, ny - 0.20) * Math.exp(-nx * nx / 0.028) * 0.42
  const d = fold - fis
  return new THREE.Vector3(bx + nx * d, by + ny * d, bz + nz * d)
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
