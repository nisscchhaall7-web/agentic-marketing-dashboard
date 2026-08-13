from datetime import datetime, date
from sqlalchemy.orm import Session
from . import models


def _as_date(value):
    if isinstance(value, date):
        return value
    return datetime.strptime(value, "%Y-%m-%d").date()


def get_or_create_brand(db: Session, name: str) -> models.Brand:
    brand = db.query(models.Brand).filter(models.Brand.name == name).first()
    if brand:
        return brand
    brand = models.Brand(name=name)
    db.add(brand)
    db.commit()
    db.refresh(brand)
    return brand


def get_or_create_platform(db: Session, name: str) -> models.Platform:
    platform = db.query(models.Platform).filter(models.Platform.name == name).first()
    if platform:
        return platform
    platform = models.Platform(name=name)
    db.add(platform)
    db.commit()
    db.refresh(platform)
    return platform


def get_or_create_account(db: Session, brand_id: int, platform_id: int, account_id_string: str) -> models.Account:
    account = db.query(models.Account).filter(
        models.Account.platform_id == platform_id,
        models.Account.account_id_string == account_id_string,
    ).first()
    if account:
        return account
    account = models.Account(
        brand_id=brand_id,
        platform_id=platform_id,
        account_id_string=account_id_string,
        name=account_id_string,
    )
    db.add(account)
    db.commit()
    db.refresh(account)
    return account


def get_or_create_campaign(db: Session, brand_id: int, account_id: int, campaign_id_string: str, campaign_name: str) -> models.Campaign:
    campaign = db.query(models.Campaign).filter(
        models.Campaign.account_id == account_id,
        models.Campaign.campaign_id_string == campaign_id_string,
    ).first()
    if campaign:
        if campaign_name and campaign.campaign_name != campaign_name:
            campaign.campaign_name = campaign_name
            db.commit()
            db.refresh(campaign)
        return campaign
    campaign = models.Campaign(
        brand_id=brand_id,
        account_id=account_id,
        campaign_id_string=campaign_id_string,
        campaign_name=campaign_name,
    )
    db.add(campaign)
    db.commit()
    db.refresh(campaign)
    return campaign


def upsert_daily_performance(db: Session, campaign_id: int, record: dict) -> models.DailyPerformance:
    record_date = _as_date(record["date"])
    row = db.query(models.DailyPerformance).filter(
        models.DailyPerformance.campaign_id == campaign_id,
        models.DailyPerformance.date == record_date,
    ).first()

    metric_fields = {
        "spend": record.get("spend", 0.0),
        "impressions": record.get("impressions", 0),
        "reach": record.get("reach", 0),
        "clicks": record.get("clicks", 0),
        "views": record.get("views", 0),
        "actions": record.get("actions", 0),
        "conversion_value": record.get("conversion_value", 0.0),
        "add_to_cart": record.get("add_to_cart", 0),
        "add_to_cart_value": record.get("add_to_cart_value", 0.0),
        "add_payment_info": record.get("add_payment_info", 0),
        "engagement": record.get("engagement", 0),
        "journey_landing": record.get("journey_landing", 0),
        "journey_product": record.get("journey_product", 0),
        "journey_checkout": record.get("journey_checkout", 0),
        "journey_purchase": record.get("journey_purchase", 0),
        "raw_native_metrics": record.get("raw_native_metrics"),
    }

    if row:
        for key, value in metric_fields.items():
            setattr(row, key, value)
    else:
        row = models.DailyPerformance(campaign_id=campaign_id, date=record_date, **metric_fields)
        db.add(row)

    db.commit()
    db.refresh(row)
    return row


def resolve_and_insert(db: Session, records: list, brand_name: str, platform_name: str, account_id_string: str) -> int:
    """Maps normalized fetcher records (platform, campaign_id_string, campaign_name, date, metrics)
    into brand/account/campaign rows, then upserts the daily performance row for each. Returns rows written."""
    if not records:
        return 0

    brand = get_or_create_brand(db, brand_name)
    platform = get_or_create_platform(db, platform_name)
    account = get_or_create_account(db, brand.id, platform.id, account_id_string)

    count = 0
    for record in records:
        campaign = get_or_create_campaign(
            db,
            brand_id=brand.id,
            account_id=account.id,
            campaign_id_string=record["campaign_id_string"],
            campaign_name=record.get("campaign_name") or record["campaign_id_string"],
        )
        upsert_daily_performance(db, campaign.id, record)
        count += 1

    return count
