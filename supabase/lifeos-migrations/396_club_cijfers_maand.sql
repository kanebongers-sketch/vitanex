-- ─── Fit Factory clubsoftware: cijfers per kalendermaand ───────────────────
-- Cijfers rapporteert per kalendermaand en vergelijkt met de vorige maand en
-- dezelfde maand vorig jaar. Daarvoor telt de database per dag (Nederlandse
-- tijd), zodat de app elk venster (hele maand, of de eerste 14 dagen) kan
-- optellen zonder elke check-in en reservering op te halen.
-- Zonder deze functies werkt alles ook (de app telt dan zelf uit losse rijen
-- en de functies van migratie 386), alleen trager bij veel data.
-- Alleen lezen, idempotent (create or replace, if not exists). Alleen de
-- service-role mag ze aanroepen, net als bij de tabellen.

-- Bezoeken per vestiging per dag ("YYYY-MM-DD", Nederlandse tijd) van p_van tot
-- p_tot, plus per weekdag en uur ("isodow-uur", bv. "3-19") vanaf p_uur_van.
create or replace function public.club_cijfers_bezoek_dag(p_user uuid, p_van timestamptz, p_tot timestamptz, p_uur_van timestamptz)
returns table (vestiging text, soort text, sleutel text, aantal bigint)
language sql stable
set search_path = public
as $$
  with c as (
    select ci.vestiging, ci.op, (ci.op at time zone 'Europe/Amsterdam') as lokaal
    from public.club_checkins ci
    where ci.user_id = p_user and ci.op >= p_van and ci.op < p_tot
  )
  select c.vestiging, 'dag'::text, to_char(c.lokaal, 'YYYY-MM-DD'), count(*)
  from c group by c.vestiging, to_char(c.lokaal, 'YYYY-MM-DD')
  union all
  select c.vestiging, 'uur'::text, extract(isodow from c.lokaal)::int || '-' || extract(hour from c.lokaal)::int, count(*)
  from c
  where c.op >= p_uur_van
  group by c.vestiging, extract(isodow from c.lokaal)::int || '-' || extract(hour from c.lokaal)::int
$$;

-- Lessen per vestiging per dag: alleen lessen die doorgingen en voor p_tot
-- begonnen. Geboekt telt per les hoogstens de capaciteit.
create or replace function public.club_cijfers_lessen_dag(p_user uuid, p_van timestamptz, p_tot timestamptz)
returns table (vestiging text, dag text, lessen bigint, capaciteit bigint, bezet bigint, aanwezig bigint, no_show bigint)
language sql stable
set search_path = public
as $$
  with per_les as (
    select l.vestiging,
      to_char(l.start_op at time zone 'Europe/Amsterdam', 'YYYY-MM-DD') as dag,
      l.capaciteit,
      count(r.id) filter (where r.status in ('geboekt', 'aanwezig', 'no_show')) as bezet,
      count(r.id) filter (where r.status = 'aanwezig') as aanwezig,
      count(r.id) filter (where r.status = 'no_show') as no_show
    from public.club_lessen l
    left join public.club_reserveringen r on r.les_id = l.id
    where l.user_id = p_user and l.start_op >= p_van and l.start_op < p_tot
      and l.status is distinct from 'geannuleerd'
    group by l.id
  )
  select p.vestiging, p.dag, count(*), sum(p.capaciteit)::bigint, sum(least(p.bezet, p.capaciteit))::bigint,
    sum(p.aanwezig)::bigint, sum(p.no_show)::bigint
  from per_les p
  group by p.vestiging, p.dag
$$;

-- Vanaf wanneer er per vestiging bezoek, lessen en leads zijn. Zo kan Cijfers
-- eerlijk "geen vergelijking" zeggen als een maand van voor de data is.
create or replace function public.club_cijfers_begin(p_user uuid)
returns table (vestiging text, bron text, eerste timestamptz)
language sql stable
set search_path = public
as $$
  select x.vestiging, x.bron, x.eerste
  from (
    select v.vestiging, 'bezoek'::text as bron,
      (select min(ci.op) from public.club_checkins ci where ci.user_id = p_user and ci.vestiging = v.vestiging) as eerste
    from public.club_vestigingen v
    union all
    select v.vestiging, 'lessen'::text,
      (select min(l.start_op) from public.club_lessen l
        where l.user_id = p_user and l.vestiging = v.vestiging and l.status is distinct from 'geannuleerd')
    from public.club_vestigingen v
    union all
    select v.vestiging, 'leads'::text,
      (select min(ld.aangemaakt_op) from public.club_leads ld where ld.user_id = p_user and ld.vestiging = v.vestiging)
    from public.club_vestigingen v
  ) x
  where x.eerste is not null
$$;

-- Snel per periode over alle vestigingen tellen.
create index if not exists club_checkins_user_op on public.club_checkins (user_id, op);
create index if not exists club_lessen_user_start on public.club_lessen (user_id, start_op);
create index if not exists club_leads_user_aangemaakt on public.club_leads (user_id, vestiging, aangemaakt_op);

revoke all on function public.club_cijfers_bezoek_dag(uuid, timestamptz, timestamptz, timestamptz) from public, anon, authenticated;
revoke all on function public.club_cijfers_lessen_dag(uuid, timestamptz, timestamptz) from public, anon, authenticated;
revoke all on function public.club_cijfers_begin(uuid) from public, anon, authenticated;
grant execute on function public.club_cijfers_bezoek_dag(uuid, timestamptz, timestamptz, timestamptz) to service_role;
grant execute on function public.club_cijfers_lessen_dag(uuid, timestamptz, timestamptz) to service_role;
grant execute on function public.club_cijfers_begin(uuid) to service_role;
