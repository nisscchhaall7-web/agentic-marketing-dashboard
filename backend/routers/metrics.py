from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Optional

from .. import schemas, crud, database

router = APIRouter(prefix="/api/v1/metrics", tags=["Metrics"])

@router.get("/", response_model=List[schemas.PerformanceMetrics])
def get_metrics(platform: Optional[str] = None, db: Session = Depends(database.get_db)):
    """
    Endpoint for the frontend to fetch normalized Universal Database metrics.
    """
    return crud.get_performance_metrics(db, platform=platform)


@router.get("/dashboard")
def get_dashboard_metrics(
    brand_name: str,
    stage: Optional[str] = "Conversion",
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(database.get_db),
):
    from sqlalchemy import text

    # Query now includes impressions, reach, views, clicks for full metric filtering
    query = text('''
        SELECT
            p.date,
            c.campaign_name,
            plt.name as platform_name,
            p.spend, p.actions, p.sessions, p.page_views, p.bounce_rate,
            p.journey_landing, p.journey_product, p.journey_checkout, p.journey_purchase,
            p.impressions, p.reach, p.views, p.clicks,
            p.add_to_cart, p.add_payment_info, p.engagement, p.conversion_value
        FROM daily_performance p
        JOIN campaigns c ON p.campaign_id = c.id
        JOIN accounts a ON c.account_id = a.id
        JOIN platforms plt ON a.platform_id = plt.id
        JOIN brands b ON c.brand_id = b.id
        WHERE b.name = :brand_name
        AND plt.name IN ('Google', 'Meta', 'YouTube')
        AND (c.utm_campaign LIKE :stage_filter OR c.utm_campaign IS NULL)
        AND (:start_date IS NULL OR p.date >= :start_date)
        AND (:end_date IS NULL OR p.date <= :end_date)
        ORDER BY p.date ASC
    ''')

    results = db.execute(query, {
        "brand_name": brand_name,
        "stage_filter": f"%{stage.lower()}%",
        "start_date": start_date,
        "end_date": end_date,
    }).fetchall()

    # Aggregate by date
    daily_aggs = {}
    for row in results:
        d = row[0] # date
        plat = row[2] # platform_name

        if d not in daily_aggs:
            daily_aggs[d] = {
                "name": str(d),
                "GoogleSpend": 0, "GoogleConversions": 0, "GoogleImpressions": 0, "GoogleReach": 0, "GoogleViews": 0, "GoogleClicks": 0,
                "GoogleAddToCart": 0, "GoogleAddPaymentInfo": 0, "GoogleEngagement": 0, "GoogleConversionValue": 0,
                "MetaSpend": 0, "MetaConversions": 0, "MetaImpressions": 0, "MetaReach": 0, "MetaViews": 0, "MetaClicks": 0,
                "MetaAddToCart": 0, "MetaAddPaymentInfo": 0, "MetaEngagement": 0, "MetaConversionValue": 0,
                "YouTubeSpend": 0, "YouTubeConversions": 0, "YouTubeImpressions": 0, "YouTubeReach": 0, "YouTubeViews": 0, "YouTubeClicks": 0,
                "YouTubeAddToCart": 0, "YouTubeAddPaymentInfo": 0, "YouTubeEngagement": 0, "YouTubeConversionValue": 0,
                "WebSessions": 0, "WebPageViews": 0, "WebBounceRate": 0,
                "journey_landing": 0, "journey_product": 0, "journey_checkout": 0, "journey_purchase": 0,
                "_count": 0
            }

        daily_aggs[d][f"{plat}Spend"] += (row[3] or 0)
        daily_aggs[d][f"{plat}Conversions"] += (row[4] or 0)

        daily_aggs[d]["WebSessions"] += (row[5] or 0)
        daily_aggs[d]["WebPageViews"] += (row[6] or 0)
        daily_aggs[d]["WebBounceRate"] += row[7] or 0

        daily_aggs[d]["journey_landing"] += (row[8] or 0)
        daily_aggs[d]["journey_product"] += (row[9] or 0)
        daily_aggs[d]["journey_checkout"] += (row[10] or 0)
        daily_aggs[d]["journey_purchase"] += (row[11] or 0)

        daily_aggs[d][f"{plat}Impressions"] += (row[12] or 0)
        daily_aggs[d][f"{plat}Reach"] += (row[13] or 0)
        daily_aggs[d][f"{plat}Views"] += (row[14] or 0)
        daily_aggs[d][f"{plat}Clicks"] += (row[15] or 0)

        daily_aggs[d][f"{plat}AddToCart"] += (row[16] or 0)
        daily_aggs[d][f"{plat}AddPaymentInfo"] += (row[17] or 0)
        daily_aggs[d][f"{plat}Engagement"] += (row[18] or 0)
        daily_aggs[d][f"{plat}ConversionValue"] += (row[19] or 0)

        daily_aggs[d]["_count"] += 1

    # Average out the bounce rate
    out = []
    for d in sorted(daily_aggs.keys()):
        agg = daily_aggs[d]
        if agg["_count"] > 0:
            agg["WebBounceRate"] = round(agg["WebBounceRate"] / agg["_count"], 1)
        del agg["_count"]
        out.append(agg)

    return out


@router.get("/verified-revenue")
def get_verified_revenue(
    brand_name: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(database.get_db),
):
    """
    Verified sales revenue by marketplace channel, sourced from EasyEcom order
    data (real orders, not ad-platform-reported conversions). Separate from
    /dashboard because this isn't ad-campaign performance - EasyEcom has no
    concept of spend/impressions/clicks, just real orders per channel per day.
    """
    from sqlalchemy import text

    query = text('''
        SELECT
            p.date,
            c.campaign_name as channel,
            p.actions as order_count,
            p.conversion_value as revenue
        FROM daily_performance p
        JOIN campaigns c ON p.campaign_id = c.id
        JOIN accounts a ON c.account_id = a.id
        JOIN platforms plt ON a.platform_id = plt.id
        JOIN brands b ON c.brand_id = b.id
        WHERE b.name = :brand_name
        AND plt.name = 'EasyEcom'
        AND (:start_date IS NULL OR p.date >= :start_date)
        AND (:end_date IS NULL OR p.date <= :end_date)
        ORDER BY p.date ASC
    ''')

    results = db.execute(query, {
        "brand_name": brand_name,
        "start_date": start_date,
        "end_date": end_date,
    }).fetchall()

    daily_aggs = {}
    channel_totals = {}
    for row in results:
        d, channel, order_count, revenue = str(row[0]), row[1], row[2] or 0, row[3] or 0.0

        if d not in daily_aggs:
            daily_aggs[d] = {"date": d, "total_orders": 0, "total_revenue": 0.0, "channels": {}}
        daily_aggs[d]["total_orders"] += order_count
        daily_aggs[d]["total_revenue"] += revenue
        daily_aggs[d]["channels"][channel] = {"orders": order_count, "revenue": round(revenue, 2)}

        if channel not in channel_totals:
            channel_totals[channel] = {"orders": 0, "revenue": 0.0}
        channel_totals[channel]["orders"] += order_count
        channel_totals[channel]["revenue"] += revenue

    daily = []
    for d in sorted(daily_aggs.keys()):
        agg = daily_aggs[d]
        agg["total_revenue"] = round(agg["total_revenue"], 2)
        daily.append(agg)

    by_channel = [
        {"channel": ch, "orders": v["orders"], "revenue": round(v["revenue"], 2)}
        for ch, v in sorted(channel_totals.items(), key=lambda x: -x[1]["revenue"])
    ]

    return {"daily": daily, "by_channel": by_channel}
