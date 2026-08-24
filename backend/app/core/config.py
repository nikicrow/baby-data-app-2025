import json
from pathlib import Path
from typing import Annotated, Any, Dict, List, Optional
from pydantic import PostgresDsn, field_validator
from pydantic_settings import BaseSettings, NoDecode

# backend/app/core/config.py -> repo root
REPO_ROOT = Path(__file__).resolve().parents[3]


class Settings(BaseSettings):
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "your-secret-key-change-this-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days
    
    # CORS origins for frontend
    # Prevent pydantic-settings from JSON-decoding this value before our
    # validator handles the comma-separated format used in .env files.
    BACKEND_CORS_ORIGINS: Annotated[List[str], NoDecode] = [
        "http://localhost:3000",  # React dev server (default)
        "http://localhost:3001",  # React feature branch server (alternate port)
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

    # Built frontend bundle. When present, the API serves the SPA from the same
    # origin, so a Tailscale deployment needs one URL and no CORS entry.
    FRONTEND_DIST: Path = REPO_ROOT / "frontend" / "build"

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
            # Support both JSON arrays and comma-separated values in .env files.
            value = v.strip()
            if value.startswith("["):
                try:
                    value = json.loads(value)
                except json.JSONDecodeError as exc:
                    raise ValueError("Invalid JSON array for BACKEND_CORS_ORIGINS") from exc
            else:
                value = value.split(",")

            if not isinstance(value, list):
                raise ValueError("BACKEND_CORS_ORIGINS must be a list of origins")
            return [origin.strip().rstrip("/") for origin in value if origin.strip()]
        if isinstance(v, list):
            # Already a list (from default or elsewhere)
            return [origin.strip().rstrip("/") for origin in v if origin.strip()]
        raise ValueError(f"Invalid CORS origins format: {v}")


    class Config:
        case_sensitive = True
        env_file = ".env"


settings = Settings()
