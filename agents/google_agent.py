import json
from typing import List, Dict, Any

try:
    from google.ads.googleads.client import GoogleAdsClient
    from google.ads.googleads.errors import GoogleAdsException
except ImportError:
    pass

from .base_agent import BaseFetcherAgent

from backend.config import settings

class GoogleFetcherAgent(BaseFetcherAgent):
    """
    Sub-Agent responsible for authenticating with Google Ads API (via env variables or google-ads.yaml),
    fetching raw campaign performance using GAQL, and normalizing it to the Universal Schema.
    """
    
    def __init__(self, customer_id: str, credentials_path: str = 'google-ads.yaml'):
        super().__init__(platform_name="Google")
        self.customer_id = customer_id.replace('-', '') # Remove dashes if present
        self.account_id_string = self.customer_id
        
        try:
            # Check if all required environment variables are set
            if all([settings.GOOGLE_DEVELOPER_TOKEN, settings.GOOGLE_CLIENT_ID, 
                    settings.GOOGLE_CLIENT_SECRET, settings.GOOGLE_REFRESH_TOKEN]):
                self.logger.info("Initializing Google Ads Client using environment variables.")
                credentials = {
                    "developer_token": settings.GOOGLE_DEVELOPER_TOKEN,
                    "client_id": settings.GOOGLE_CLIENT_ID,
                    "client_secret": settings.GOOGLE_CLIENT_SECRET,
                    "refresh_token": settings.GOOGLE_REFRESH_TOKEN,
                    "use_proto_plus": True
                }
                if settings.GOOGLE_LOGIN_CUSTOMER_ID:
                    # Strip any dashes from the manager account ID
                    credentials["login_customer_id"] = settings.GOOGLE_LOGIN_CUSTOMER_ID.replace('-', '')
                
                self.client = GoogleAdsClient.load_from_dict(credentials)
            else:
                self.logger.info(f"Using Google Ads Client from storage configuration: {credentials_path}")
                self.client = GoogleAdsClient.load_from_storage(credentials_path)
                
            self.ga_service = self.client.get_service("GoogleAdsService")
        except Exception as e:
            self.logger.error(f"Failed to initialize Google Ads Client: {e}")
            self.client = None

    def fetch_daily_performance(self, target_date: str) -> List[Any]:
        self.logger.info(f"Fetching Google Ads performance for date: {target_date}")
        
        if not self.client:
            self.logger.error("Google Ads Client not initialized. Returning empty list.")
            return []
            
        query = f"""
            SELECT
              campaign.id,
              campaign.name,
              metrics.clicks,
              metrics.impressions,
              metrics.cost_micros,
              metrics.conversions,
              metrics.conversions_value,
              metrics.search_impression_share,
              metrics.ctr,
              metrics.average_cpc
            FROM campaign
            WHERE segments.date = '{target_date}'
              AND campaign.status = 'ENABLED'
        """
        
        search_request = self.client.get_type("SearchGoogleAdsRequest")
        search_request.customer_id = self.customer_id
        search_request.query = query

        raw_data = []
        try:
            response = self.ga_service.search(request=search_request)
            for row in response:
                raw_data.append(row)
            
            self.logger.info(f"Successfully fetched {len(raw_data)} active campaigns from Google Ads.")
            return raw_data
            
        except GoogleAdsException as ex:
            self.logger.error(f"Google Ads API Request failed with status {ex.error.code().name}")
            for error in ex.failure.errors:
                self.logger.error(f"\tError with message: {error.message}")
            raise

    def normalize_data(self, raw_data: List[Any], target_date: str) -> List[Dict[str, Any]]:
        normalized_records = []
        
        for row in raw_data:
            campaign_id = str(row.campaign.id)
            campaign_name = row.campaign.name
            
            # Google stores cost in micros (1 millionth of the currency unit)
            spend = float(row.metrics.cost_micros) / 1_000_000.0
            impressions = int(row.metrics.impressions)
            clicks = int(row.metrics.clicks)
            
            # Universal 'actions' mapping
            standard_actions = float(row.metrics.conversions)
            conversion_value = float(row.metrics.conversions_value)

            # Pack Google-specific metrics into our JSONB payload
            raw_native_metrics = {
                'platform_cpc': float(row.metrics.average_cpc) / 1_000_000.0 if row.metrics.average_cpc else 0,
                'platform_ctr': float(row.metrics.ctr),
                'search_impression_share': float(row.metrics.search_impression_share) if getattr(row.metrics, "search_impression_share", None) else None
            }

            normalized_records.append({
                'platform': self.platform_name,
                'campaign_id_string': campaign_id,
                'campaign_name': campaign_name,
                'date': target_date,
                'spend': spend,
                'impressions': impressions,
                'clicks': clicks,
                'actions': standard_actions,
                'conversion_value': conversion_value,
                'raw_native_metrics': raw_native_metrics
            })
            
        self.logger.info(f"Normalized {len(normalized_records)} records to Universal Schema.")
        return normalized_records
