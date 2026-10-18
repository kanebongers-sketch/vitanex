-- 442: beveiligingsronde over betalen (439), push (438) en community (440).
-- Alleen toevoegen of vervangen; idempotent.
--
-- 1. club_betalen_teruggeven: geeft niets meer terug op een tegoed waarvan de
--    verkoop (volledig) is terugbetaald. Zonder deze regel kon een strip die
--    nog op een boeking stond, na de terugbetaling via annuleren terugkomen
--    op een tegoed waar het geld al van terug was.
-- 2. club_community_berichten: de rem (1 per 15 sec, 5 per 10 min, 30 per dag)
--    ook in de database, onder een slot per lid. De rem in de code telt eerst
--    en schrijft dan; veel gelijktijdige verzoeken kwamen er allemaal door.

create or replace function public.club_betalen_teruggeven(p_user uuid, p_lid uuid, p_reservering uuid, p_afspraak uuid, p_door text)
returns boolean
language plpgsql
set search_path = public
as $$
declare
  netto integer;
  bron uuid;
begin
  if (p_reservering is null) = (p_afspraak is null) then raise exception 'ongeldig'; end if;
  perform pg_advisory_xact_lock(hashtext('club_betalen_' || p_lid::text));
  select coalesce(sum(m.aantal), 0) into netto
    from public.club_betalen_mutaties m
   where m.user_id = p_user and m.lid_id = p_lid
     and ((p_reservering is not null and m.reservering_id = p_reservering) or (p_afspraak is not null and m.afspraak_id = p_afspraak));
  if netto >= 0 then return false; end if;
  select m.tegoed_id into bron
    from public.club_betalen_mutaties m
   where m.user_id = p_user and m.lid_id = p_lid and m.aantal < 0
     and ((p_reservering is not null and m.reservering_id = p_reservering) or (p_afspraak is not null and m.afspraak_id = p_afspraak))
   order by m.op desc
   limit 1;
  -- Niet terugzetten op een tegoed waarvan de verkoop terugbetaald is.
  update public.club_betalen_tegoeden t set saldo = saldo + 1
   where t.id = bron and t.saldo < t.totaal
     and not exists (select 1 from public.club_betalen_verkopen v where v.id = t.verkoop_id and v.status = 'terugbetaald');
  if not found then return false; end if;
  insert into public.club_betalen_mutaties (user_id, tegoed_id, lid_id, aantal, reden, reservering_id, afspraak_id, door)
  values (p_user, bron, p_lid, 1, 'terug', p_reservering, p_afspraak, left(p_door, 80));
  return true;
end $$;

revoke all on function public.club_betalen_teruggeven(uuid, uuid, uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.club_betalen_teruggeven(uuid, uuid, uuid, uuid, text) to service_role;

create or replace function public.club_community_bericht_rem()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  n15 integer;
  n10 integer;
  n24 integer;
begin
  -- Demodata en beheer vallen hier niet onder: alleen echte leden-berichten.
  if new.demo then return new; end if;
  perform pg_advisory_xact_lock(hashtext('club_community_' || new.lid_id::text));
  select count(*) filter (where aangemaakt_op > now() - interval '15 seconds'),
         count(*) filter (where aangemaakt_op > now() - interval '10 minutes'),
         count(*)
    into n15, n10, n24
    from public.club_community_berichten
   where user_id = new.user_id and lid_id = new.lid_id and aangemaakt_op > now() - interval '24 hours';
  if n15 >= 1 or n10 >= 5 or n24 >= 30 then
    raise exception 'community_rem' using errcode = 'P0001';
  end if;
  return new;
end $$;

revoke all on function public.club_community_bericht_rem() from public, anon, authenticated;

drop trigger if exists club_community_bericht_rem on public.club_community_berichten;
create trigger club_community_bericht_rem
  before insert on public.club_community_berichten
  for each row execute function public.club_community_bericht_rem();
