from sqlalchemy.orm import Session
from datetime import date, timedelta
from . import models, schemas
import json

# Brands
def get_brands(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Brand).offset(skip).limit(limit).all()

def create_brand(db: Session, brand: schemas.BrandCreate):
    db_brand = models.Brand(name=brand.name)
    db.add(db_brand)
    db.commit()
    db.refresh(db_brand)
    return db_brand

# PPMs
def get_ppms(db: Session, brand_id: int = None):
    query = db.query(models.PPM)
    if brand_id:
        query = query.filter(models.PPM.brand_id == brand_id)
    return query.all()

def create_ppm(db: Session, ppm: schemas.PPMCreate):
    db_ppm = models.PPM(**ppm.dict())
    db.add(db_ppm)
    db.commit()
    db.refresh(db_ppm)
    return db_ppm

# Weekly Analysis (AI / Logic Mock)
def get_weekly_analyses(db: Session, brand_id: int):
    return db.query(models.WeeklyAnalysis).filter(models.WeeklyAnalysis.brand_id == brand_id).all()

def generate_weekly_analysis(db: Session, brand_id: int, ppm_id: int):
    """
    Mock function to represent the 'Analysis' layer logic.
    In real usage, this would fetch data from daily_performance, sum it up, compare to PPM targets, and ask an LLM.
    """
    ppm = db.query(models.PPM).filter(models.PPM.id == ppm_id).first()
    if not ppm:
        return None

    # Dummy comparison logic
    achieved_kpi_value = ppm.kpi_target * 0.88 # Let's say it missed target by 12%
    kpi_met = False

    suggestion = f"Meta Ads underperforming against {ppm.objective} KPI target by 12%. Reallocating budget to generic ad copies recommended."

    db_analysis = models.WeeklyAnalysis(
        brand_id=brand_id,
        ppm_id=ppm_id,
        start_date=date.today() - timedelta(days=7),
        end_date=date.today(),
        metrics_summary_json={"achieved": achieved_kpi_value, "target": ppm.kpi_target, "metric": ppm.kpi_metric},
        kpi_met=kpi_met,
        suggestions_text=suggestion
    )
    db.add(db_analysis)
    db.commit()
    db.refresh(db_analysis)
    return db_analysis


def get_performance_metrics(db: Session, platform: str = None):
    query = db.query(models.DailyPerformance, models.Campaign).join(
        models.Campaign, models.DailyPerformance.campaign_id == models.Campaign.id
    )
    if platform:
        query = query.join(models.Account, models.Campaign.account_id == models.Account.id).join(
            models.Platform, models.Account.platform_id == models.Platform.id
        ).filter(models.Platform.name == platform)

    results = []
    for perf, campaign in query.all():
        spend = perf.spend or 0.0
        actions = perf.actions or 0
        conversion_value = perf.conversion_value or 0.0
        results.append({
            "campaign_name": campaign.campaign_name,
            "date": perf.date,
            "spend": spend,
            "impressions": perf.impressions or 0,
            "reach": perf.reach or 0,
            "views": perf.views or 0,
            "clicks": perf.clicks or 0,
            "actions": actions,
            "conversion_value": conversion_value,
            "add_to_cart": perf.add_to_cart or 0,
            "add_to_cart_value": perf.add_to_cart_value or 0.0,
            "add_payment_info": perf.add_payment_info or 0,
            "engagement": perf.engagement or 0,
            "sessions": perf.sessions or 0,
            "page_views": perf.page_views or 0,
            "bounce_rate": perf.bounce_rate or 0.0,
            "journey_landing": perf.journey_landing or 0,
            "journey_product": perf.journey_product or 0,
            "journey_checkout": perf.journey_checkout or 0,
            "journey_purchase": perf.journey_purchase or 0,
            "roas": (conversion_value / spend) if spend else 0.0,
            "cpa": (spend / actions) if actions else 0.0,
            "raw_native_metrics": perf.raw_native_metrics,
        })
    return results
