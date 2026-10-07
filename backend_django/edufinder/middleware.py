"""Protection CSRF par contrôle de l'origine.

Les routes qui écrivent reposent (ou reposeront, pour les espaces privés) sur
un cookie de session httpOnly. Même si SameSite=Lax et le préflight CORS
couvrent la majorité des attaques, je bloque en plus toute requête mutante
dont l'en-tête Origin n'est pas explicitement autorisé : un navigateur
attaquant ne peut pas forger cet en-tête. C'est une défense en profondeur
contre le login CSRF et contre un SameSite assoupli en production.
"""
from collections.abc import Callable

from django.conf import settings
from django.http import HttpRequest, HttpResponse, HttpResponseForbidden

SAFE_METHODS = {"GET", "HEAD", "OPTIONS"}
FORBIDDEN_ORIGIN_MESSAGE = "Forbidden: cross-site request without valid origin"


def csrf_origin_middleware(
    get_response: Callable[[HttpRequest], HttpResponse],
) -> Callable[[HttpRequest], HttpResponse]:
    def refuse_untrusted_mutating_request(request: HttpRequest) -> HttpResponse:
        if request.method in SAFE_METHODS or _is_allowed_origin(request):
            return get_response(request)
        return HttpResponseForbidden(FORBIDDEN_ORIGIN_MESSAGE)

    return refuse_untrusted_mutating_request


def _is_allowed_origin(request: HttpRequest) -> bool:
    request_origin = request.headers.get("Origin")
    # Pas d'Origin = requête de même origine ou client non navigateur (curl,
    # tests) : un navigateur attaquant envoie toujours Origin en cross-site.
    if request_origin is None:
        return True
    if request_origin in settings.CORS_ALLOWED_ORIGINS:
        return True
    # Même origine que l'API. Je la reconstruis depuis l'en-tête Host, qu'un
    # site attaquant ne peut pas choisir dans le navigateur de la victime : il
    # désigne toujours le serveur visé.
    own_origin = f"{request.scheme}://{request.get_host()}"
    return request_origin == own_origin
