import logging
import json
from datetime import datetime, timedelta

# Note: Requires google-ads Python client library
# pip install google-ads
try:
    from google.ads.googleads.client import GoogleAdsClient
    from google.ads.googleads.errors import GoogleAdsException
except ImportError:
    logging.warning("google-ads library not found. Install via 'pip install google-ads' before running.")

# Configure Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - [GoogleAgent] - %(levelname)s - %(message)s')

class GoogleFetcherAgent:
    """
    Sub-Agent responsible for authenticating with Google Ads API (via google-ads.yaml),
    fetching raw campaign performance using GAQL, and normalizing it to the Universal Schema.
    """
    
    def __init__(self, customer_id: str, credentials_path: str = 'google-ads.yaml'):
        self.customer_id = customer_id.replace('-', '') # Remove dashes if present
        
        try:
            self.client = GoogleAdsClient.load_from_storage(credentials_path)
            self.ga_service = self.client.get_service("GoogleAdsService")
        except Exception as e:
            logging.error(f"Failed to initialize Google Ads Client. Ensure {credentials_path} exists and is valid.")
            self.client = None

    def fetch_daily_performance(self, target_date: str = None) -> list:
        """
        Fetches raw daily campaign insights from Google Ads using GAQL.
        target_date format: 'YYYY-MM-DD'
        """
        if not target_date:
            target_date = (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d')
            
        logging.info(f"Fetching Google Ads performance for date: {target_date}")
        
        if not self.client:
            logging.error("Google Ads Client not initialized. Returning empty list.")
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
            
            logging.info(f"Successfully fetched {len(raw_data)} active campaigns from Google Ads.")
            return raw_data
            
        except GoogleAdsException as ex:
            logging.error(f"Google Ads API Request failed with status {ex.error.code().name}")
            for error in ex.failure.errors:
                logging.error(f"\tError with message: {error.message}")
            raise

    def normalize_data(self, raw_data: list, target_date: str) -> list:
        """
        Transforms raw Google Ads row objects into the Universal Database Schema format.
        Maps Google 'conversions' -> Universal 'actions'.
        Dumps Google-specific metrics (like search_impression_share) into JSONB blob.
        """
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
                'search_impression_share': float(row.metrics.search_impression_share) if row.metrics.search_impression_share else None
            }

            normalized_records.append({
                'platform': 'Google',
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
            
        logging.info(f"Normalized {len(normalized_records)} records to Universal Schema.")
        return normalized_records

    def push_to_database(self, normalized_data: list):
        """
        Stub function representing the insert into our PostgreSQL Unified DB.
        """
        logging.info(f"Pushing {len(normalized_data)} rows to Unified PostgreSQL Database... [STUB]")
        pass

    def run(self, target_date: str = None):
        """Main execution flow for the Agent."""
        try:
            if not target_date:
                target_date = (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d')
                
            raw_data = self.fetch_daily_performance(target_date)
            normalized = self.normalize_data(raw_data, target_date)
            self.push_to_database(normalized)
            
            logging.info("Google Agent execution completed successfully. ✅")
            return normalized
            
        except Exception as e:
            logging.error(f"Google Agent execution failed: {str(e)} ❌")
            raise

if __name__ == "__main__":
    # Example Usage
    # Ensure google-ads.yaml is correctly configured with your Developer Token, Client ID, etc.
    GOOGLE_CUSTOMER_ID = "123-456-7890"
    
    # agent = GoogleFetcherAgent(customer_id=GOOGLE_CUSTOMER_ID)
    # results = agent.run()
    # print(json.dumps(results[:1], indent=2))
