-- ─── Fit Factory clubsoftware: cijfers in de database tellen ────────────────
-- Drie leesfuncties voor Vandaag en Cijfers, zodat niet elke check-in en elke
-- reservering naar de server hoeft. Zonder deze functies werkt alles ook (de
-- app telt dan zelf uit losse rijen), alleen trager bij veel data.
-- Alleen lezen, idempotent (create or replace). Alleen de service-role mag ze
-- aanroepen, net als bij de tabellen.

-- Bezoeken per vestiging: per week (sleutel = maandag, "YYYY-MM-DD") en per
-- weekdag en uur (sleutel = "isodow-uur", bv. "3-19"), in Nederlandse tijd.
create or replace function public.club_cijfers_bezoek(p_user uuid, p_van timestamptz)
returns table (vestiging text, soort text, sleutel text, aantal bigint)
language sql stable
set search_path = public
as $$
  with c as (
    select ci.vestiging, (ci.op at time zone 'Europe/Amsterdam') as lokaal
    from public.club_checkins ci
    where ci.user_id = p_user and ci.op >= p_van
  )
  select c.vestiging, 'week'::text, to_char(date_trunc('week', c.lokaal), 'YYYY-MM-DD'), count(*)
  from c group by c.vestiging, to_char(date_trunc('week', c.lokaal), 'YYYY-MM-DD')
  union all
  select c.vestiging, 'uur'::text, extract(isodow from c.lokaal)::int || '-' || extract(hour from c.lokaal)::int, count(*)
  from c group by c.vestiging, extract(isodow from c.lokaal)::int || '-' || extract(hour from c.lokaal)::int
$$;

-- Het laatste bezoek per lid van een vestiging (voor "leden met risico").
create or replace function public.club_laatste_bezoek(p_user uuid, p_vestiging text)
returns table (lid_id uuid, laatste timestamptz)
language sql stable
set search_path = public
as $$
  select ci.lid_id, max(ci.op)
  from public.club_checkins ci
  where ci.user_id = p_user and ci.vestiging = p_vestiging
  group by ci.lid_id
$$;

-- Per les de reserveringen geteld op status.
create or replace function public.club_cijfers_lessen(p_user uuid, p_van timestamptz, p_tot timestamptz)
returns table (
  id uuid, vestiging text, lestype text, start_op timestamptz, capaciteit int, geannuleerd boolean,
  bezet bigint, aanwezig bigint, no_show bigint, wachtlijst bigint
)
language sql stable
set search_path = public
as $$
  select l.id, l.vestiging, t.naam, l.start_op, l.capaciteit, l.status = 'geannuleerd',
    count(r.id) filter (where r.status in ('geboekt', 'aanwezig', 'no_show')),
    count(r.id) filter (where r.status = 'aanwezig'),
    count(r.id) filter (where r.status = 'no_show'),
    count(r.id) filter (where r.status = 'wachtlijst')
  from public.club_lessen l
  join public.club_lestypen t on t.id = l.lestype_id
  left join public.club_reserveringen r on r.les_id = l.id
  where l.user_id = p_user and l.start_op >= p_van and l.start_op < p_tot
  group by l.id, t.naam
$$;

-- Sneller tellen per les.
create index if not exists club_reserveringen_les_status on public.club_reserveringen (les_id, status);

revoke all on function public.club_cijfers_bezoek(uuid, timestamptz) from public, anon, authenticated;
revoke all on function public.club_laatste_bezoek(uuid, text) from public, anon, authenticated;
revoke all on function public.club_cijfers_lessen(uuid, timestamptz, timestamptz) from public, anon, authenticated;
grant execute on function public.club_cijfers_bezoek(uuid, timestamptz) to service_role;
grant execute on function public.club_laatste_bezoek(uuid, text) to service_role;
grant execute on function public.club_cijfers_lessen(uuid, timestamptz, timestamptz) to service_role;
