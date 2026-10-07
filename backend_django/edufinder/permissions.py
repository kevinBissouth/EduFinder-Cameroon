"""Contrôles de rôle des espaces privés.

Ils sont appliqués ici, côté serveur : le frontend n'est qu'une commodité,
jamais une barrière de sécurité.
"""
from rest_framework.permissions import BasePermission
from rest_framework.request import Request

from edufinder.models import UserRole

PRIVATE_SPACE_ROLES = {UserRole.MANAGER, UserRole.SUPER_ADMIN}


class IsManagerOrSuperAdmin(BasePermission):
    message = "Manager or admin role required"

    def has_permission(self, request: Request, view) -> bool:
        return request.user.role in PRIVATE_SPACE_ROLES


class IsSuperAdmin(BasePermission):
    message = "Admin role required"

    def has_permission(self, request: Request, view) -> bool:
        return request.user.role == UserRole.SUPER_ADMIN
