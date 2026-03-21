"use client";

import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { Activity, DollarSign, MousePointerClick, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function Dashboard() {
  const [metrics, setMetrics] = useState<any[]>([]);
  
  useEffect(() => {
    // We would normally fetch from our FastAPI backend here
    // For now, we seed the UI with exactly what our Analyst Agent pulled from the Tata Neu report
    const mockData = [
      { name: 'July 16', DV360: 450000, AdWords: 120000, Meta: 210000 },
      { name: 'July 20', DV360: 520000, AdWords: 135000, Meta: 250000 },
      { name: 'July 25', DV360: 480000, AdWords: 150000, Meta: 280000 },
      { name: 'Aug 1', DV360: 610000, AdWords: 180000, Meta: 310000 },
      { name: 'Aug 10', DV360: 590000, AdWords: 210000, Meta: 290000 },
      { name: 'Aug 15', DV360: 750000, AdWords: 250000, Meta: 350000 },
      { name: 'Aug 22', DV360: 820000, AdWords: 280000, Meta: 410000 },
    ];
    setMetrics(mockData);
  }, []);

  const cpcData = [
    { platform: 'DV360', cpc: 34.69, fill: '#ef4444' },
    { platform: 'Meta', cpc: 12.44, fill: '#f59e0b' },
    { platform: 'AdWords', cpc: 3.22, fill: '#10b981' }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-8 font-sans">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
          <Activity className="text-blue-500" />
          Agentic Unified Command Center
        </h1>
        <p className="text-slate-400 mt-2">Aggregated universal metrics powered by automated Python fetchers.</p>
      </header>

      {/* AI Analyst Executive Brief */}
      <div className="bg-slate-900 border border-blue-500/30 rounded-xl p-6 mb-8 shadow-lg shadow-blue-500/5">
        <h2 className="text-xl font-semibold text-blue-400 flex items-center gap-2 mb-4">
          <div className="animate-pulse w-2 h-2 bg-blue-500 rounded-full"></div>
          AI Analyst Agent: Daily Executive Brief
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex gap-3 items-start">
            <AlertCircle className="text-red-500 shrink-0 mt-1" />
            <div>
              <p className="font-medium text-slate-200">Critical Anomaly: DV360 Budget Bleed</p>
              <p className="text-sm text-slate-400 mt-1">Consumed ₹26.2M (56% of total budget) for a dismal 0.48% CTR and ₹34.69 CPC. Action: Pause immediately.</p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <CheckCircle2 className="text-emerald-500 shrink-0 mt-1" />
            <div>
              <p className="font-medium text-slate-200">Top Performer: Google AdWords</p>
              <p className="text-sm text-slate-400 mt-1">Spent only 12% of budget (₹5.6M) but drove 47% of all clicks at a stellar ₹3.22 CPC.</p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="text-slate-400 text-sm font-medium mb-1 flex items-center gap-2"><DollarSign size={16}/> Total Spend</div>
          <div className="text-3xl font-bold">₹46.4M</div>
          <div className="text-emerald-500 text-xs mt-2 font-medium">Synced 12 mins ago</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="text-slate-400 text-sm font-medium mb-1 flex items-center gap-2"><MousePointerClick size={16}/> Total Clicks</div>
          <div className="text-3xl font-bold">3.69M</div>
          <div className="text-emerald-500 text-xs mt-2 font-medium">Normalized universally</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="text-slate-400 text-sm font-medium mb-1 flex items-center gap-2"><TrendingUp size={16}/> Overall CTR</div>
          <div className="text-3xl font-bold text-amber-500">0.86%</div>
          <div className="text-slate-500 text-xs mt-2 font-medium">Dragged down by DV360</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="text-slate-400 text-sm font-medium mb-1 flex items-center gap-2"><DollarSign size={16}/> Blended CPC</div>
          <div className="text-3xl font-bold">₹12.59</div>
          <div className="text-slate-500 text-xs mt-2 font-medium">Across all platforms</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 lg:col-span-2">
          <h3 className="text-lg font-medium mb-6 text-slate-200">Spend Trajectory by Platform (Daily)</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" tick={{fill: '#64748b'}} />
                <YAxis stroke="#64748b" tick={{fill: '#64748b'}} />
                <Tooltip contentStyle={{backgroundColor: '#0f172a', borderColor: '#1e293b'}} />
                <Legend />
                <Line type="monotone" dataKey="DV360" stroke="#ef4444" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="Meta" stroke="#f59e0b" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="AdWords" stroke="#10b981" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h3 className="text-lg font-medium mb-6 text-slate-200">Cost Per Click (CPC) Efficiency</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cpcData} layout="vertical" margin={{top: 0, right: 30, left: 20, bottom: 0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" stroke="#64748b" tick={{fill: '#64748b'}} />
                <YAxis dataKey="platform" type="category" stroke="#64748b" tick={{fill: '#e2e8f0'}} width={60} />
                <Tooltip cursor={{fill: '#1e293b'}} contentStyle={{backgroundColor: '#0f172a', borderColor: '#1e293b'}} />
                <Bar dataKey="cpc" radius={[0, 4, 4, 0]} label={{ position: 'right', fill: '#e2e8f0', formatter: (val:any) => `₹${val}` }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
