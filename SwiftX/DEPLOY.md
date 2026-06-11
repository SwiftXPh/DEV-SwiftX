# Deploying SwiftX (Render / Railway)

The app is containerized and reads all secrets/config from environment variables.
TLS is terminated by the platform's proxy; the app trusts `X-Forwarded-*` headers.

## 1. Service settings

- **Build:** Docker (uses the included [`Dockerfile`](Dockerfile)).
- **Root directory:** `SwiftX` (the project lives in the `SwiftX/` subfolder of the repo).
- **Port:** the platform injects `PORT`; the app binds `0.0.0.0:$PORT` automatically. No port config needed.
- **Health check path:** `/` (the public home page).

## 2. Required environment variables

Set these in the Render/Railway dashboard (never commit them):

| Variable | Value |
| --- | --- |
| `ASPNETCORE_ENVIRONMENT` | `Production` |
| `ConnectionStrings__DefaultConnection` | `Host=...supabase.co;Port=5432;Database=postgres;Username=postgres;Password=<rotated>;SSL Mode=Require;Trust Server Certificate=true` |
| `Supabase__Url` | `https://<project-ref>.supabase.co` |
| `Supabase__ServiceRoleKey` | your Supabase secret key (`sb_secret_...`) |
| `Supabase__RiderBucket` | `rider-documents` |
| `Supabase__MerchantBucket` | `merchant-documents` |
| `AdminSeed__Username` | admin login username |
| `AdminSeed__Password` | strong admin password (seeded/synced on startup) |
| `AdminSeed__Email` | admin email (optional) |
| `AllowedHosts` | your production domain, e.g. `swiftx.onrender.com` (pin it; don't leave `*`) |

> Note the double underscore `__` — that's how environment variables map to nested
> config keys in .NET.

## 3. Database migrations (run manually per deploy)

Migrations are **not** applied automatically. Before/after deploying a build that
changes the schema, run from a machine with the production connection string:

```bash
dotnet ef database update
```

Or generate a SQL script to apply via the Supabase SQL editor:

```bash
dotnet ef migrations script --idempotent -o migrate.sql
```

## 4. Supabase prerequisites

- Two **private** Storage buckets: `rider-documents`, `merchant-documents`.
- Rotate the database password and Supabase keys if they were ever committed.

## 5. First-run checklist

1. Buckets created and private.
2. Env vars set (table above), `AllowedHosts` pinned.
3. Migrations applied (`Role` column etc.).
4. Deploy → app seeds the admin from `AdminSeed__*` on startup.
5. Log in at `/Admin`, then change the admin password.
