"""Authentification des espaces privés par cookie httpOnly.

Le jeton vit uniquement dans un cookie que JavaScript ne peut pas lire
(protection contre le vol de session par XSS). C'est le seul canal accepté :
ni en-tête Authorization, ni jeton dans une réponse.
"""
from django.conf import settings
from django.http import HttpResponse
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.request import Request

from edufinder.models import User
from edufinder.services.security import find_user_from_access_token

TOKEN_COOKIE_NAME = "token"
COOKIE_PATH = "/"
INVALID_CREDENTIALS_MESSAGE = "Invalid or missing credentials"
SECONDS_PER_MINUTE = 60


# Cette classe n'est déclarée que sur les vues privées, et elle refuse toute
# requête sans jeton valide : une vue qui l'utilise est donc toujours appelée
# avec un compte identifié. Les vues publiques ne la déclarent pas, un cookie
# périmé ne peut donc jamais bloquer la consultation publique.
class CookieJwtAuthentication(BaseAuthentication):
    def authenticate(self, request: Request) -> tuple[User, None]:
        token = request.COOKIES.get(TOKEN_COOKIE_NAME)
        user = find_user_from_access_token(token) if token else None
        # Même refus pour un jeton absent, falsifié, expiré ou d'un compte
        # supprimé : je ne dis pas au client laquelle de ces raisons s'applique.
        if user is None:
            raise AuthenticationFailed(INVALID_CREDENTIALS_MESSAGE)
        return user, None

    # Sans cet en-tête, DRF transformerait le refus 401 en 403.
    def authenticate_header(self, request: Request) -> str:
        return "Cookie"


def set_token_cookie(response: HttpResponse, token: str) -> None:
    # SameSite=Lax fonctionne en dev (localhost:5173 -> localhost:8000, même
    # site car les ports sont ignorés). En production sur des domaines
    # séparés, il faudra SameSite=None, qui exige le flag secure.
    response.set_cookie(
        TOKEN_COOKIE_NAME,
        token,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * SECONDS_PER_MINUTE,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite="Lax",
        path=COOKIE_PATH,
    )


def expire_token_cookie(response: HttpResponse) -> None:
    response.delete_cookie(TOKEN_COOKIE_NAME, path=COOKIE_PATH)
