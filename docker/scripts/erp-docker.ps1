<#
  Aide-mémoire de pilotage de la stack Docker ERP (Windows / PowerShell).
  Usage :  .\docker\scripts\erp-docker.ps1 <commande>

  Commandes :
    up            Démarre toute la stack (build l'app si besoin), en arrière-plan.
    down          Arrête la stack (garde les données).
    reset         Arrête ET SUPPRIME les données de la base (repart de zéro).
    logs [svc]    Affiche les logs (ex: logs app, logs db). Ctrl+C pour quitter.
    ps            État des conteneurs.
    psql          Ouvre une console SQL dans la base.
    restore <f>   Restaure un dump SQL (issu du cloud) dans la base locale.
    ged-bucket    Crée le bucket 'ged' (documents/plans) s'il n'existe pas.
    migrate       Applique les scripts_import/*.sql dans l'ordre (migrations).
    mirror [n]    Recopie schéma+données du CLOUD (clé anon, sans mdp DB) vers la base locale.
    urls          Rappelle les adresses (app, dashboard).
#>
param(
  [Parameter(Position=0)][string]$Cmd = "urls",
  [Parameter(Position=1)][string]$Arg
)

$ErrorActionPreference = "Stop"
$dockerDir = Split-Path -Parent $PSScriptRoot          # ...\docker
$repoRoot  = Split-Path -Parent $dockerDir             # racine du dépôt
Push-Location $dockerDir
try {
  if (-not (Test-Path ".env")) {
    Write-Host "→ .env absent : copie depuis .env.example" -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
  }

  switch ($Cmd) {
    "up" {
      docker compose up -d --build
      Write-Host "`nStack lancée. Voir l'état :  .\docker\scripts\erp-docker.ps1 ps" -ForegroundColor Green
      Write-Host "App        : http://localhost:3000"
      Write-Host "Dashboard  : http://localhost:8000  (user 'supabase' / mdp dans .env)"
    }
    "down"    { docker compose down }
    "reset"   {
      Write-Host "Cela SUPPRIME les données (base + storage) locales. Ctrl+C pour annuler." -ForegroundColor Red
      Start-Sleep -Seconds 3
      docker compose down -v   # -v supprime les volumes nommés db-data / storage-data / db-config
      Write-Host "Base réinitialisée. Relancez 'up'." -ForegroundColor Green
    }
    "logs"    { if ($Arg) { docker compose logs -f $Arg } else { docker compose logs -f } }
    "ps"      { docker compose ps }
    "psql"    { docker compose exec db psql -U postgres -d postgres }
    "restore" {
      if (-not $Arg) { throw "Usage: restore <chemin\vers\dump.sql>" }
      if (-not (Test-Path $Arg)) { throw "Fichier introuvable : $Arg" }
      Write-Host "→ Restauration de $Arg dans la base locale…" -ForegroundColor Cyan
      Get-Content $Arg -Raw | docker compose exec -T db psql -U postgres -d postgres -v ON_ERROR_STOP=0
      Write-Host "Restauration terminée." -ForegroundColor Green
    }
    "ged-bucket" {
      $sql = "insert into storage.buckets (id, name, public) values ('ged','ged',false) on conflict (id) do nothing;"
      $sql | docker compose exec -T db psql -U postgres -d postgres
      Write-Host "Bucket 'ged' prêt." -ForegroundColor Green
    }
    "migrate" {
      Write-Host "→ Application des migrations scripts_import/*.sql (ordre alphabétique)…" -ForegroundColor Cyan
      Get-ChildItem (Join-Path $repoRoot "scripts_import") -Filter *.sql | Sort-Object Name | ForEach-Object {
        Write-Host ("  · " + $_.Name)
        Get-Content $_.FullName -Raw | docker compose exec -T db psql -U postgres -d postgres -v ON_ERROR_STOP=0
      }
      Write-Host "Migrations appliquées." -ForegroundColor Green
    }
    "mirror" {
      # Recopie schéma + données des tables publiques du cloud vers la base locale via la
      # seule clé anon (aucun mot de passe DB requis). $Arg = limite de lignes/table.
      $url  = if ($env:MIRROR_URL)  { $env:MIRROR_URL }  else { "https://vyqgrasezpyqjwvijwvv.supabase.co" }
      $anon = if ($env:MIRROR_ANON) { $env:MIRROR_ANON } else { "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5cWdyYXNlenB5cWp3dmlqd3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwNTE4MTcsImV4cCI6MjA5MzYyNzgxN30.Optt1QD-Ai3Xm8mk4f8fsvKry9-L2SlTBNB9KgVG3ls" }
      $lim  = if ($Arg) { $Arg } else { "5000" }
      New-Item -ItemType Directory -Force -Path "db\seed" | Out-Null
      Write-Host "→ Génération du miroir depuis le cloud…" -ForegroundColor Cyan
      node "scripts\mirror-cloud.mjs" $url $anon "db\seed\_mirror.sql" $lim
      Get-Content "db\seed\_mirror.sql" -Raw | docker compose exec -T db psql -U postgres -d postgres -v ON_ERROR_STOP=0 | Select-Object -Last 3
      docker compose restart rest | Out-Null
      Write-Host "Miroir cloud → local chargé (PostgREST rechargé)." -ForegroundColor Green
    }
    "urls" {
      Write-Host "App ERP    : http://localhost:3000"
      Write-Host "Dashboard  : http://localhost:8000   (Supabase Studio)"
      Write-Host "Postgres   : localhost:54322  (user postgres, mdp = POSTGRES_PASSWORD du .env)"
      Write-Host "`nCommandes : up | down | reset | logs [svc] | ps | psql | restore <f> | ged-bucket | migrate | mirror [n]"
    }
    default { Write-Host "Commande inconnue : $Cmd. Voir l'en-tête du script." -ForegroundColor Red }
  }
}
finally { Pop-Location }
