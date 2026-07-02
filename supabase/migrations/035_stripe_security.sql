-- 035: security-hardening voor de Stripe-integratie (n.a.v. security-review)
--
-- (1) Kolomlek dichten: de publieke SELECT-policy op bedrijven (004, bedoeld om
--     hr-codes te valideren) is rij-gebaseerd en zou de nieuwe stripe_*-kolommen
--     cross-tenant leesbaar maken. RLS kent geen kolommen; kolom-GRANTS wel.
--     We trekken table-brede SELECT in en geven expliciet alle kolommen terug
--     BEHALVE stripe_customer_id/stripe_subscription_id/stripe_subscription_status.
--     Die zijn vanaf nu alleen via de service-role (API-routes) leesbaar.
--     Let op: nieuwe kolommen zijn hierdoor standaard NIET client-leesbaar
--     totdat ze expliciet ge-grant worden — secure by default.
revoke select on table bedrijven from anon, authenticated;
grant select (
  id, naam, aangemaakt_op, hr_code, hr_code_actief,
  sector, grootte, stad, website, kvk_nummer, beschrijving,
  disc_verplicht, plan
) on bedrijven to anon, authenticated;

-- (2) Webhook-replay-bescherming: elk Stripe-event wordt precies één keer
--     verwerkt. Alleen de service-role raakt deze tabel aan (RLS zonder
--     policies + revoke), clients hebben er niets te zoeken.
create table if not exists stripe_webhook_events (
  event_id text primary key,
  type text not null,
  verwerkt_op timestamptz not null default now()
);
alter table stripe_webhook_events enable row level security;
revoke all on table stripe_webhook_events from anon, authenticated;
