"""Middleware de protection CSRF par contrôle de l'origine.

Les routes mutantes (POST/PUT/PATCH/DELETE) de l'espace responsable et
administrateur reposent sur un cookie de session httpOnly. Même si SameSite
=Lax et le préflight CORS couvrent la majorité des attaques, je bloque en
plus toute requête mutante dont l'en-tête Origin n'est pas explicitement
autorisé : un navigateur attaquant ne peut pas forger cet en-tête, c'est donc
une défense en profondeur contre le login CSRF et les cas où SameSite serait
assoupli en production (cross-site délibéré).
"""
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

from app.core.config import settings

_SAFE_METHODS = {"GET", "HEAD", "OPTIONS"}


class CsrfOriginMiddleware(BaseHTTPMiddleware):
    """Refuse toute requête mutante d'origine non autorisée.

    Règle : si un en-tête Origin est présent et qu'il n'appartient pas à la
    liste blanche CORS, la requête est rejetée (403). L'absence d'Origin
    désigne une requête de même origine ou un client non navigateur (curl,
    tests) : elle est laissée passer, car un navigateur attaquant envoie
    toujours Origin sur une requête cross-site.
    """

    async def dispatch(self, request: Request, call_next) -> Response:
        if (
            request.method in _SAFE_METHODS
            or request.url.path.startswith("/media")
            or request.url.path.startswith("/auth/")
        ):
            return await call_next(request)

        request_origin = request.headers.get("origin")
        if request_origin and request_origin not in settings.cors_origins:
            return Response(
                status_code=403,
                content="Forbidden: cross-site request without valid origin",
            )
        return await call_next(request)
