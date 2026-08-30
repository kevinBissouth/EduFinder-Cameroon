"""Dépendances FastAPI d'authentification et d'autorisation.

Tous les contrôles de rôle sont appliqués ICI, côté serveur : le frontend
n'est qu'une commodité, jamais une barrière de sécurité.

Le token est accepté depuis le cookie httpOnly posé par /auth/login (flux
navigateur) OU depuis le header Authorization: Bearer (tests pytest et
bouton Authorize de Swagger). Le header Bearer reste prioritaire : quand
il est présent, c'est une intention d'authentification explicite, alors
que le cookie peut être périmé (le client HTTP garde le dernier cookie
posé même si un header plus récent est envoyé).
"""
from typing import Annotated

from fastapi import Depends, HTTPException, Request, status
from sqlmodel import Session

from app.db.session import get_db
from app.models import User, UserRole
from app.services.security import decode_access_token

COOKIE_NAME = "token"


def _invalid_credentials() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or missing credentials",
    )


def _extract_token(request: Request) -> str | None:
    # Header Bearer d'abord : le cookie httpOnly reste le flux normal du
    # navigateur, mais un client qui envoie explicitement un Bearer veut
    # être identifié par CE token (le jar de cookies peut contenir le
    # token d'une session de connexion antérieure, par exemple lors des
    # tests qui enchaînent deux logins différents).
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.lower().startswith("bearer "):
        return auth_header[7:].strip()
    return request.cookies.get(COOKIE_NAME)


def get_current_user(
    request: Request,
    session: Annotated[Session, Depends(get_db)],
) -> User:
    token = _extract_token(request)
    if not token:
        raise _invalid_credentials()
    claims = decode_access_token(token)
    if claims is None:
        raise _invalid_credentials()
    user = session.get(User, int(claims["sub"]))
    if user is None:
        raise _invalid_credentials()
    return user


def require_manager_or_admin(
    current_user: Annotated[User, Depends(get_current_user)],
) -> User:
    if current_user.role not in (UserRole.manager, UserRole.super_admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Manager or admin role required",
        )
    return current_user


def require_admin(current_user: Annotated[User, Depends(get_current_user)]) -> User:
    if current_user.role != UserRole.super_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin role required",
        )
    return current_user