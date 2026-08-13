import logging
from abc import ABC, abstractmethod
from typing import List, Dict, Any
from datetime import datetime, timedelta

from backend.database import SessionLocal
from backend.resolver import resolve_and_insert
from backend.config import settings

# Configuration
logging.basicConfig(level=logging.INFO, format='%(asctime)s - [%(name)s] - %(levelname)s - %(message)s')

class BaseFetcherAgent(ABC):
    """
    Abstract Base Class for all advertising platform fetcher agents.
    Provides standard interface and centralized database pushing.
    """

    def __init__(self, platform_name: str):
        self.platform_name = platform_name
        self.account_id_string: str = ""
        self.logger = logging.getLogger(self.platform_name)

    @abstractmethod
    def fetch_daily_performance(self, target_date: str) -> List[Any]:
        """Fetch raw performance data from the specific ad platform API."""
        pass

    @abstractmethod
    def normalize_data(self, raw_data: List[Any], target_date: str) -> List[Dict[str, Any]]:
        """Transform raw platform data into the Universal Database Schema format."""
        pass

    def push_to_database(self, normalized_data: List[Dict[str, Any]]) -> None:
        """Centralized method to push normalized records to PostgreSQL."""
        if not normalized_data:
            self.logger.info("No data to push to database.")
            return

        db = SessionLocal()
        try:
            count = resolve_and_insert(
                db,
                normalized_data,
                brand_name=settings.DEFAULT_BRAND_NAME,
                platform_name=self.platform_name,
                account_id_string=self.account_id_string,
            )
            self.logger.info(f"Successfully pushed {count} rows to Unified DB.")
        except Exception as e:
            self.logger.error(f"Failed to push to database: {e}")
            db.rollback()
            raise
        finally:
            db.close()

    def run(self, target_date: str = None) -> List[Dict[str, Any]]:
        """Main execution workflow for the agent."""
        try:
            if not target_date:
                target_date = (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d')
                
            self.logger.info(f"Starting agent run for date: {target_date}")
            raw_data = self.fetch_daily_performance(target_date)
            normalized = self.normalize_data(raw_data, target_date)
            self.push_to_database(normalized)
            
            self.logger.info(f"{self.platform_name} Agent execution completed successfully. ✅")
            return normalized
        except Exception as e:
            self.logger.error(f"{self.platform_name} Agent execution failed: {str(e)} ❌")
            raise
