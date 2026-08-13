-- ==============================================================================
-- UNIVERSAL MARKETING DATABASE SCHEMA (PostgreSQL)
-- Phase 2: Brand & PPM Architecture
-- ==============================================================================

-- 1. Brands
CREATE TABLE brands (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Platforms (Lookup Table)
CREATE TABLE platforms (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL -- 'Meta', 'Google', 'YouTube'
);

-- 3. Platform Planned Matrix (PPM)
CREATE TABLE ppms (
    id SERIAL PRIMARY KEY,
    brand_id INT REFERENCES brands(id) ON DELETE CASCADE,
    platform_id INT REFERENCES platforms(id),
    objective VARCHAR(255),
    kpi_metric VARCHAR(255),
    kpi_target DECIMAL(12, 2),
    funnel_stage VARCHAR(100),
    utm_source VARCHAR(255),
    utm_medium VARCHAR(255),
    utm_campaign VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Accounts / Clients
CREATE TABLE accounts (
    id SERIAL PRIMARY KEY,
    brand_id INT REFERENCES brands(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    platform_id INT REFERENCES platforms(id),
    account_id_string VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Campaigns
CREATE TABLE campaigns (
    id SERIAL PRIMARY KEY,
    brand_id INT REFERENCES brands(id) ON DELETE CASCADE,
    account_id INT REFERENCES accounts(id),
    campaign_id_string VARCHAR(255) NOT NULL,
    campaign_name VARCHAR(500) NOT NULL,
    status VARCHAR(50),
    utm_source VARCHAR(255),
    utm_medium VARCHAR(255),
    utm_campaign VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (account_id, campaign_id_string)
);

-- 6. Unified Daily Performance Metrics
CREATE TABLE daily_performance (
    id SERIAL PRIMARY KEY,
    campaign_id INT REFERENCES campaigns(id),
    date DATE NOT NULL,
    
    spend DECIMAL(12, 2) DEFAULT 0.00,
    impressions INT DEFAULT 0,
    reach INT DEFAULT 0,
    views INT DEFAULT 0,
    clicks INT DEFAULT 0,
    actions INT DEFAULT 0,
    conversion_value DECIMAL(12, 2) DEFAULT 0.00,

    add_to_cart INT DEFAULT 0,
    add_to_cart_value DECIMAL(12, 2) DEFAULT 0.00,
    add_payment_info INT DEFAULT 0,
    engagement INT DEFAULT 0,

    sessions INT DEFAULT 0,
    page_views INT DEFAULT 0,
    bounce_rate DECIMAL(5, 2) DEFAULT 0.00,
    
    journey_landing INT DEFAULT 0,
    journey_product INT DEFAULT 0,
    journey_checkout INT DEFAULT 0,
    journey_purchase INT DEFAULT 0,

    
    raw_native_metrics JSONB,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (campaign_id, date)
);

-- 7. Weekly Analysis
CREATE TABLE weekly_analysis (
    id SERIAL PRIMARY KEY,
    brand_id INT REFERENCES brands(id) ON DELETE CASCADE,
    ppm_id INT REFERENCES ppms(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    metrics_summary_json JSONB,
    kpi_met BOOLEAN,
    suggestions_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indices
CREATE INDEX idx_daily_performance_date ON daily_performance(date);
CREATE INDEX idx_daily_performance_campaign ON daily_performance(campaign_id);
CREATE INDEX idx_campaigns_brand ON campaigns(brand_id);
CREATE INDEX idx_ppms_brand ON ppms(brand_id);
