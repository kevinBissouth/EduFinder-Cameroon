"""Mots de passe (bcrypt) et jetons de session (JWT signé).

Le jeton garde la clé, l'algorithme et le contenu de l'ancien backend : une
session ouverte sur l'un reste valable sur l'autre pendant la transition.
"""
import secrets
from datetime import datetime, timedelta, timezone

import bcrypt
from django.conf import settings
from jose import JWTError, jwt

from edufinder.models import User

ALGORITHM = "HS256"
# bcrypt ignore tout ce qui dépasse 72 octets et sa version 5 lève une erreur
# au-delà : je refuse ces mots de passe moi-même plutôt que de laisser
# l'erreur remonter en 500.
BCRYPT_MAX_PASSWORD_BYTES = 72


def hash_password(plain_password: str) -> str:
    return bcrypt.hashpw(plain_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password: str, password_hash: str) -> bool:
    encoded_password = plain_password.encode("utf-8")
    if len(encoded_password) > BCRYPT_MAX_PASSWORD_BYTES:
        return False
    return bcrypt.checkpw(encoded_password, password_hash.encode("utf-8"))


# Hash d'un secret aléatoire que personne ne connaît : il sert à dépenser le
# même temps de calcul quand l'e-mail est inconnu.
_UNKNOWN_ACCOUNT_PASSWORD_HASH = hash_password(secrets.token_urlsafe(32))


def authenticate_account(email: str, plain_password: str) -> User | None:
    user = User.objects.filter(email=email).first()
    # Je vérifie toujours un hash, même sans compte : répondre plus vite pour
    # un e-mail inconnu révélerait quels e-mails ont un compte.
    password_hash = user.password_hash if user else _UNKNOWN_ACCOUNT_PASSWORD_HASH
    is_password_valid = verify_password(plain_password, password_hash)
    if user is None or not is_password_valid:
        return None
    return user


def create_access_token(user: User) -> str:
    expires_at = datetime.now(timezone.utc) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    claims = {"sub": str(user.id_user), "role": user.role, "exp": expires_at}
    return jwt.encode(claims, settings.SECRET_KEY, algorithm=ALGORITHM)


def find_user_from_access_token(token: str) -> User | None:
    user_id = _read_user_id(token)
    if user_id is None:
        return None
    # Le compte est relu en base à chaque requête : un compte supprimé perd
    # l'accès immédiatement, et son rôle actuel prime sur celui du jeton.
    return User.objects.filter(pk=user_id).first()


def _read_user_id(token: str) -> int | None:
    try:
        claims = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None
    subject = claims.get("sub")
    if not isinstance(subject, str) or not subject.isdigit():
        return None
    return int(subject)
