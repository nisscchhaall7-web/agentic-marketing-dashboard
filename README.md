# Agentic Marketing Dashboard

An AI-powered Unified Marketing Command Center. Instead of rigid ETL pipelines, this architecture uses Agentic fetchers to pull data from Meta Ads and Google Ads into a unified Universal Database Schema, allowing for AI-driven insights and cross-platform analysis.

## Features
- **Universal Schema**: Normalize Meta "Purchases" and Google "Conversions" into standardized 'Actions'.
- **Python Agent Fetchers**: Isolated fetch scripts for Google and Meta Ads APIs.
- **Unified DB**: PostgreSQL storage for standardized marketing performance.
- **AI Analyst**: (Planned) Daily insights generation via LLM.

## Setup (Phase 1)
Database schema definitions can be found in `/database/schema.sql`.
