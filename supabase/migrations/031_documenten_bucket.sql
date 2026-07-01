-- ================================================================
-- MentaForce – Migratie 031: Documenten storage-bucket (privé)
-- ================================================================
-- Migratie 006 maakte de `documenten`-tabel maar liet de storage-bucket
-- als handmatige Dashboard-stap. Die stap werd nooit uitgevoerd, waardoor
-- upload/download/verwijderen van documenten faalde.
--
-- Bucket is PRIVÉ: bestanden (loonstroken, contracten, HR-dossier) worden
-- uitsluitend via de service-role API-routes benaderd, met tijdelijke
-- signed URLs (createSignedUrl, 1 uur geldig). Nooit publiek toegankelijk.

insert into storage.buckets (id, name, public)
values ('documenten', 'documenten', false)
on conflict (id) do nothing;
