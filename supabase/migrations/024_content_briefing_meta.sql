-- 024: voeg meta kolom toe aan content_briefings (groet, thema, tip)
alter table content_briefings add column if not exists meta jsonb;
