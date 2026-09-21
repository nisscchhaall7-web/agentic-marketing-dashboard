"use client";

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  ComposedChart, AreaChart, Area, Cell, BarChart, Bar
} from 'recharts';
import {
  Activity, Target, Filter, Layers,
  Briefcase, Zap, ArrowRight, MousePointerClick, Globe, UserCheck, Filter as FunnelIcon,
  Eye, Users, Tv, PointerIcon, IndianRupee, ShoppingCart, ChevronDown, Check, X, SlidersHorizontal,
  TrendingDown, ArrowDownRight, Workflow, ShoppingBag, CreditCard, Heart,
  Calendar, RotateCcw, TrendingUp, Gauge
} from 'lucide-react';

const COLORS: Record<string, string> = {
  Google: '#10b981', // Emerald 500
  Meta: '#f59e0b',   // Amber 500
  YouTube: '#ef4444', // Red 500
  Web: '#3b82f6'     // Blue 500
};

const formatCompactNumber = (value: number) => {
  const sign = value < 0 ? '-' : '';
  const abs = Math.abs(value);
  if (abs >= 10000000) return `${sign}${(abs / 10000000).toFixed(1)}Cr`;
  if (abs >= 100000) return `${sign}${(abs / 100000).toFixed(1)}L`;
  if (abs >= 1000) return `${sign}${(abs / 1000).toFixed(0)}k`;
  return `${sign}${abs}`;
};

const CHANNEL_COLOR_PALETTE = [
  '#34d399', '#f59e0b', '#60a5fa', '#f472b6', '#a78bfa',
  '#fb923c', '#22d3ee', '#facc15', '#c084fc', '#fb7185',
];

const BRANDS = [process.env.NEXT_PUBLIC_BRAND_NAME || "Demo Brand"];
const FUNNEL_STAGES = ["Awareness", "Consideration", "Conversion"];

// ─── Metric Definitions ───────────────────────────────────────────────────────
// Each metric has a key (matching backend field suffix), label, icon, color, and category
const METRIC_DEFINITIONS = [
  { key: 'Spend',       label: 'Spend',       icon: IndianRupee,     color: '#a78bfa', category: 'Ad Performance',  unit: '₹',  isPlatformMetric: true },
  { key: 'Impressions', label: 'Impressions', icon: Eye,             color: '#60a5fa', category: 'Ad Performance',  unit: '',   isPlatformMetric: true },
  { key: 'Reach',       label: 'Reach',       icon: Users,           color: '#34d399', category: 'Ad Performance',  unit: '',   isPlatformMetric: true },
  { key: 'Views',       label: 'Views',       icon: Tv,              color: '#fb923c', category: 'Ad Performance',  unit: '',   isPlatformMetric: true },
  { key: 'Clicks',      label: 'Clicks',      icon: PointerIcon,     color: '#f472b6', category: 'Ad Performance',  unit: '',   isPlatformMetric: true },
  { key: 'Conversions', label: 'Conversions', icon: ShoppingCart,    color: '#fbbf24', category: 'Ad Performance',  unit: '',   isPlatformMetric: true },
  { key: 'AddToCart',      label: 'Add to Cart',      icon: ShoppingBag, color: '#22d3ee', category: 'Ad Performance', unit: '', isPlatformMetric: true },
  { key: 'AddPaymentInfo', label: 'Add Payment Info', icon: CreditCard,  color: '#c084fc', category: 'Ad Performance', unit: '', isPlatformMetric: true },
  { key: 'Engagement',     label: 'Engagement',       icon: Heart,       color: '#fb7185', category: 'Ad Performance', unit: '', isPlatformMetric: true },
];

const WEB_METRIC_DEFINITIONS = [
  { key: 'WebSessions',   label: 'Sessions',    icon: Globe,           color: '#3b82f6', category: 'Web Analytics', unit: '' },
  { key: 'WebPageViews',  label: 'Page Views',  icon: Eye,             color: '#818cf8', category: 'Web Analytics', unit: '' },
  { key: 'WebBounceRate', label: 'Bounce Rate', icon: MousePointerClick, color: '#f43f5e', category: 'Web Analytics', unit: '%' },
];

const PLATFORMS = ['Google', 'Meta', 'YouTube'];

// ─── Metric Filter Panel Component ───────────────────────────────────────────
function MetricFilterPanel({ 
  activeMetrics, 
  onToggleMetric, 
  isOpen, 
  onClose 
}: { 
  activeMetrics: Record<string, boolean>;
  onToggleMetric: (key: string) => void;
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen) return null;
  
  const allMetrics = [...METRIC_DEFINITIONS, ...WEB_METRIC_DEFINITIONS];
  const adMetrics = METRIC_DEFINITIONS;
  const webMetrics = WEB_METRIC_DEFINITIONS;
  
  const activeCount = Object.values(activeMetrics).filter(Boolean).length;
  const totalCount = Object.keys(activeMetrics).length;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-in"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'slideUp 0.3s ease-out' }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border-b border-slate-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-500/20 p-2 rounded-lg">
              <SlidersHorizontal size={18} className="text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Metric Filters</h2>
              <p className="text-xs text-slate-400">{activeCount} of {totalCount} metrics active</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1 hover:bg-slate-800 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Body */}
        <div className="px-6 py-5 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {/* Quick Actions */}
          <div className="flex gap-2 mb-5">
            <button 
              onClick={() => {
                allMetrics.forEach(m => {
                  const fullKeys = m.category === 'Ad Performance' 
                    ? PLATFORMS.map(p => `${p}${(m as typeof METRIC_DEFINITIONS[0]).key}`)
                    : [(m as typeof WEB_METRIC_DEFINITIONS[0]).key];
                  fullKeys.forEach(k => { if (!activeMetrics[k]) onToggleMetric(k); });
                });
              }}
              className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors font-medium"
            >
              Select All
            </button>
            <button 
              onClick={() => {
                allMetrics.forEach(m => {
                  const fullKeys = m.category === 'Ad Performance' 
                    ? PLATFORMS.map(p => `${p}${(m as typeof METRIC_DEFINITIONS[0]).key}`)
                    : [(m as typeof WEB_METRIC_DEFINITIONS[0]).key];
                  fullKeys.forEach(k => { if (activeMetrics[k]) onToggleMetric(k); });
                });
              }}
              className="text-xs px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors font-medium"
            >
              Clear All
            </button>
          </div>

          {/* Ad Performance Metrics */}
          <div className="mb-6">
            <h3 className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-3 flex items-center gap-2">
              <div className="w-1 h-3 bg-indigo-500 rounded-full"></div>
              Ad Platform Metrics
            </h3>
            <div className="space-y-2">
              {adMetrics.map(metric => {
                const MetricIcon = metric.icon;
                const platformStates = PLATFORMS.map(p => ({
                  platform: p,
                  key: `${p}${metric.key}`,
                  active: activeMetrics[`${p}${metric.key}`] ?? false
                }));
                const allActive = platformStates.every(s => s.active);
                const someActive = platformStates.some(s => s.active) && !allActive;
                
                return (
                  <div key={metric.key} className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-3 hover:border-slate-600 transition-all">
                    {/* Metric Header Row */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <MetricIcon size={15} style={{ color: metric.color }} />
                        <span className="text-sm font-medium text-slate-200">{metric.label}</span>
                      </div>
                      {/* Toggle All for this metric */}
                      <button
                        onClick={() => {
                          platformStates.forEach(s => {
                            if (allActive) {
                              if (s.active) onToggleMetric(s.key);
                            } else {
                              if (!s.active) onToggleMetric(s.key);
                            }
                          });
                        }}
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-md transition-all ${
                          allActive 
                            ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' 
                            : someActive
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-slate-700/50 text-slate-400 border border-slate-600'
                        }`}
                      >
                        {allActive ? 'ALL ON' : someActive ? 'PARTIAL' : 'ALL OFF'}
                      </button>
                    </div>
                    {/* Platform Toggles */}
                    <div className="flex gap-1.5">
                      {platformStates.map(({ platform, key, active }) => (
                        <button
                          key={key}
                          onClick={() => onToggleMetric(key)}
                          className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                            active 
                              ? 'border-opacity-50 bg-opacity-15 shadow-sm' 
                              : 'border-slate-700 bg-slate-900/50 text-slate-500 hover:text-slate-300 hover:border-slate-600'
                          }`}
                          style={active ? { 
                            borderColor: COLORS[platform], 
                            backgroundColor: `${COLORS[platform]}15`,
                            color: COLORS[platform]
                          } : {}}
                        >
                          {active && <Check size={10} />}
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS[platform] }}></span>
                          {platform}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Web Analytics Metrics */}
          <div>
            <h3 className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-3 flex items-center gap-2">
              <div className="w-1 h-3 bg-blue-500 rounded-full"></div>
              Web Analytics Metrics
            </h3>
            <div className="space-y-2">
              {webMetrics.map(metric => {
                const MetricIcon = metric.icon;
                const active = activeMetrics[metric.key] ?? false;
                return (
                  <button
                    key={metric.key}
                    onClick={() => onToggleMetric(metric.key)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
                      active 
                        ? 'bg-blue-500/10 border-blue-500/30 shadow-sm' 
                        : 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <MetricIcon size={15} style={{ color: active ? metric.color : '#64748b' }} />
                      <span className={`text-sm font-medium ${active ? 'text-slate-200' : 'text-slate-400'}`}>{metric.label}</span>
                    </div>
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${
                      active ? 'bg-blue-500' : 'border border-slate-600'
                    }`}>
                      {active && <Check size={12} className="text-white" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="border-t border-slate-700 px-6 py-3 bg-slate-900/80 flex justify-end">
          <button 
            onClick={onClose}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors shadow-lg shadow-indigo-500/20"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Digital Marketing Funnel Modal ──────────────────────────────────────────
function DigitalMarketingFunnel({
  isOpen,
  onClose,
  aggregatedTotals,
  activePlatforms,
}: {
  isOpen: boolean;
  onClose: () => void;
  aggregatedTotals: Record<string, number>;
  activePlatforms: Record<string, boolean>;
}) {
  if (!isOpen) return null;

  const activePlats = PLATFORMS.filter(p => activePlatforms[p]);

  // Build funnel stages from actual aggregated data
  const stages = [
    {
      key: 'Impressions',
      label: 'Impressions',
      subtitle: 'Total ad impressions served across platforms',
      icon: Eye,
      color: '#60a5fa',
      bgFrom: 'from-blue-600/20',
      bgTo: 'to-blue-900/10',
      borderColor: 'border-blue-500/30',
      glowColor: 'shadow-blue-500/10',
    },
    {
      key: 'Reach',
      label: 'Reach',
      subtitle: 'Unique users who saw the ad',
      icon: Users,
      color: '#34d399',
      bgFrom: 'from-emerald-600/20',
      bgTo: 'to-emerald-900/10',
      borderColor: 'border-emerald-500/30',
      glowColor: 'shadow-emerald-500/10',
    },
    {
      key: 'Views',
      label: 'Views',
      subtitle: 'Users who watched/engaged with the content',
      icon: Tv,
      color: '#fb923c',
      bgFrom: 'from-orange-600/20',
      bgTo: 'to-orange-900/10',
      borderColor: 'border-orange-500/30',
      glowColor: 'shadow-orange-500/10',
    },
    {
      key: 'Clicks',
      label: 'Clicks',
      subtitle: 'Users who clicked through to the website',
      icon: PointerIcon,
      color: '#f472b6',
      bgFrom: 'from-pink-600/20',
      bgTo: 'to-pink-900/10',
      borderColor: 'border-pink-500/30',
      glowColor: 'shadow-pink-500/10',
    },
    {
      key: 'Conversions',
      label: 'Conversions',
      subtitle: 'Users who completed a desired action',
      icon: ShoppingCart,
      color: '#fbbf24',
      bgFrom: 'from-amber-600/20',
      bgTo: 'to-amber-900/10',
      borderColor: 'border-amber-500/30',
      glowColor: 'shadow-amber-500/10',
    },
  ];

  // Calculate totals per stage
  const stageData = stages.map(stage => {
    const total = activePlats.reduce(
      (acc, p) => acc + (aggregatedTotals[`${p}${stage.key}`] || 0),
      0
    );
    const perPlatform = activePlats.map(p => ({
      platform: p,
      value: aggregatedTotals[`${p}${stage.key}`] || 0,
    }));
    return { ...stage, total, perPlatform };
  });

  // Width percentages for the funnel shape (widest to narrowest)
  const widths = [100, 82, 64, 46, 32];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden"
        onClick={e => e.stopPropagation()}
        style={{ animation: 'slideUp 0.3s ease-out' }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600/20 via-pink-600/15 to-amber-600/20 border-b border-slate-700 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-purple-500/30 to-pink-500/30 p-2.5 rounded-xl border border-purple-500/20">
              <Workflow size={20} className="text-purple-300" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Digital Marketing Funnel</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Full conversion journey across {activePlats.join(', ')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1.5 hover:bg-slate-800 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        {/* Funnel Body */}
        <div className="px-6 py-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          <div className="flex flex-col items-center gap-0">
            {stageData.map((stage, idx) => {
              const StageIcon = stage.icon;
              const prevTotal = idx > 0 ? stageData[idx - 1].total : null;
              const conversionRate =
                prevTotal && prevTotal > 0
                  ? ((stage.total / prevTotal) * 100).toFixed(1)
                  : null;
              const dropoffRate =
                prevTotal && prevTotal > 0
                  ? (((prevTotal - stage.total) / prevTotal) * 100).toFixed(1)
                  : null;

              return (
                <React.Fragment key={stage.key}>
                  {/* Connector arrow between stages */}
                  {idx > 0 && (
                    <div className="flex items-center justify-center gap-2 py-1.5 relative">
                      <div className="flex flex-col items-center">
                        <div className="w-px h-3 bg-slate-700"></div>
                        <ArrowDownRight size={14} className="text-slate-500 rotate-45" />
                      </div>
                      <div className="absolute left-1/2 translate-x-8 flex items-center gap-1.5">
                        <TrendingDown size={11} className="text-red-400/70" />
                        <span className="text-[10px] font-semibold text-red-400/80">
                          {dropoffRate}% drop-off
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Funnel Stage */}
                  <div
                    className={`relative bg-gradient-to-r ${stage.bgFrom} ${stage.bgTo} border ${stage.borderColor} rounded-xl px-5 py-4 shadow-lg ${stage.glowColor} transition-all hover:scale-[1.02] hover:shadow-xl group`}
                    style={{
                      width: `${widths[idx]}%`,
                      animation: `fadeInScale 0.4s ease-out ${idx * 0.1}s both`,
                    }}
                  >
                    {/* Stage number badge */}
                    <div
                      className="absolute -left-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border"
                      style={{
                        backgroundColor: `${stage.color}20`,
                        borderColor: `${stage.color}50`,
                        color: stage.color,
                      }}
                    >
                      {idx + 1}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <StageIcon size={18} style={{ color: stage.color }} className="shrink-0" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-white">{stage.label}</span>
                            {conversionRate && (
                              <span
                                className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                                style={{
                                  backgroundColor: `${stage.color}15`,
                                  color: stage.color,
                                  border: `1px solid ${stage.color}30`,
                                }}
                              >
                                {conversionRate}% from prev
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5 truncate">{stage.subtitle}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <div className="text-xl font-bold text-white" style={{ textShadow: `0 0 20px ${stage.color}30` }}>
                          {stage.total.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {/* Per-platform breakdown */}
                    <div className="flex gap-1.5 mt-2.5 flex-wrap">
                      {stage.perPlatform
                        .filter(p => p.value > 0)
                        .map(p => (
                          <span
                            key={p.platform}
                            className="text-[10px] font-medium px-2 py-0.5 rounded-md inline-flex items-center gap-1"
                            style={{
                              backgroundColor: `${COLORS[p.platform]}12`,
                              color: COLORS[p.platform],
                              border: `1px solid ${COLORS[p.platform]}25`,
                            }}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: COLORS[p.platform] }}
                            ></span>
                            {p.platform}: {p.value.toLocaleString()}
                          </span>
                        ))}
                    </div>

                    {/* Progress fill bar */}
                    <div className="mt-3 w-full bg-slate-800/60 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000 ease-out"
                        style={{
                          width: `${stageData[0].total > 0 ? Math.max((stage.total / stageData[0].total) * 100, 2) : 0}%`,
                          background: `linear-gradient(90deg, ${stage.color}, ${stage.color}80)`,
                        }}
                      ></div>
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
          </div>

          {/* Overall Conversion Summary */}
          <div className="mt-6 bg-gradient-to-r from-emerald-900/20 to-slate-900 border border-emerald-500/20 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-500/15 p-2 rounded-lg border border-emerald-500/20">
                  <Target size={16} className="text-emerald-400" />
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">Overall Funnel Conversion Rate</div>
                  <div className="text-sm text-slate-300 mt-0.5">Impressions → Conversions</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-emerald-400">
                  {stageData[0].total > 0
                    ? ((stageData[4].total / stageData[0].total) * 100).toFixed(2)
                    : '0.00'}
                  %
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  {stageData[4].total.toLocaleString()} of {stageData[0].total.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-700 px-6 py-3 bg-slate-900/80 flex justify-end">
          <button
            onClick={onClose}
            className="bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors shadow-lg shadow-purple-500/20"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Active Metric Chips ──────────────────────────────────────────────────────
function MetricChips({ 
  activeMetrics, 
  onToggle 
}: { 
  activeMetrics: Record<string, boolean>;
  onToggle: (key: string) => void;
}) {
  const activeKeys = Object.entries(activeMetrics).filter(([, v]) => v).map(([k]) => k);
  if (activeKeys.length === 0) return null;
  
  const getChipInfo = (key: string) => {
    for (const m of METRIC_DEFINITIONS) {
      for (const p of PLATFORMS) {
        if (`${p}${m.key}` === key) {
          return { label: `${p} ${m.label}`, color: COLORS[p], metricColor: m.color };
        }
      }
    }
    for (const m of WEB_METRIC_DEFINITIONS) {
      if (m.key === key) {
        return { label: m.label, color: '#3b82f6', metricColor: m.color };
      }
    }
    return { label: key, color: '#64748b', metricColor: '#64748b' };
  };
  
  return (
    <div className="flex flex-wrap gap-1.5 mt-3">
      {activeKeys.slice(0, 12).map(key => {
        const info = getChipInfo(key);
        return (
          <span 
            key={key}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all hover:scale-105 cursor-pointer group"
            style={{ 
              borderColor: `${info.color}40`,
              backgroundColor: `${info.color}10`,
              color: info.color
            }}
            onClick={() => onToggle(key)}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: info.color }}></span>
            {info.label}
            <X size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
          </span>
        );
      })}
      {activeKeys.length > 12 && (
        <span className="text-[11px] text-slate-500 self-center ml-1">+{activeKeys.length - 12} more</span>
      )}
    </div>
  );
}

export default function Dashboard() {
  const [activeBrand, setActiveBrand] = useState(BRANDS[0]);
  const [activeStage, setActiveStage] = useState(FUNNEL_STAGES[2]);
  const [startDate, setStartDate] = useState(''); // empty = no lower bound
  const [endDate, setEndDate] = useState('');     // empty = no upper bound
  const [isMounted, setIsMounted] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showBlueprint, setShowBlueprint] = useState(false);
  const [showMetricPanel, setShowMetricPanel] = useState(false);
  const [showFunnelModal, setShowFunnelModal] = useState(false);
  
  const [activePlatforms, setActivePlatforms] = useState<Record<string, boolean>>({
    Google: true,
    Meta: true,
    YouTube: true,
    Web: true
  });
  
  // Metric visibility state — all on by default
  const [activeMetrics, setActiveMetrics] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    METRIC_DEFINITIONS.forEach(m => {
      PLATFORMS.forEach(p => { initial[`${p}${m.key}`] = true; });
    });
    WEB_METRIC_DEFINITIONS.forEach(m => { initial[m.key] = true; });
    return initial;
  });

  const [mockData30D, setMockData30D] = useState<Record<string, unknown>[]>([]);
  const [verifiedRevenue, setVerifiedRevenue] = useState<{
    daily: { date: string; total_orders: number; total_revenue: number; channels: Record<string, { orders: number; revenue: number }> }[];
    by_channel: { channel: string; orders: number; revenue: number }[];
  } | null>(null);
  const [activeChannels, setActiveChannels] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);

  // Default newly-seen channels to active, without resetting toggles the user already made
  useEffect(() => {
    if (!verifiedRevenue) return;
    setActiveChannels(prev => {
      const next = { ...prev };
      let changed = false;
      for (const c of verifiedRevenue.by_channel) {
        if (!(c.channel in next)) {
          next[c.channel] = true;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [verifiedRevenue]);

  const toggleChannel = useCallback((channel: string) => {
    setActiveChannels(prev => ({ ...prev, [channel]: !prev[channel] }));
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const dateParams = `${startDate ? `&start_date=${encodeURIComponent(startDate)}` : ''}${endDate ? `&end_date=${encodeURIComponent(endDate)}` : ''}`;

    // Using relative path. Next.js rewrites will proxy this to the backend automatically.
    fetch(`/api/v1/metrics/dashboard?brand_name=${encodeURIComponent(activeBrand)}&stage=${encodeURIComponent(activeStage)}${dateParams}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setMockData30D(data);
        }
      })
      .catch(err => console.error("Failed to fetch data:", err));

    fetch(`/api/v1/metrics/verified-revenue?brand_name=${encodeURIComponent(activeBrand)}${dateParams}`)
      .then(res => res.json())
      .then(data => setVerifiedRevenue(data))
      .catch(err => console.error("Failed to fetch verified revenue:", err));
  }, [activeBrand, activeStage, startDate, endDate, isMounted]);

  const handleGenerateBlueprint = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setShowBlueprint(true);
    }, 1500);
  };

  const togglePlatform = (platform: string) => {
    setActivePlatforms(prev => ({...prev, [platform]: !prev[platform]}));
  };
  
  const toggleMetric = useCallback((key: string) => {
    setActiveMetrics(prev => ({...prev, [key]: !prev[key]}));
  }, []);

  // ─── Computed Aggregations ──────────────────────────────────────────────────
  const isMetricActive = useCallback((key: string) => activeMetrics[key] ?? false, [activeMetrics]);

  const aggregateSpend = useMemo(() => {
    let google = 0, meta = 0, youtube = 0;
    mockData30D.forEach(d => {
      google += (d.GoogleSpend as number) || 0;
      meta += (d.MetaSpend as number) || 0;
      youtube += (d.YouTubeSpend as number) || 0;
    });
    return [
      { name: 'Google', value: google },
      { name: 'Meta', value: meta },
      { name: 'YouTube', value: youtube }
    ].filter(p => activePlatforms[p.name]);
  }, [mockData30D, activePlatforms]);

  const totalConversions = useMemo(() => Math.floor(mockData30D.reduce((acc, d) => 
    acc + (activePlatforms.Google ? ((d.GoogleConversions as number) || 0) : 0) + 
    (activePlatforms.Meta ? ((d.MetaConversions as number) || 0) : 0) + 
    (activePlatforms.YouTube ? ((d.YouTubeConversions as number) || 0) : 0)
  , 0)), [mockData30D, activePlatforms]);

  const totalSessions = Math.floor(mockData30D.reduce((acc, d) => acc + ((d.WebSessions as number) || 0), 0));
  const avgBounceRate = mockData30D.length > 0 ? (mockData30D.reduce((acc, d) => acc + ((d.WebBounceRate as number) || 0), 0) / mockData30D.length).toFixed(1) : "0.0";
  const totalSpend = aggregateSpend.reduce((acc, curr) => acc + curr.value, 0);
  const targetConversions = 11000;
  const progressRatio = totalConversions / targetConversions;

  // Sum a per-platform metric key across the currently active platforms
  const sumActivePlatformMetric = useCallback((suffix: string) =>
    mockData30D.reduce((acc, d) =>
      acc +
      (activePlatforms.Google ? ((d[`Google${suffix}`] as number) || 0) : 0) +
      (activePlatforms.Meta ? ((d[`Meta${suffix}`] as number) || 0) : 0) +
      (activePlatforms.YouTube ? ((d[`YouTube${suffix}`] as number) || 0) : 0)
    , 0),
    [mockData30D, activePlatforms]
  );

  const totalImpressions = useMemo(() => sumActivePlatformMetric('Impressions'), [sumActivePlatformMetric]);
  const totalClicks = useMemo(() => sumActivePlatformMetric('Clicks'), [sumActivePlatformMetric]);
  const totalConversionValue = useMemo(() => sumActivePlatformMetric('ConversionValue'), [sumActivePlatformMetric]);
  const totalAddToCart = useMemo(() => sumActivePlatformMetric('AddToCart'), [sumActivePlatformMetric]);

  // ─── Performance Insights (derived metrics) ──────────────────────────────
  const insights = useMemo(() => ({
    cpc: totalClicks > 0 ? totalSpend / totalClicks : 0,
    cpm: totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0,
    ctr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
    cpr: totalConversions > 0 ? totalSpend / totalConversions : 0,
    roas: totalSpend > 0 ? totalConversionValue / totalSpend : 0,
    convRate: totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0,
    addToCartRate: totalClicks > 0 ? (totalAddToCart / totalClicks) * 100 : 0,
    cartAbandonmentRate: totalAddToCart > 0 ? ((totalAddToCart - totalConversions) / totalAddToCart) * 100 : 0,
  }), [totalClicks, totalImpressions, totalSpend, totalConversions, totalConversionValue, totalAddToCart]);

  // ─── Day-over-day Impressions % change ───────────────────────────────────
  const impressionsDoD = useMemo(() => {
    const rows = mockData30D.map(d => ({
      name: d.name as string,
      impressions:
        (activePlatforms.Google ? ((d.GoogleImpressions as number) || 0) : 0) +
        (activePlatforms.Meta ? ((d.MetaImpressions as number) || 0) : 0) +
        (activePlatforms.YouTube ? ((d.YouTubeImpressions as number) || 0) : 0),
    }));
    return rows.map((row, i) => {
      const prev = i > 0 ? rows[i - 1].impressions : null;
      const change = prev && prev > 0 ? ((row.impressions - prev) / prev) * 100 : null;
      return { name: row.name, impressions: row.impressions, change: change === null ? 0 : Math.round(change * 10) / 10, hasChange: change !== null };
    });
  }, [mockData30D, activePlatforms]);

  // Aggregate totals for new metrics
  const aggregatedTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    const countKeys: Record<string, number> = {};
    
    METRIC_DEFINITIONS.forEach(m => {
      PLATFORMS.forEach(p => {
        const key = `${p}${m.key}`;
        totals[key] = 0;
      });
    });
    WEB_METRIC_DEFINITIONS.forEach(m => {
      totals[m.key] = 0;
      countKeys[m.key] = 0;
    });
    
    mockData30D.forEach(d => {
      METRIC_DEFINITIONS.forEach(m => {
        PLATFORMS.forEach(p => {
          const key = `${p}${m.key}`;
          totals[key] = (totals[key] || 0) + ((d[key] as number) || 0);
        });
      });
      WEB_METRIC_DEFINITIONS.forEach(m => {
        totals[m.key] = (totals[m.key] || 0) + ((d[m.key] as number) || 0);
        countKeys[m.key] = (countKeys[m.key] || 0) + 1;
      });
    });
    
    // Average bounce rate
    if (countKeys['WebBounceRate'] > 0) {
      totals['WebBounceRate'] = Math.round((totals['WebBounceRate'] / countKeys['WebBounceRate']) * 10) / 10;
    }
    
    return totals;
  }, [mockData30D]);

  // Verified revenue trend, flattened per channel per day for the chart.
  // allVerifiedChannels stays stable (drives color assignment) so toggling a
  // channel off doesn't shift everyone else's color.
  const allVerifiedChannels = useMemo(
    () => (verifiedRevenue?.by_channel ?? []).map(c => c.channel),
    [verifiedRevenue]
  );
  const channelColor = useCallback(
    (channel: string) => CHANNEL_COLOR_PALETTE[allVerifiedChannels.indexOf(channel) % CHANNEL_COLOR_PALETTE.length],
    [allVerifiedChannels]
  );
  const activeVerifiedChannels = useMemo(
    () => allVerifiedChannels.filter(c => activeChannels[c] ?? true),
    [allVerifiedChannels, activeChannels]
  );
  const visibleByChannel = useMemo(
    () => (verifiedRevenue?.by_channel ?? []).filter(c => activeChannels[c.channel] ?? true),
    [verifiedRevenue, activeChannels]
  );
  const aov = useMemo(() => {
    const revenue = visibleByChannel.reduce((acc, c) => acc + c.revenue, 0);
    const orders = visibleByChannel.reduce((acc, c) => acc + c.orders, 0);
    return orders > 0 ? revenue / orders : 0;
  }, [visibleByChannel]);
  const verifiedRevenueTrend = useMemo(() => {
    if (!verifiedRevenue) return [];
    return verifiedRevenue.daily.map(day => {
      const row: Record<string, string | number> = { name: day.date };
      for (const channel of activeVerifiedChannels) {
        row[channel] = day.channels?.[channel]?.revenue ?? 0;
      }
      return row;
    });
  }, [verifiedRevenue, activeVerifiedChannels]);

  // Funnel Data Generation using backend journey metrics
  const funnelData = useMemo(() => {
    let landing = 0, product = 0, checkout = 0, purchase = 0;
    mockData30D.forEach(d => {
      landing += (d.journey_landing as number) || 0;
      product += (d.journey_product as number) || 0;
      checkout += (d.journey_checkout as number) || 0;
      purchase += (d.journey_purchase as number) || 0;
    });
    return [
      { stage: '1. Landing', users: landing, fill: '#3b82f6', dropoff: '---' },
      { stage: '2. Product', users: product, fill: '#6366f1', dropoff: landing > 0 ? `${((1 - (product/landing))*100).toFixed(1)}% drop` : '0%' },
      { stage: '3. Checkout', users: checkout, fill: '#8b5cf6', dropoff: product > 0 ? `${((1 - (checkout/product))*100).toFixed(1)}% drop` : '0%' },
      { stage: '4. Completed Journey', users: purchase, fill: '#10b981', dropoff: checkout > 0 ? `${((1 - (purchase/checkout))*100).toFixed(1)}% drop` : '0%' }
    ];
  }, [mockData30D]);

  const totalCompletedJourney = funnelData[3].users;
  
  // ─── Determine which metric groups are active for conditional rendering ─────
  const hasActiveSpend = PLATFORMS.some(p => isMetricActive(`${p}Spend`) && activePlatforms[p]);
  const hasActiveConversions = PLATFORMS.some(p => isMetricActive(`${p}Conversions`) && activePlatforms[p]);
  const hasActiveImpressions = PLATFORMS.some(p => isMetricActive(`${p}Impressions`) && activePlatforms[p]);
  const hasActiveReach = PLATFORMS.some(p => isMetricActive(`${p}Reach`) && activePlatforms[p]);
  const hasActiveViews = PLATFORMS.some(p => isMetricActive(`${p}Views`) && activePlatforms[p]);
  const hasActiveClicks = PLATFORMS.some(p => isMetricActive(`${p}Clicks`) && activePlatforms[p]);
  const hasActiveAddToCart = PLATFORMS.some(p => isMetricActive(`${p}AddToCart`) && activePlatforms[p]);
  const hasActiveAddPaymentInfo = PLATFORMS.some(p => isMetricActive(`${p}AddPaymentInfo`) && activePlatforms[p]);
  const hasActiveEngagement = PLATFORMS.some(p => isMetricActive(`${p}Engagement`) && activePlatforms[p]);
  const hasWebSessions = isMetricActive('WebSessions');
  const hasWebBounce = isMetricActive('WebBounceRate');
  const hasWebPageViews = isMetricActive('WebPageViews');
  const hasAnyWebMetric = hasWebSessions || hasWebBounce || hasWebPageViews;
  const hasAnyAdMetric = hasActiveSpend || hasActiveConversions || hasActiveImpressions || hasActiveReach || hasActiveViews || hasActiveClicks || hasActiveAddToCart || hasActiveAddPaymentInfo || hasActiveEngagement;
  
  const activeMetricCount = Object.values(activeMetrics).filter(Boolean).length;
  const totalMetricCount = Object.keys(activeMetrics).length;

  if (!isMounted) return <div className="min-h-screen bg-slate-950" />;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-4 md:p-8 font-sans transition-colors duration-300">
      
      {/* Metric Filter Panel Modal */}
      <MetricFilterPanel 
        activeMetrics={activeMetrics}
        onToggleMetric={toggleMetric}
        isOpen={showMetricPanel}
        onClose={() => setShowMetricPanel(false)}
      />

      {/* Digital Marketing Funnel Modal */}
      <DigitalMarketingFunnel
        isOpen={showFunnelModal}
        onClose={() => setShowFunnelModal(false)}
        aggregatedTotals={aggregatedTotals}
        activePlatforms={activePlatforms}
      />

      {/* Top Header */}
      <header className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Activity className="text-indigo-500" />
            Agentic Unified Command
          </h1>
          <p className="text-slate-400 mt-2 text-sm">Platform Planned Matrix with Unified Web Analytics & User Journey</p>
        </div>
        
        {/* Global Context Pickers */}
        <div className="flex gap-4">
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-2 flex items-center gap-3 hover:border-slate-500 transition-colors">
            <Briefcase size={16} className="text-slate-400 ml-1" />
            <select 
              className="bg-transparent text-sm font-medium text-white focus:outline-none cursor-pointer"
              value={activeBrand}
              onChange={(e) => setActiveBrand(e.target.value)}
            >
              {BRANDS.map(b => <option key={b} className="bg-slate-900">{b}</option>)}
            </select>
          </div>
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-2 flex items-center gap-3 hover:border-slate-500 transition-colors">
            <Layers size={16} className="text-slate-400 ml-1" />
            <select 
              className="bg-transparent text-sm font-medium text-white focus:outline-none cursor-pointer"
              value={activeStage}
              onChange={(e) => setActiveStage(e.target.value)}
            >
              {FUNNEL_STAGES.map(s => <option key={s} className="bg-slate-900">{s}</option>)}
            </select>
          </div>
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-2 flex items-center gap-2 hover:border-slate-500 transition-colors">
            <Calendar size={16} className="text-slate-400 ml-1" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-sm font-medium text-white focus:outline-none cursor-pointer [color-scheme:dark]"
            />
            <ArrowRight size={12} className="text-slate-600" />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent text-sm font-medium text-white focus:outline-none cursor-pointer [color-scheme:dark]"
            />
            {(startDate || endDate) && (
              <button
                onClick={() => { setStartDate(''); setEndDate(''); }}
                title="Clear date range"
                className="text-slate-500 hover:text-white transition-colors ml-1"
              >
                <RotateCcw size={14} />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Date range quick presets */}
      <div className="flex flex-wrap gap-2 mb-6 -mt-2">
        {[
          { label: 'Last 7 days', days: 7 },
          { label: 'Last 14 days', days: 14 },
          { label: 'Last 30 days', days: 30 },
          { label: 'Last 90 days', days: 90 },
        ].map(preset => (
          <button
            key={preset.label}
            onClick={() => {
              const end = new Date();
              const start = new Date();
              start.setDate(end.getDate() - preset.days + 1);
              setEndDate(end.toISOString().slice(0, 10));
              setStartDate(start.toISOString().slice(0, 10));
            }}
            className="text-xs px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-600 transition-colors"
          >
            {preset.label}
          </button>
        ))}
        <button
          onClick={() => { setStartDate(''); setEndDate(''); }}
          className={`text-xs px-3 py-1 rounded-full border transition-colors ${!startDate && !endDate ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-600'}`}
        >
          All time
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        {/* Journey Completion Highlight (New) */}
        <div className="bg-gradient-to-br from-emerald-900/30 to-slate-900 border border-emerald-500/30 rounded-2xl p-6 lg:col-span-1 shadow-[0_0_20px_rgba(16,185,129,0.05)] flex flex-col justify-between">
          <div>
            <h2 className="text-sm uppercase tracking-wider text-emerald-400 font-semibold mb-4 flex items-center gap-2">
              <UserCheck size={16}/> Successful Journeys
            </h2>
            <div className="mb-2">
              <span className="text-4xl font-bold text-white">{totalCompletedJourney.toLocaleString()}</span>
              <span className="text-emerald-500/80 font-semibold text-lg ml-2 block sm:inline">Users Finished</span>
            </div>
            <p className="text-sm text-slate-400 mt-2">
              Users who entered via campaigns, navigated the product catalog, and fully completed checkout this period.
            </p>
          </div>
          <div className="text-sm text-slate-400 font-medium mt-4 bg-slate-950/50 p-3 rounded-lg border border-slate-800">
            Conv. Rate: <strong className="text-emerald-400">{funnelData[0].users > 0 ? ((totalCompletedJourney / funnelData[0].users)*100).toFixed(2) : '0.00'}%</strong> of Landing Traffic
          </div>
        </div>

        {/* Web Analytics Summary */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 lg:col-span-1 shadow-sm">
           <h2 className="text-sm uppercase tracking-wider text-blue-400 font-semibold mb-4 flex items-center gap-2">
              <Globe size={16}/> Traffic Vitality
           </h2>
           
           <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <div className="text-xs text-slate-500 mb-1 font-medium">SESSIONS</div>
                <div className="text-2xl font-bold text-slate-200">{totalSessions.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1 font-medium">BOUNCE RATE</div>
                <div className="text-2xl font-bold text-slate-200">{avgBounceRate}%</div>
              </div>
              <div className="col-span-2 bg-blue-500/10 rounded-lg p-3 border border-blue-500/20 mt-2">
                <div className="text-xs text-blue-400 mb-1 font-semibold flex items-center gap-1.5"><MousePointerClick size={12}/> Engagement Dropoff</div>
                <div className="text-sm text-slate-300">Highest abandonment observed at <strong className="text-white">Checkout Stage</strong>.</div>
              </div>
           </div>
        </div>

        {/* AI Weekly Analyst Suggestion Engine */}
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 lg:col-span-2 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-purple-600"></div>
          <h2 className="text-sm uppercase tracking-wider text-blue-400 font-semibold mb-3 flex items-center gap-2">
            <Zap size={16} className="text-yellow-400 animate-pulse"/> AI Journey Analyst Brief
          </h2>
          
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 flex items-start gap-4 shadow-sm h-[130px] overflow-y-auto custom-scrollbar relative">
            {!showBlueprint ? (
              <>
                <div className="bg-purple-500/20 p-2 rounded-full mt-1 shrink-0">
                  <FunnelIcon className="text-purple-400" size={20} />
                </div>
                <div className="w-full">
                  <h3 className="text-md font-semibold text-slate-100 mb-1">Targeting Friction Point</h3>
                  <p className="text-slate-300 text-sm leading-relaxed mb-3">
                    Users are reaching the Product Page successfully but displaying a <strong>{funnelData[2].dropoff}</strong> before moving to Checkout. <strong>AI Suggestion:</strong> Initiate a retargeting sprint on YouTube highlighting product reviews and free shipping to bridge this specific Funnel gap.
                  </p>
                  <button 
                    onClick={handleGenerateBlueprint}
                    disabled={isGenerating}
                    className={`${isGenerating ? 'bg-blue-800 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500'} text-white text-xs font-semibold py-1.5 px-3 rounded-md transition-colors flex items-center gap-2 shadow-sm`}
                  >
                    {isGenerating ? (
                      <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Generating...</>
                    ) : (
                      <>Generate A/B Blueprint <ArrowRight size={14}/></>
                    )}
                  </button>
                </div>
              </>
            ) : (
              <div className="w-full animate-in fade-in zoom-in duration-300">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2"><Zap size={14}/> Blueprint Ready: Variant B</h3>
                  <button onClick={() => setShowBlueprint(false)} className="text-slate-400 hover:text-white text-xs">Close</button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-900/80 p-2 rounded border border-slate-700">
                    <div className="text-[10px] text-slate-400 font-semibold mb-1 uppercase tracking-wider">Hero Section</div>
                    <div className="text-xs text-slate-200">Replace H1 text block with 15-sec auto-playing video asset from top-performing Meta Ad (ID: m_camp_1).</div>
                  </div>
                  <div className="bg-slate-900/80 p-2 rounded border border-slate-700">
                    <div className="text-[10px] text-slate-400 font-semibold mb-1 uppercase tracking-wider">CTA Button</div>
                    <div className="text-xs text-slate-200">Move primary CTA above the fold, change copy from &quot;Read More&quot; to &quot;Get Started Now&quot;.</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── KPI Summary Cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="text-slate-400 text-sm font-medium mb-1 flex items-center gap-2">Total Spend</div>
          <div className="text-3xl font-bold text-white">₹{(totalSpend / 1000).toFixed(1)}k</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="text-slate-400 text-sm font-medium mb-1 flex items-center gap-2">Total Conversions</div>
          <div className="text-3xl font-bold text-white">{totalConversions.toLocaleString()}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col justify-center">
            <div className="text-slate-400 text-sm font-medium mb-1">Target Progress</div>
            <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden shadow-inner">
              <div 
                className="bg-gradient-to-r from-indigo-500 to-purple-500 h-3 rounded-full transition-all duration-1000 ease-in-out" 
                style={{ width: `${Math.min(progressRatio * 100, 100)}%` }}
              >
              </div>
            </div>
            <div className="text-xs text-slate-500 mt-2">{(progressRatio * 100).toFixed(1)}% of {(targetConversions/1000).toFixed(1)}k target</div>
        </div>
      </div>

      {/* ─── Performance Insights (derived metrics) ────────────────────────────── */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-8">
        <h3 className="text-lg font-medium mb-5 text-slate-200 flex items-center gap-2">
          <Gauge className="text-indigo-400" size={18} />
          Performance Insights
          <span className="text-xs text-slate-500 font-normal">(for the selected date range &amp; active platforms)</span>
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">CPC</div>
            <div className="text-xl font-bold text-white">₹{insights.cpc.toFixed(2)}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Cost per click</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">CPM</div>
            <div className="text-xl font-bold text-white">₹{insights.cpm.toFixed(2)}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Cost per 1,000 impressions</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">CTR</div>
            <div className="text-xl font-bold text-white">{insights.ctr.toFixed(2)}%</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Click-through rate</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">CPR</div>
            <div className="text-xl font-bold text-white">₹{insights.cpr.toFixed(2)}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Cost per result (conversion)</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">ROAS</div>
            <div className="text-xl font-bold text-emerald-400">{insights.roas.toFixed(2)}x</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Return on ad spend</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Conv. Rate</div>
            <div className="text-xl font-bold text-white">{insights.convRate.toFixed(2)}%</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Conversions / clicks</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Add-to-Cart Rate</div>
            <div className="text-xl font-bold text-white">{insights.addToCartRate.toFixed(2)}%</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Add to cart / clicks</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Cart Abandonment</div>
            <div className="text-xl font-bold text-rose-400">{insights.cartAbandonmentRate.toFixed(2)}%</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Carts not converted</div>
          </div>
          {visibleByChannel.length > 0 && (
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">AOV</div>
              <div className="text-xl font-bold text-emerald-400">₹{aov.toFixed(0)}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Avg. order value (verified)</div>
            </div>
          )}
        </div>
      </div>

      {/* ─── Day-over-Day Impressions Change ───────────────────────────────────── */}
      {hasActiveImpressions && impressionsDoD.length > 1 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-8">
          <h3 className="text-lg font-medium mb-6 text-slate-200 flex items-center gap-2">
            <TrendingUp className="text-blue-400" size={18} />
            Impressions: Day-over-Day % Change
          </h3>
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={impressionsDoD.filter(r => r.hasChange)} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fill: '#64748b', fontSize: 12 }} width={48} tickFormatter={(v) => `${v}%`} />
                <RechartsTooltip
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', borderColor: '#334155', borderRadius: '12px' }}
                  itemStyle={{ color: '#f8fafc' }}
                  formatter={(value: number) => [`${value > 0 ? '+' : ''}${value}%`, 'vs previous day']}
                />
                <Bar dataKey="change" radius={[4, 4, 0, 0]}>
                  {impressionsDoD.filter(r => r.hasChange).map((row, i) => (
                    <Cell key={i} fill={row.change >= 0 ? '#34d399' : '#f43f5e'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ─── Verified Revenue (EasyEcom) ───────────────────────────────────────── */}
      {verifiedRevenue && verifiedRevenue.by_channel.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-slate-200 flex items-center gap-2">
              <IndianRupee className="text-emerald-500" size={18} />
              Verified Revenue <span className="text-xs text-slate-500 font-normal">(real orders via EasyEcom, not ad-platform-reported)</span>
            </h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
            <div>
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Total Revenue</div>
              <div className="text-2xl font-bold text-emerald-400">
                ₹{(visibleByChannel.reduce((acc, c) => acc + c.revenue, 0) / 1000).toFixed(1)}k
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Total Orders</div>
              <div className="text-2xl font-bold text-white">
                {visibleByChannel.reduce((acc, c) => acc + c.orders, 0).toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Channels</div>
              <div className="text-2xl font-bold text-white">{visibleByChannel.length} <span className="text-sm text-slate-500 font-normal">/ {verifiedRevenue.by_channel.length}</span></div>
            </div>
            <div>
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Days Tracked</div>
              <div className="text-2xl font-bold text-white">{verifiedRevenue.daily.length}</div>
            </div>
          </div>

          {/* Channel filter toggles, same pattern as the platform filter row */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Filter size={14} className="text-slate-500 mr-1" />
            {allVerifiedChannels.map(channel => (
              <button
                key={channel}
                onClick={() => toggleChannel(channel)}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-all border ${(activeChannels[channel] ?? true) ? 'bg-slate-800 border-slate-600 text-white' : 'bg-transparent border-slate-800 text-slate-500 hover:text-slate-300'}`}
                style={{ borderColor: (activeChannels[channel] ?? true) ? channelColor(channel) : '#1e293b' }}
              >
                {channel}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            {visibleByChannel.map(c => (
              <div key={c.channel} className="bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2">
                <div className="text-xs" style={{ color: channelColor(c.channel) }}>{c.channel}</div>
                <div className="text-sm font-semibold text-white">₹{(c.revenue / 1000).toFixed(1)}k <span className="text-slate-500 font-normal">· {c.orders} orders</span></div>
              </div>
            ))}
          </div>
          {verifiedRevenueTrend.length > 1 && (
            <div>
              <h4 className="text-sm font-medium text-slate-400 mb-3">Revenue by Channel Over Time</h4>
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={verifiedRevenueTrend} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      {activeVerifiedChannels.map(channel => (
                        <linearGradient key={channel} id={`grad_rev_${channel.replace(/[^a-zA-Z0-9]/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={channelColor(channel)} stopOpacity={0.5} />
                          <stop offset="95%" stopColor={channelColor(channel)} stopOpacity={0} />
                        </linearGradient>
                      ))}
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="name" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 11 }} />
                    <YAxis stroke="#64748b" tick={{ fill: '#64748b', fontSize: 12 }} width={48} tickFormatter={formatCompactNumber} />
                    <RechartsTooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', borderColor: '#334155', borderRadius: '12px' }} itemStyle={{ color: '#f8fafc' }} />
                    {activeVerifiedChannels.map(channel => (
                      <Area
                        key={channel}
                        type="monotone"
                        dataKey={channel}
                        name={channel}
                        stackId="revenue"
                        stroke={channelColor(channel)}
                        fill={`url(#grad_rev_${channel.replace(/[^a-zA-Z0-9]/g, '')})`}
                        fillOpacity={1}
                        strokeWidth={1.5}
                      />
                    ))}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── Filter Row with Metric Picker ─────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 mb-2 border-t border-slate-800 pt-6">
        <Filter size={16} className="text-slate-500 mr-2" />
        {Object.keys(COLORS).map(platform => (
          <button 
            key={platform}
            onClick={() => togglePlatform(platform)}
            className={`px-4 py-1.5 text-sm font-medium rounded-full transition-all border ${activePlatforms[platform] ? 'bg-slate-800 border-slate-600 text-white shadow-sm hover:scale-105' : 'bg-transparent border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-600'}`}
            style={{ borderColor: activePlatforms[platform] ? COLORS[platform as keyof typeof COLORS] : '#1e293b' }}
          >
            {platform}
          </button>
        ))}
        
        {/* Metric Filter & Funnel Buttons */}
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setShowFunnelModal(true)}
            className="flex items-center gap-2 px-4 py-1.5 text-sm font-medium rounded-full bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 text-purple-300 hover:border-purple-400/50 hover:from-purple-600/30 hover:to-pink-600/30 transition-all shadow-lg shadow-purple-500/5 hover:shadow-purple-500/10"
          >
            <Workflow size={14} />
            Marketing Funnel
          </button>
          <button
            onClick={() => setShowMetricPanel(true)}
            className="flex items-center gap-2 px-4 py-1.5 text-sm font-medium rounded-full bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border border-indigo-500/30 text-indigo-300 hover:border-indigo-400/50 hover:from-indigo-600/30 hover:to-purple-600/30 transition-all shadow-lg shadow-indigo-500/5 hover:shadow-indigo-500/10"
          >
            <SlidersHorizontal size={14} />
            Metric Filters
            <span className="bg-indigo-500/30 text-indigo-200 text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
              {activeMetricCount}/{totalMetricCount}
            </span>
          </button>
        </div>
      </div>
      
      {/* Active Metric Chips */}
      <div className="mb-6">
        <MetricChips activeMetrics={activeMetrics} onToggle={toggleMetric} />
      </div>

      {/* ─── Dynamic Metric Summary Cards (based on filters) ───────────────────── */}
      {(hasActiveImpressions || hasActiveReach || hasActiveClicks || hasActiveViews || hasActiveAddToCart || hasActiveAddPaymentInfo || hasActiveEngagement) && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {hasActiveImpressions && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 hover:border-blue-500/30 transition-all group">
              <div className="flex items-center gap-2 mb-2">
                <Eye size={14} className="text-blue-400" />
                <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Impressions</span>
              </div>
              <div className="text-2xl font-bold text-white group-hover:text-blue-300 transition-colors">
                {PLATFORMS.filter(p => activePlatforms[p] && isMetricActive(`${p}Impressions`))
                  .reduce((acc, p) => acc + (aggregatedTotals[`${p}Impressions`] || 0), 0)
                  .toLocaleString()}
              </div>
              <div className="flex gap-2 mt-2">
                {PLATFORMS.filter(p => activePlatforms[p] && isMetricActive(`${p}Impressions`)).map(p => (
                  <span key={p} className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ backgroundColor: `${COLORS[p]}15`, color: COLORS[p] }}>
                    {p}: {(aggregatedTotals[`${p}Impressions`] || 0).toLocaleString()}
                  </span>
                ))}
              </div>
            </div>
          )}
          {hasActiveReach && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 hover:border-emerald-500/30 transition-all group">
              <div className="flex items-center gap-2 mb-2">
                <Users size={14} className="text-emerald-400" />
                <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Reach</span>
              </div>
              <div className="text-2xl font-bold text-white group-hover:text-emerald-300 transition-colors">
                {PLATFORMS.filter(p => activePlatforms[p] && isMetricActive(`${p}Reach`))
                  .reduce((acc, p) => acc + (aggregatedTotals[`${p}Reach`] || 0), 0)
                  .toLocaleString()}
              </div>
              <div className="flex gap-2 mt-2">
                {PLATFORMS.filter(p => activePlatforms[p] && isMetricActive(`${p}Reach`)).map(p => (
                  <span key={p} className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ backgroundColor: `${COLORS[p]}15`, color: COLORS[p] }}>
                    {p}: {(aggregatedTotals[`${p}Reach`] || 0).toLocaleString()}
                  </span>
                ))}
              </div>
            </div>
          )}
          {hasActiveClicks && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 hover:border-pink-500/30 transition-all group">
              <div className="flex items-center gap-2 mb-2">
                <PointerIcon size={14} className="text-pink-400" />
                <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Clicks</span>
              </div>
              <div className="text-2xl font-bold text-white group-hover:text-pink-300 transition-colors">
                {PLATFORMS.filter(p => activePlatforms[p] && isMetricActive(`${p}Clicks`))
                  .reduce((acc, p) => acc + (aggregatedTotals[`${p}Clicks`] || 0), 0)
                  .toLocaleString()}
              </div>
              <div className="flex gap-2 mt-2">
                {PLATFORMS.filter(p => activePlatforms[p] && isMetricActive(`${p}Clicks`)).map(p => (
                  <span key={p} className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ backgroundColor: `${COLORS[p]}15`, color: COLORS[p] }}>
                    {p}: {(aggregatedTotals[`${p}Clicks`] || 0).toLocaleString()}
                  </span>
                ))}
              </div>
            </div>
          )}
          {hasActiveViews && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 hover:border-orange-500/30 transition-all group">
              <div className="flex items-center gap-2 mb-2">
                <Tv size={14} className="text-orange-400" />
                <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Views</span>
              </div>
              <div className="text-2xl font-bold text-white group-hover:text-orange-300 transition-colors">
                {PLATFORMS.filter(p => activePlatforms[p] && isMetricActive(`${p}Views`))
                  .reduce((acc, p) => acc + (aggregatedTotals[`${p}Views`] || 0), 0)
                  .toLocaleString()}
              </div>
              <div className="flex gap-2 mt-2">
                {PLATFORMS.filter(p => activePlatforms[p] && isMetricActive(`${p}Views`)).map(p => (
                  <span key={p} className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ backgroundColor: `${COLORS[p]}15`, color: COLORS[p] }}>
                    {p}: {(aggregatedTotals[`${p}Views`] || 0).toLocaleString()}
                  </span>
                ))}
              </div>
            </div>
          )}
          {hasActiveAddToCart && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 hover:border-cyan-500/30 transition-all group">
              <div className="flex items-center gap-2 mb-2">
                <ShoppingBag size={14} className="text-cyan-400" />
                <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Add to Cart</span>
              </div>
              <div className="text-2xl font-bold text-white group-hover:text-cyan-300 transition-colors">
                {PLATFORMS.filter(p => activePlatforms[p] && isMetricActive(`${p}AddToCart`))
                  .reduce((acc, p) => acc + (aggregatedTotals[`${p}AddToCart`] || 0), 0)
                  .toLocaleString()}
              </div>
              <div className="flex gap-2 mt-2">
                {PLATFORMS.filter(p => activePlatforms[p] && isMetricActive(`${p}AddToCart`)).map(p => (
                  <span key={p} className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ backgroundColor: `${COLORS[p]}15`, color: COLORS[p] }}>
                    {p}: {(aggregatedTotals[`${p}AddToCart`] || 0).toLocaleString()}
                  </span>
                ))}
              </div>
            </div>
          )}
          {hasActiveAddPaymentInfo && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 hover:border-purple-500/30 transition-all group">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard size={14} className="text-purple-400" />
                <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Add Payment Info</span>
              </div>
              <div className="text-2xl font-bold text-white group-hover:text-purple-300 transition-colors">
                {PLATFORMS.filter(p => activePlatforms[p] && isMetricActive(`${p}AddPaymentInfo`))
                  .reduce((acc, p) => acc + (aggregatedTotals[`${p}AddPaymentInfo`] || 0), 0)
                  .toLocaleString()}
              </div>
              <div className="flex gap-2 mt-2">
                {PLATFORMS.filter(p => activePlatforms[p] && isMetricActive(`${p}AddPaymentInfo`)).map(p => (
                  <span key={p} className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ backgroundColor: `${COLORS[p]}15`, color: COLORS[p] }}>
                    {p}: {(aggregatedTotals[`${p}AddPaymentInfo`] || 0).toLocaleString()}
                  </span>
                ))}
              </div>
            </div>
          )}
          {hasActiveEngagement && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 hover:border-rose-500/30 transition-all group">
              <div className="flex items-center gap-2 mb-2">
                <Heart size={14} className="text-rose-400" />
                <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Engagement</span>
              </div>
              <div className="text-2xl font-bold text-white group-hover:text-rose-300 transition-colors">
                {PLATFORMS.filter(p => activePlatforms[p] && isMetricActive(`${p}Engagement`))
                  .reduce((acc, p) => acc + (aggregatedTotals[`${p}Engagement`] || 0), 0)
                  .toLocaleString()}
              </div>
              <div className="flex gap-2 mt-2">
                {PLATFORMS.filter(p => activePlatforms[p] && isMetricActive(`${p}Engagement`)).map(p => (
                  <span key={p} className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ backgroundColor: `${COLORS[p]}15`, color: COLORS[p] }}>
                    {p}: {(aggregatedTotals[`${p}Engagement`] || 0).toLocaleString()}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── Primary Graphs Grid ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
        
        {/* User Stage Funnel */}
        {activePlatforms.Web && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 lg:col-span-1 transition-all shadow-sm">
             <h3 className="text-lg font-medium mb-6 text-slate-200 flex items-center gap-2">
               <FunnelIcon className="text-purple-500" size={18}/> 
               User Journey Funnel
             </h3>
             <div className="h-[280px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={funnelData} layout="vertical" margin={{top: 0, right: 30, left: 10, bottom: 0}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={true} vertical={false}/>
                    <XAxis type="number" stroke="#64748b" hide/>
                    <YAxis dataKey="stage" type="category" stroke="#64748b" tick={{fill: '#e2e8f0', fontSize: 12, fontWeight: 500}} width={90} axisLine={false} tickLine={false}/>
                    <RechartsTooltip 
                      cursor={{fill: '#1e293b'}} 
                      contentStyle={{backgroundColor: 'rgba(15, 23, 42, 0.95)', borderColor: '#334155', borderRadius: '12px'}}
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      formatter={(val: any) => (val as number).toLocaleString()}
                    />
                    <Bar 
                      dataKey="users" 
                      radius={[0, 4, 4, 0]} 
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      label={(props: any) => {
                        const { x, y, width, value, index } = props;
                        if (index === undefined || !funnelData[index]) return null;
                        return (
                          <text x={x + width + 5} y={y + 12} fill="#94a3b8" fontSize={11} dominantBaseline="middle">
                            {`${value.toLocaleString()} (${funnelData[index].dropoff})`}
                          </text>
                        );
                      }}
                    >
                      {funnelData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                 </BarChart>
               </ResponsiveContainer>
             </div>
          </div>
        )}

        {/* Web Engagement Dual-Axis Chart — rendered only if web metrics are active */}
        {activePlatforms.Web && hasAnyWebMetric && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 lg:col-span-2 xl:col-span-2 transition-all shadow-sm">
             <h3 className="text-lg font-medium mb-6 text-slate-200 flex items-center gap-2">
               <Globe className="text-blue-500" size={18}/> 
               Web Engagement Analysis
               <span className="text-xs text-slate-500 ml-2 font-normal">
                 ({[hasWebSessions && 'Sessions', hasWebBounce && 'Bounce Rate', hasWebPageViews && 'Page Views'].filter(Boolean).join(' · ')})
               </span>
             </h3>
             <div className="h-[280px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <ComposedChart data={mockData30D} margin={{top: 5, right: 0, left: 0, bottom: 0}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="name" stroke="#64748b" tick={{fill: '#64748b', fontSize: 12}} />
                    
                    {/* Left Axis for Volume */}
                    <YAxis yAxisId="left" stroke="#64748b" tick={{fill: '#64748b', fontSize: 12}} width={48} tickFormatter={formatCompactNumber} />
                    {/* Right Axis for Percentages */}
                    {hasWebBounce && <YAxis yAxisId="right" orientation="right" stroke="#64748b" tick={{fill: '#64748b', fontSize: 12}} domain={[0, 100]} tickFormatter={(val) => `${val}%`}/>}
                    
                    <RechartsTooltip 
                      contentStyle={{backgroundColor: 'rgba(15, 23, 42, 0.95)', borderColor: '#334155', borderRadius: '12px'}}
                      itemStyle={{color: '#f8fafc'}}
                    />
                    
                    {hasWebSessions && <Area yAxisId="left" type="monotone" dataKey="WebSessions" fill="#1e3a8a" stroke="#3b82f6" strokeWidth={2} name="Sessions" fillOpacity={0.3}/>}
                    {hasWebPageViews && <Area yAxisId="left" type="monotone" dataKey="WebPageViews" fill="#312e81" stroke="#818cf8" strokeWidth={2} name="Page Views" fillOpacity={0.2}/>}
                    {hasWebBounce && <Line yAxisId="right" type="step" dataKey="WebBounceRate" stroke="#f43f5e" strokeWidth={2} dot={false} name="Bounce Rate %"/>}
                 </ComposedChart>
               </ResponsiveContainer>
             </div>
          </div>
        )}

        {/* ─── Dynamic Platform Metric Trend Charts ──────────────────────────── */}
        {/* Impressions Trend */}
        {hasActiveImpressions && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 lg:col-span-3 xl:col-span-3 transition-all shadow-sm">
            <h3 className="text-lg font-medium mb-6 text-slate-200 flex items-center gap-2">
              <Eye className="text-blue-400" size={18} />
              Impressions Trend
            </h3>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockData30D} margin={{top: 5, right: 0, left: 0, bottom: 0}}>
                  <defs>
                    {PLATFORMS.filter(p => activePlatforms[p] && isMetricActive(`${p}Impressions`)).map(p => (
                      <linearGradient key={p} id={`grad_imp_${p}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS[p]} stopOpacity={0.5}/>
                        <stop offset="95%" stopColor={COLORS[p]} stopOpacity={0}/>
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" tick={{fill: '#64748b', fontSize: 12}} />
                  <YAxis stroke="#64748b" tick={{fill: '#64748b', fontSize: 12}} width={48} tickFormatter={formatCompactNumber} />
                  <RechartsTooltip contentStyle={{backgroundColor: 'rgba(15, 23, 42, 0.95)', borderColor: '#334155', borderRadius: '12px'}} itemStyle={{color: '#f8fafc'}} />
                  {PLATFORMS.filter(p => activePlatforms[p] && isMetricActive(`${p}Impressions`)).map(p => (
                    <Area key={p} type="monotone" dataKey={`${p}Impressions`} name={`${p}`} stroke={COLORS[p]} fill={`url(#grad_imp_${p})`} fillOpacity={1} strokeWidth={2} />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Reach Trend */}
        {hasActiveReach && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 lg:col-span-3 xl:col-span-3 transition-all shadow-sm">
            <h3 className="text-lg font-medium mb-6 text-slate-200 flex items-center gap-2">
              <Users className="text-emerald-400" size={18} />
              Reach Trend
            </h3>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockData30D} margin={{top: 5, right: 0, left: 0, bottom: 0}}>
                  <defs>
                    {PLATFORMS.filter(p => activePlatforms[p] && isMetricActive(`${p}Reach`)).map(p => (
                      <linearGradient key={p} id={`grad_reach_${p}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS[p]} stopOpacity={0.5}/>
                        <stop offset="95%" stopColor={COLORS[p]} stopOpacity={0}/>
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" tick={{fill: '#64748b', fontSize: 12}} />
                  <YAxis stroke="#64748b" tick={{fill: '#64748b', fontSize: 12}} width={48} tickFormatter={formatCompactNumber} />
                  <RechartsTooltip contentStyle={{backgroundColor: 'rgba(15, 23, 42, 0.95)', borderColor: '#334155', borderRadius: '12px'}} itemStyle={{color: '#f8fafc'}} />
                  {PLATFORMS.filter(p => activePlatforms[p] && isMetricActive(`${p}Reach`)).map(p => (
                    <Area key={p} type="monotone" dataKey={`${p}Reach`} name={`${p}`} stroke={COLORS[p]} fill={`url(#grad_reach_${p})`} fillOpacity={1} strokeWidth={2} />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Clicks Trend */}
        {hasActiveClicks && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 lg:col-span-3 xl:col-span-3 transition-all shadow-sm">
            <h3 className="text-lg font-medium mb-6 text-slate-200 flex items-center gap-2">
              <PointerIcon className="text-pink-400" size={18} />
              Clicks Trend
            </h3>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockData30D} margin={{top: 5, right: 0, left: 0, bottom: 0}}>
                  <defs>
                    {PLATFORMS.filter(p => activePlatforms[p] && isMetricActive(`${p}Clicks`)).map(p => (
                      <linearGradient key={p} id={`grad_clicks_${p}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS[p]} stopOpacity={0.5}/>
                        <stop offset="95%" stopColor={COLORS[p]} stopOpacity={0}/>
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" tick={{fill: '#64748b', fontSize: 12}} />
                  <YAxis stroke="#64748b" tick={{fill: '#64748b', fontSize: 12}} width={48} tickFormatter={formatCompactNumber} />
                  <RechartsTooltip contentStyle={{backgroundColor: 'rgba(15, 23, 42, 0.95)', borderColor: '#334155', borderRadius: '12px'}} itemStyle={{color: '#f8fafc'}} />
                  {PLATFORMS.filter(p => activePlatforms[p] && isMetricActive(`${p}Clicks`)).map(p => (
                    <Area key={p} type="monotone" dataKey={`${p}Clicks`} name={`${p}`} stroke={COLORS[p]} fill={`url(#grad_clicks_${p})`} fillOpacity={1} strokeWidth={2} />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Views Trend */}
        {hasActiveViews && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 lg:col-span-3 xl:col-span-3 transition-all shadow-sm">
            <h3 className="text-lg font-medium mb-6 text-slate-200 flex items-center gap-2">
              <Tv className="text-orange-400" size={18} />
              Views Trend
            </h3>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockData30D} margin={{top: 5, right: 0, left: 0, bottom: 0}}>
                  <defs>
                    {PLATFORMS.filter(p => activePlatforms[p] && isMetricActive(`${p}Views`)).map(p => (
                      <linearGradient key={p} id={`grad_views_${p}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS[p]} stopOpacity={0.5}/>
                        <stop offset="95%" stopColor={COLORS[p]} stopOpacity={0}/>
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" tick={{fill: '#64748b', fontSize: 12}} />
                  <YAxis stroke="#64748b" tick={{fill: '#64748b', fontSize: 12}} width={48} tickFormatter={formatCompactNumber} />
                  <RechartsTooltip contentStyle={{backgroundColor: 'rgba(15, 23, 42, 0.95)', borderColor: '#334155', borderRadius: '12px'}} itemStyle={{color: '#f8fafc'}} />
                  {PLATFORMS.filter(p => activePlatforms[p] && isMetricActive(`${p}Views`)).map(p => (
                    <Area key={p} type="monotone" dataKey={`${p}Views`} name={`${p}`} stroke={COLORS[p]} fill={`url(#grad_views_${p})`} fillOpacity={1} strokeWidth={2} />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Actual vs Planned Conversions trend — only when conversions are active */}
        {hasActiveConversions && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 lg:col-span-3 xl:col-span-3 group hover:border-slate-700 transition-colors duration-300 shadow-sm flex flex-col">
            <div className="mb-6">
              <h3 className="text-lg font-medium text-slate-200 flex items-center gap-2 mb-3">
                <Target className="text-emerald-500" size={18}/> 
                Attributed Platform Conversions Trend
              </h3>
              <div className="flex flex-wrap gap-2 items-center text-xs text-slate-400 bg-slate-950/50 p-2.5 rounded-lg border border-slate-800 w-fit shadow-sm">
                 <span className="font-semibold text-slate-300 uppercase tracking-widest text-[10px]">Included Triggers:</span>
                 {activePlatforms.Google && isMetricActive('GoogleConversions') && <span className="bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded border border-emerald-500/20">Google Form Submits</span>}
                 {activePlatforms.Meta && isMetricActive('MetaConversions') && <span className="bg-amber-500/10 text-amber-400 px-2 py-1 rounded border border-amber-500/20">Meta Pixel Purchases</span>}
                 {activePlatforms.YouTube && isMetricActive('YouTubeConversions') && <span className="bg-red-500/10 text-red-400 px-2 py-1 rounded border border-red-500/20">YouTube CTA Clicks</span>}
                 <span className="ml-2 italic opacity-80">(Standardized by Normalization Engine via active UTM parameters)</span>
              </div>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockData30D} margin={{top: 10, right: 0, left: 0, bottom: 0}}>
                  <defs>
                    {Object.keys(COLORS).filter(k => k !== 'Web').map(key => (
                       <linearGradient key={key} id={`color${key}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS[key as keyof typeof COLORS]} stopOpacity={0.6}/>
                          <stop offset="95%" stopColor={COLORS[key as keyof typeof COLORS]} stopOpacity={0}/>
                       </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" tick={{fill: '#64748b', fontSize: 12}} tickMargin={10} minTickGap={20}/>
                  <YAxis stroke="#64748b" tick={{fill: '#64748b', fontSize: 12}} width={48} tickFormatter={formatCompactNumber} />
                  <RechartsTooltip 
                    contentStyle={{backgroundColor: 'rgba(15, 23, 42, 0.95)', borderColor: '#334155', borderRadius: '12px', backdropFilter: 'blur(8px)', color: '#fff'}}
                    itemStyle={{color: '#f8fafc', fontWeight: 500}}
                  />
                  
                  {activePlatforms.YouTube && isMetricActive('YouTubeConversions') && <Area type="monotone" dataKey="YouTubeConversions" name="YouTube Attributed" stroke={COLORS.YouTube} fillOpacity={1} fill="url(#colorYouTube)" strokeWidth={2}/>}
                  {activePlatforms.Meta && isMetricActive('MetaConversions') && <Area type="monotone" dataKey="MetaConversions" name="Meta Attributed" stroke={COLORS.Meta} fillOpacity={1} fill="url(#colorMeta)" strokeWidth={2}/>}
                  {activePlatforms.Google && isMetricActive('GoogleConversions') && <Area type="monotone" dataKey="GoogleConversions" name="Google Attributed" stroke={COLORS.Google} fillOpacity={1} fill="url(#colorGoogle)" strokeWidth={2}/>}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

      </div>
      
      {/* CSS for animations */}
      <style jsx global>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.92) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
      `}</style>
    </div>
  );
}
