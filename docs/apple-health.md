# Apple Health in de MentaForce-app (iOS)

De iPhone-app leest Apple Health via `@capgo/capacitor-health` (MPL-2.0).
Code: `src/lib/health/apple-health.ts` (lezen) en `apple-health-parser.ts` (omzetten, met tests).

## Wat MentaForce leest
Per dag: stappen, afstand, actieve kcal, gemiddelde hartslag, rusthartslag, HRV (SDNN),
VO2max, gewicht, ademhaling, zuurstof, slaap (totaal, diep/kern/REM/wakker, bed- en wektijd)
en trainingen. MentaForce schrijft niets terug.

- HRV: Apple levert SDNN, Health Connect RMSSD. Vergelijk alleen met iemands eigen normaal.
- Slaap: per nacht telt een bron. Een bron met echte fases (Apple Watch) gaat voor een app
  die alleen "slaap" schrijft, en die weer voor alleen "in bed" (iPhone-bedtijd).
- Trainingen: de plugin levert geen hartslag per training; dat veld blijft leeg.

## Android blijft zoals het was
Op Android loopt alles via Health Connect (`@devmaxime/capacitor-health-connect` + `capacitor-health`).
`capacitor.config.ts` bepaalt per platform welke plugins meegaan (`includePlugins`): de twee
health-plugins registreren zich native allebei als `HealthPlugin` en mogen nooit samen op
een platform staan. Nieuwe Capacitor-plugin? Voeg hem daar toe, anders gaat hij niet mee.

## Nieuwe iOS-versie bouwen (Mac met Xcode nodig)
1. `npm install` en daarna `npx cap sync ios` (werkt `ios/App/CapApp-SPM/Package.swift` bij).
2. Open `ios/App/App.xcodeproj` in Xcode.
3. Target App > Signing & Capabilities > + Capability > **HealthKit** (maakt het entitlement aan).
4. `NSHealthShareUsageDescription` staat al in `ios/App/App/Info.plist`.
5. Testen op een echte iPhone (de simulator heeft geen Apple Watch-gegevens), dan via
   App Store Connect indienen. Apple vraagt bij review naar het gebruik van gezondheidsgegevens;
   de uitleg staat in de voorwaarden (`/voorwaarden#privacy`).

Zonder Mac kan het ook via een cloud-build (bijv. Codemagic of Ionic Appflow).
