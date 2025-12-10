# PowerShell script to run database migrations
# Usage: .\migrations\run-migrations.ps1

param(
    [string]$PostgresUrl = $env:POSTGRES_URL,
    [switch]$DryRun = $false,
    [switch]$Backup = $true
)

# Colors for output
$ErrorColor = "Red"
$SuccessColor = "Green"
$InfoColor = "Cyan"
$WarningColor = "Yellow"

function Write-Step {
    param([string]$Message)
    Write-Host "`n==> $Message" -ForegroundColor $InfoColor
}

function Write-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor $SuccessColor
}

function Write-Error {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor $ErrorColor
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠ $Message" -ForegroundColor $WarningColor
}

# Validate PostgreSQL URL
if (-not $PostgresUrl) {
    Write-Error "POSTGRES_URL not set. Please set environment variable or pass -PostgresUrl parameter"
    exit 1
}

Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor $InfoColor
Write-Host "║  NY AI Chatbot - Single-Tenant Migration                  ║" -ForegroundColor $InfoColor
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor $InfoColor

# Check if psql is available
try {
    $null = Get-Command psql -ErrorAction Stop
    Write-Success "PostgreSQL client (psql) found"
} catch {
    Write-Error "psql command not found. Please install PostgreSQL client tools."
    Write-Host "Download from: https://www.postgresql.org/download/windows/" -ForegroundColor $WarningColor
    exit 1
}

# Backup database if requested
if ($Backup -and -not $DryRun) {
    Write-Step "Creating database backup..."
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $backupFile = ".\migrations\backups\backup_$timestamp.sql"
    
    # Create backups directory if it doesn't exist
    $backupDir = ".\migrations\backups"
    if (-not (Test-Path $backupDir)) {
        New-Item -ItemType Directory -Path $backupDir | Out-Null
    }
    
    try {
        pg_dump $PostgresUrl > $backupFile
        Write-Success "Backup created: $backupFile"
    } catch {
        Write-Warning "Backup failed, but continuing with migration..."
    }
}

# Migration files in order
$migrations = @(
    "000_enable_extensions.sql",
    "001_bot_settings_global.sql",
    "002_chat_sessionid.sql",
    "003_analytics_table.sql",
    "004_migrate_existing_chats.sql"
)

# Dry run mode
if ($DryRun) {
    Write-Warning "DRY RUN MODE - No changes will be made"
    Write-Host "`nMigrations that would be executed:" -ForegroundColor $InfoColor
    foreach ($migration in $migrations) {
        Write-Host "  - $migration" -ForegroundColor $InfoColor
    }
    exit 0
}

# Run migrations
$successCount = 0
$failCount = 0

foreach ($migration in $migrations) {
    $migrationPath = ".\migrations\$migration"
    
    if (-not (Test-Path $migrationPath)) {
        Write-Error "Migration file not found: $migrationPath"
        $failCount++
        continue
    }
    
    Write-Step "Running migration: $migration"
    
    try {
        # Run migration and capture output
        $output = psql $PostgresUrl -f $migrationPath 2>&1
        
        # Check for errors in output
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Migration completed: $migration"
            
            # Show NOTICE messages if any
            $notices = $output | Where-Object { $_ -match "NOTICE:" }
            if ($notices) {
                foreach ($notice in $notices) {
                    Write-Host "  $notice" -ForegroundColor $InfoColor
                }
            }
            
            $successCount++
        } else {
            Write-Error "Migration failed: $migration"
            Write-Host $output -ForegroundColor $ErrorColor
            $failCount++
            
            # Ask if user wants to continue
            $continue = Read-Host "`nContinue with remaining migrations? (y/N)"
            if ($continue -ne 'y' -and $continue -ne 'Y') {
                Write-Warning "Migration process aborted by user"
                break
            }
        }
    } catch {
        Write-Error "Error running migration: $migration"
        Write-Host $_.Exception.Message -ForegroundColor $ErrorColor
        $failCount++
        break
    }
}

# Summary
Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor $InfoColor
Write-Host "║  Migration Summary                                         ║" -ForegroundColor $InfoColor
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor $InfoColor
Write-Host "Successful: $successCount" -ForegroundColor $SuccessColor
Write-Host "Failed: $failCount" -ForegroundColor $(if ($failCount -gt 0) { $ErrorColor } else { $SuccessColor })

if ($failCount -eq 0) {
    Write-Host "`n✓ All migrations completed successfully!" -ForegroundColor $SuccessColor
    Write-Host "`nNext steps:" -ForegroundColor $InfoColor
    Write-Host "  1. Update code to use new session management" -ForegroundColor $InfoColor
    Write-Host "  2. Test anonymous chat functionality" -ForegroundColor $InfoColor
    Write-Host "  3. Verify admin dashboard works" -ForegroundColor $InfoColor
    exit 0
} else {
    Write-Host "`n✗ Some migrations failed. Please review errors above." -ForegroundColor $ErrorColor
    exit 1
}
