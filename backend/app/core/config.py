"""Application configuration using pydantic-settings."""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Supabase
    supabase_url: str
    supabase_key: str
    supabase_service_key: str

    # OpenAI
    openai_api_key: str

    #NewsAPI
    newsai_api_key: str

    # Resend
    resend_api_key: str
    resend_from_email: str
    resend_from_name: str = "Quorent"
    resend_reply_to: Optional[str] = None

    # Cron
    cron_secret_token: str
    
    # Server
    environment: str = "development"
    port: int = 8000
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()