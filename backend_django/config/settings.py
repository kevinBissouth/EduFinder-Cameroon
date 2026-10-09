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


SQLITE_URL_PREFIX = "sqlite:///"


def _parse_database_url(database_url: str) -> dict:
    if database_url.startswith(SQLITE_URL_PREFIX):
        return _build_sqlite_settings(database_url.removeprefix(SQLITE_URL_PREFIX))
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


# SQLite sert à l'hébergement de démonstration, là où MySQL n'est pas offert :
# toute la base tient dans un fichier. Un chemin relatif part du dossier du
# projet Django ; un chemin absolu s'écrit avec une quatrième barre oblique
# (sqlite:////home/moi/base.sqlite3), comme dans la convention SQLAlchemy.
def _build_sqlite_settings(database_path: str) -> dict:
    return {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / database_path,
    }


# Pas de valeur par défaut : je préfère un échec au démarrage à une clé de
# signature prévisible oubliée en production.
SECRET_KEY = os.environ["SECRET_KEY"]
DEBUG = _read_boolean("DEBUG")
ALLOWED_HOSTS = json.loads(os.environ.get("ALLOWED_HOSTS", '["localhost", "127.0.0.1"]'))

# En production le site est derrière le serveur de l'hébergeur, qui reçoit le
# HTTPS et transmet la requête en HTTP en ajoutant cet en-tête. Sans ce
# réglage, les adresses complètes données aux robots (plan du site, image de
# partage) commenceraient par « http:// ». En développement il n'y a pas
# d'intermédiaire : je ne fais confiance à cet en-tête qu'hors DEBUG.
if not DEBUG:
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

INSTALLED_APPS = [
    "corsheaders",
    "rest_framework",
    "edufinder",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "edufinder.middleware.csrf_origin_middleware",
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.middleware.common.CommonMiddleware",
]

ROOT_URLCONF = "config.urls"
WSGI_APPLICATION = "config.wsgi.application"

DATABASES = {"default": _parse_database_url(os.environ["DATABASE_URL"])}
DEFAULT_AUTO_FIELD = "django.db.models.AutoField"

# Dossier unique des fichiers téléversés, à la racine du projet : c'est aussi
# là que vivent les images de démonstration, et l'ancien backend y écrit.
MEDIA_ROOT = BASE_DIR.parent / "media"
MEDIA_URL = "/media/"

# Le frontend compilé est servi par Django lui-même, à la racine du site :
# l'interface et l'API partagent ainsi le même domaine, et le cookie de
# session fonctionne sans réglage particulier. Le dossier n'existe qu'après
# « npm run build » : en développement, c'est Vite qui sert l'interface.
FRONTEND_BUILD_DIR = BASE_DIR.parent / "frontend" / "dist"
HASHED_ASSETS_URL_PREFIX = "/assets/"


# Vite met une empreinte du contenu dans le nom de chaque fichier de
# « assets » : un nom donné ne change jamais de contenu, le navigateur peut
# donc le garder en cache indéfiniment. Les autres fichiers (index.html,
# manifeste, icônes) gardent un cache court pour suivre les mises à jour.
def _is_hashed_asset(file_path: str, url: str) -> bool:
    return url.startswith(HASHED_ASSETS_URL_PREFIX)


if FRONTEND_BUILD_DIR.is_dir():
    WHITENOISE_ROOT = FRONTEND_BUILD_DIR
    WHITENOISE_INDEX_FILE = True
    WHITENOISE_IMMUTABLE_FILE_TEST = _is_hashed_asset
    # Type attendu par les navigateurs pour le manifeste de l'application ;
    # il n'est pas dans la table par défaut.
    WHITENOISE_MIMETYPES = {".webmanifest": "application/manifest+json"}

# Le cache sert au dédoublonnage des événements de suivi et au décompte des
# tentatives de connexion. MAX_ENTRIES borne la mémoire : au-delà, Django
# évince des entrées au lieu de grossir sans limite.
CACHE_MAX_ENTRIES = 10_000
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        "OPTIONS": {"MAX_ENTRIES": CACHE_MAX_ENTRIES},
    }
}

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

LOGIN_ATTEMPTS_RATE = "10/min"

# Nombre de serveurs intermédiaires de confiance placés devant Django
# (répartiteur de charge de l'hébergeur…). 0 en développement : l'adresse du
# client est celle de la connexion. Derrière un hébergeur, Django ne voit que
# l'adresse du dernier serveur ; ce nombre dit combien de crans remonter dans
# X-Forwarded-For pour retrouver le vrai visiteur, sans croire ce que le
# client a pu y écrire lui-même.
TRUSTED_PROXY_COUNT = int(os.environ.get("TRUSTED_PROXY_COUNT", "0"))

REST_FRAMEWORK = {
    "DEFAULT_RENDERER_CLASSES": ["rest_framework.renderers.JSONRenderer"],
    "DEFAULT_PARSER_CLASSES": ["rest_framework.parsers.JSONParser"],
    # Aucune authentification par défaut : les routes sont publiques sauf
    # celles qui déclarent explicitement CookieJwtAuthentication.
    "DEFAULT_AUTHENTICATION_CLASSES": [],
    "UNAUTHENTICATED_USER": None,
    "DEFAULT_THROTTLE_RATES": {"login": LOGIN_ATTEMPTS_RATE},
    # Sans ce réglage, DRF croirait tout l'en-tête X-Forwarded-For, que le
    # client peut forger pour contourner la limite de tentatives.
    "NUM_PROXIES": TRUSTED_PROXY_COUNT,
    "EXCEPTION_HANDLER": "edufinder.exception_handler.handle_api_exception",
}
