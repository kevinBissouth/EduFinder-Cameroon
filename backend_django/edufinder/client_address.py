"""Adresse du client d'une requête.

Elle sert au dédoublonnage des visites : la rendre falsifiable permettrait de
gonfler les compteurs d'un établissement.
"""
from django.conf import settings
from django.http import HttpRequest

UNKNOWN_CLIENT_ADDRESS = "unknown"


# Sans serveur intermédiaire, l'adresse est celle de la connexion et l'en-tête
# X-Forwarded-For est ignoré : le client peut y écrire ce qu'il veut. Derrière
# des serveurs de confiance, chacun ajoute à la fin de l'en-tête l'adresse
# qu'il a vue : je lis donc depuis la fin, d'autant de crans qu'il y a de
# serveurs, et tout ce que le client a pu écrire avant reste sans effet. C'est
# le même calcul que celui de DRF pour la limite de tentatives de connexion.
def get_client_address(request: HttpRequest) -> str:
    forwarded_addresses = _read_forwarded_addresses(request)
    if settings.TRUSTED_PROXY_COUNT == 0 or not forwarded_addresses:
        return request.META.get("REMOTE_ADDR") or UNKNOWN_CLIENT_ADDRESS
    trusted_depth = min(settings.TRUSTED_PROXY_COUNT, len(forwarded_addresses))
    return forwarded_addresses[-trusted_depth]


def _read_forwarded_addresses(request: HttpRequest) -> list[str]:
    forwarded_header = request.META.get("HTTP_X_FORWARDED_FOR", "")
    return [address.strip() for address in forwarded_header.split(",") if address.strip()]
