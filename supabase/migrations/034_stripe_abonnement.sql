-- 034: Stripe-abonnementsvelden op bedrijven + ontbrekende disc_verplicht
--
-- stripe_customer_id / stripe_subscription_id / stripe_subscription_status
-- worden beheerd door /api/stripe/* (service-role); clients lezen alleen.
-- disc_verplicht werd al door hr/page.tsx gelezen en geschreven maar stond
-- nog in geen enkele migratie.

alter table bedrijven add column if not exists disc_verplicht boolean not null default false;
alter table bedrijven add column if not exists stripe_customer_id text;
alter table bedrijven add column if not exists stripe_subscription_id text;
alter table bedrijven add column if not exists stripe_subscription_status text;

-- Eén bedrijf per Stripe-customer (nulls uitgezonderd).
create unique index if not exists bedrijven_stripe_customer_id_key
  on bedrijven (stripe_customer_id)
  where stripe_customer_id is not null;
