-- ─── AI Your Gym: mails in de proefperiode ─────────────────────────────────
-- Welke proefmail (dag 1, dag 3, dag 7, herinnering voor het einde) al naar de
-- eigenaar van een aanmelding is gestuurd. De primaire sleutel zorgt dat elke
-- mail precies een keer weggaat: de cron claimt eerst een rij en verstuurt
-- daarna (mislukt het versturen, dan gaat de rij weer weg). Bevat geen
-- e-mailadres of inhoud, alleen soort en tijdstip. Verdwijnt met de aanmelding.
-- Alleen de server (service role): RLS aan, geen policies. Voegt alleen toe.
-- Code: src/lib/aiyourgym/proefmails/. Versturen alleen met AIYOURGYM_PROEFMAILS=1.

create table if not exists public.ayg_proefmails (
  aanmelding_id uuid not null references public.ayg_aanmeldingen (id) on delete cascade,
  soort text not null check (soort in ('dag1', 'dag3', 'dag7', 'einde')),
  verstuurd_op timestamptz not null default now(),
  primary key (aanmelding_id, soort)
);

alter table public.ayg_proefmails enable row level security;
revoke all on public.ayg_proefmails from anon, authenticated;
