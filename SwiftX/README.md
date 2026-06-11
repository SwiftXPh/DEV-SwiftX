# SwiftX

Delivery platform built with **ASP.NET Core 8 MVC**. Riders and merchants apply with
uploaded documents; admins review and manage them from a secured dashboard.

- **Backend:** ASP.NET Core 8 (MVC), EF Core + Npgsql
- **Database:** Supabase (PostgreSQL)
- **File storage:** Supabase Storage (private buckets, signed URLs)
- **Auth:** cookie auth; admin portal gated by role
- **Styling:** Tailwind CSS

> The project lives in the `SwiftX/` subfolder of the repository. Run all commands below
> from inside `SwiftX/`.

---

## 1. Prerequisites

| Tool | Version | Notes |
| --- | --- | --- |
| [.NET SDK](https://dotnet.microsoft.com/download) | 8.0 | `dotnet --version` |
| [Node.js](https://nodejs.org) | 18+ | Needed for the Tailwind CSS build |
| `dotnet-ef` CLI | latest | `dotnet tool install --global dotnet-ef` |
| Supabase project | — | Provides the Postgres DB + Storage buckets |

You also need access to the team's Supabase project (connection string + keys) and the
admin seed credentials. Ask a maintainer — these are **never** committed to the repo.

---

## 2. First-time setup

```bash
# from the repo root
cd SwiftX

# restore .NET and npm dependencies
dotnet restore
npm install
```

### Configure secrets (user-secrets)

Secrets are stored in .NET user-secrets, not in `appsettings.json`. Set them once per
machine (replace the placeholder values):

```bash
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Host=db.<ref>.supabase.co;Port=5432;Database=postgres;Username=postgres;Password=<password>;SSL Mode=Require;Trust Server Certificate=true"
dotnet user-secrets set "Supabase:Url" "https://<ref>.supabase.co"
dotnet user-secrets set "Supabase:ServiceRoleKey" "<supabase-secret-key>"
dotnet user-secrets set "AdminSeed:Username" "admin"
dotnet user-secrets set "AdminSeed:Password" "<choose-a-strong-password>"
```

`Supabase:RiderBucket` and `Supabase:MerchantBucket` default to `rider-documents` /
`merchant-documents` and only need overriding if your buckets are named differently.

Verify with:

```bash
dotnet user-secrets list
```

### Apply database migrations

```bash
dotnet ef database update
```

> If the app is running, stop it first, or append `--no-build` after a successful build.

---

## 3. Running the app

```bash
dotnet run
```

Then open the URL printed in the console (e.g. `https://localhost:7208`).

On startup the app seeds/updates the admin account from `AdminSeed:*`. Log in at **`/Admin`**
with the username/password you configured.

### Visual Studio

Open `SwiftX.sln` and press **F5**. The launch profiles already set
`ASPNETCORE_ENVIRONMENT=Development`.

---

## 4. Tailwind CSS

CSS is compiled from `wwwroot/css/site.css` to `wwwroot/output.css`.

- A normal `dotnet build` runs a **one-shot** minified build automatically.
- For live rebuilding while editing styles, run the watcher in a **separate terminal**:

  ```bash
  npx tailwindcss -i ./wwwroot/css/site.css -o ./wwwroot/output.css --watch
  ```

Do **not** add `--watch` to the build target — it never returns and hangs `dotnet build`/`publish`/`ef`.

---

## 5. Database changes (migrations)

After editing an entity model:

```bash
dotnet ef migrations add <DescriptiveName>
dotnet ef database update
```

Migrations live in `Migrations/`. Validation-only attributes (e.g. `[Required]`,
`[EmailAddress]`) do **not** require a migration; only schema-affecting changes do.

---

## 6. Project structure

```
SwiftX/
├── Controllers/        MVC controllers (Home, Admin, SignUp, Customer, Error)
├── Models/             Entities + form view models
├── Views/              Razor views (Admin, SignUp, Home, Error, Shared layouts)
├── Services/           Supabase storage service, admin seeder
├── Migrations/         EF Core migrations
├── wwwroot/            Static assets, JS, css/site.css -> output.css
├── appsettings.json    Non-secret config (secrets come from user-secrets/env)
├── Dockerfile          Container build (used for deployment)
└── DEPLOY.md           Production deployment guide (Render / Railway)
```

---

## 7. Conventions & notes

- **Never commit secrets.** Use user-secrets locally and environment variables in production.
- **Media** (rider/merchant documents) is uploaded to private Supabase Storage buckets;
  the DB stores only the object path. Admins view files via short-lived signed URLs.
- **Admin only for now** — customer login shows a "Coming Soon" page; it isn't wired up yet.
- Signups run in a DB transaction that rolls back the user and deletes uploaded files if
  any step fails.

---

## 8. Deployment

See **[DEPLOY.md](DEPLOY.md)** for the full Render/Railway guide (Docker, environment
variables, and the manual migration step).
