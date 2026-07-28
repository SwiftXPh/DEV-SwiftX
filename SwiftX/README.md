# SwiftX

Delivery platform built with **ASP.NET Core 8 MVC**. Riders and merchants apply with uploaded documents; admins review and manage them from a secured dashboard.

## Tech Stack
- **Backend:** ASP.NET Core 8 (MVC), EF Core + Npgsql
- **Database:** Supabase (PostgreSQL)
- **File storage:** Supabase Storage (private buckets, signed URLs)
- **Auth:** cookie auth; admin portal gated by role
- **Styling:** Tailwind CSS

---

## 🚀 Developer Onboarding: Running Locally for the First Time

Welcome to the SwiftX team! Follow these steps to get the project running on your local machine. This guide will walk you through the first-time setup process.

### Step 1: Prerequisites

Ensure you have the following installed on your machine:
- [.NET SDK 8.0](https://dotnet.microsoft.com/download) (Verify by running `dotnet --version` in your terminal)
- [Node.js 18+](https://nodejs.org) (Required for building Tailwind CSS)
- **EF Core CLI**: Install the Entity Framework Core CLI globally by running:
  ```bash
  dotnet tool install --global dotnet-ef
  ```

### Step 2: Clone the Repository

Clone the project and navigate to the `SwiftX` directory (this is important, as the .NET solution lives inside this subfolder):
```bash
git clone <repository_url>
cd DEV-SwiftX/SwiftX
```
*(Make sure to run all subsequent commands from inside the `SwiftX/` folder.)*

### Step 3: Install Dependencies

Restore the .NET packages and install the Node modules for Tailwind CSS:
```bash
dotnet restore
npm install
```

### Step 4: Configure Local Secrets

We use `.NET user-secrets` to keep sensitive information out of version control and `appsettings.json`. You will need to obtain the **Supabase connection details** and **Admin seed credentials** from a team maintainer.

Once you have them, run the following commands in the `SwiftX` directory, replacing the `<placeholders>` with the actual values:

```bash
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Host=db.<ref>.supabase.co;Port=5432;Database=postgres;Username=postgres;Password=<password>;SSL Mode=Require;Trust Server Certificate=true"
dotnet user-secrets set "Supabase:Url" "https://<ref>.supabase.co"
dotnet user-secrets set "Supabase:ServiceRoleKey" "<supabase-secret-key>"
dotnet user-secrets set "AdminSeed:Username" "admin"
dotnet user-secrets set "AdminSeed:Password" "<choose-a-strong-password>"
```

*(Optional)* Configuration for `Supabase:RiderBucket`, `Supabase:MerchantBucket`, and `Supabase:CustomerBucket` default to `rider-documents`, `merchant-documents`, and `customer-avatars` respectively. You only need to override these if your team's buckets are named differently.

You can verify your secrets are set correctly by running:
```bash
dotnet user-secrets list
```

### Step 5: Apply Database Migrations

Ensure your local database schema is up-to-date. This will create the necessary tables in your connected Supabase Postgres instance:
```bash
dotnet ef database update
```
*(Note: If the app is already running, stop it first before executing this command).*

### Step 6: Start the Application

You need two terminals to run the application fully (one for the .NET server and one for the Tailwind CSS watcher).

**Terminal 1: Start the .NET Server**
```bash
dotnet run
```
Then, open the URL printed in the console (e.g., `https://localhost:7208`).

**Terminal 2: Start the Tailwind CSS Watcher**
Tailwind CSS needs to recompile when you make styling changes. Keep this running in the background:
```bash
npx tailwindcss -i ./wwwroot/css/site.css -o ./wwwroot/output.css --watch
```
*(Warning: Do **not** add `--watch` to the `.csproj` build target — it will hang `dotnet build`/`publish`/`ef` indefinitely).*

### Step 7: Log In

On startup, the application automatically seeds or updates the admin account using the `AdminSeed:*` credentials you provided in Step 4.
Navigate to **`/Admin`** in your browser and log in with those credentials to access the secure dashboard.

---

## 🛠️ Development Workflow

### Visual Studio
If you prefer using Visual Studio, open `SwiftX.sln` and press **F5**. The launch profiles are already configured to set `ASPNETCORE_ENVIRONMENT=Development`. 
*Note: You still need to run the Tailwind CSS watcher in a separate terminal if you are editing styles.*

### Database Changes (Migrations)
If you edit an entity model in the `Models/` directory, you must create a migration to update the schema:
```bash
dotnet ef migrations add <DescriptiveName>
dotnet ef database update
```
*Note: Validation-only attributes (e.g. `[Required]`, `[EmailAddress]`) do not require a migration; only schema-affecting changes do.*

---

## 📁 Project Structure

```text
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

## 💡 Conventions & Notes

- **Never commit secrets.** Always use `user-secrets` locally and environment variables in production.
- **Media Storage:** Rider, merchant, and customer documents/avatars are uploaded directly to private Supabase Storage buckets. The database only stores the object path. Admins view files via short-lived signed URLs.
- **Admin only for now:** The customer login currently shows a "Coming Soon" page and isn't fully wired up yet.
- **Transactions:** Signups run within a database transaction that rolls back the user creation and deletes any uploaded files if any step of the process fails.

---

## 🚀 Deployment

See **[DEPLOY.md](DEPLOY.md)** for the full Render/Railway guide (Docker, environment variables, and the manual migration step).
