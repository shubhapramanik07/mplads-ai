import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  IndianRupee, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp, 
  Layers, 
  Search, 
  Sparkles,
  ShieldCheck,
  FileSpreadsheet,
  ArrowUpRight,
  Filter,
  Calculator,
  Cpu
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';
import KPICard from '../components/KPICard';
import RiskBadge from '../components/RiskBadge';
import { fetchKPIs, fetchStateSummaries, fetchWorkTypes, fetchAlerts, formatINR } from '../services/api';

export default function OverviewView({ onSelectWork, onNavigate }) {
  const [kpis, setKpis] = useState(null);
  const [states, setStates] = useState([]);
  const [workTypes, setWorkTypes] = useState([]);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [kpisData, stateData, wtData, alertsData] = await Promise.all([
        fetchKPIs(),
        fetchStateSummaries(),
        fetchWorkTypes(),
        fetchAlerts({ limit: 6, min_risk_score: 70 })
      ]);
      setKpis(kpisData);
      setStates(stateData || []);
      setWorkTypes(wtData || []);
      setRecentAlerts(alertsData?.alerts || []);
      setLoading(false);
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gov-navy"></div>
          <span className="text-sm font-semibold text-slate-600">Loading DigiGov National Intelligence...</span>
        </div>
      </div>
    );
  }

  const topStates = states.slice(0, 10).map(s => ({
    name: s.state,
    totalWorks: s.total_works,
    highRisk: s.high_risk_count,
    avgRisk: s.avg_risk_score,
    outlay: s.total_amount_crores
  }));

  const riskPieData = [
    { name: 'Normal / Compliant (<40)', value: kpis?.low_risk_count || 0, color: '#16A34A' },
    { name: 'Moderate Review (40-69)', value: kpis?.medium_risk_count || 0, color: '#F59E0B' },
    { name: 'High Risk / Action Required (≥70)', value: kpis?.high_risk_count || 0, color: '#DC2626' }
  ];

  return (
    <div className="space-y-6">
      
      {/* DigiGov Hero Banner */}
      <div className="bg-gradient-to-r from-gov-navy via-[#113264] to-[#1E3A8A] rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>
        
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-bold mb-3 backdrop-blur-xs border border-white/10">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI-Driven DigiGov Vigilance Architecture</span>
          </div>
          
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
            National MPLADS Anomaly, Fraud & Inefficiency Intelligence
          </h1>
          
          <p className="mt-2 text-sm sm:text-base text-blue-100/90 leading-relaxed">
            Real-time monitoring of <strong className="text-white">43,496 completed works</strong> across <strong className="text-white">33 States/UTs</strong> and <strong className="text-white">655 MPs</strong>. Powered by Isolation Forest price modeling, NLP duplicate work detection, and agency monopoly radars.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={() => onNavigate('alerts')}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 text-xs font-bold rounded-lg transition-all shadow-md flex items-center gap-2"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Review Priority High-Risk Queue ({kpis?.high_risk_count || 0})</span>
            </button>

            <button
              onClick={() => onNavigate('state')}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-lg transition-all border border-white/20 flex items-center gap-2"
            >
              <Layers className="w-4 h-4" />
              <span>Explore State & Agency Radar</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard
          title="Total Works Tracked"
          value={(kpis?.total_works || 0).toLocaleString()}
          subtitle="Across 33 States & UTs"
          icon={Building2}
          color="blue"
        />

        <KPICard
          title="Cumulative Outlay"
          value={`₹${kpis?.total_amount_crores || 0} Cr`}
          subtitle="Direct Scheme Utilization"
          icon={IndianRupee}
          color="emerald"
        />

        <KPICard
          title="Flagged High-Risk"
          value={(kpis?.high_risk_count || 0).toLocaleString()}
          subtitle={`${kpis?.high_risk_percentage || 0}% of national total`}
          icon={AlertTriangle}
          color="red"
          badge="Priority"
        />

        <KPICard
          title="Average Risk Index"
          value={`${kpis?.avg_risk_score || 0} / 100`}
          subtitle="Composite Anomaly Index"
          icon={TrendingUp}
          color="amber"
        />

        <KPICard
          title="Duplicate Works Caught"
          value={(kpis?.duplicate_works_count || 0).toLocaleString()}
          subtitle={`${kpis?.missing_images_count || 0} Missing Photos`}
          icon={ShieldCheck}
          color="purple"
        />
      </div>

      {/* Risk Scoring Architecture Decomposition Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-blue-600" />
              <span>Mathematical AI Risk Scoring Methodology (0–100 Scale)</span>
            </h3>
            <p className="text-xs text-slate-500">Explainable AI fusion model combining 4 calibrated anomaly dimensions</p>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded bg-blue-50 text-blue-800 border border-blue-200">
            Formula: S = 0.35·C + 0.35·D + 0.15·M + 0.15·I
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 space-y-1.5">
            <div className="text-xs font-bold text-blue-950 flex items-center justify-between">
              <span>1. Cost Outlier Modeling</span>
              <span className="bg-blue-200 text-blue-900 px-1.5 py-0.5 rounded text-[10px] font-extrabold">35%</span>
            </div>
            <p className="text-[11px] text-blue-900 font-medium">
              Isolation Forest + category & state peer median deviation (&gt;50% price inflation flags).
            </p>
          </div>

          <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-200 space-y-1.5">
            <div className="text-xs font-bold text-purple-950 flex items-center justify-between">
              <span>2. Duplicate Work Detection</span>
              <span className="bg-purple-200 text-purple-900 px-1.5 py-0.5 rounded text-[10px] font-extrabold">35%</span>
            </div>
            <p className="text-[11px] text-purple-900 font-medium">
              TF-IDF NLP + Cosine Similarity (&ge;70% similarity between works recommended by same MP).
            </p>
          </div>

          <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 space-y-1.5">
            <div className="text-xs font-bold text-amber-950 flex items-center justify-between">
              <span>3. Visual Compliance Proof</span>
              <span className="bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded text-[10px] font-extrabold">15%</span>
            </div>
            <p className="text-[11px] text-amber-900 font-medium">
              Flags high-value projects executed without mandatory geo-tagged inspection photos.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-1.5">
            <div className="text-xs font-bold text-emerald-950 flex items-center justify-between">
              <span>4. Agency Monopoly Radar</span>
              <span className="bg-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded text-[10px] font-extrabold">15%</span>
            </div>
            <p className="text-[11px] text-emerald-900 font-medium">
              Identifies single Implementing District Agencies managing &gt;35% of total state funds.
            </p>
          </div>
        </div>
      </div>

      {/* Main Visualizations Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* State-Wise Work Volume vs High Risk */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">State-wise Works Volume & High-Risk Disparity</h3>
              <p className="text-xs text-slate-500">Top 10 States by total completed works volume</p>
            </div>
            <button 
              onClick={() => onNavigate('ministry')}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <span>View All 33 States</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topStates} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" angle={-25} textAnchor="end" interval={0} tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip 
                  formatter={(val, name) => [name === 'outlay' ? `₹${val} Cr` : val.toLocaleString(), name === 'totalWorks' ? 'Total Works' : name === 'highRisk' ? 'High Risk' : 'Outlay']}
                  contentStyle={{ backgroundColor: '#0F172A', color: '#FFF', borderRadius: '8px', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="totalWorks" fill="#1E3A8A" name="Total Completed Works" radius={[4, 4, 0, 0]} />
                <Bar dataKey="highRisk" fill="#DC2626" name="Flagged High Risk" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Distribution Pie */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">National Risk Breakdown</h3>
            <p className="text-xs text-slate-500">Distribution across 0–100 AI Risk Scoring bands</p>
          </div>

          <div className="h-60 w-full flex items-center justify-center my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {riskPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(val) => [val.toLocaleString(), 'Works']}
                  contentStyle={{ backgroundColor: '#0F172A', color: '#FFF', borderRadius: '8px', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 border-t border-slate-100 pt-3">
            {riskPieData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                  <span className="font-semibold text-slate-700">{item.name}</span>
                </div>
                <span className="font-extrabold text-slate-900">{item.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Row 2: Category Breakdown & Priority Vigilance Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Work Category Share */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <h3 className="text-sm font-extrabold text-slate-900">Expenditure by Work Category</h3>
          <p className="text-xs text-slate-500 mb-4">Outlay distribution across 10 standardized categories</p>

          <div className="space-y-3">
            {workTypes.slice(0, 6).map((wt, idx) => {
              const maxOutlay = Math.max(...workTypes.map(w => w.total_amount_crores || 1));
              const pct = ((wt.total_amount_crores / maxOutlay) * 100).toFixed(0);
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-700">
                    <span className="capitalize">{wt.work_type.replace('_', ' ')}</span>
                    <span className="font-bold text-slate-900">₹{wt.total_amount_crores} Cr <span className="text-[10px] font-normal text-slate-400">({wt.total_works.toLocaleString()} works)</span></span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-gov-blue"
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Priority Vigilance Queue */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span>Priority Vigilance Queue (Score ≥ 70)</span>
              </h3>
              <p className="text-xs text-slate-500">Live projects requiring immediate physical / BoQ audit</p>
            </div>
            <button
              onClick={() => onNavigate('alerts')}
              className="text-xs font-bold text-red-600 hover:text-red-800 flex items-center gap-1"
            >
              <span>View All Alerts</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {recentAlerts.map((alert, idx) => (
              <div 
                key={idx}
                onClick={() => onSelectWork(alert)}
                className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
              >
                <div className="space-y-1 max-w-xl">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      #{alert.work_id}
                    </span>
                    <span className="text-xs font-semibold text-slate-700 bg-blue-50 text-blue-700 px-2 py-0.5 rounded capitalize">
                      {alert.work_type}
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      {alert.state} — {alert.constituency}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-800 line-clamp-1 group-hover:text-blue-900">
                    "{alert.work_description}"
                  </p>
                  <div className="text-[11px] text-red-700 font-medium line-clamp-1">
                    ⚠️ {alert.risk_reasons?.[0] || 'High multi-factor anomaly detected'}
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between shrink-0 gap-1.5">
                  <span className="text-xs font-extrabold text-slate-900">{formatINR(alert.final_amount)}</span>
                  <RiskBadge score={alert.risk_score} category={alert.risk_category} />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
