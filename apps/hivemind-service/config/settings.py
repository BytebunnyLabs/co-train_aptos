import os
from typing import List

class Settings:
    # 服务配置
    PORT: int = int(os.getenv("PORT", 8000))
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"
    
    # Hivemind 配置
    DHT_PORT: int = int(os.getenv("HIVEMIND_DHT_PORT", 8080))
    SERVER_PORT: int = int(os.getenv("HIVEMIND_SERVER_PORT", 8081))
    INITIAL_PEERS: List[str] = os.getenv("HIVEMIND_INITIAL_PEERS", "").split(",") if os.getenv("HIVEMIND_INITIAL_PEERS") else []
    
    # 外部服务配置
    BACKEND_URL: str = os.getenv("BACKEND_URL", "http://backend:3001")
    
settings = Settings()