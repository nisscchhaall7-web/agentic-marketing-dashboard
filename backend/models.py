from sqlalchemy import Column, Integer, String, Float, Date, JSON, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from .database import Base

class Brand(Base):
    __tablename__ = "brands"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    
    ppms = relationship("PPM", back_populates="brand")
    campaigns = relationship("Campaign", back_populates="brand")
    weekly_analyses = relationship("WeeklyAnalysis", back_populates="brand")

class Platform(Base):
    __tablename__ = "platforms"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)

class PPM(Base):
    __tablename__ = "ppms"
    id = Column(Integer, primary_key=True, index=True)
    brand_id = Column(Integer, ForeignKey("brands.id"))
    platform_id = Column(Integer, ForeignKey("platforms.id"))
    
    objective = Column(String)
    kpi_metric = Column(String)
    kpi_target = Column(Float)
    funnel_stage = Column(String)
    
    utm_source = Column(String)
    utm_medium = Column(String)
    utm_campaign = Column(String)

    brand = relationship("Brand", back_populates="ppms")
    weekly_analyses = relationship("WeeklyAnalysis", back_populates="ppm")

class Account(Base):
    __tablename__ = "accounts"
    id = Column(Integer, primary_key=True, index=True)
    brand_id = Column(Integer, ForeignKey("brands.id"))
    name = Column(String, nullable=False)
    platform_id = Column(Integer, ForeignKey("platforms.id"))
    account_id_string = Column(String, nullable=False)

    campaigns = relationship("Campaign", back_populates="account")

class Campaign(Base):
    __tablename__ = "campaigns"
    id = Column(Integer, primary_key=True, index=True)
    brand_id = Column(Integer, ForeignKey("brands.id"))
    account_id = Column(Integer, ForeignKey("accounts.id"))
    campaign_id_string = Column(String, nullable=False)
    campaign_name = Column(String, nullable=False)
    status = Column(String)
    
    utm_source = Column(String)
    utm_medium = Column(String)
    utm_campaign = Column(String)

    brand = relationship("Brand", back_populates="campaigns")
    account = relationship("Account", back_populates="campaigns")
    daily_performances = relationship("DailyPerformance", back_populates="campaign")

class DailyPerformance(Base):
    __tablename__ = "daily_performance"
    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(Integer, ForeignKey("campaigns.id"))
    date = Column(Date, index=True, nullable=False)
    
    spend = Column(Float, default=0.0)
    impressions = Column(Integer, default=0)
    reach = Column(Integer, default=0)
    views = Column(Integer, default=0)
    clicks = Column(Integer, default=0)
    actions = Column(Integer, default=0)
    conversion_value = Column(Float, default=0.0)

    add_to_cart = Column(Integer, default=0)
    add_to_cart_value = Column(Float, default=0.0)
    add_payment_info = Column(Integer, default=0)
    engagement = Column(Integer, default=0)

    sessions = Column(Integer, default=0)
    page_views = Column(Integer, default=0)
    bounce_rate = Column(Float, default=0.0)
    
    journey_landing = Column(Integer, default=0)
    journey_product = Column(Integer, default=0)
    journey_checkout = Column(Integer, default=0)
    journey_purchase = Column(Integer, default=0)

    
    raw_native_metrics = Column(JSON, nullable=True)

    campaign = relationship("Campaign", back_populates="daily_performances")

class WeeklyAnalysis(Base):
    __tablename__ = "weekly_analysis"
    id = Column(Integer, primary_key=True, index=True)
    brand_id = Column(Integer, ForeignKey("brands.id"))
    ppm_id = Column(Integer, ForeignKey("ppms.id"))
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    
    metrics_summary_json = Column(JSON)
    kpi_met = Column(Boolean)
    suggestions_text = Column(Text)

    brand = relationship("Brand", back_populates="weekly_analyses")
    ppm = relationship("PPM", back_populates="weekly_analyses")
