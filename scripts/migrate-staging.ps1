# SwiftX — Staging Database Migration
# Applies all pending EF Core migrations directly against the staging database.
#
# Usage:
#   1. Set the staging connection string below (or pass it as a parameter).
#   2. Run: .\scripts\migrate-staging.ps1
#
# WARNING: This connects directly to the staging database. Never use a
# production connection string here.

param(
    [string]$ConnectionString
)

if (-not $ConnectionString) {
    Write-Host "Usage: .\scripts\migrate-staging.ps1 -ConnectionString '<staging-conn-string>'" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Example:" -ForegroundColor Gray
    Write-Host '  .\scripts\migrate-staging.ps1 -ConnectionString "Host=db.ajlppaqbjuiicvxvekig.supabase.co;Port=5432;Database=postgres;Username=postgres;Password=YOUR_PASSWORD;SSL Mode=Require;Trust Server Certificate=true"'
    exit 1
}

$env:ConnectionStrings__DefaultConnection = $ConnectionString

Write-Host "Applying migrations to STAGING database..." -ForegroundColor Cyan
dotnet ef database update --project SwiftX

if ($LASTEXITCODE -eq 0) {
    Write-Host "Staging migrations applied successfully." -ForegroundColor Green
} else {
    Write-Host "Migration failed! Check the output above." -ForegroundColor Red
    exit 1
}
