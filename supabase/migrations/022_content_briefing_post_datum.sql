-- 022: voeg post_datum en drive_link toe aan content_briefings
alter table content_briefings
  add column if not exists post_datum date,
  add column if not exists drive_link text;
