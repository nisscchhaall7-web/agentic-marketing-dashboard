-- ==============================================================================
-- UNIVERSAL MARKETING DATABASE SCHEMA (PostgreSQL)
-- Phase 1: Meta Ads & Google Ads
-- ==============================================================================

-- 1. Platforms (Lookup Table)
CREATE TABLE platforms (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL -- 'Meta', 'Google'
);

-- 2. Accounts / Clients
CREATE TABLE accounts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    platform_id INT REFERENCES platforms(id),
    account_id_string VARCHAR(255) NOT NULL, -- The specific Meta/Google account ID
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Campaigns
CREATE TABLE campaigns (
    id SERIAL PRIMARY KEY,
    account_id INT REFERENCES accounts(id),
    campaign_id_string VARCHAR(255) NOT NULL, -- Native ID from platform
    campaign_name VARCHAR(500) NOT NULL,
    status VARCHAR(50), -- 'ACTIVE', 'PAUSED', 'COMPLETED'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (account_id, campaign_id_string)
);

-- 4. Unified Daily Performance Metrics
-- This is the core table where the Normalization Engine pushes standard rows.
CREATE TABLE daily_performance (
    id SERIAL PRIMARY KEY,
    campaign_id INT REFERENCES campaigns(id),
    date DATE NOT NULL,
    
    -- The Universal Metrics
    spend DECIMAL(12, 2) DEFAULT 0.00,
    impressions INT DEFAULT 0,
    clicks INT DEFAULT 0,
    actions INT DEFAULT 0,           -- Standardized: Meta 'Purchases' / Google 'Conversions'
    conversion_value DECIMAL(12, 2) DEFAULT 0.00, -- Standardized: Revenue/Value
    
    -- Native Platform Metrics (Stored as JSON for platform-specific edge cases)
    -- e.g., Meta's 'ThruPlays' or Google's 'Search Impression Share'
    raw_native_metrics JSONB,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (campaign_id, date)
);

-- Indices for fast querying
CREATE INDEX idx_daily_performance_date ON daily_performance(date);
CREATE INDEX idx_daily_performance_campaign ON daily_performance(campaign_id);

