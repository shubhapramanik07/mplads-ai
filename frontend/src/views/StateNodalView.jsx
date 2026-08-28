import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Layers, 
  Search, 
  AlertTriangle, 
  IndianRupee, 
  CheckCircle2, 
  Camera,
  Filter,
  ArrowUpDown
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend,
  ReferenceLine
} from 'recharts';
import RiskBadge from '../components/RiskBadge';
import { fetchStateSummaries, fetchIDASummaries, fetchWorks, formatINR } from '../services/api';

export default function StateNodalView({ onSelectWork }) {
  const [states, setStates] = useState([]);
  const [selectedState, setSelectedState] = useState('');
  const [idaData, setIdaData] = useState([]);
  const [works, setWorks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [worksLoading, setWorksLoading] = useState(false);

  useEffect(() => {
    async function loadStates() {
      setLoading(true);
      const stateList = await fetchStateSummaries();
      setStates(stateList || []);
      if (stateList && stateList.length > 0) {
        setSelectedState(stateList[0].state);
      }
      setLoading(false);
    }
    loadStates();
  }, []);

  useEffect(() => {
    if (!selectedState) return;
    async function loadStateDetails() {
      setWorksLoading(true);
      const [idaRes, worksRes] = await Promise.all([
        fetchIDASummaries(selectedState),
        fetchWorks({ state: selectedState, limit: 200 })
      ]);
      setIdaData(idaRes || []);
      setWorks(worksRes?.data || []);
      setWorksLoading(false);
    }
    loadStateDetails();
  }, [selectedState]);

  const currentStateMeta = states.find(s => s.state.toLowerCase() === selectedState.toLowerCase());

  const filteredWorks = works.filter(w => {
    const matchesSearch = 
      searchTerm === '' ||
      w.work_description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.work_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.mp_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.constituency.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCat = categoryFilter === 'ALL' || w.work_type.toLowerCase() === categoryFilter.toLowerCase();
    const matchesRisk = riskFilter === 'ALL' || w.risk_category.toUpperCase() === riskFilter.toUpperCase();

    return matchesSearch && matchesCat && matchesRisk;
  });

  const idaChartData = idaData.slice(0, 8).map(i => ({
    name: i.ida.length > 25 ? i.ida.substring(0, 25) + '...' : i.ida,
    fullName: i.ida,
    worksShare: i.works_share_pct,
    fundsShare: i.amount_share_pct,
    outlay: i.amount_crores,
    isMonopoly: i.is_monopoly_risk
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
      
      {/* State Selector Bar */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-gov-navy uppercase tracking-wider">
            <Layers className="w-4 h-4 text-blue-600" />
            <span>State Nodal Officer & Agency Concentration Radar</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 mt-1">State Jurisdictional Intelligence</h2>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-slate-500 uppercase">Select State / UT:</label>
          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="px-4 py-2 text-sm font-bold bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden shadow-xs cursor-pointer min-w-[200px]"
          >
            {states.map((s, idx) => (
              <option key={idx} value={s.state}>{s.state} ({s.total_works.toLocaleString()} works)</option>
            ))}
          </select>
        </div>
      </div>

      {/* State KPI Summary */}
      {currentStateMeta && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs border-l-4 border-l-blue-600">
            <div className="text-xs font-bold text-slate-500 uppercase">State Total Works</div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">{currentStateMeta.total_works.toLocaleString()}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Completed Works Monitored</div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs border-l-4 border-l-emerald-600">
            <div className="text-xs font-bold text-slate-500 uppercase">State Total Outlay</div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">₹{currentStateMeta.total_amount_crores} Cr</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Cumulative Expenditure</div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs border-l-4 border-l-red-600">
            <div className="text-xs font-bold text-slate-500 uppercase">High-Risk Projects</div>
            <div className="text-2xl font-extrabold text-red-600 mt-1">{currentStateMeta.high_risk_count.toLocaleString()}</div>
            <div className="text-[11px] text-red-600 font-semibold mt-0.5">{currentStateMeta.high_risk_rate_pct}% of state total</div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs border-l-4 border-l-amber-500">
            <div className="text-xs font-bold text-slate-500 uppercase">Dominant Agency (IDA)</div>
            <div className="text-sm font-extrabold text-slate-900 mt-1 truncate" title={currentStateMeta.top_ida}>
              {currentStateMeta.top_ida}
            </div>
            <div className="text-[11px] text-amber-700 font-bold mt-0.5">{currentStateMeta.top_ida_share_pct}% State Works Share</div>
          </div>
        </div>
      )}

      {/* Implementing Agency (IDA) Concentration Chart */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">Implementing Agency (IDA) Market Concentration & Monopoly Risk</h3>
            <p className="text-xs text-slate-500">Agencies managing &gt;35% of total state works or funds are flagged for single-vendor risk</p>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded bg-amber-100 text-amber-900 border border-amber-200">
            35% Monopoly Threshold
          </span>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={idaChartData} margin={{ top: 10, right: 10, left: -10, bottom: 35 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="name" angle={-25} textAnchor="end" interval={0} tick={{ fontSize: 11, fill: '#64748B' }} />
              <YAxis domain={[0, 70]} tick={{ fontSize: 11, fill: '#64748B' }} unit="%" />
              <Tooltip 
                formatter={(val, name, item) => [`${val}%`, name === 'worksShare' ? 'Share of Works' : 'Share of Funds']}
                labelFormatter={(label, items) => items?.[0]?.payload?.fullName || label}
                contentStyle={{ backgroundColor: '#0F172A', color: '#FFF', borderRadius: '8px', fontSize: '12px' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '15px' }} />
              <ReferenceLine y={35} stroke="#DC2626" strokeDasharray="4 4" label={{ value: 'Monopoly Limit (35%)', fill: '#DC2626', fontSize: 10, position: 'insideTopLeft' }} />
              <Bar dataKey="worksShare" fill="#3B82F6" name="Share of Works (%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="fundsShare" fill="#F59E0B" name="Share of Funds (%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* State Works Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        
        {/* Controls */}
        <div className="p-4 sm:p-6 border-b border-slate-200 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search works, MP, ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-slate-50 font-medium"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
            >
              <option value="ALL">All Categories</option>
              <option value="road">Roads & Pathways</option>
              <option value="street_light">Street Light / Solar</option>
              <option value="water_supply">Water Supply</option>
              <option value="education">Education Facilities</option>
              <option value="community_hall">Community Hall</option>
              <option value="drainage">Drainage</option>
              <option value="sanitation">Sanitation</option>
              <option value="healthcare">Healthcare</option>
              <option value="sports">Sports</option>
            </select>

            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
            >
              <option value="ALL">All Risk Levels</option>
              <option value="HIGH">High Risk Only</option>
              <option value="MEDIUM">Medium Risk</option>
              <option value="LOW">Normal Risk</option>
            </select>
          </div>
        </div>

        {/* Table Body */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3">Work ID & Category</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">MP & Constituency</th>
                <th className="px-4 py-3 text-right">Cost</th>
                <th className="px-4 py-3 text-center">Images</th>
                <th className="px-6 py-3 text-right">Risk Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
              {filteredWorks.slice(0, 50).map((work, idx) => (
                <tr 
                  key={idx} 
                  onClick={() => onSelectWork(work)}
                  className="hover:bg-blue-50/40 transition-colors cursor-pointer"
                >
                  <td className="px-6 py-3.5">
                    <div className="font-mono font-bold text-slate-900">#{work.work_id}</div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">{work.work_type}</span>
                  </td>
                  <td className="px-4 py-3.5 max-w-xs">
                    <p className="line-clamp-2 text-slate-800 font-semibold">{work.work_description}</p>
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <div className="font-bold text-slate-900">{work.mp_name}</div>
                    <div className="text-[11px] text-slate-500">{work.constituency}</div>
                  </td>
                  <td className="px-4 py-3.5 text-right font-extrabold text-slate-900 whitespace-nowrap">
                    {formatINR(work.final_amount)}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    {work.has_images ? (
                      <span className="text-emerald-700 font-bold text-[10px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">✅ Yes</span>
                    ) : (
                      <span className="text-rose-700 font-bold text-[10px] bg-rose-50 px-2 py-0.5 rounded border border-rose-200">❌ No</span>
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
