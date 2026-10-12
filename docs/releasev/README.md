# RELEASE V webshop (releasev.nl)

Webshop voor de Recovery & Mobility Kit, onderdeel van deze app (naast Fit Factory PT).

## Waar staat wat
| Wat | Waar |
|---|---|
| Pagina's | `src/app/releasev/` (bezoekers zien gewoon `releasev.nl/product`, enz.) |
| Componenten, teksten, config, logica | `src/releasev/` (import met `@rv/…`) |
| Merk, contact, bedrijfsgegevens, verzending | `src/releasev/config/site.ts` |
| Prijs, product, duo-pakket | `src/releasev/config/product.ts` |
| Foto's (tijdelijk Unsplash) | `src/releasev/config/images.ts` |
| Teksten | `src/releasev/content/` |
| Kleuren, fonts, maten | `src/releasev/styles/tokens.css` (waarden in `:root { --rv-… }`) |
| Domeinlogica | `src/releasev/lib/host-routing.ts` + `src/proxy.ts` |
| Stijlregels design | `docs/releasev/STYLEGUIDE.md` |

## Lokaal ontwikkelen
`npm run dev` en open **http://releasev.localhost:3000** (de app kiest de webshop op basis van het domein).

## Instellingen (Render > Environment)
Alles met het voorvoegsel `RELEASEV_`, zodat het nooit botst met MentaForce/Fit Factory:

| Variabele | Wat |
|---|---|
| `NEXT_PUBLIC_RELEASEV_SITE_URL` | Standaard `https://releasev.nl` |
| `RELEASEV_SITE_MODE` | `verborgen` (standaard: noindex voor Google) of `live` |
| `RELEASEV_PREVIEW_PASSWORD` | Optioneel wachtwoord (gebruiker `release`) zolang verborgen |
| `RELEASEV_STRIPE_SECRET_KEY`, `RELEASEV_STRIPE_WEBHOOK_SECRET` | Stripe van RELEASE V (webhook: `https://releasev.nl/api/stripe/webhook`) |
| `RELEASEV_STRIPE_PRICE_ID_KIT(_DUO)` | Optioneel, vaste Stripe-prijzen |
| `RELEASEV_RESEND_API_KEY`, `RELEASEV_EMAIL_FROM`, `RELEASEV_EMAIL_TO`, `RELEASEV_RESEND_SEGMENT_ID` | E-mail |
| `RELEASEV_NEWSLETTER_SIGNING_SECRET` | Min. 32 tekens, voor de double opt-in |
| `NEXT_PUBLIC_RELEASEV_TRACKING_ENABLED`, `NEXT_PUBLIC_RELEASEV_GA_MEASUREMENT_ID`, `NEXT_PUBLIC_RELEASEV_META_PIXEL_ID`, `RELEASEV_META_CAPI_ACCESS_TOKEN` | Tracking (alleen na toestemming) |

## Afspraken
- Geen gedachtestreepjes en geen klemtoon-accenten in teksten (test bewaakt het).
- Geen verzonnen reviews, cijfers of medische claims. Kane: manager van 8 PT-locaties, leidt zelf trainers op (geen academy).
- Openstaande verbeterpunten: `docs/releasev/CRO-AUDIT.md`.

## MentaForce onder releasev.nl/mentaforce (sinds 12-10-2026)
- `releasev.nl/mentaforce/…` is MentaForce; alle andere adressen blijven van de webshop (ook `/contact`, `/bedankt` en de webshop-API's).
- Regels en tests: `src/lib/mentaforce/basis.ts`. De webshop-pagina's en -API's worden tijdens de build uit `src/app/releasev` gelezen (`RELEASEV_ROUTES`, `RELEASEV_APIS` in `next.config.ts`), zodat MentaForce er nooit tussen komt.
- Onder `/mentaforce` gelden de headers (CSP) van MentaForce; de verborgen stand van de webshop (noindex) geldt er ook.
- Supabase: `https://releasev.nl/mentaforce/**` moet in de toegestane terugkeeradressen staan (Authentication > URL Configuration), anders werken Google-login en wachtwoord-reset niet.
- Render: `MENTAFORCE_APP_URL=https://releasev.nl/mentaforce` voor links in mails (uitnodiging, welkom, herinnering), de Stripe-terugkeer en de Fitbit/Google Agenda-koppeling. `NEXT_PUBLIC_APP_URL` niet aanpassen: LifeOS gebruikt die. Bij Fitbit en Google het terugkeeradres `https://releasev.nl/mentaforce/api/<fitbit|google-calendar>/callback` toevoegen.
