from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", "backend/.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "EduFinder Cameroon"
    version: str = "0.1.0"
    cors_origins: list[str] = ["*"]
    database_url: str = "mysql+pymysql://user:password@localhost:3306/edufinder_db"


settings = Settings()