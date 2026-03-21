import requests
import json
import logging
from datetime import datetime, timedelta

# Configure Logging for the Agent
logging.basicConfig(level=logging.INFO, format='%(asctime)s - [MetaAgent] - %(levelname)s - %(message)s')

class MetaFetcherAgent:
    """
    Sub-Agent responsible for authenticating with Meta Graph API,
    fetching raw campaign performance, and normalizing it to the Universal Schema.
    """
    
    API_VERSION = "v19.0"
    
    def __init__(self, access_token: str, ad_account_id: str):
        self.access_token = access_token
        self.ad_account_id = ad_account_id
        if not self.ad_account_id.startswith('act_'):
            self.ad_account_id = f"act_{self.ad_account_id}"
            
        self.base_url = f"https://graph.facebook.com/{self.API_VERSION}/{self.ad_account_id}/insights"

    def fetch_daily_performance(self, target_date: str = None) -> list:
        """
        Fetches raw daily campaign insights from Meta.
        target_date format: 'YYYY-MM-DD'
        """
        if not target_date:
            # Default to yesterday
            target_date = (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d')
            
        logging.info(f"Fetching Meta Ads performance for date: {target_date}")
        
        params = {
            'access_token': self.access_token,
            'level': 'campaign',
            'time_range': json.dumps({'since': target_date, 'until': target_date}),
            'fields': 'campaign_id,campaign_name,spend,impressions,clicks,actions,action_values,cpc,cpm,ctr,frequency'
        }
        
        response = requests.get(self.base_url, params=params)
        
        if response.status_code != 200:
            logging.error(f"Meta API Error: {response.text}")
            raise Exception(f"Failed to fetch data: {response.status_code}")
            
        data = response.json().get('data', [])
        logging.info(f"Successfully fetched {len(data)} active campaigns from Meta.")
        return data

    def normalize_data(self, raw_data: list, target_date: str) -> list:
        """
        Transforms raw Meta JSON into the Universal Database Schema format.
        Maps Meta 'Purchases' -> Universal 'Actions'.
        Dumps remaining platform-specific metrics into a JSONB blob.
        """
        normalized_records = []
        
        for row in raw_data:
            campaign_id = row.get('campaign_id')
            campaign_name = row.get('campaign_name')
            
            spend = float(row.get('spend', 0.0))
            impressions = int(row.get('impressions', 0))
            clicks = int(row.get('clicks', 0))
            
            # Extract standard 'Purchases' from Meta's complex actions array
            standard_actions = 0
            if 'actions' in row:
                for action in row['actions']:
                    if action.get('action_type') == 'purchase':
                        standard_actions = int(action.get('value', 0))
                        break
                        
            # Extract conversion value (Revenue)
            conversion_value = 0.0
            if 'action_values' in row:
                for action_val in row['action_values']:
                    if action_val.get('action_type') == 'purchase':
                        conversion_value = float(action_val.get('value', 0.0))
                        break

            # Pack all the other weird Meta-specific metrics into our JSONB payload
            raw_native_metrics = {
                'platform_cpc': row.get('cpc'),
                'platform_ctr': row.get('ctr'),
                'platform_frequency': row.get('frequency'),
                'raw_actions_array': row.get('actions', [])
            }

            normalized_records.append({
                'platform': 'Meta',
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
        # Example: session.bulk_insert_mappings(DailyPerformance, normalized_data)
        # session.commit()
        pass

    def run(self, target_date: str = None):
        """Main execution flow for the Agent."""
        try:
            if not target_date:
                target_date = (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d')
                
            raw_data = self.fetch_daily_performance(target_date)
            normalized = self.normalize_data(raw_data, target_date)
            self.push_to_database(normalized)
            
            logging.info("Agent execution completed successfully. ✅")
            return normalized
            
        except Exception as e:
            logging.error(f"Agent execution failed: {str(e)} ❌")
            raise

if __name__ == "__main__":
    # Example Usage
    # You would typically pass these via environment variables or a secure secret manager
    META_ACCESS_TOKEN = "EAAGm0P...YOUR_TOKEN...XYZ"
    META_AD_ACCOUNT_ID = "123456789012345"
    
    agent = MetaFetcherAgent(access_token=META_ACCESS_TOKEN, ad_account_id=META_AD_ACCOUNT_ID)
    
    # Uncomment to run the agent (Requires real token)
    # results = agent.run()
    # print(json.dumps(results[:1], indent=2))
