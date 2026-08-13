import time
from collections import defaultdict
from typing import Any, Dict, List

import requests

from .base_agent import BaseFetcherAgent


class EasyEcomFetcherAgent(BaseFetcherAgent):
    """
    Sub-Agent responsible for authenticating with the EasyEcom API and fetching
    real order/revenue data, verified across marketplace channels (Amazon, Myntra,
    Flipkart, Website, etc). EasyEcom has no concept of ad "campaigns" - each
    marketplace channel is normalized into a synthetic campaign so it can sit in
    the same Universal Schema as the ad-platform agents.
    """

    BASE_URL = "https://api.easyecom.io"

    def __init__(self, api_key: str, email: str, password: str, location_key: str):
        super().__init__(platform_name="EasyEcom")
        self.api_key = api_key
        self.email = email
        self.password = password
        self.location_key = location_key
        self.account_id_string = location_key

        self.jwt_token = None
        self.jwt_expires_at = 0
        self._authenticate()

    def _authenticate(self):
        try:
            response = requests.post(
                f"{self.BASE_URL}/access/token",
                headers={"x-api-key": self.api_key, "Content-Type": "application/json"},
                json={
                    "email": self.email,
                    "password": self.password,
                    "location_key": self.location_key,
                },
            )
            response.raise_for_status()
            payload = response.json()["data"]["token"]
            self.jwt_token = payload["jwt_token"]
            self.jwt_expires_at = time.time() + payload["expires_in"]
            self.logger.info("EasyEcom authentication successful.")
        except Exception as e:
            self.logger.error(f"Failed to authenticate with EasyEcom: {e}")
            self.jwt_token = None

    def _auth_headers(self):
        if time.time() >= self.jwt_expires_at:
            self._authenticate()
        return {"x-api-key": self.api_key, "Authorization": f"Bearer {self.jwt_token}"}

    def fetch_daily_performance(self, target_date: str) -> List[Any]:
        self.logger.info(f"Fetching EasyEcom orders for date: {target_date}")

        if not self.jwt_token:
            self.logger.error("EasyEcom client not authenticated. Returning empty list.")
            return []

        orders: List[Any] = []
        url = f"{self.BASE_URL}/orders/V2/getAllOrders"
        params = {
            "start_date": f"{target_date} 00:00:00",
            "end_date": f"{target_date} 23:59:59",
        }

        try:
            while url:
                response = requests.get(url, headers=self._auth_headers(), params=params)
                response.raise_for_status()
                payload = response.json()

                if payload.get("code") not in (200, None) and "data" not in payload:
                    self.logger.error(f"EasyEcom API error: {payload}")
                    break

                data = payload.get("data", {})
                orders.extend(data.get("orders", []))

                next_url = data.get("nextUrl")
                url = f"{self.BASE_URL}{next_url}" if next_url else None
                params = None  # cursor is already embedded in next_url

            self.logger.info(f"Successfully fetched {len(orders)} orders from EasyEcom.")
            return orders
        except Exception as e:
            self.logger.error(f"EasyEcom API Request failed: {e}")
            raise

    def normalize_data(self, raw_data: List[Any], target_date: str) -> List[Dict[str, Any]]:
        by_channel = defaultdict(lambda: {"order_count": 0, "revenue": 0.0})

        for order in raw_data:
            channel = order.get("marketplace") or "Unknown"
            by_channel[channel]["order_count"] += 1
            by_channel[channel]["revenue"] += float(order.get("total_amount") or 0.0)

        normalized_records = []
        for channel, agg in by_channel.items():
            normalized_records.append({
                "platform": self.platform_name,
                "campaign_id_string": channel,
                "campaign_name": channel,
                "date": target_date,
                "spend": 0.0,
                "impressions": 0,
                "reach": 0,
                "clicks": 0,
                "actions": agg["order_count"],
                "conversion_value": round(agg["revenue"], 2),
                "raw_native_metrics": {
                    "verified_order_count": agg["order_count"],
                    "verified_revenue": round(agg["revenue"], 2),
                },
            })

        self.logger.info(f"Normalized {len(normalized_records)} channel records to Universal Schema.")
        return normalized_records
