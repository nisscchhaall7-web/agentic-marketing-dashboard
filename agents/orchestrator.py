import logging
from datetime import datetime, timedelta
from agents.google_agent import GoogleFetcherAgent
from agents.meta_agent import MetaFetcherAgent
from agents.easyecom_agent import EasyEcomFetcherAgent
from backend.config import settings

logger = logging.getLogger("Orchestrator")

def get_configured_agents():
    """Instantiate agents that have correct configuration."""
    agents = []
    
    if settings.GOOGLE_CUSTOMER_ID:
        try:
            # Requires google-ads.yaml in root folder
            agents.append(GoogleFetcherAgent(customer_id=settings.GOOGLE_CUSTOMER_ID))
        except Exception as e:
            logger.warning(f"Google Agent skipping init: {e}")

    if settings.META_ACCESS_TOKEN and settings.META_AD_ACCOUNT_ID:
        agents.append(MetaFetcherAgent(
            access_token=settings.META_ACCESS_TOKEN,
            ad_account_id=settings.META_AD_ACCOUNT_ID
        ))

    if all([settings.EASYECOM_API_KEY, settings.EASYECOM_EMAIL, settings.EASYECOM_PASSWORD, settings.EASYECOM_LOCATION_KEY]):
        try:
            agents.append(EasyEcomFetcherAgent(
                api_key=settings.EASYECOM_API_KEY,
                email=settings.EASYECOM_EMAIL,
                password=settings.EASYECOM_PASSWORD,
                location_key=settings.EASYECOM_LOCATION_KEY,
            ))
        except Exception as e:
            logger.warning(f"EasyEcom Agent skipping init: {e}")

    return agents

def run_all_agents(target_date: str = None, days: int = 1):
    """
    Executes all active agents to pull data into Universal DB.
    If target_date is set, runs for that single date. Otherwise backfills
    the last `days` days (ending yesterday).
    """
    logger.info("Starting global agent orchestration sync... 🚀")
    agents = get_configured_agents()

    if not agents:
        logger.warning("No fetcher agents are configured. Check your .env setup.")
        return

    if target_date:
        dates = [target_date]
    else:
        dates = [
            (datetime.now() - timedelta(days=i + 1)).strftime('%Y-%m-%d')
            for i in range(days)
        ]

    for date_str in dates:
        for agent in agents:
            try:
                agent.run(target_date=date_str)
            except Exception as e:
                logger.error(f"Failure running {agent.platform_name} Agent for {date_str}: {e}")

    logger.info("Global agent orchestration complete! 🎉")

if __name__ == "__main__":
    run_all_agents()
