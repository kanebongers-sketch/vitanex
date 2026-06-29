# Brein — neuro-anatomie als naslag

Korte, algemene naslag over de hersenen, plus uitleg over hoe MentaForce het brein gebruikt als visuele metafoor voor de zes vlakken. De anatomie hieronder is algemeen en feitelijk; het bevat geen medische beloftes en is geen diagnostisch hulpmiddel.

## Hersenkwabben en kernstructuren

### Frontale kwab (voorhoofdskwab)
Aan de voorzijde van de grote hersenen. Betrokken bij planning, besluitvorming, aandacht, werkgeheugen, impulscontrole, motoriek en aspecten van taal en persoonlijkheid.

### Pariëtale kwab (wandbeenkwab)
Bovenaan/achteraan. Verwerkt zintuiglijke informatie zoals tast, temperatuur, pijn en lichaamsgevoel, en speelt een rol bij ruimtelijk besef en oriëntatie.

### Temporale kwab (slaapbeenkwab)
Aan de zijkant, ter hoogte van de slapen. Betrokken bij gehoor, taalbegrip en geheugen; bevat structuren die belangrijk zijn voor het vormen van herinneringen.

### Occipitale kwab (achterhoofdskwab)
Achteraan. Het primaire visuele verwerkingsgebied: het interpreteren van wat we zien (vorm, kleur, beweging).

### Cerebellum (kleine hersenen)
Onderaan-achteraan, onder de grote hersenen. Coördineert beweging, balans, houding en motorische timing; speelt ook een rol bij het fijn afstemmen van handelingen.

### Hersenstam
Verbindt de hersenen met het ruggenmerg. Reguleert vitale, automatische functies zoals ademhaling, hartslag, bloeddruk en de slaap-waakcyclus.

## Mapping in MentaForce

In MentaForce wordt het 3D-brein verdeeld in **zes delen** die de zes pijlers van welzijn representeren. De verdeling volgt:

- **twee hemisferen** (links en rechts), en
- **drie banden** per hemisfeer (voor, midden, achter).

Dat geeft 6 regio's: voor-links, voor-rechts, midden-links, midden-rechts, achter-links, achter-rechts. In de scrollsectie lichten deze regio's één voor één op terwijl je door de zes vlakken scrollt.

> **Belangrijk:** dit is een **visuele metafoor**, geen exacte neurologische claim. De zes breindelen koppelen welzijnsvlakken aan een herkenbaar beeld; ze stellen geen specifieke hersengebieden gelijk aan specifieke vlakken en doen geen uitspraak over neurologische oorzaak of werking.

### Technische details (naslag)

- Regio-index = `hemisfeer (0=links, 1=rechts) * 3 + band (0=voor, 1=midden, 2=achter)`.
- Scroll-volgorde naar regio: `STEP_REGION = [0, 3, 1, 4, 2, 5]` (voor-links, voor-rechts, midden-links, midden-rechts, achter-links, achter-rechts).
- Elk breindeel heeft een eigen kleur (`BRAIN_COLORS` in `src/components/marketing/theme.ts`); deze kleuren worden **alleen** in de 3D-visualisatie gebruikt, nergens anders in de UI.
- Implementatie: `src/components/marketing/landing/BrainScroll.tsx`, `src/components/marketing/BrainCanvas.tsx`.
