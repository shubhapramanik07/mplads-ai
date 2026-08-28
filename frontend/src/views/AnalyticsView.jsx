import React, { useState, useEffect } from 'react';
import { 
  LineChart, 
  Line, 
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
import { 
  TrendingUp, 
  IndianRupee, 
  Layers, 
  Building2, 
  AlertTriangle,
  PieChart as PieIcon
} from 'lucide-react';
import KPICard from '../components/KPICard';
import { fetchAnalytics, fetchDashboardSummary, fetchStates, formatINR } from '../services/api';

export default function AnalyticsView({ currentRole, selectedScope }) {
  const [analytics, setAnalytics] = useState(null);
  const [summary, setSummary] = useState(null);
  const [states, setStates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [analRes, sumRes, stRes] = await Promise.all([
        fetchAnalytics(currentRole, selectedScope.state, selectedScope.district, selectedScope.mpName),
        fetchDashboardSummary(currentRole, selectedScope.state, selectedScope.district, selectedScope.mpName),
        fetchStates()
      ]);
      setAnalytics(analRes);
      setSummary(sumRes);
      setStates(stRes || []);
      setLoading(false);
    }
    loadData();
  }, [currentRole, selectedScope]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gov-navy"></div>
      </div>
    );
  }

  const topStatesUtilization = states.slice(0, 10).map(s => ({
    name: s.state,
    utilization: s.fund_utilization_pct,
    expenditure: s.total_expenditure_crores,
    sanctioned: s.total_sanctioned_crores
  }));

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-bold text-gov-navy uppercase tracking-wider">
          <TrendingUp className="w-4 h-4 text-blue-600" />
          <span>Macro Financial Analytics & Vigilance Trends</span>
        </div>
        <h2 className="text-xl font-black text-slate-900 mt-1">MPLADS Fund Utilization & Risk Analytics</h2>
        <p className="text-xs text-slate-500 mt-0.5">Comprehensive time-series expenditure trends, work-category allocation shares, and risk concentration patterns</p>
      </div>

      {/* Analytics KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KPICard title="Total Expenditure" value={`₹${summary?.total_expenditure_crores || 0} Cr`} subtitle="Realized Scheme Outlay" color="emerald" />
        <KPICard title="Fund Utilization" value={`${summary?.fund_utilization_pct || 0}%`} subtitle="Efficiency Ratio" color="blue" />
        <KPICard title="Average Risk Index" value={`${summary?.avg_risk_score || 0} / 100`} subtitle="Composite Score" color="amber" />
        <KPICard title="High-Risk Projects" value={(summary?.high_risk_projects || 0).toLocaleString()} subtitle="Audit Required" color="red" />
      </div>

      {/* Row 1: Monthly Trend & Risk Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Monthly Trend */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <h3 className="text-sm font-extrabold text-slate-900 mb-1">Monthly Scheme Expenditure & Completion Trajectory</h3>
          <p className="text-xs text-slate-500 mb-4">Historical disbursement velocity over time (in ₹ Crores)</p>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics?.monthly_trend || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} unit="Cr" />
                <Tooltip contentStyle={{ backgroundColor: '#0F172A', color: '#FFF', borderRadius: '8px', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Line type="monotone" dataKey="expenditure_crores" stroke="#1A56DB" strokeWidth={2.5} name="Expenditure (₹ Cr)" dot={{ r: 3 }} />
                <Line type="monotone" dataKey="completed_projects" stroke="#046A38" strokeWidth={2} name="Completed Works" dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Breakdown */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 mb-1">Risk Severity Breakdown</h3>
            <p className="text-xs text-slate-500 mb-2">Projects segmented across 4 AI risk tiers</p>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics?.risk_distribution || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="count"
                >
                  {(analytics?.risk_distribution || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0F172A', color: '#FFF', borderRadius: '8px', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 border-t border-slate-100 pt-3">
            {(analytics?.risk_distribution || []).map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                  <span>{item.name}</span>
                </div>
                <span className="font-extrabold text-slate-900">{item.count.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Row 2: Category Expenditure & State Utilization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Category Breakdown */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <h3 className="text-sm font-extrabold text-slate-900 mb-1">Work Category Expenditure & Risk Load</h3>
          <p className="text-xs text-slate-500 mb-4">Total outlay (₹ Cr) vs high-risk project volume by category</p>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.work_type_distribution || []} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="work_type" angle={-20} textAnchor="end" interval={0} tick={{ fontSize: 10, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} unit="Cr" />
                <Tooltip contentStyle={{ backgroundColor: '#0F172A', color: '#FFF', borderRadius: '8px', fontSize: '12px' }} />
                <Bar dataKey="expenditure_crores" fill="#1E3A8A" name="Expenditure (₹ Cr)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* State Utilization */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <h3 className="text-sm font-extrabold text-slate-900 mb-1">Top States: Fund Utilization Efficiency (%)</h3>
          <p className="text-xs text-slate-500 mb-4">Ratio of realized expenditure vs sanctioned outlay</p>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topStatesUtilization} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" angle={-25} textAnchor="end" interval={0} tick={{ fontSize: 10, fill: '#64748B' }} />
                <YAxis domain={[0, 120]} tick={{ fontSize: 11, fill: '#64748B' }} unit="%" />
                <Tooltip contentStyle={{ backgroundColor: '#0F172A', color: '#FFF', borderRadius: '8px', fontSize: '12px' }} />
                <Bar dataKey="utilization" fill="#046A38" name="Fund Utilization (%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
}
