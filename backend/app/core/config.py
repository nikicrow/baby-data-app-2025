from typing import Any, Dict, List, Optional
from pydantic import PostgresDsn, field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "your-secret-key-change-this-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days
    
    # CORS origins for frontend
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",  # React dev server
        "http://localhost:8000",  # FastAPI dev server
        "https://localhost:3000",
    ]

    # Database configuration
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_USER: str = "crowbe"
    POSTGRES_PASSWORD: str = "localtestpass"
    POSTGRES_DB: str = "baby_data"
    DATABASE_URL: Optional[PostgresDsn] = None

    # Redis configuration (optional, for caching)
    REDIS_URL: str = "redis://localhost:6379"
    
    # Timezone
    TIMEZONE: str = "Australia/Sydney"

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_db_connection(cls, v: Optional[str], info) -> Any:
        if isinstance(v, str):
            return v
        # Build DATABASE_URL from individual components
        values = info.data
        return f"postgresql://{values.get('POSTGRES_USER')}:{values.get('POSTGRES_PASSWORD')}@{values.get('POSTGRES_SERVER')}/{values.get('POSTGRES_DB')}"


    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Any) -> List[str]:
        if isinstance(v, str):
            # Handle comma-separated string from .env
            return [i.strip() for i in v.split(",")]
        if isinstance(v, list):
            # Already a list (from default or elsewhere)
            return v
        raise ValueError(f"Invalid CORS origins format: {v}")


    class Config:
        case_sensitive = True
        env_file = ".env"


settings = Settings()