from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import date

# --- Brand Schemas ---
class BrandBase(BaseModel):
    name: str

class BrandCreate(BrandBase):
    pass

class Brand(BrandBase):
    id: int
    class Config:
        from_attributes = True

# --- PPM Schemas ---
class PPMBase(BaseModel):
    brand_id: int
    platform_id: Optional[int] = None
    objective: Optional[str] = None
    kpi_metric: Optional[str] = None
    kpi_target: Optional[float] = None
    funnel_stage: Optional[str] = None
    utm_source: Optional[str] = None
    utm_medium: Optional[str] = None
    utm_campaign: Optional[str] = None

class PPMCreate(PPMBase):
    pass

class PPM(PPMBase):
    id: int
    class Config:
        from_attributes = True

# --- Weekly Analysis Schemas ---
class WeeklyAnalysisBase(BaseModel):
    brand_id: int
    ppm_id: int
    start_date: date
    end_date: date
    metrics_summary_json: Optional[Dict[str, Any]] = None
    kpi_met: Optional[bool] = None
    suggestions_text: Optional[str] = None

class WeeklyAnalysisCreate(WeeklyAnalysisBase):
    pass

class WeeklyAnalysis(WeeklyAnalysisBase):
    id: int
    class Config:
        from_attributes = True

# --- Legacy/Updated Performance Schemas ---
class PerformanceMetrics(BaseModel):
    campaign_name: str
    date: date
    spend: float
    impressions: int
    reach: int
    views: int
    clicks: int
    actions: float
    conversion_value: float
    add_to_cart: int
    add_to_cart_value: float
    add_payment_info: int
    engagement: int
    sessions: int
    page_views: int
    bounce_rate: float
    journey_landing: int
    journey_product: int
    journey_checkout: int
    journey_purchase: int

    roas: float
    cpa: float

    raw_native_metrics: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True
