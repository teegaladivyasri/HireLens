from typing import List, Union, Optional
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "HireLens API"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Database
    DATABASE_URL: str = "sqlite:///./hirelens.db"

    # JWT & Auth
    JWT_SECRET_KEY: str = "hirelens-insecure-dev-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # CORS
    CORS_ORIGINS: Union[List[str], str] = ["http://localhost:5173", "http://127.0.0.1:5173"]

    # File Storage
    UPLOAD_DIR: str = "./uploads"
    TEMP_DIR: str = "./temp"
    MAX_UPLOAD_SIZE_MB: int = 25

    # AI Matching & LLM Provider Configuration
    # Supported: "native", "gemini", "openai", "anthropic", "ollama"
    AI_PROVIDER: str = "native"
    AI_API_KEY: Optional[str] = None
    AI_MODEL: Optional[str] = None
    AI_BASE_URL: Optional[str] = None

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            return v
        return ["http://localhost:5173", "http://127.0.0.1:5173"]


settings = Settings()
