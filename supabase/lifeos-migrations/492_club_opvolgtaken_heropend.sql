-- 492: Club, heropenen van opvolgtaken, werkwijze-versies in een keer en
-- alleen het sleuteltje "Alles tonen".
--
-- Uit een codereview (04-11-2026). Alleen toevoegen; idempotent.
--
-- 1. club_opvolgtaken.heropend_op: heropenen zette de status weer op open maar
--    liet aangemaakt_op staan, dus een taak ouder dan 14 dagen viel meteen weer
--    weg en verliep opnieuw. Nu tellen de 14 dagen vanaf
--    greatest(aangemaakt_op, heropend_op) (VERLOOP_DAGEN en openSinds in
--    src/lib/club/automatisering/belijst.ts). Heropen zet heropend_op = now().
-- 2. club_werkwijze_nieuwe_versie: een nieuwe versie van een werkwijze, het
--    versienummer op de werkwijze en (bij een belangrijke wijziging) de
--    verplichte mededeling in een transactie. Lukt een deel niet, dan gebeurt
--    niets. Uitkomst 'ok' of 'oud' (iemand anders was net eerder).
-- 3. club_organisatie_alles_tonen: zet alleen instellingen.menu.alles_tonen;
--    andere sleutels en gelijktijdige wijzigingen blijven staan.
--
-- De code werkt ook zonder deze migratie (terugval, de fout staat in het log).

-- ── 1. Heropend ───────────────────────────────────────────────────────────────
alter table public.club_opvolgtaken add column if not exists heropend_op timestamptz;

-- ── 2. Nieuwe versie van een werkwijze, in een transactie ─────────────────────
create or replace function public.club_werkwijze_nieuwe_versie(
  p_user uuid,
  p_werkwijze uuid,
  p_oude_versie integer,
  p_versie integer,
  p_stappen jsonb,
  p_wat_anders text,
  p_door uuid,
  p_mededeling jsonb default null
) returns text
language plpgsql
security invoker
set search_path = public
as $$
begin
  if p_versie <> p_oude_versie + 1 then
    return 'oud';
  end if;

  -- Alleen als de werkwijze nog op de oude versie staat (en niet gearchiveerd is).
  update public.club_werkwijzen
     set versie = p_versie, bijgewerkt_op = now()
   where id = p_werkwijze and user_id = p_user and versie = p_oude_versie and not gearchiveerd;
  if not found then
    return 'oud';
  end if;

  insert into public.club_werkwijze_versies (user_id, werkwijze_id, versie, stappen, wat_anders, door_profiel)
  values (p_user, p_werkwijze, p_versie, p_stappen, p_wat_anders, p_door);

  if p_mededeling is not null then
    insert into public.club_mededelingen (user_id, titel, inhoud, vestigingen, rollen, verplicht, soort, werkwijze_id, werkwijze_versie, door_profiel)
    values (
      p_user,
      p_mededeling->>'titel',
      coalesce(p_mededeling->>'inhoud', ''),
      coalesce(array(select jsonb_array_elements_text(p_mededeling->'vestigingen')), '{}'),
      coalesce(array(select jsonb_array_elements_text(p_mededeling->'rollen')), '{}'),
      true,
      'wijziging',
      p_werkwijze,
      p_versie,
      p_door
    );
  end if;

  return 'ok';
exception
  -- Deze versie bestaat al: iemand anders was net eerder. Alles hierboven wordt teruggedraaid.
  when unique_violation then
    return 'oud';
end;
$$;

revoke all on function public.club_werkwijze_nieuwe_versie(uuid, uuid, integer, integer, jsonb, text, uuid, jsonb) from public, anon, authenticated;
grant execute on function public.club_werkwijze_nieuwe_versie(uuid, uuid, integer, integer, jsonb, text, uuid, jsonb) to service_role;

-- ── 3. Alleen het sleuteltje menu.alles_tonen ────────────────────────────────
create or replace function public.club_organisatie_alles_tonen(p_org uuid, p_beheerder uuid, p_aan boolean)
returns boolean
language plpgsql
security invoker
set search_path = public
as $$
begin
  update public.club_organisaties
     set instellingen = coalesce(instellingen, '{}'::jsonb)
                        || jsonb_build_object('menu',
                             (case when jsonb_typeof(instellingen->'menu') = 'object' then instellingen->'menu' else '{}'::jsonb end)
                             || jsonb_build_object('alles_tonen', p_aan)),
         bijgewerkt_op = now()
   where id = p_org and beheerder_id = p_beheerder;
  return found;
end;
$$;

revoke all on function public.club_organisatie_alles_tonen(uuid, uuid, boolean) from public, anon, authenticated;
grant execute on function public.club_organisatie_alles_tonen(uuid, uuid, boolean) to service_role;
