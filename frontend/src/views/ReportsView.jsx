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
  Layers,
  UserCheck
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
      if (currentRole !== 'mp') {
        const stList = await fetchStates();
        setStates(stList || []);
      }
    }
    loadMeta();
  }, [currentRole]);

  useEffect(() => {
    async function loadReportData() {
      setLoading(true);
      const [projRes, sumRes] = await Promise.all([
        fetchProjects({
          role: currentRole,
          state: currentRole === 'mp' ? undefined : (stateFilter !== 'ALL' ? stateFilter : undefined),
          mp_name: currentRole === 'mp' ? selectedScope?.mpName : undefined,
          risk_level: reportType === 'HIGH_RISK_AUDIT' ? 'HIGH' : reportType === 'CRITICAL_ONLY' ? 'CRITICAL' : undefined,
          status: reportType === 'DELAYED_PROJECTS' ? 'Delayed' : undefined,
          limit: 100
        }),
        fetchDashboardSummary(
          currentRole, 
          currentRole === 'mp' ? undefined : (stateFilter !== 'ALL' ? stateFilter : undefined),
          undefined,
          currentRole === 'mp' ? selectedScope?.mpName : undefined
        )
      ]);
      setProjects(projRes?.projects || []);
      setSummary(sumRes);
      setLoading(false);
    }
    loadReportData();
  }, [reportType, stateFilter, currentRole, selectedScope]);

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
      `"${p.risk_level}"`,
      `"${p.start_date || ''}"`,
      `"${p.expected_completion_date || ''}"`,
      `"${(p.risk_factors || []).join('; ').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `MPLADS_Audit_Report_${reportType}_${new Date().toISOString().slice(0, 10)}.csv`);
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
            {currentRole === 'mp' ? <UserCheck className="w-4 h-4 text-purple-600" /> : <FileSpreadsheet className="w-4 h-4 text-emerald-600" />}
            <span>
              {currentRole === 'mp'
                ? `Constituency Dossier Generator • ${selectedScope?.mpName || 'MP Works'}`
                : 'Government Audit Reports & Compliance Dossier'}
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-900 mt-1">
            {currentRole === 'mp' ? `${selectedScope?.mpName || 'MP'} Scheme Audit Dossier` : 'Official Compliance Dossiers & Exports'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Generate printable MoSPI vigilance reports and export structured audit datasets
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            disabled={projects.length === 0}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV Dossier</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-gov-navy hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span>Print Official Report</span>
          </button>
        </div>
      </div>

      {/* Report Template Selector */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'HIGH_RISK_AUDIT', label: '🔴 Priority Audit Ledger', desc: 'High & Critical Risk Works' },
            { id: 'CRITICAL_ONLY', label: '⚠️ Severe Overrun Dossier', desc: 'Critical Outliers Only' },
            { id: 'DELAYED_PROJECTS', label: '⏱️ Milestone Overdue List', desc: 'Delayed Projects' },
          ].map((tpl) => (
            <button
              key={tpl.id}
              onClick={() => setReportType(tpl.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                reportType === tpl.id
                  ? 'bg-gov-navy text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {tpl.label}
            </button>
          ))}
        </div>

        {currentRole !== 'mp' && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-semibold">Jurisdiction:</span>
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="px-3 py-1.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
            >
              <option value="ALL">All States (National)</option>
              {states.map((s, idx) => (
                <option key={idx} value={s.state}>{s.state}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Official Audit Document Preview Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-6">
        
        {/* Official Header Badge */}
        <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="text-[10px] font-extrabold text-gov-saffron uppercase tracking-wider">
              CONFIDENTIAL • FOR OFFICIAL VIGILANCE AUDIT ONLY
            </div>
            <h3 className="text-base font-black text-slate-900 mt-0.5">
              MPLADS Scheme Forensic Audit Extract — {reportType.replace(/_/g, ' ')}
            </h3>
            <div className="text-xs text-slate-500">
              Scope: {currentRole === 'mp' ? `MP Portfolio: ${selectedScope?.mpName}` : stateFilter !== 'ALL' ? stateFilter : 'National (All States)'} • Total Records: {projects.length}
            </div>
          </div>
          <div className="text-right text-xs text-slate-400 font-mono">
            Generated on: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
          </div>
        </div>

        {/* Summary KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
          <div>
            <div className="text-slate-400 font-medium">Projects in Audit</div>
            <div className="text-base font-black text-slate-900">{projects.length}</div>
          </div>
          <div>
            <div className="text-slate-400 font-medium">Sanctioned Outlay</div>
            <div className="text-base font-black text-slate-900">₹{summary?.total_sanctioned_crores || 0} Cr</div>
          </div>
          <div>
            <div className="text-slate-400 font-medium">Total Expenditure</div>
            <div className="text-base font-black text-emerald-700">₹{summary?.total_expenditure_crores || 0} Cr</div>
          </div>
          <div>
            <div className="text-slate-400 font-medium">Fund Utilization</div>
            <div className="text-base font-black text-blue-700">{summary?.fund_utilization_pct || 0}%</div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-2.5">ID</th>
                <th className="px-4 py-2.5">Work Name & Scope</th>
                <th className="px-4 py-2.5">Jurisdiction / MP</th>
                <th className="px-4 py-2.5 text-right">Sanctioned</th>
                <th className="px-4 py-2.5 text-right">Expenditure</th>
                <th className="px-4 py-2.5 text-center">Progress</th>
                <th className="px-4 py-2.5 text-center">Risk Level</th>
                <th className="px-4 py-2.5">Audit Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400">Loading audit extract...</td>
                </tr>
              ) : projects.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400">No records found matching report parameters.</td>
                </tr>
              ) : (
                projects.map((p, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5 font-mono font-bold text-slate-900">#{p.project_id}</td>
                    <td className="px-4 py-2.5 max-w-xs font-semibold text-slate-800 line-clamp-1">{p.project_name}</td>
                    <td className="px-4 py-2.5 text-slate-600 whitespace-nowrap">{p.district} ({p.mp_name})</td>
                    <td className="px-4 py-2.5 text-right font-bold text-slate-700">{formatINR(p.sanctioned_amount)}</td>
                    <td className="px-4 py-2.5 text-right font-black text-slate-900">{formatINR(p.expenditure)}</td>
                    <td className="px-4 py-2.5 text-center font-bold text-emerald-700">{p.progress_pct}%</td>
                    <td className="px-4 py-2.5 text-center whitespace-nowrap">
                      <RiskBadge score={p.risk_score} category={p.risk_level} />
                    </td>
                    <td className="px-4 py-2.5 text-[11px] text-slate-600 max-w-xs">
                      {p.risk_factors?.[0] || '100% physically completed on schedule'}
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
