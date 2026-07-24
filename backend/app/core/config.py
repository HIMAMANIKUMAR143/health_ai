from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    # Snowflake Configuration
    SNOWFLAKE_ACCOUNT: Optional[str] = None
    SNOWFLAKE_USER: Optional[str] = None
    SNOWFLAKE_PASSWORD: Optional[str] = None
    SNOWFLAKE_WAREHOUSE: Optional[str] = "COMPUTE_WH"
    SNOWFLAKE_DATABASE: Optional[str] = "HEALTHCARE_DB"
    SNOWFLAKE_SCHEMA: Optional[str] = "PUBLIC"

    # Authentication
    JWT_SECRET: str = "your_jwt_secret_key_here_must_be_long_and_secure"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 115200  # 80 days for ease of testing
    CLERK_SECRET_KEY: Optional[str] = None
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: Optional[str] = None

    # API Configuration
    DATABASE_URL: str = "sqlite:///./healthcare.db"
    API_URL: str = "http://localhost:8000"
    NEXT_PUBLIC_API_URL: str = "http://localhost:8000"

    # File Upload
    MAX_UPLOAD_SIZE: int = 50000000
    ALLOWED_FILE_TYPES: str = "pdf,docx,txt,jpg,png"

    # OCR Configuration
    TESSERACT_PATH: str = "/usr/bin/tesseract"
    ENABLE_OCR: bool = True

    # Email Configuration
    SMTP_SERVER: Optional[str] = None
    SMTP_PORT: Optional[int] = None
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None

    # Logging
    LOG_LEVEL: str = "INFO"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
