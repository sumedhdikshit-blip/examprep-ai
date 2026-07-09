import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    host: str = "127.0.0.1"
    port: int = 8000
    database_url: str = "sqlite:///./exam_prep.db"
    jwt_secret_key: str = "supersecretkeychangeinproduction12345"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440
    upload_dir: str = "backend/uploads"
    max_upload_size_mb: int = 10

    class Config:
        # Load from .env if it exists in the working directory
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

settings = Settings()

# Ensure the upload directory exists
os.makedirs(settings.upload_dir, exist_ok=True)
