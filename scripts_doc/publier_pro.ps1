# ═══════════════════════════════════════════════════════════════════════════
# Publie l'état de `main` vers le dépôt professionnel (Seem-Semrac).
#
#   .\scripts_doc\publier_pro.ps1 "message de publication"
#
# Équivalent PowerShell de publier_pro.sh, pour un poste Windows sans WSL.
# Le dépôt professionnel garde un historique PROPRE : un commit par
# publication, jamais les 262 commits (4,8 Go) du dépôt de travail. Le contenu
# publié est toujours strictement identique à `main`.
#
# L'historique n'est jamais réécrit : la VM peut faire `git pull` sans heurt.
# ═══════════════════════════════════════════════════════════════════════════
param(
    [string]$Message = ""
)
$ErrorActionPreference = "Stop"

$racine = git rev-parse --show-toplevel
if (-not $?) { Write-Host "X Pas dans un depot git." -ForegroundColor Red; exit 1 }
Set-Location $racine

$REMOTE = "pro"
$BRANCHE = "livraison"

# Le depot distant est-il configure ?
git remote get-url $REMOTE *> $null
if (-not $?) {
    Write-Host "X Le depot distant << $REMOTE >> n'est pas configure. Une fois :" -ForegroundColor Red
    Write-Host "    git remote add $REMOTE https://Seem-Semrac@github.com/Seem-Semrac/ERP-seem-semrac.git"
    exit 1
}

# Arbre de travail propre ?
$sale = git status --porcelain
if ($sale) {
    Write-Host "X Arbre de travail non propre - committez ou remisez d'abord." -ForegroundColor Red
    git status --short
    exit 1
}

# Sur main ?
$depart = git branch --show-current
if ($depart -ne "main") {
    Write-Host "X Placez-vous sur main (actuellement : $depart)." -ForegroundColor Red
    exit 1
}

if (-not $Message) { $Message = "Mise a jour " + (Get-Date -Format "yyyy-MM-dd") }

git checkout -q $BRANCHE
# Aligne index ET copie de travail sur l'arbre de main - gere aussi les suppressions.
git read-tree -u --reset main
git add -A

git diff --cached --quiet
if ($?) {
    Write-Host "  Rien de nouveau a publier."
} else {
    git commit -q -m $Message
    Write-Host ("  Commit de publication : " + (git log --oneline -1))
}

git push -q $REMOTE "$BRANCHE`:main"
$pousse = $?
git checkout -q main

if ($pousse) {
    Write-Host "OK Publie - https://github.com/Seem-Semrac/ERP-seem-semrac" -ForegroundColor Green
    Write-Host "   Sur la VM :  cd ~/erp && git pull && docker/scripts/erp-docker.sh up"
} else {
    Write-Host "X Le push a echoue. Vous etes revenu sur main, rien n'est perdu." -ForegroundColor Red
    exit 1
}
