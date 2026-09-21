from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Database Settings
    DATABASE_URL: str = "sqlite:///./agentic.db"
    
    # App Settings
    APP_NAME: str = "Agentic Dashboard API"
    API_VERSION: str = "v1"

    # Agent Settings
    GOOGLE_CUSTOMER_ID: str = ""
    GOOGLE_DEVELOPER_TOKEN: str = ""
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REFRESH_TOKEN: str = ""
    GOOGLE_LOGIN_CUSTOMER_ID: str = ""

    META_ACCESS_TOKEN: str = ""
    META_AD_ACCOUNT_ID: str = ""

    DEFAULT_BRAND_NAME: str = "Demo Brand"

    EASYECOM_API_KEY: str = ""
    EASYECOM_EMAIL: str = ""
    EASYECOM_PASSWORD: str = ""
    EASYECOM_LOCATION_KEY: str = ""

    class Config:
        env_file = ".env"

settings = Settings()
