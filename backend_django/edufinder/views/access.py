"""Contrôles d'accès communs aux vues des espaces privés.

Tous les contrôles sont faits ici, côté serveur : le frontend n'est qu'une
commodité, jamais une barrière de sécurité.
"""
from collections.abc import Callable

from django.db.models import QuerySet
from rest_framework.decorators import (
    api_view,
    authentication_classes,
    permission_classes,
)
from rest_framework.exceptions import NotFound, PermissionDenied
from rest_framework.permissions import BasePermission
from rest_framework.request import Request

from edufinder.authentication import CookieJwtAuthentication
from edufinder.models import Establishment
from edufinder.permissions import IsManagerOrSuperAdmin
from edufinder.services.manager_space import user_manages_establishment

NOT_MANAGED_MESSAGE = "You do not manage this establishment"


# Une vue privée exige toujours un compte identifié ET un rôle autorisé : je
# regroupe les trois décorateurs pour qu'aucune route ne puisse en oublier un.
def _build_private_api_view(role_permission: type[BasePermission]) -> Callable:
    def private_api_view(http_method_names: list[str]) -> Callable:
        def decorate(view: Callable) -> Callable:
            protected_view = permission_classes([role_permission])(view)
            authenticated_view = authentication_classes([CookieJwtAuthentication])(
                protected_view
            )
            return api_view(http_method_names)(authenticated_view)

        return decorate

    return private_api_view


manager_api_view = _build_private_api_view(IsManagerOrSuperAdmin)


# Toute route d'établissement de l'espace responsable passe par ici : un
# responsable ne voit et ne modifie QUE les établissements liés dans
# user_establishment (403 sinon).
def get_managed_establishment(
    request: Request, establishment_uuid: str, establishments: QuerySet
) -> Establishment:
    establishment = establishments.filter(uuid=establishment_uuid).first()
    if establishment is None:
        raise NotFound(f"Establishment {establishment_uuid} not found")
    if not user_manages_establishment(request.user, establishment):
        raise PermissionDenied(NOT_MANAGED_MESSAGE)
    return establishment
