-- 491: Club, opvolgtaken die te lang open staan sluiten als "verlopen".
--
-- Opdracht Kane (03-11-2026, Club in 10 minuten): Bellen vandaag toonde 76
-- namen en de teller 99+. Regels als welkom, proeflid, jarig en mijlpaal
-- vervallen nooit vanzelf, dus open taken stapelden zich op. Vanaf nu sluit
-- de ronde van vandaag een taak die langer dan 14 dagen open staat met de
-- status 'verlopen' (VERLOOP_DAGEN in src/lib/club/automatisering/belijst.ts).
-- Er wordt niets verwijderd: de taak blijft bewaard en is terug te zetten met
-- Heropen. Alleen toevoegen; idempotent.
--
-- 1. De statuscontrole kent ook 'verlopen'.
-- 2. Bestaande taken die nu al langer dan 14 dagen open staan, worden een keer
--    als verlopen gesloten (zelfde regel als de code).
-- 3. Mocht een lid voor dezelfde regel toch meer dan een open taak hebben (oude
--    gegevens), dan blijft de nieuwste open en sluiten de oudere als verlopen.

alter table public.club_opvolgtaken drop constraint if exists club_opvolgtaken_status_check;
alter table public.club_opvolgtaken add constraint club_opvolgtaken_status_check
  check (status in ('open', 'gedaan', 'overgeslagen', 'vervallen', 'verlopen'));

update public.club_opvolgtaken
   set status = 'verlopen', afgehandeld_door = 'Club', afgehandeld_op = now()
 where status = 'open'
   and aangemaakt_op < (now() at time zone 'Europe/Amsterdam')::date - 14;

with dubbel as (
  select id,
         row_number() over (partition by user_id, vestiging, lid_id, regel order by aangemaakt_op desc, id desc) as nr
    from public.club_opvolgtaken
   where status = 'open'
     and lid_id is not null
)
update public.club_opvolgtaken t
   set status = 'verlopen', afgehandeld_door = 'Club', afgehandeld_op = now()
  from dubbel d
 where t.id = d.id and d.nr > 1;
