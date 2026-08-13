from fastapi import APIRouter
from datetime import date

router = APIRouter(prefix="/api/v1/insights", tags=["Insights"])

@router.get("/")
def get_daily_insights():
    """
    Endpoint serving the AI Analyst Agent's daily brief to the frontend.
    Currently mocked until the LLM is wired up.
    """
    # TODO: Connect to LLM for dynamic insights generation based on daily_performance data
    return {
        "date": str(date.today()),
        "insight_html": "<ul><li><strong style='color:green'>Google Ads</strong> crushed it yesterday with a 18.75x ROAS on Brand Search.</li><li><strong style='color:red'>Meta</strong> retargeting CPA spiked to $33.34. Suggest refreshing creatives.</li></ul>"
    }
