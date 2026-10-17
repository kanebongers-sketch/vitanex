-- AI Your Gym: beveiligingsronde. Alleen toevoegen, idempotent. NIET automatisch uitgevoerd.

-- 1) Een adres (slug) kan maar bij een aanmelding horen die ingericht wordt of loopt.
--    Twee betalers met hetzelfde adres kunnen zo nooit allebei een sportschool krijgen
--    (de tweede claim krijgt 23505 en wordt een aanvraag voor Kane, zie claimInrichten).
--    Controleer eerst op dubbelen: select slug, count(*) from public.ayg_aanmeldingen
--    where status in ('inrichten','actief','betaling_mislukt','gepauzeerd','test') group by slug having count(*) > 1;
create unique index if not exists ayg_aanmeldingen_slug_uniek
  on public.ayg_aanmeldingen (slug)
  where status in ('inrichten', 'actief', 'betaling_mislukt', 'gepauzeerd', 'test');

-- 2) Index voor de rem per e-mailadres en per uur in /api/aiyourgym/checkout.
create index if not exists ayg_aanmeldingen_email_tijd
  on public.ayg_aanmeldingen (eigenaar_email, aangemaakt_op desc);

-- 3) Zeker weten: niemand behalve de server leest of schrijft deze tabellen.
alter table public.ayg_aanmeldingen force row level security;
alter table public.ayg_stripe_events force row level security;
revoke all on public.ayg_aanmeldingen from anon, authenticated, public;
revoke all on public.ayg_stripe_events from anon, authenticated, public;

-- 4) Optioneel, later: oude events opruimen (de tabel groeit anders eindeloos).
--    delete from public.ayg_stripe_events where ontvangen_op < now() - interval '90 days';
