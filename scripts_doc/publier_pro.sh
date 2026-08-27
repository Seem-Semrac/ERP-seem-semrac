#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════
# Publie l'état de `main` vers le dépôt professionnel (Seem-Semrac).
#
#   scripts_doc/publier_pro.sh ["message de publication"]
#
# Le dépôt professionnel garde un historique PROPRE : un commit par
# publication, jamais les 262 commits (4,8 Go) du dépôt de travail. Le contenu
# publié est toujours strictement identique à `main`.
#
# L'historique n'est jamais réécrit : la VM peut faire `git pull` sans heurt.
# ═══════════════════════════════════════════════════════════════════════════
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

REMOTE="pro"
BRANCHE="livraison"

git remote get-url "$REMOTE" >/dev/null 2>&1 || {
  echo "✗ Le dépôt distant « $REMOTE » n'est pas configuré. Une fois :"
  echo "    git remote add $REMOTE https://Seem-Semrac@github.com/Seem-Semrac/ERP-seem-semrac.git"
  exit 1
}
[ -z "$(git status --porcelain)" ] || {
  echo "✗ Arbre de travail non propre — committez ou remisez d'abord."; exit 1; }
DEPART="$(git branch --show-current)"
[ "$DEPART" = "main" ] || {
  echo "✗ Placez-vous sur main (actuellement : $DEPART)."; exit 1; }

MSG="${1:-Mise a jour $(date +%Y-%m-%d)}"

git checkout -q "$BRANCHE"
# Aligne index ET copie de travail sur l'arbre de main — gère aussi les suppressions.
git read-tree -u --reset main
git add -A

if git diff --cached --quiet; then
  echo "· Rien de nouveau à publier."
else
  git commit -q -m "$MSG"
  echo "· Commit de publication : $(git log --oneline -1)"
fi

git push -q "$REMOTE" "$BRANCHE:main"
git checkout -q main

echo "✓ Publié — https://github.com/Seem-Semrac/ERP-seem-semrac"
echo "  Sur la VM :  cd ~/erp && git pull && docker/scripts/erp-docker.sh up"
