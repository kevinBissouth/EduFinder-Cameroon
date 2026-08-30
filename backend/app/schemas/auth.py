"""Schémas de réponse liés à l'authentification."""
from pydantic import BaseModel


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class AuthenticatedUser(BaseModel):
    id_user: int
    name: str
    email: str
    role: str
