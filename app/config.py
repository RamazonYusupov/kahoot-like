import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    REDIS_HOST: str = os.getenv("REDIS_HOST", "localhost")
    REDIS_PORT: int = int(os.getenv("REDIS_PORT", 6379))
    REDIS_DB: int = int(os.getenv("REDIS_DB", 0))
    
    AI_API_KEY: str = os.getenv("AI_API_KEY", "")
    AI_API_TYPE: str = os.getenv("AI_API_TYPE", "gemini")  # "openai", "claude", or "gemini"
    AI_MODEL: str = os.getenv("AI_MODEL", "gemini-2.5-flash")
    
    # Admin authentication
    ADMIN_USERNAME: str = os.getenv("ADMIN_USERNAME", "admin")
    ADMIN_PASSWORD: str = os.getenv("ADMIN_PASSWORD", "admin123")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
