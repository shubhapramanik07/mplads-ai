import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  ArrowUpDown, 
  Search, 
  TrendingUp, 
  IndianRupee, 
  AlertTriangle,
  FileSpreadsheet,
  Layers
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  Legend
} from 'recharts';
import RiskBadge from '../components/RiskBadge';
import { fetchStateSummaries, fetchKPIs, fetchWorks, formatINR } from '../services/api';

export default function MinistryView({ onSelectWork }) {
  const [states, setStates] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('total_works');
  const [sortAsc, setSortAsc] = useState(false);
  const [topAlerts, setTopAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [stateData, worksData] = await Promise.all([
        fetchStateSummaries(),
        fetchWorks({ min_risk_score: 70, limit: 10 })
      ]);
      setStates(stateData || []);
      setTopAlerts(worksData?.data || []);
      setLoading(false);
    }
    loadData();
  }, []);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const filteredStates = states
    .filter(s => s.state.toLowerCase().includes(searchTerm.toLowerCase()) || (s.top_ida || '').toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      const vA = a[sortField];
      const vB = b[sortField];
      if (typeof vA === 'string') {
        return sortAsc ? vA.localeCompare(vB) : vB.localeCompare(vA);
      }
      return sortAsc ? vA - vB : vB - vA;
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gov-navy"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-gov-saffron uppercase tracking-wider">
            <Building2 className="w-4 h-4" />
            <span>Ministry of Statistics & Programme Implementation (MoSPI)</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 mt-1">National Executive Leaderboard</h2>
          <p className="text-xs text-slate-500 mt-0.5">Macro oversight of fund allocation, risk velocity, and dominant district agencies across all 33 States & UTs</p>
        </div>

        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search state or agency..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-slate-50 font-medium"
          />
        </div>
      </div>

      {/* State Leaderboard Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-slate-900">
            State & Union Territory Performance Rankings ({filteredStates.length})
          </h3>
          <span className="text-xs text-slate-500">Click column headers to sort</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3 cursor-pointer" onClick={() => handleSort('state')}>
                  <div className="flex items-center gap-1">State / UT <ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                </th>
                <th className="px-4 py-3 cursor-pointer text-right" onClick={() => handleSort('total_works')}>
                  <div className="flex items-center justify-end gap-1">Total Works <ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                </th>
                <th className="px-4 py-3 cursor-pointer text-right" onClick={() => handleSort('total_amount_crores')}>
                  <div className="flex items-center justify-end gap-1">Outlay (₹ Cr) <ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                </th>
                <th className="px-4 py-3 cursor-pointer text-right" onClick={() => handleSort('high_risk_count')}>
                  <div className="flex items-center justify-end gap-1">High Risk Works <ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                </th>
                <th className="px-4 py-3 cursor-pointer text-right" onClick={() => handleSort('avg_risk_score')}>
                  <div className="flex items-center justify-end gap-1">Avg Risk Index <ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                </th>
                <th className="px-6 py-3">Dominant Implementing Agency (IDA)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
              {filteredStates.map((st, idx) => (
                <tr key={idx} className="hover:bg-blue-50/40 transition-colors">
                  <td className="px-6 py-3.5 font-bold text-slate-900">{st.state}</td>
                  <td className="px-4 py-3.5 text-right font-extrabold">{st.total_works.toLocaleString()}</td>
                  <td className="px-4 py-3.5 text-right font-bold text-slate-900">₹{st.total_amount_crores} Cr</td>
                  <td className="px-4 py-3.5 text-right">
                    <span className={`px-2 py-0.5 rounded font-extrabold text-[11px] ${
                      st.high_risk_count > 200 ? 'bg-red-100 text-red-800' : st.high_risk_count > 50 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {st.high_risk_count.toLocaleString()} ({st.high_risk_rate_pct}%)
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <span className={`font-extrabold ${st.avg_risk_score >= 30 ? 'text-red-600' : st.avg_risk_score >= 20 ? 'text-amber-600' : 'text-emerald-700'}`}>
                      {st.avg_risk_score.toFixed(1)} / 100
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-slate-600">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate max-w-[220px]" title={st.top_ida}>{st.top_ida}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 shrink-0">
                        {st.top_ida_share_pct}% share
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top National Risk Highlights */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <h3 className="text-sm font-extrabold text-slate-900 mb-1 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-500" />
          <span>Top Priority Audit Projects Nationally</span>
        </h3>
        <p className="text-xs text-slate-500 mb-4">Click any project to inspect full bill of quantities & risk justifications</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {topAlerts.map((work, idx) => (
            <div 
              key={idx}
              onClick={() => onSelectWork(work)}
              className="p-4 rounded-xl border border-slate-200 hover:border-red-400 hover:bg-red-50/20 transition-all cursor-pointer space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                    #{work.work_id}
                  </span>
                  <RiskBadge score={work.risk_score} category={work.risk_category} />
                </div>
                <span className="text-xs font-extrabold text-slate-900">{formatINR(work.final_amount)}</span>
              </div>

              <p className="text-xs font-semibold text-slate-800 line-clamp-2 group-hover:text-blue-900">
                "{work.work_description}"
              </p>

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                <span>{work.mp_name} ({work.state})</span>
                <span className="text-red-700 font-bold">⚠️ {work.risk_reasons?.[0] || 'High Risk'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
