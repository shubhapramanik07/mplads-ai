import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Download, 
  Printer, 
  FileText, 
  Filter, 
  CheckCircle2, 
  AlertTriangle,
  Building2,
  Layers
} from 'lucide-react';
import RiskBadge from '../components/RiskBadge';
import { fetchProjects, fetchStates, fetchDashboardSummary, formatINR } from '../services/api';

export default function ReportsView({ currentRole, selectedScope }) {
  const [reportType, setReportType] = useState('HIGH_RISK_AUDIT');
  const [stateFilter, setStateFilter] = useState(selectedScope?.state || 'ALL');
  const [states, setStates] = useState([]);
  const [projects, setProjects] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMeta() {
      const stList = await fetchStates();
      setStates(stList || []);
    }
    loadMeta();
  }, []);

  useEffect(() => {
    async function loadReportData() {
      setLoading(true);
      const [projRes, sumRes] = await Promise.all([
        fetchProjects({
          role: currentRole,
          state: stateFilter !== 'ALL' ? stateFilter : undefined,
          risk_level: reportType === 'HIGH_RISK_AUDIT' ? 'HIGH' : reportType === 'CRITICAL_ONLY' ? 'CRITICAL' : undefined,
          status: reportType === 'DELAYED_PROJECTS' ? 'Delayed' : undefined,
          limit: 100
        }),
        fetchDashboardSummary(currentRole, stateFilter !== 'ALL' ? stateFilter : '')
      ]);
      setProjects(projRes?.projects || []);
      setSummary(sumRes);
      setLoading(false);
    }
    loadReportData();
  }, [reportType, stateFilter, currentRole]);

  const handleExportCSV = () => {
    if (projects.length === 0) return;
    const headers = [
      "Project ID", "Project Name", "Work Type", "State", "District", "MP Name",
      "Sanctioned Amount", "Expenditure", "Progress %", "Risk Score", "Risk Level", "Start Date", "Expected Completion", "Risk Factors"
    ];
    const rows = projects.map(p => [
      `"${p.project_id}"`,
      `"${(p.project_name || '').replace(/"/g, '""')}"`,
      `"${p.work_type}"`,
      `"${p.state}"`,
      `"${p.district}"`,
      `"${p.mp_name}"`,
      p.sanctioned_amount,
      p.expenditure,
      p.progress_pct,
      p.risk_score,
      p.risk_level,
      `"${p.start_date || ''}"`,
      `"${p.expected_completion_date || ''}"`,
      `"${(Array.isArray(p.risk_factors) ? p.risk_factors.join(' | ') : '').replace(/"/g, '""')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `mplads_audit_report_${reportType}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-gov-navy uppercase tracking-wider">
            <FileSpreadsheet className="w-4 h-4 text-blue-600" />
            <span>Official Vigilance & CAG Audit Report Generation</span>
          </div>
          <h2 className="text-xl font-black text-slate-900 mt-1">Audit Dossiers & Compliance Reports</h2>
          <p className="text-xs text-slate-500 mt-0.5">Generate exportable audit registers with financial parameters, timelines, and explainable AI risk factors</p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-all border border-slate-300 flex items-center gap-1.5 shadow-2xs"
          >
            <Printer className="w-4 h-4" />
            <span>Print Dossier</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-gov-navy hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>Export CSV Report</span>
          </button>
        </div>
      </div>

      {/* Report Controls */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase">Select Report Type:</label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="w-full mt-1.5 px-3.5 py-2 text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
          >
            <option value="HIGH_RISK_AUDIT">High & Critical Risk Priority Audit Dossier (Risk ≥ 70)</option>
            <option value="CRITICAL_ONLY">Critical Fraud & Severe Anomaly Register (Risk ≥ 85)</option>
            <option value="DELAYED_PROJECTS">Milestone Delay & Schedule Overrun Ledger</option>
            <option value="ALL_PROJECTS">Comprehensive Scheme Monitoring Register (All Projects)</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-500 uppercase">Jurisdiction Scope (State / UT):</label>
          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className="w-full mt-1.5 px-3.5 py-2 text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
          >
            <option value="ALL">All States / UTs (National Level)</option>
            {states.map((s, idx) => (
              <option key={idx} value={s.state}>{s.state}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Generated Report Preview Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-3">
        
        {/* Report Header Card */}
        <div className="p-6 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-[10px] font-extrabold text-gov-saffron uppercase">OFFICIAL AUDIT REPORT PREVIEW</div>
            <h3 className="text-base font-black text-slate-900 mt-0.5">
              {reportType.replace(/_/g, ' ')} — {stateFilter === 'ALL' ? 'National Scope' : stateFilter}
            </h3>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-4">
              <span><strong>Records Generated:</strong> {projects.length} Works</span>
              <span><strong>Generated On:</strong> {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              <span><strong>Scheme:</strong> MPLADS 17th Lok Sabha</span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-100 text-blue-900 border border-blue-200">
              Verified by AI Vigilance Engine
            </span>
          </div>
        </div>

        {/* Report Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3">Project ID</th>
                <th className="px-4 py-3">Project Name & Category</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3 text-right">Sanctioned</th>
                <th className="px-4 py-3 text-right">Expenditure</th>
                <th className="px-4 py-3 text-center">Progress</th>
                <th className="px-4 py-3 text-center">Risk Level</th>
                <th className="px-6 py-3">Risk Factors & Recommendations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gov-navy mx-auto"></div>
                  </td>
                </tr>
              ) : projects.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-12 text-slate-500">
                    No records found matching report criteria.
                  </td>
                </tr>
              ) : (
                projects.map((p, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="px-6 py-3.5 font-mono font-bold text-slate-900">#{p.project_id}</td>
                    <td className="px-4 py-3.5 max-w-xs">
                      <div className="font-bold text-slate-900 line-clamp-1">{p.project_name}</div>
                      <div className="text-[10px] text-slate-400 capitalize">{p.work_type}</div>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-slate-600">
                      {p.district}, {p.state}
                    </td>
                    <td className="px-4 py-3.5 text-right font-bold text-slate-900">{formatINR(p.sanctioned_amount)}</td>
                    <td className="px-4 py-3.5 text-right font-black text-slate-900">{formatINR(p.expenditure)}</td>
                    <td className="px-4 py-3.5 text-center font-bold text-emerald-700">{p.progress_pct}%</td>
                    <td className="px-4 py-3.5 text-center whitespace-nowrap">
                      <RiskBadge score={p.risk_score} category={p.risk_level} />
                    </td>
                    <td className="px-6 py-3.5 max-w-xs text-[11px] text-slate-700">
                      <div className="text-red-700 font-semibold">{p.risk_factors?.[0] || 'Parameters normal'}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {p.risk_score >= 85 ? 'Field inspection recommended' : p.risk_score >= 70 ? 'BoQ verification recommended' : 'Routine quarterly review'}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
}
