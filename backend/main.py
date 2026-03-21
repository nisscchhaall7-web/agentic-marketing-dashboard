from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import date
import sqlite3 # Using sqlite for mock DB initially
import uvicorn

app = FastAPI(title="Agentic Dashboard API", version="1.0.0")

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict to frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dummy/Mock DB connection function (Will be replaced with Postgres + SQLAlchemy)
def get_db():
    conn = sqlite3.connect(':memory:')
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE daily_performance (
            platform TEXT,
            campaign_name TEXT,
            date TEXT,
            spend REAL,
            impressions INTEGER,
            clicks INTEGER,
            actions INTEGER,
            conversion_value REAL
        )
    ''')
    
    # Insert Mock Normalized Data
    cursor.execute("INSERT INTO daily_performance VALUES ('Meta', 'Retargeting_V1', '2026-03-20', 1500.50, 45000, 1200, 45, 8500.00)")
    cursor.execute("INSERT INTO daily_performance VALUES ('Google', 'Brand_Search', '2026-03-20', 800.00, 15000, 3000, 150, 15000.00)")
    conn.commit()
    return conn

# Response Models
class PerformanceMetrics(BaseModel):
    platform: str
    campaign_name: str
    date: date
    spend: float
    impressions: int
    clicks: int
    actions: int
    conversion_value: float
    roas: float
    cpa: float

@app.get("/api/v1/metrics", response_model=List[PerformanceMetrics])
def get_metrics(platform: Optional[str] = None):
    """
    Endpoint for the Next.js Frontend to fetch normalized Universal Database metrics.
    """
    conn = get_db()
    cursor = conn.cursor()
    
    query = "SELECT platform, campaign_name, date, spend, impressions, clicks, actions, conversion_value FROM daily_performance"
    params = ()
    if platform:
        query += " WHERE platform = ?"
        params = (platform,)
        
    cursor.execute(query, params)
    rows = cursor.fetchall()
    
    results = []
    for row in rows:
        spend = row[3]
        actions = row[6]
        conversion_value = row[7]
        
        # Calculate Universal KPI
        cpa = round(spend / actions, 2) if actions > 0 else 0
        roas = round(conversion_value / spend, 2) if spend > 0 else 0
        
        results.append(PerformanceMetrics(
            platform=row[0],
            campaign_name=row[1],
            date=row[2],
            spend=spend,
            impressions=row[4],
            clicks=row[5],
            actions=actions,
            conversion_value=conversion_value,
            roas=roas,
            cpa=cpa
        ))
    
    return results

@app.get("/api/v1/insights")
def get_daily_insights():
    """
    Endpoint serving the AI Analyst Agent's daily brief to the frontend.
    """
    return {
        "date": "2026-03-20",
        "insight_html": "<ul><li><strong style='color:green'>Google Ads</strong> crushed it yesterday with a 18.75x ROAS on Brand Search.</li><li><strong style='color:red'>Meta</strong> retargeting CPA spiked to $33.34. Suggest refreshing creatives.</li></ul>"
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
