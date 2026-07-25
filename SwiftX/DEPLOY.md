# Deploying SwiftX — Staging & Production

The app is containerized and reads all secrets/config from environment variables.
TLS is terminated by the platform's proxy; the app trusts `X-Forwarded-*` headers.

## Architecture Overview

| | **Staging** | **Production** |
|---|---|---|
| **Git branch** | `staging` | `main` |
| **Render service** | `swiftx-staging` | `swiftx` |
| **Render URL** | `https://swiftx-staging-*.onrender.com` | `https://www.swiftxph.com` |
| **Supabase project** | SwiftX DB (`ajlppaqbjuiicvxvekig`) | SwiftX Production (`uuyynrvlnfahsbpkvqer`) |
| **Auto-deploy** | Yes (on push to `staging`) | No (manual trigger / CI deploy hook) |
| **`ASPNETCORE_ENVIRONMENT`** | `Staging` | `Production` |

## Git Workflow

```
Feature branches (sean/*, dev-*)
       │
       ▼  PR + CI must pass
   staging  ──────► auto-deploys to swiftx-staging on Render
       │
       ▼  PR + CI + approval
     main   ──────► manual deploy to swiftx (production) on Render
```

## 1. Service Settings

- **Build:** Docker (uses the included [`Dockerfile`](Dockerfile)).
- **Root directory:** `SwiftX` (the project lives in the `SwiftX/` subfolder of the repo).
- **Port:** the platform injects `PORT`; the app binds `0.0.0.0:$PORT` automatically.
- **Health check path:** `/` (the public home page).

## 2. Required Environment Variables

Set these in the Render dashboard for **each** service (never commit them):

| Variable | Staging Value | Production Value |
|---|---|---|
| `ASPNETCORE_ENVIRONMENT` | `Staging` | `Production` |
| `ConnectionStrings__DefaultConnection` | `Host=db.ajlppaqbjuiicvxvekig.supabase.co;Port=5432;Database=postgres;Username=postgres;Password=<pw>;SSL Mode=Require;Trust Server Certificate=true` | `Host=db.uuyynrvlnfahsbpkvqer.supabase.co;Port=5432;Database=postgres;Username=postgres;Password=<pw>;SSL Mode=Require;Trust Server Certificate=true` |
| `Supabase__Url` | `https://ajlppaqbjuiicvxvekig.supabase.co` | `https://uuyynrvlnfahsbpkvqer.supabase.co` |
| `Supabase__ServiceRoleKey` | staging service-role key | production service-role key |
| `Supabase__RiderBucket` | `rider-documents` | `rider-documents` |
| `Supabase__MerchantBucket` | `merchant-documents` | `merchant-documents` |
| `AdminSeed__Username` | admin username | admin username |
| `AdminSeed__Password` | strong password | strong password (different from staging!) |
| `AdminSeed__Email` | admin email | admin email |
| `AllowedHosts` | `swiftx-staging-*.onrender.com` | `swiftxph.com,www.swiftxph.com` |

> Note the double underscore `__` — that's how environment variables map to nested
> config keys in .NET.

## 3. Database Migrations

Migrations are **not** applied automatically. Use the convenience scripts:

### Staging (direct apply)

```powershell
.\scripts\migrate-staging.ps1 -ConnectionString "<staging-connection-string>"
```

### Production (generate SQL for review)

```powershell
.\scripts\migrate-production.ps1
# Review the generated migrate-production.sql, then apply via Supabase SQL Editor
```

Or manually:

```bash
# Direct apply (staging only):
dotnet ef database update --project SwiftX

# Generate idempotent SQL (production):
dotnet ef migrations script --idempotent --project SwiftX -o migrate.sql
```

## 4. Supabase Prerequisites

Each Supabase project needs:
- Two **private** Storage buckets: `rider-documents`, `merchant-documents`.
- Rotate the database password and Supabase keys if they were ever committed.

## 5. CI/CD Pipeline

### GitHub Actions

| Workflow | Trigger | Purpose |
|---|---|---|
| `ci.yml` | Push/PR to `staging` or `main` | Build .NET + Docker verify |
| `deploy.yml` | Push to `staging` or `main` | Trigger Render deploy hook |

### GitHub Secrets Required

Set these in the GitHub repository settings (Settings → Secrets → Actions):

| Secret | Value |
|---|---|
| `RENDER_DEPLOY_HOOK_STAGING` | Deploy hook URL from the swiftx-staging Render service |
| `RENDER_DEPLOY_HOOK_PRODUCTION` | Deploy hook URL from the swiftx Render service |

### GitHub Environments (Optional)

Create a `production` environment in GitHub with **required reviewers** to gate
production deploys behind manual approval.

## 6. First-Run Checklist

### Staging
1. Supabase project (`ajlppaqbjuiicvxvekig`) — buckets exist and private. ✅
2. Render `swiftx-staging` service created, env vars set.
3. Migrations applied via `.\scripts\migrate-staging.ps1`.
4. Deploy → app seeds admin from `AdminSeed__*` on startup.
5. Verify at staging URL.

### Production
1. Supabase project (`uuyynrvlnfahsbpkvqer`) — buckets exist and private. ✅
2. Render `swiftx` service env vars updated to point to production Supabase.
3. Migrations applied via SQL script (reviewed first).
4. Custom domain `www.swiftxph.com` configured in Render.
5. Deploy → app seeds admin on startup.
6. Verify at `https://www.swiftxph.com`.

## 7. Rollback

- **Render:** Use the Render dashboard to roll back to a previous deploy.
- **Database:** EF Core does not auto-rollback. Create a manual down-migration
  or restore from Supabase's point-in-time recovery (Pro plan required).
