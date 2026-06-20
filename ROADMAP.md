# Roadmap — Vitaal / MentaForce

Gegenereerd na 8-agent volledige product-, UX-, groei-, investerings-, architectuur-, QA-, markt- en innovatie-audit (2026-06-19).

---

## Prioriteitsmatrix

Impact × Effort scores:
- **P0** = Blokkeer release / kritieke bug / security
- **P1** = Hoge impact, beperkt effort
- **P2** = Strategische differentiator
- **P3** = Nice-to-have / langetermijn

---

## P0 — Kritiek (Fix voor volgende release)

| # | Item | Bestand | Type |
|---|------|---------|------|
| 1 | Niet-atomische delete+insert in submit-checkin → data loss bij concurrent submits | `src/app/api/submit-checkin/route.ts` L62-76 | Bug |
| 2 | `achievements/check` insert zonder `onConflict` → dubbele achievements mogelijk | `src/app/api/achievements/check/route.ts` | Bug |
| 3 | `bedrijf_id` in submit-checkin niet gevalideerd als eigendom van user (IDOR) | `src/app/api/submit-checkin/route.ts` L74 | Security |
| 4 | `burnout-predictor` GET zonder try/catch → unhandled exceptions bij DB fout | `src/app/api/burnout-predictor/route.ts` L122 | Bug |

---

## P1 — Hoge impact, beperkt bouwtijd (< 2 weken elk)

### Product & UX

| # | Item | Bron | Effort |
|---|------|------|--------|
| 5 | Verwijder wekelijkse check-in als hard-gate voor de rest van de app | UX Agent Fix #3 | S |
| 6 | Reduceer sidebar van 30 naar max 8 items op mobile (of sectie-drawer model) | UX Agent Fix #2 | M |
| 7 | Verwijder "Content OS" uit employee-facing navigatie | UX Agent Fix #1 | XS |
| 8 | Elimineer duplicatie van "Vandaag" + "Snel loggen" op home-pagina | UX Agent Fix #6 | XS |
| 9 | Voeg sessie-persistentie toe aan check-in flow (localStorage draft per sectie) | UX Agent Fix #9 | S |
| 10 | Fix sidebar sub-item touch targets (33px → 44px) | UX Agent Fix #5 | XS |

### Architectuur

| # | Item | Bron | Effort |
|---|------|------|--------|
| 11 | Split `dashboard/page.tsx` (1686 regels) in aparte component-bestanden | Architect Agent | L |
| 12 | Migreer XP van localStorage naar Supabase `user_xp` tabel | QA Agent MED-05 | M |
| 13 | Implementeer server-side achievements sync (localStorage ↔ server) | QA Agent MED-05 | M |
| 14 | Voeg dynamic imports toe voor Recharts (bundle-grootte) | Architect Agent | S |
| 15 | Valideer `slaap/route.ts` `kwaliteit` range (1-10) en datum format | QA Agent VAL-01/02 | XS |

### Groei & Monetisatie

| # | Item | Bron | Effort |
|---|------|------|--------|
| 16 | Burnout ROI Calculator voor CFO/HR als in-app rapport | Innovation Agent | M |
| 17 | Manager Pulse wekelijks rapport (anoniem team-niveau snapshot per email) | Innovation Agent | M |
| 18 | Persoonlijk wekelijks rapport voor medewerkers (PDF download) | Product Agent | M |

---

## P2 — Strategische differentiators (Q3 2026)

| # | Item | Impact | Effort |
|---|------|--------|--------|
| 19 | **Team Energy Heatmap** — anoniem team-dashboard voor HR met privacy-garantie | Uniek in NL markt | L |
| 20 | **AI Coach met Geheugen** — conversation summaries + vector-opslag → relatie i.p.v. sessie | Sterkste retentie-mechanic | L |
| 21 | **Predictive Burnout Score v2** — ML-model op historische check-in data, 4-weeks vooruitkijkend | Kernproduct USP | XL |
| 22 | **Kalender-integratie** — Google Calendar / Outlook blokken reserveren op basis van energieniveau | Dagelijkse relevantie | L |
| 23 | **Proactive Micro-Coaching** — push na 3 slechte slaapdagen met één concrete tip | Engagement | M |
| 24 | **Team Challenges** — afdeling vs. afdeling streak-scorebord (volledig anoniem) | Viraliteit | M |

---

## P3 — Langetermijn / Post-PMF

| # | Item | Toelichting |
|---|------|-------------|
| 25 | Microsoft Teams / Slack Bot voor check-ins | Adoptie in bestaande workflow |
| 26 | Voice Check-In (30s inspreken → AI vult mood/stress in) | Frictionloos loggen |
| 27 | Wearable integratie (Apple Health, Google Fit, Fitbit) | Objectieve data |
| 28 | HR-systeem SSO koppeling (AFAS, Workday, Nmbrs) | Enterprise sales-enabler |
| 29 | Natural Language HR Reports ("Stuur me een rapport van vorige maand") | AI-differentiator |
| 30 | Exit Risk Predictor — combineer lage scores + verlofpatroon + eNPS | Strategische HR-waarde |

---

## Marktpositionering (Market Agent bevindingen)

**Winnende positionering:** "Stop verzuim vóórdat het begint."

**Primaire ICP:** Nederlandse bedrijven 50–250 FTE in sectoren met hoge verzuimrisico's (zorg, onderwijs, logistiek).

**Pricing tiers:**
- **Starter** — €4/user/maand (MKB <50 FTE, basis wellness)
- **Growth** — €9/user/maand (aanbevolen, incl. AI-coaching + burnout-predictor)
- **Enterprise** — op maat (>250 FTE, SSO, custom integraties)

**Distributiestrategie:**
1. Arbodienst-partnerschappen als kanaal (vermijdt groot salesteam)
2. Zorgverzekeraar-kanaal (preventiebudgetten groeien 18% p.j.)
3. Direct MKB-segment via content marketing rond burnout-cijfers

**VC Investment Score (Investor Agent):** 67/100
- Sterktes: unieke burnout-predictor, juiste markt, real data
- Zwaktes: ontbreekt AFAS/Workday-integraties, beperkte social proof, XP in localStorage toont data-architectuur risico's

---

## Technische schuldprioriteiten

| Schuld | Bestand | Urgentie |
|--------|---------|---------|
| God Component (1686 regels) | `dashboard/page.tsx` | Hoog |
| XP in localStorage | `src/lib/xp.ts` | Hoog |
| Dubbele checkin-data queries | `dashboard/page.tsx` L627+671 | Medium |
| Twee inconsistente achievement-systemen | `xp.ts` vs `achievements/check` | Hoog |
| Rate limiting ontbreekt op alle routes | alle API routes | Medium |
| `submit-checkin` bedrijf_id IDOR | `submit-checkin/route.ts` | Kritiek |
