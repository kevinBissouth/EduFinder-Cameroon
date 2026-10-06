"""Router d'authentification : connexion, déconnexion, profil courant.

Le token est posé dans un cookie httpOnly par le serveur ; le client
navigateur ne le lit jamais en JavaScript (protection XSS). Le même cookie
est lisible par le header Authorization: Bearer pour les clients API et les
tests, comme expliqué dans app.api.dependencies.
"""
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session, select

from app.api.dependencies import COOKIE_NAME, get_current_user
from app.db.session import get_db
from app.models import User
from app.schemas.auth import AuthenticatedUser, TokenResponse
from app.services.security import create_access_token, set_token_cookie, verify_password

auth_router = APIRouter()


@auth_router.post("/auth/login", response_model=TokenResponse)
def login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    response: Response,
    session: Session = Depends(get_db),
):
    # Je compare en une passe : un email inconnu et un mauvais mot de passe
    # renvoient exactement le même message, pour ne rien révéler sur l'existence
    # d'un compte.
    user = session.exec(select(User).where(User.email == form_data.username)).first()
    if user is None or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    token = create_access_token(user.id_user, user.role.value)
    set_token_cookie(response, token)
    return TokenResponse(access_token=token)


@auth_router.post("/auth/logout")
def logout(response: Response):
    # Le cookie httpOnly ne peut pas être effacé côté client : le navigateur
    # doit recevoir l'ordre d'expiration directement du serveur.
    response.delete_cookie(COOKIE_NAME, path="/")
    return {"status": "ok"}


@auth_router.get("/auth/me", response_model=AuthenticatedUser)
def read_current_user(current_user: Annotated[User, Depends(get_current_user)]):
    return AuthenticatedUser(
        id_user=current_user.id_user,
        name=current_user.name,
        email=current_user.email,
        role=current_user.role.value,
    )
