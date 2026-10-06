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


def _is_allowed_origin(request: Request) -> bool:
    request_origin = request.headers.get("origin")
    # Pas d'Origin = requête de même origine ou client non navigateur (curl,
    # tests) : un navigateur attaquant envoie toujours Origin en cross-site.
    if request_origin is None:
        return True
    if request_origin in settings.cors_origins:
        return True
    # Même origine que l'API (Swagger sur /docs). Je la reconstruis depuis
    # l'en-tête Host, qu'un site attaquant ne peut pas choisir dans le
    # navigateur de la victime : il désigne toujours le serveur visé.
    own_origin = f"{request.url.scheme}://{request.url.netloc}"
    return request_origin == own_origin


class CsrfOriginMiddleware(BaseHTTPMiddleware):
    """Refuse toute requête mutante d'origine non autorisée (403).

    /auth/ est contrôlé comme le reste : sans cela, un site tiers pourrait
    connecter la victime sur le compte de l'attaquant (login CSRF) ou la
    déconnecter.
    """

    async def dispatch(self, request: Request, call_next) -> Response:
        if request.method in _SAFE_METHODS or request.url.path.startswith("/media"):
            return await call_next(request)
        if not _is_allowed_origin(request):
            return Response(
                status_code=403,
                content="Forbidden: cross-site request without valid origin",
            )
        return await call_next(request)
