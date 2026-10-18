-- 445: Club, ledenapp. Een training maar een keer opslaan.
-- De telefoon geeft elke training bij het starten een eigen id (client_id).
-- Viel het antwoord weg en stuurt de wachtrij de training opnieuw, dan ziet de
-- server aan dit id dat hij er al is. Alleen toevoegen, niets verwijderen.

alter table public.club_trainingslog add column if not exists client_id uuid;

create unique index if not exists club_trainingslog_client_id
  on public.club_trainingslog (user_id, lid_id, client_id)
  where client_id is not null;
