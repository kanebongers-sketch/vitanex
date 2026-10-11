@AGENTS.md

# RELEASE V-webshop (releasev.nl) in deze app

Sinds 11-10-2026 draait de RELEASE V-webshop in dezelfde app als Fit Factory PT. Zie `docs/releasev/README.md`.
- Code: `src/releasev/` (alias `@rv/*`), pagina's: `src/app/releasev/`. `src/proxy.ts` herschrijft verzoeken op releasev.nl naar `/releasev/…` (logica: `src/releasev/lib/host-routing.ts`).
- Raak voor Fit Factory nooit `src/releasev` aan en andersom; gedeeld zijn alleen `src/proxy.ts`, `next.config.ts` (redirects/CSP gelden niet voor releasev.nl) en `src/app/layout.tsx`.
- Webshopstijlen staan in `src/releasev/styles/releasev.css` (eigen Tailwind-build, alleen op webshoppagina's) met unieke `--rv-…`-variabelen. Nieuwe algemene regels in `src/app/globals.css` buiten de Tailwind-lagen kunnen de webshop raken: check dan releasev.nl.
- Instellingen van de webshop beginnen altijd met `RELEASEV_` (eigen Stripe via pakket `stripe-rv`, eigen Resend-adressen).
- Schrijfstijl webshop: geen gedachtestreepjes en geen klemtoon-accenten (test: `src/releasev/content/copy-style.test.ts`).
- Logo (gekozen 11-10-2026): woordmerk "RELEASE V" in Archivo breed/zwaar, V in signaaloranje #ff6b3d. Component `src/releasev/components/layout/Logo.tsx`, paden in `logo-paths.ts` (gegenereerd), bestanden voor drukwerk in `docs/releasev/brand/`. Favicon is de oranje V.
