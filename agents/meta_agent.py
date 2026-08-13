import requests
import json
from typing import List, Dict, Any
from .base_agent import BaseFetcherAgent

class MetaFetcherAgent(BaseFetcherAgent):
    """
    Sub-Agent responsible for authenticating with Meta Graph API,
    fetching raw campaign performance, and normalizing it to the Universal Schema.
    """
    
    API_VERSION = "v19.0"
    
    def __init__(self, access_token: str, ad_account_id: str):
        super().__init__(platform_name="Meta")
        self.access_token = access_token
        self.ad_account_id = ad_account_id
        if not self.ad_account_id.startswith('act_'):
            self.ad_account_id = f"act_{self.ad_account_id}"
        self.account_id_string = self.ad_account_id

        self.base_url = f"https://graph.facebook.com/{self.API_VERSION}/{self.ad_account_id}/insights"

    def fetch_daily_performance(self, target_date: str) -> List[Any]:
        self.logger.info(f"Fetching Meta Ads performance for date: {target_date}")
        
        params = {
            'access_token': self.access_token,
            'level': 'campaign',
            'time_range': json.dumps({'since': target_date, 'until': target_date}),
            'fields': 'campaign_id,campaign_name,spend,impressions,reach,clicks,actions,action_values,cpc,cpm,ctr,frequency'
        }
        
        response = requests.get(self.base_url, params=params)
        
        if response.status_code != 200:
            self.logger.error(f"Meta API Error: {response.text}")
            raise Exception(f"Failed to fetch data: {response.status_code}")
            
        data = response.json().get('data', [])
        self.logger.info(f"Successfully fetched {len(data)} active campaigns from Meta.")
        return data

    def normalize_data(self, raw_data: List[Any], target_date: str) -> List[Dict[str, Any]]:
        normalized_records = []

        for row in raw_data:
            campaign_id = row.get('campaign_id')
            campaign_name = row.get('campaign_name')

            spend = float(row.get('spend', 0.0))
            impressions = int(row.get('impressions', 0))
            reach = int(row.get('reach', 0))
            clicks = int(row.get('clicks', 0))

            # Flatten the full actions/action_values arrays so nothing Meta sends is lost,
            # even action types we don't promote to a dedicated column below.
            all_actions = {a.get('action_type'): int(float(a.get('value', 0))) for a in row.get('actions', [])}
            all_action_values = {a.get('action_type'): float(a.get('value', 0.0)) for a in row.get('action_values', [])}

            standard_actions = all_actions.get('purchase', 0)
            conversion_value = all_action_values.get('purchase', 0.0)

            journey_landing = all_actions.get('landing_page_view', 0)
            journey_product = all_actions.get('view_content', 0)
            journey_checkout = all_actions.get('initiate_checkout', 0)
            journey_purchase = standard_actions

            add_to_cart = all_actions.get('add_to_cart', 0)
            add_to_cart_value = all_action_values.get('add_to_cart', 0.0)
            add_payment_info = all_actions.get('add_payment_info', 0)
            video_views = all_actions.get('video_view', 0)
            engagement = all_actions.get('post_engagement', 0)

            # Pack everything else Meta returns into the JSONB payload, fully captured.
            raw_native_metrics = {
                'platform_cpc': row.get('cpc'),
                'platform_cpm': row.get('cpm'),
                'platform_ctr': row.get('ctr'),
                'platform_frequency': row.get('frequency'),
                'all_actions': all_actions,
                'all_action_values': all_action_values,
            }

            normalized_records.append({
                'platform': self.platform_name,
                'campaign_id_string': campaign_id,
                'campaign_name': campaign_name,
                'date': target_date,
                'spend': spend,
                'impressions': impressions,
                'reach': reach,
                'clicks': clicks,
                'views': video_views,
                'actions': standard_actions,
                'conversion_value': conversion_value,
                'add_to_cart': add_to_cart,
                'add_to_cart_value': add_to_cart_value,
                'add_payment_info': add_payment_info,
                'engagement': engagement,
                'journey_landing': journey_landing,
                'journey_product': journey_product,
                'journey_checkout': journey_checkout,
                'journey_purchase': journey_purchase,
                'raw_native_metrics': raw_native_metrics
            })

        self.logger.info(f"Normalized {len(normalized_records)} records to Universal Schema.")
        return normalized_records
