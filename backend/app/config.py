import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    RAM_BASE_URL: str = os.getenv("RAM_BASE_URL", "https://your-sas-host.example.com")
    RAM_API_URL: str = os.getenv("RAM_API_URL", "https://your-sas-host.example.com/SASRetrievalAgentManager/api/v1")
    KEYCLOAK_URL: str = os.getenv("KEYCLOAK_URL", "https://your-sas-host.example.com/SASRetrievalAgentManager/auth")
    REALM: str = os.getenv("REALM", "sas-iot")
    CLIENT_ID: str = os.getenv("CLIENT_ID", "sas-ram-api")
    VIYA_HOST: str = os.getenv("VIYA_HOST", "https://your-sas-host.example.com")
    RAM_TOKEN: str = os.getenv("RAM_TOKEN", "")
    DEFAULT_AGENT_ID: str = os.getenv("DEFAULT_AGENT_ID", "")
    VERIFY_SSL: bool = os.getenv("VERIFY_SSL", "True").lower() in ("true", "1", "yes")
    RAM_SESSION_FILE: str = os.getenv("RAM_SESSION_FILE", "/tmp/ram_sessions.json")
    COOKIE_SECURE: bool = os.getenv("COOKIE_SECURE", "False").lower() in ("true", "1", "yes")
    SIGNIN_FLOW: str = os.getenv("SIGNIN_FLOW", "device")
    MAX_ATTACH_CHARS: int = int(os.getenv("MAX_ATTACH_CHARS", "20000"))

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
