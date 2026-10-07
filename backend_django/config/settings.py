"""Réglages Django d'EduFinder Cameroon.

Les valeurs sensibles ou propres à un environnement viennent du fichier .env
(jamais commité). Les noms de variables sont ceux de l'ancien backend
FastAPI : le même .env sert aux deux pendant la transition.
"""
import json
import os
from pathlib import Path
from urllib.parse import unquote, urlparse

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

DEFAULT_CORS_ORIGINS = '["http://localhost:5173", "http://127.0.0.1:5173"]'
DEFAULT_ACCESS_TOKEN_EXPIRE_MINUTES = "120"
DEFAULT_MYSQL_PORT = 3306


def _read_boolean(variable_name: str, default: bool = False) -> bool:
    raw_value = os.environ.get(variable_name)
    if raw_value is None:
        return default
    return raw_value.strip().lower() in {"1", "true", "yes"}


def _parse_database_url(database_url: str) -> dict:
    # L'URL est au format SQLAlchemy (mysql+pymysql://user:mdp@hote:port/base) ;
    # Django veut ces éléments séparés.
    parsed_url = urlparse(database_url)
    return {
        "ENGINE": "django.db.backends.mysql",
        "NAME": parsed_url.path.lstrip("/"),
        "USER": unquote(parsed_url.username or ""),
        "PASSWORD": unquote(parsed_url.password or ""),
        "HOST": parsed_url.hostname or "localhost",
        "PORT": parsed_url.port or DEFAULT_MYSQL_PORT,
        "OPTIONS": {"charset": "utf8mb4"},
    }


# Pas de valeur par défaut : je préfère un échec au démarrage à une clé de
# signature prévisible oubliée en production.
SECRET_KEY = os.environ["SECRET_KEY"]
DEBUG = _read_boolean("DEBUG")
ALLOWED_HOSTS = json.loads(os.environ.get("ALLOWED_HOSTS", '["localhost", "127.0.0.1"]'))

INSTALLED_APPS = [
    "corsheaders",
    "rest_framework",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.middleware.common.CommonMiddleware",
]

ROOT_URLCONF = "config.urls"
WSGI_APPLICATION = "config.wsgi.application"

DATABASES = {"default": _parse_database_url(os.environ["DATABASE_URL"])}
DEFAULT_AUTO_FIELD = "django.db.models.AutoField"

# Les dates existantes sont stockées en UTC sans fuseau : Django fait la même
# chose avec MySQL quand USE_TZ est actif.
USE_TZ = True
TIME_ZONE = "UTC"
USE_I18N = False

# Les routes de l'API n'ont pas de barre oblique finale (contrat du frontend) :
# je désactive la redirection automatique de Django vers « /chemin/ ».
APPEND_SLASH = False

CORS_ALLOWED_ORIGINS = json.loads(os.environ.get("CORS_ORIGINS", DEFAULT_CORS_ORIGINS))
CORS_ALLOW_CREDENTIALS = True

ACCESS_TOKEN_EXPIRE_MINUTES = int(
    os.environ.get("ACCESS_TOKEN_EXPIRE_MINUTES", DEFAULT_ACCESS_TOKEN_EXPIRE_MINUTES)
)
COOKIE_SECURE = _read_boolean("COOKIE_SECURE")

REST_FRAMEWORK = {
    "DEFAULT_RENDERER_CLASSES": ["rest_framework.renderers.JSONRenderer"],
    "DEFAULT_PARSER_CLASSES": ["rest_framework.parsers.JSONParser"],
    # Aucune authentification tant que le modèle de comptes n'est pas porté :
    # seules des routes publiques existent à ce stade.
    "DEFAULT_AUTHENTICATION_CLASSES": [],
    "UNAUTHENTICATED_USER": None,
}
