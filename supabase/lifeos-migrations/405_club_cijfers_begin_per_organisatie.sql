-- ─── Club: cijfers-beginstand alleen over de eigen vestigingen ──────────────
-- club_cijfers_begin (396) liep door de vestigingen van alle sportscholen en
-- filterde pas in de subqueries op p_user. Dat lekte niets, maar is onnodig
-- werk nu er meerdere sportscholen zijn. Zelfde uitkomst, alleen eigen
-- vestigingen. Idempotent.

create or replace function public.club_cijfers_begin(p_user uuid)
returns table(vestiging text, bron text, eerste timestamptz)
language sql
stable
set search_path to 'public'
as $function$
  select x.vestiging, x.bron, x.eerste
  from (
    select v.vestiging, 'bezoek'::text as bron,
      (select min(ci.op) from public.club_checkins ci where ci.user_id = p_user and ci.vestiging = v.vestiging) as eerste
    from public.club_vestigingen v where v.user_id = p_user
    union all
    select v.vestiging, 'lessen'::text,
      (select min(l.start_op) from public.club_lessen l
        where l.user_id = p_user and l.vestiging = v.vestiging and l.status is distinct from 'geannuleerd')
    from public.club_vestigingen v where v.user_id = p_user
    union all
    select v.vestiging, 'leads'::text,
      (select min(ld.aangemaakt_op) from public.club_leads ld where ld.user_id = p_user and ld.vestiging = v.vestiging)
    from public.club_vestigingen v where v.user_id = p_user
  ) x
  where x.eerste is not null
$function$;
