// ─── Fit Factory Club, 3D-oefenbeelden: structuur van stof (shadercode) ─────
// Een hoogteveld op de bindpositie van elk punt (beweegt dus mee met het
// lichaam): brede, liggende golving zoals stof die over het lichaam valt, plus
// een fijne korrel van het weefsel. De normaal wordt daarmee verstoord (bump
// via schermafgeleiden), zonder textuur of extra driehoeken.

export const STOF_GLSL = /* glsl */ `
float stofHash(vec3 p) {
  p = fract(p * 0.3183099 + 0.1);
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

float stofRuis(vec3 x) {
  vec3 i = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(stofHash(i), stofHash(i + vec3(1.0, 0.0, 0.0)), f.x),
        mix(stofHash(i + vec3(0.0, 1.0, 0.0)), stofHash(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
    mix(mix(stofHash(i + vec3(0.0, 0.0, 1.0)), stofHash(i + vec3(1.0, 0.0, 1.0)), f.x),
        mix(stofHash(i + vec3(0.0, 1.0, 1.0)), stofHash(i + vec3(1.0, 1.0, 1.0)), f.x), f.y),
    f.z);
}

/** Hoogte van de stof in meter op bindpositie p. */
float stofHoogte(vec3 p) {
  float golf = stofRuis(vec3(p.x * 16.0, p.y * 48.0, p.z * 16.0));
  float plooi = stofRuis(vec3(p.x * 30.0 + 3.1, p.y * 22.0, p.z * 30.0 - 1.7));
  float korrel = stofRuis(p * 260.0);
  return golf * 0.0009 + plooi * 0.0005 + korrel * 0.00006;
}

vec3 stofNormaal(vec3 pos, vec3 n, vec3 p, float sterk, float face) {
  float h = stofHoogte(p) * sterk;
  vec2 dH = vec2(dFdx(h), dFdy(h));
  vec3 sx = dFdx(pos);
  vec3 sy = dFdy(pos);
  vec3 r1 = cross(sy, n);
  vec3 r2 = cross(n, sx);
  float det = dot(sx, r1) * face;
  vec3 grad = sign(det) * (dH.x * r1 + dH.y * r2);
  return normalize(abs(det) * n - grad);
}
`
