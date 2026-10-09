-- ─── LifeOS — PT-app: harde grenzen op de bucket `pt-documenten` ─────────────
-- De app controleert grootte en type pas ná de upload (POST metadata leest het
-- object terug en gooit het weg als het niet klopt). Tussen de signed upload
-- URL en die controle kon de opslag zelf nog álles aannemen, tot de projectgrens
-- (standaard 50 MB, bij een groter plan meer). Dit legt dezelfde grenzen vast
-- op de bucket zelf, zodat Storage een te groot of verkeerd bestand al bij de
-- PUT weigert — ook als de app-laag ooit omzeild wordt.
--
-- Hoort bij `src/lib/lifeos/pt-dashboard/documenten.ts` (MAX_GROOTTE, SOORTEN):
-- wijzig je daar iets, wijzig het dan ook hier.

update storage.buckets
set
  file_size_limit = 52428800, -- 50 MB, gelijk aan MAX_GROOTTE
  allowed_mime_types = array[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/png',
    'image/jpeg'
  ]
where id = 'pt-documenten';
