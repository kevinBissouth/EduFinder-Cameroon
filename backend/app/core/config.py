from pydantic_settings import BaseSettings, SettingsConfigDict

import os

# Dossier unique des fichiers téléversés : défini ici car il est utilisé à
# la fois par main.py (montage StaticFiles) et par les routes d'upload.
MEDIA_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "media"
)


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
    access_token_expire_minutes: int = 480


settings = Settings()