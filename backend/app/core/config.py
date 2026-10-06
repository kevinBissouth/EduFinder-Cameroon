from pydantic_settings import BaseSettings, SettingsConfigDict

import os

# Dossier unique des fichiers téléversés : défini ici car il est utilisé à
# la fois par main.py (montage StaticFiles) et par les routes d'upload.
# Le seed écrit ses images dans media/ à la racine du projet (profil_*.jpg,
# director_*.png) : je remonte donc jusqu'à la racine pour servir ce dossier.
_MEDIA_PARENT = os.path.dirname(
    os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
)
MEDIA_DIR = os.path.join(_MEDIA_PARENT, "media")


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", "backend/.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "EduFinder Cameroon"
    version: str = "0.1.0"

    cors_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]
    database_url: str = "mysql+pymysql://user:password@localhost:3306/edufinder_db"

    secret_key: str
    # Le JWT n'est pas révocable : un token volé reste valable jusqu'à son
    # expiration, donc je garde une durée courte.
    access_token_expire_minutes: int = 120
    # À passer à true en production (HTTPS) : le navigateur n'envoie alors
    # jamais le cookie de session sur une connexion non chiffrée. Reste à
    # false en développement, servi en HTTP.
    cookie_secure: bool = False


settings = Settings()