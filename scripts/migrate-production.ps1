# SwiftX — Production Database Migration
# Generates an idempotent SQL script for manual review before applying.
#
# Usage:
#   1. Run: .\scripts\migrate-production.ps1
#   2. Review the generated SQL file (migrate-production.sql).
#   3. Apply it via the Supabase SQL Editor or psql.
#
# IMPORTANT: Never apply migrations to production without reviewing the SQL first.

$OutputFile = "migrate-production.sql"

Write-Host "Generating idempotent migration script for PRODUCTION..." -ForegroundColor Cyan
dotnet ef migrations script --idempotent --project SwiftX -o $OutputFile

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "SQL script generated: $OutputFile" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "  1. Review the SQL in $OutputFile" -ForegroundColor Yellow
    Write-Host "  2. Apply via the Supabase SQL Editor (Production project)" -ForegroundColor Yellow
    Write-Host "  3. Or run: psql <production-connection-string> -f $OutputFile" -ForegroundColor Yellow
} else {
    Write-Host "Script generation failed! Check the output above." -ForegroundColor Red
    exit 1
}
