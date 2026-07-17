# Deployen van 140 — het mensen-bord (CRM)

Geschreven 17 juli 2026. De code staat op main; **migratie 140 is nog niet
gedraaid.** Tot dat gebeurt geeft `/lifeos/mensen` foutmeldingen — de routes
vragen naar tabellen (`crm_personen`, `crm_historie`) die er nog niet zijn.

Dit bestand mag weg zodra 't gedraaid en getest is.

---

## 1. Migratie draaien (LifeOS-project, NIET MentaForce)

Supabase → **lifeos**-project (`bbklogjersviaoocgrve`) → SQL-editor →
`140_crm.sql` plakken en draaien. Idempotent, dus opnieuw draaien is veilig. De
migratie faalt hard als RLS niet aanstaat of een index ontbreekt (zelfcontrole
onderaan) — dat is met opzet.

Check in de Supabase-advisor dat RLS aanstaat op `crm_personen` en `crm_historie`.

## 2. Wat je krijgt

- **Nav**: onder "Mijn dashboard" staat nu ook **"Mensen"** (founder-only). Ook een
  Mensen-tegel in de cockpit-snelrij.
- **`/lifeos/mensen`**: drie tabs (PT-klanten, Team Budel, PT-team). Per tab een
  kanban met status-kolommen. Sleep een kaart naar een andere kolom → status
  wijzigt (en wordt gelogd). Zet een follow-up-dag. Klik een kaart → popup met de
  status-geschiedenis, contact, bijzonderheden en een notitie-veld.
- **Toetsenbord**: elke kaart heeft een "Verplaats naar…"-kiezer, dus je hoeft niet
  te slepen als je dat niet wilt.

## 3. MentaForce opent nu in je volledige dashboard

Na deze update logt je login-flow je als founder direct door naar `/lifeos` (je
command center) i.p.v. `/admin`. Dat gebeurt via de founder-gate; een fout op die
check blokkeert je login nóóit (dan val je door naar de normale route). Wil je
liever ergens anders landen, zeg het — het is één regel.

Niet-founders (klantbedrijven en hun medewerkers) merken hier **niets** van; hun
MentaForce blijft exact zoals het was.

## 4. `npm run build` = de echte typecheck

Zoals altijd: ik kon geen `tsc`/`next build` draaien (crasht je pc). Vitest (1045
groen), eslint en een postcss-CSS-check zijn schoon, en een review-agent liep de
UI↔API-raakvlakken na. Maar **`npm run build` op jouw kant is de eerste echte
typecheck** over dit werk. Faalt 'ie: log plakken, dan fix ik het.

Daarna in Render: **Manual Deploy → Deploy latest commit** (Render auto-deployt
niet op een push).
