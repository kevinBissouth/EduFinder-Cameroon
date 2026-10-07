"""Connexion, déconnexion et profil courant."""
from rest_framework import status
from rest_framework.decorators import (
    api_view,
    authentication_classes,
    parser_classes,
    throttle_classes,
)
from rest_framework.exceptions import APIException
from rest_framework.parsers import FormParser
from rest_framework.response import Response

from edufinder.authentication import (
    CookieJwtAuthentication,
    expire_token_cookie,
    set_token_cookie,
)
from edufinder.serializers.auth import AuthenticatedUserSerializer, LoginSerializer
from edufinder.services.security import authenticate_account, create_access_token
from edufinder.throttling import LoginRateThrottle

SUCCESS_BODY = {"status": "ok"}


# Exception dédiée plutôt que AuthenticationFailed : sur une vue sans classe
# d'authentification (c'est le cas de la connexion), DRF transformerait cette
# dernière en 403.
class IncorrectCredentials(APIException):
    status_code = status.HTTP_401_UNAUTHORIZED
    default_detail = "Incorrect email or password"


@api_view(["POST"])
@parser_classes([FormParser])
@throttle_classes([LoginRateThrottle])
def login(request):
    credentials_serializer = LoginSerializer(data=request.data)
    credentials_serializer.is_valid(raise_exception=True)
    credentials = credentials_serializer.validated_data
    user = authenticate_account(credentials["email"], credentials["password"])
    # Un e-mail inconnu et un mauvais mot de passe reçoivent exactement la même
    # réponse, pour ne rien révéler sur l'existence d'un compte.
    if user is None:
        raise IncorrectCredentials()
    # Le jeton part uniquement dans le cookie httpOnly, jamais dans le corps :
    # le renvoyer en JSON le rendrait lisible par un script injecté.
    response = Response(SUCCESS_BODY)
    set_token_cookie(response, create_access_token(user))
    return response


# Le cookie httpOnly ne peut pas être effacé côté client : le navigateur doit
# recevoir l'ordre d'expiration directement du serveur.
@api_view(["POST"])
def logout(request):
    response = Response(SUCCESS_BODY)
    expire_token_cookie(response)
    return response


@api_view(["GET"])
@authentication_classes([CookieJwtAuthentication])
def current_user(request):
    return Response(AuthenticatedUserSerializer(request.user).data)
