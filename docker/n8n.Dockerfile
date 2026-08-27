# ══════════════════════════════════════════════════════════════
# Image n8n + CLI Docker — pour le workflow d'observabilité de l'ERP.
# n8n de base n'a pas la commande `docker` : on l'ajoute pour que les nœuds
# « Execute Command » puissent lire l'état des conteneurs et en redémarrer.
#
# ⚠ L'image n8nio/n8n est une « Docker Hardened Image » (Alpine SANS gestionnaire
# de paquets : `apk` est retiré pour durcir la surface). On ne peut donc PAS faire
# `apk add docker-cli`. À la place, on copie le binaire `docker` (statique, sans
# dépendances) depuis l'image officielle docker:cli — approche multi-étages propre.
#
# L'accès au socket Docker (monté par le compose) exige root → voir docker-compose.observ.yml.
# ══════════════════════════════════════════════════════════════
FROM docker:cli AS dockercli

FROM n8nio/n8n:latest
USER root
# Binaire docker statiquement lié → aucune dépendance à installer.
COPY --from=dockercli /usr/local/bin/docker /usr/local/bin/docker
# On reste root : l'accès au socket /var/run/docker.sock nécessite root sur ce poste
# (un utilisateur non-root reçoit « permission denied »). Monter le socket = déjà
# équivalent-root sur le Docker de l'hôte, donc rester root n'aggrave pas la surface.
