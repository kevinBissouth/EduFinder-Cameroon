"""Réglages des tests : base SQLite en mémoire, la base MySQL de démo n'est
jamais touchée."""
import os

os.environ.setdefault("SECRET_KEY", "test-only-secret-key")
os.environ.setdefault("DATABASE_URL", "mysql+pymysql://unused:unused@localhost/unused")

from config.settings import *  # noqa: E402, F403

DATABASES = {
    "default": {"ENGINE": "django.db.backends.sqlite3", "NAME": ":memory:"}
}
