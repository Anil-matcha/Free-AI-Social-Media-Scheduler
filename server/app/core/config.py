import os
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseModel):
    PROJECT_NAME: str = "OpenSpaces API"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api"
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    CORS_ORIGINS: list[str] = [
        origin.strip()
        for origin in os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(",")
        if origin.strip()
    ]
    DATABASE_URL: str = os.getenv(
        "DIRECT_URL",
        os.getenv(
            "DATABASE_URL",
            "postgresql://postgres.kzemjiijodshsryvhsmj:b3ZOvhDE3OfGkaTM@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres"
        )
    )
    DEFAULT_MODEL: str = os.getenv("DEFAULT_MODEL", "mimo-v2-6-flash-abliterated")
    MUAPI_API_KEY: str = os.getenv("MUAPI_API_KEY", "")

settings = Settings()
