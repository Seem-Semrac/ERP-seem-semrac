# ===========================================================================
#  OBSOLETE depuis le 9 septembre 2026.
#
#  Le depot Seem-Semrac/ERP-seem-semrac est desormais le depot PRINCIPAL
#  (« origin ») : on y committe directement, il n'y a plus d'etape de
#  publication separee.
#
#      git add -A ; git commit -m "..." ; git push
#
#  Puis, sur la VM :   ~/erp/docker/scripts/erp-docker.sh maj
#
#  Ce fichier ne fait plus que rappeler la marche a suivre.
#  L'ancien depot de travail reste accessible sous le remote « archive ».
# ===========================================================================
Write-Host ""
Write-Host "  Ce script n'est plus necessaire." -ForegroundColor Yellow
Write-Host ""
Write-Host "  Seem-Semrac/ERP-seem-semrac est maintenant le depot principal (origin)."
Write-Host "  On y committe directement :"
Write-Host ""
Write-Host "      git add -A" -ForegroundColor Cyan
Write-Host "      git commit -m 'ce que contient la mise a jour'" -ForegroundColor Cyan
Write-Host "      git push" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Puis, sur la VM :"
Write-Host ""
Write-Host "      ~/erp/docker/scripts/erp-docker.sh maj" -ForegroundColor Cyan
Write-Host ""
