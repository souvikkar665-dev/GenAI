"""Environment configuration; secrets are never embedded in source."""
import os
from dataclasses import dataclass

@dataclass(frozen=True)
class Settings:
    host: str = os.getenv('HOST', '0.0.0.0')
    port: int = int(os.getenv('PORT', '3000'))
    postgres_dsn: str = os.getenv('BOARDROOM_POSTGRES_DSN', '')
    aws_region: str = os.getenv('AWS_REGION', '')
    log_level: str = os.getenv('LOG_LEVEL', 'INFO')

    @property
    def demo_mode(self) -> bool:
        return not bool(self.postgres_dsn)

settings = Settings()
