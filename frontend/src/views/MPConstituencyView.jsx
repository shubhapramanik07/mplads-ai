import React, { useState, useEffect } from 'react';
import { 
  UserCheck, 
  Search, 
  IndianRupee, 
  AlertTriangle, 
  Building2, 
  Copy, 
  CheckCircle2,
  TrendingUp,
  FileText
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import RiskBadge from '../components/RiskBadge';
import { fetchMPSummaries, fetchWorks, fetchBenchmarks, formatINR } from '../services/api';

export default function MPConstituencyView({ onSelectWork }) {
  const [mps, setMps] = useState([]);
  const [selectedMpName, setSelectedMpName] = useState('');
  const [mpWorks, setMpWorks] = useState([]);
  const [benchmarks, setBenchmarks] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    async function loadMPs() {
      setLoading(true);
      const mpList = await fetchMPSummaries();
      setMps(mpList || []);
      if (mpList && mpList.length > 0) {
        setSelectedMpName(mpList[0].mp_name);
      }
      setLoading(false);
    }
    loadMPs();
  }, []);

  useEffect(() => {
    if (!selectedMpName) return;
    async function loadMPData() {
      setDetailsLoading(true);
      const currentMP = mps.find(m => m.mp_name === selectedMpName);
      const [worksRes, benchRes] = await Promise.all([
        fetchWorks({ mp_name: selectedMpName, limit: 100 }),
        fetchBenchmarks(selectedMpName, currentMP?.state || '')
      ]);
      setMpWorks(worksRes?.data || []);
      setBenchmarks(benchRes);
      setDetailsLoading(false);
    }
    loadMPData();
  }, [selectedMpName, mps]);

  const currentMpMeta = mps.find(m => m.mp_name === selectedMpName);

  const duplicateWorks = mpWorks.filter(w => w.is_duplicate);

  const benchmarkChartData = (benchmarks?.benchmarks || [])
    .filter(b => b.mp_avg_cost_lakhs > 0 || b.state_avg_cost_lakhs > 0)
    .map(b => ({
      category: b.work_type.replace('_', ' '),
      mpAvg: b.mp_avg_cost_lakhs,
      stateAvg: b.state_avg_cost_lakhs,
      nationalAvg: b.national_avg_cost_lakhs,
      count: b.mp_works_count
    }));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gov-navy"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* MP Selector Bar */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-gov-navy uppercase tracking-wider">
            <UserCheck className="w-4 h-4 text-blue-600" />
            <span>Member of Parliament (MP) Portfolio & Cost Benchmark Comparator</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 mt-1">Constituency Work Intelligence</h2>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-slate-500 uppercase">Select MP:</label>
          <select
            value={selectedMpName}
            onChange={(e) => setSelectedMpName(e.target.value)}
            className="px-4 py-2 text-sm font-bold bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden shadow-xs cursor-pointer min-w-[260px] max-w-sm truncate"
          >
            {mps.map((m, idx) => (
              <option key={idx} value={m.mp_name}>
                {m.mp_name} — {m.constituency} ({m.state})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* MP Profile Cards */}
      {currentMpMeta && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs border-l-4 border-l-blue-600 col-span-2 sm:col-span-1">
            <div className="text-xs font-bold text-slate-500 uppercase">Constituency / House</div>
            <div className="text-base font-extrabold text-slate-900 mt-1">{currentMpMeta.constituency}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">{currentMpMeta.state} ({currentMpMeta.house})</div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs border-l-4 border-l-indigo-600">
            <div className="text-xs font-bold text-slate-500 uppercase">Works Monitored</div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">{currentMpMeta.total_works.toLocaleString()}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Recommendations</div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs border-l-4 border-l-emerald-600">
            <div className="text-xs font-bold text-slate-500 uppercase">Sanctioned Outlay</div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">₹{currentMpMeta.total_amount_crores} Cr</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Total Funds Allocated</div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs border-l-4 border-l-red-600">
            <div className="text-xs font-bold text-slate-500 uppercase">High-Risk Projects</div>
            <div className="text-2xl font-extrabold text-red-600 mt-1">{currentMpMeta.high_risk_count}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Avg Risk: {currentMpMeta.avg_risk_score}/100</div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs border-l-4 border-l-purple-600">
            <div className="text-xs font-bold text-slate-500 uppercase">Duplicate Flags</div>
            <div className="text-2xl font-extrabold text-purple-700 mt-1">{duplicateWorks.length}</div>
            <div className="text-[11px] text-purple-600 font-semibold mt-0.5">NLP Matches (&ge;75%)</div>
          </div>
        </div>
      )}

      {/* Cost Benchmark Comparison Chart */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">Average Project Cost Benchmark (in ₹ Lakhs)</h3>
            <p className="text-xs text-slate-500">
              Compares <strong className="text-slate-800">{selectedMpName}'s</strong> average cost against State and National peer-group medians
            </p>
          </div>
        </div>

        <div className="h-72 w-full">
          {benchmarkChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={benchmarkChartData} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="category" angle={-20} textAnchor="end" interval={0} tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} unit="L" />
                <Tooltip 
                  formatter={(val) => [`₹${val} Lakhs`, '']}
                  contentStyle={{ backgroundColor: '#0F172A', color: '#FFF', borderRadius: '8px', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="mpAvg" fill="#1E3A8A" name={`MP Average (${selectedMpName})`} radius={[4, 4, 0, 0]} />
                <Bar dataKey="stateAvg" fill="#3B82F6" name="State Average" radius={[4, 4, 0, 0]} />
                <Bar dataKey="nationalAvg" fill="#94A3B8" name="National Peer Average" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              No comparative cost data available for this MP.
            </div>
          )}
        </div>
      </div>

      {/* Duplicate Works Alert Box */}
      {duplicateWorks.length > 0 && (
        <div className="bg-purple-50/80 border border-purple-200 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-purple-900 font-extrabold text-sm">
            <Copy className="w-4 h-4 text-purple-600" />
            <span>Potential Duplicate Works Flagged in Constituency ({duplicateWorks.length})</span>
          </div>
          <p className="text-xs text-purple-800">
            These works share high textual and semantic similarity with other recommendations by the same MP. Verify whether duplicate tenders were executed.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            {duplicateWorks.map((work, idx) => (
              <div 
                key={idx}
                onClick={() => onSelectWork(work)}
                className="p-3.5 bg-white rounded-xl border border-purple-200 hover:border-purple-400 transition-all cursor-pointer space-y-1.5 shadow-2xs"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-purple-900">#{work.work_id}</span>
                  <span className="font-extrabold text-slate-900">{formatINR(work.final_amount)}</span>
                </div>
                <p className="text-xs font-semibold text-slate-800 line-clamp-2">"{work.work_description}"</p>
                <div className="text-[11px] text-purple-700 font-medium line-clamp-1">
                  ⚠️ {work.risk_reasons?.[0] || 'Duplicate description match'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MP Works Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-slate-900">
            Complete Constituency Works Portfolio ({mpWorks.length} Works)
          </h3>
          <span className="text-xs text-slate-500">Click any row to open full audit dossier</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3">Work ID & Category</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Agency (IDA)</th>
                <th className="px-4 py-3 text-right">Cost</th>
                <th className="px-4 py-3 text-center">Images</th>
                <th className="px-6 py-3 text-right">Risk Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
              {mpWorks.map((work, idx) => (
                <tr 
                  key={idx}
                  onClick={() => onSelectWork(work)}
                  className="hover:bg-blue-50/40 transition-colors cursor-pointer"
                >
                  <td className="px-6 py-3.5 whitespace-nowrap">
                    <div className="font-mono font-bold text-slate-900">#{work.work_id}</div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">{work.work_type}</span>
                  </td>
                  <td className="px-4 py-3.5 max-w-sm">
                    <p className="line-clamp-2 text-slate-800 font-semibold">{work.work_description}</p>
                  </td>
                  <td className="px-4 py-3.5 text-slate-600 truncate max-w-[180px]">
                    {work.ida}
                  </td>
                  <td className="px-4 py-3.5 text-right font-extrabold text-slate-900 whitespace-nowrap">
                    {formatINR(work.final_amount)}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    {work.has_images ? (
                      <span className="text-emerald-700 font-bold text-[10px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">✅</span>
                    ) : (
                      <span className="text-rose-700 font-bold text-[10px] bg-rose-50 px-2 py-0.5 rounded border border-rose-200">❌ Missing</span>
                    )}
                  </td>
                  <td className="px-6 py-3.5 text-right whitespace-nowrap">
                    <RiskBadge score={work.risk_score} category={work.risk_category} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
