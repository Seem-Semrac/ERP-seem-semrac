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

# git ecrit des avertissements benins sur stderr ; en PowerShell 5.1 avec Stop, cela
# suffit a interrompre le script. On teste $? explicitement la ou c'est necessaire.
$ErrorActionPreference = "Continue"
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
    "stop" {
      # Arrêt SANS supprimer les conteneurs : redémarrage bien plus rapide qu'un down/up,
      # et aucune reconstruction d'image. Les données ne bougent pas.
      docker compose stop
      Write-Host "Stack arretee. Relancer avec : .\docker\scripts\erp-docker.ps1 start" -ForegroundColor Green
    }
    "start"   { docker compose start; Write-Host "Stack relancee. App : http://localhost:3000" -ForegroundColor Green }
    "restart" { docker compose restart; Write-Host "Stack redemarree." -ForegroundColor Green }
    "livrer" {
      # Chaine complete de livraison, avec une garde : on ne publie QUE si la stack
      # locale demarre reellement. Publier du code qui ne se lance pas chez soi
      # revient a casser la VM a distance.
      Write-Host "[1/3] Reconstruction des conteneurs locaux..." -ForegroundColor Cyan
      docker compose up -d --build
      if (-not $?) {
        Write-Host "X La construction locale a echoue - RIEN n'est publie." -ForegroundColor Red
        exit 1
      }

      Write-Host "[2/3] Attente des services..." -ForegroundColor Cyan
      $sain = $false
      for ($i = 0; $i -lt 36; $i++) {
        $lignes = docker compose ps --format "{{.Name}} {{.Status}}"
        $total = @($lignes).Count
        $ok = @($lignes | Where-Object { $_ -match "healthy|Up " }).Count
        if ($total -gt 0 -and $ok -ge $total) { $sain = $true; break }
        Start-Sleep -Seconds 5
      }
      docker compose ps --format "table {{.Name}}`t{{.Status}}"
      if (-not $sain) {
        Write-Host "`nX Tous les conteneurs ne sont pas sains - RIEN n'est publie." -ForegroundColor Red
        Write-Host "  Diagnostic :  .\docker\scripts\erp-docker.ps1 logs" -ForegroundColor Yellow
        exit 1
      }

      Write-Host "`n[3/3] Commit et envoi vers Seem-Semrac..." -ForegroundColor Cyan
      $msg = $Arg
      if (-not $msg) { $msg = "Mise a jour " + (Get-Date -Format "yyyy-MM-dd") }
      Push-Location $repoRoot
      try {
        $sale = git status --porcelain 2>$null
        if ($sale) {
          git add -A
          git commit -m $msg
          if (-not $?) { Write-Host "X Le commit a echoue." -ForegroundColor Red; exit 1 }
        } else {
          Write-Host "  Rien de nouveau a committer." -ForegroundColor Yellow
        }
        git push
        if (-not $?) { Write-Host "X Le push a echoue." -ForegroundColor Red; exit 1 }
      } finally { Pop-Location }

      Write-Host "`nOK Livre. Sur la VM :  ~/erp/docker/scripts/erp-docker.sh maj" -ForegroundColor Green
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
      Write-Host "`nCommandes : livrer [message] | up | stop | start | restart | down | reset"
      Write-Host "            logs [svc] | ps | psql | restore <f> | ged-bucket | migrate | mirror [n]"
      Write-Host "`nlivrer = reconstruit en local, verifie que tout demarre, PUIS committe et pousse." -ForegroundColor Cyan
      Write-Host "         Ensuite, sur la VM :  ~/erp/docker/scripts/erp-docker.sh maj" -ForegroundColor Cyan
    }
    default { Write-Host "Commande inconnue : $Cmd. Voir l'en-tête du script." -ForegroundColor Red }
  }
}
finally { Pop-Location }
