# Three.js / R3F — MentaForce brein

Stack: `@react-three/fiber` 9, `@react-three/drei` 10, `three` 0.176, `@react-three/postprocessing` 3.
Referentie-implementatie: `src/components/marketing/BrainCanvas.tsx`.

## Laden & mounten

- Heel `BrainCanvas` is `'use client'` en wordt lazy geladen: `dynamic(() => import('./BrainCanvas'), { ssr: false })`. Three draait nooit op de server.
- GLTF laden met `useGLTF(MODEL_URL)` en wrap de gebruiker ervan in `<Suspense fallback={null}>`. Preloaden met `useGLTF.preload(MODEL_URL)` op modulniveau.
- Model = geometry-only in `/public/models/brain.glb`. Documenteer herkomst/licentie in een comment (zoals nu gedaan).

## Materialen & shading

- Custom shading via `material.onBeforeCompile` + uniforms (zie `addHighlight`), **niet** een losse `ShaderMaterial` waar het niet hoeft. Zo behoud je three's lighting/PBR.
- Bewaar de shader-ref op `mat.userData.shader` zodat `useFrame` de uniforms (`uRegionA`/`uRegionB`/`uMix`) kan updaten.
- Vertex-colors (`vertexColors: true`) voor de 6 regio-kleuren; roep `computeVertexNormals()` aan ná elke displacement/geometrie-aanpassing, anders klopt de belichting niet.
- De 6 breinkleuren komen ALLEEN uit `BRAIN_COLORS` (theme.ts). Brein = enige meerkleurige element; de rest van de scene is navy + cyan.

## Geometrie wegknippen

- Onderkant/stam wegknippen met een `THREE.Plane` als `material.clippingPlanes`, en zet **`gl.localClippingEnabled = true`** in `onCreated` (anders doet de plane niets).

## useFrame (per-frame)

- **Lees en muteer refs, nooit `setState`.** State per frame = re-render per frame = stotteren.
- Smooth volgen met frame-rate-onafhankelijke lerp: `const k = 1 - Math.exp(-delta * speed)` en dan `current.lerp(target, k)` (zie camera-logica). Geen vaste lerp-factor — die is FPS-afhankelijk.
- Houd `useFrame` goedkoop: geen allocaties in de loop. Hergebruik vooraf gemaakte `Vector3`/`Quaternion`-refs (`tA`, `tB`, `tDir`, ...), alloceer niet elke frame een nieuwe.

## Renderer

- Screenshots/export vereisen `gl: { preserveDrawingBuffer: true }` — kost geheugen, dus alleen aanzetten als je het echt gebruikt.
- `powerPreference: 'high-performance'`, ACES tone mapping. Clear-color = `COLORS.navy`.
- Sober verlichten: ambient + 1–2 directional + evt. 1 point. Cyan-rim mag, geen kleurenfestival.

## Performance

- GPU-zuinig: beperk vertex-count, draw-calls en lights. Geen postprocessing-effecten "voor de sier".
- `frustumCulled={false}` alleen waar nodig (bv. het achtergrond-deeltjesveld dat het hele beeld vult).
- Respecteer `prefers-reduced-motion`: zet auto-rotatie/zware animatie uit en toon een statisch frame.
