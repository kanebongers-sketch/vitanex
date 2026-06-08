# checkin-reminder — Supabase Edge Function

Stuur wekelijkse check-in herinneringen naar gebruikers die nog niet hebben ingecheckt.

## Deploy

```bash
supabase functions deploy checkin-reminder --project-ref <jouw-project-ref>
```

## Vereiste environment variables

Stel in via **Supabase dashboard → Settings → Edge Functions → Secrets**:

| Variabele | Waarde |
|---|---|
| `RESEND_API_KEY` | Aanmaken op [resend.com](https://resend.com) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase dashboard → Settings → API |

## Wekelijkse cron instellen

Via **Supabase dashboard → Database → Extensions** — zet `pg_cron` en `pg_net` aan.

Dan in de SQL editor:

```sql
SELECT cron.schedule(
  'checkin-reminder-weekly',
  '0 9 * * 1',  -- Elke maandag om 09:00 UTC
  $$
    SELECT net.http_post(
      url     := current_setting('app.supabase_functions_url') || '/checkin-reminder',
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key')
      ),
      body    := '{}'::jsonb
    );
  $$
);
```

## Droogloop testen (geen echte e-mails)

Verwijder `RESEND_API_KEY` tijdelijk — de functie logt dan `[DRY RUN]` naar de console
zonder echte e-mails te sturen. Handig om te controleren wie een herinnering zou ontvangen.

## Handmatig triggeren

```bash
curl -X POST https://<project-ref>.supabase.co/functions/v1/checkin-reminder \
  -H "Authorization: Bearer <service-role-key>" \
  -H "Content-Type: application/json"
```
