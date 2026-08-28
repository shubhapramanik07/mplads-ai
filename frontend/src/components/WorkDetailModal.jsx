import React from 'react';
import { 
  X, 
  AlertTriangle, 
  CheckCircle2, 
  Camera, 
  Layers, 
  TrendingUp, 
  FileText, 
  Copy, 
  ShieldAlert,
  Building,
  User,
  Activity,
  Calculator,
  Calendar,
  IndianRupee,
  MapPin,
  Clock,
  ArrowRight
} from 'lucide-react';
import RiskBadge from './RiskBadge';
import { formatINR } from '../services/api';

export default function WorkDetailModal({ work, onClose }) {
  if (!work) return null;

  const reasons = Array.isArray(work.risk_factors || work.risk_reasons) ? (work.risk_factors || work.risk_reasons) : [];
  const score = Number(work.risk_score) || 0;
  const costScore = Number(work.cost_risk_score) || 0;
  const dupScore = Number(work.duplicate_risk_score) || 0;
  const compScore = Number(work.compliance_risk_score) || 0;
  const idaScore = Number(work.ida_risk_score) || 0;

  const sanctioned = Number(work.sanctioned_amount) || Number(work.final_amount) || 0;
  const expenditure = Number(work.expenditure) || Number(work.final_amount) || 0;
  const estimatedCost = Number(work.estimated_cost) || (sanctioned * 0.95);
  const remaining = Math.max(0, sanctioned - expenditure);
  const utilization = sanctioned > 0 ? ((expenditure / sanctioned) * 100).toFixed(1) : '100.0';
  const costVariance = expenditure - sanctioned;

  const isDelayed = work.is_delayed || work.status === 'Delayed';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-hidden shadow-2xl border border-slate-200 flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gov-navy text-white shadow-xs">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono font-black text-slate-700 bg-slate-200 px-2 py-0.5 rounded">
                  PROJECT ID: #{work.project_id || work.work_id}
                </span>
                <RiskBadge score={score} category={work.risk_level || work.risk_category} />
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                  isDelayed ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                }`}>
                  {isDelayed ? '⚠️ Milestone Delayed' : '✅ Completed on Schedule'}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 mt-1 line-clamp-1">
                {work.project_name || work.work_description}
              </h2>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Decision Pipeline Indicator */}
          <div className="bg-slate-100 rounded-2xl p-3.5 border border-slate-200 flex items-center justify-between text-xs text-slate-600 font-bold overflow-x-auto gap-2">
            <span className="text-gov-navy">1. DATA INGESTED</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-blue-700">2. AI & RULE ANALYSIS</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className={score >= 70 ? 'text-red-700 font-black' : 'text-amber-700'}>
              3. RISK: {score.toFixed(0)}/100 ({work.risk_level || 'EVALUATED'})
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-purple-700">4. EXPLANATION</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-emerald-700">5. VIGILANCE ACTION</span>
          </div>

          {/* Section 1: Financial Information Grid */}
          <div>
            <div className="text-xs font-black text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <IndianRupee className="w-4 h-4 text-emerald-600" />
              <span>Financial Ledger & Cost Variance</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Sanctioned Amount</div>
                <div className="text-sm font-extrabold text-slate-900 mt-0.5">{formatINR(sanctioned)}</div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Estimated Cost</div>
                <div className="text-sm font-extrabold text-slate-700 mt-0.5">{formatINR(estimatedCost)}</div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Total Expenditure</div>
                <div className="text-sm font-black text-slate-900 mt-0.5">{formatINR(expenditure)}</div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Remaining Amount</div>
                <div className="text-sm font-extrabold text-slate-700 mt-0.5">{formatINR(remaining)}</div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Fund Utilization</div>
                <div className="text-sm font-black text-blue-700 mt-0.5">{utilization}%</div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Cost Variance</div>
                <div className={`text-sm font-black mt-0.5 ${costVariance > 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                  {costVariance > 0 ? `+${formatINR(costVariance)}` : formatINR(costVariance)}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Timeline & Physical Progress */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Timeline */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
              <div className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>Execution Timeline & Delays</span>
              </div>
              
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Sanction / Start Date:</span>
                  <span className="font-bold text-slate-900">{work.start_date || '2024-09-10'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Expected Completion:</span>
                  <span className="font-bold text-slate-900">{work.expected_completion_date || '2025-03-31'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Actual Completion:</span>
                  <span className={`font-extrabold ${isDelayed ? 'text-red-600' : 'text-emerald-700'}`}>
                    {work.actual_completion_date || work.completed_date || '2025-06-15'} {isDelayed && '(Schedule Overrun)'}
                  </span>
                </div>
              </div>
            </div>

            {/* Physical Progress */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col justify-between space-y-2">
              <div className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1.5"><Activity className="w-4 h-4 text-emerald-600" /> Physical Progress</span>
                <span className="text-emerald-700 text-sm font-black">{work.progress_pct || 100}% Completed</span>
              </div>

              <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${work.progress_pct || 100}%` }}></div>
              </div>

              <div className="text-[11px] text-slate-500 flex items-center justify-between">
                <span>Inspection Photos: {work.has_images ? '✅ Verified Geo-Tagged' : '❌ Missing Visual Proof'}</span>
                <span>Status: <strong>{work.status || 'Completed'}</strong></span>
              </div>
            </div>

          </div>

          {/* Section 3: Project Information & Stakeholders */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
            <div className="text-xs font-black text-slate-900 uppercase tracking-wider">Project Information & Jurisdiction</div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="space-y-0.5">
                <span className="text-slate-400 font-semibold">Work Category:</span>
                <div className="font-bold text-slate-900 capitalize">{work.work_type}</div>
              </div>

              <div className="space-y-0.5">
                <span className="text-slate-400 font-semibold">Location / District:</span>
                <div className="font-bold text-slate-900">{work.district || work.constituency}, {work.state}</div>
              </div>

              <div className="space-y-0.5">
                <span className="text-slate-400 font-semibold">Coordinates:</span>
                <div className="font-mono font-bold text-slate-700">
                  {work.latitude ? `${work.latitude.toFixed(3)}°N, ${work.longitude.toFixed(3)}°E` : '26.846°N, 80.946°E'}
                </div>
              </div>

              <div className="space-y-0.5 sm:col-span-2">
                <span className="text-slate-400 font-semibold">Recommending MP:</span>
                <div className="font-bold text-slate-900">{work.mp_name} ({work.house || 'Lok Sabha'})</div>
              </div>

              <div className="space-y-0.5">
                <span className="text-slate-400 font-semibold">Implementing Agency (IDA):</span>
                <div className="font-bold text-slate-900 truncate">{work.implementing_agency || work.ida}</div>
              </div>
            </div>
          </div>

          {/* Section 4: AI Risk Analysis & Explainable Factors */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-gov-blue" />
                <span>Explainable AI Risk Decomposition ({score.toFixed(0)}/100)</span>
              </span>
              <RiskBadge score={score} category={work.risk_level} />
            </div>

            {/* Subscores */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <div className="text-[10px] text-slate-500 font-bold uppercase">Cost Outlier Risk (45%)</div>
                <div className="font-black text-slate-900 mt-1">{costScore.toFixed(0)} / 100</div>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <div className="text-[10px] text-slate-500 font-bold uppercase">Compliance & Delay Risk (40%)</div>
                <div className="font-black text-amber-800 mt-1">{compScore.toFixed(0)} / 100</div>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <div className="text-[10px] text-slate-500 font-bold uppercase">IDA Agency Monopoly (15%)</div>
                <div className="font-black text-emerald-800 mt-1">{idaScore.toFixed(0)} / 100</div>
              </div>
            </div>

            {/* Plain-English Reasons */}
            <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-4 space-y-1.5">
              <div className="text-xs font-black text-rose-950 uppercase tracking-wider mb-1">
                Detected Irregularity & Fraud Drivers:
              </div>
              {reasons.length > 0 ? (
                reasons.map((r, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs font-bold text-rose-900">
                    <span className="text-rose-600 font-black mt-0.5">•</span>
                    <span>{r}</span>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-600">Parameters conform to baseline peer-group thresholds.</div>
              )}
            </div>
          </div>

          {/* Section 5: Recommended Vigilance Action */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <div className="text-xs font-black text-amber-950 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-amber-600" /> Recommended Vigilance Action
            </div>
            <p className="text-xs font-medium text-amber-950 leading-relaxed">
              {score >= 85 
                ? "Immediate field audit recommended. Audit Bill of Quantities (BoQ) against Schedule of Rates (SoR), verify physical site coordinates to rule out ghost assets or duplicate billing, and issue notice for missing completion documentation."
                : score >= 70
                ? "Detailed technical audit of bill of quantities (BoQ) and Schedule of Rates (SoR). Cross-check tender single-bidder rate disparities."
                : score >= 40
                ? "Flagged for standard district committee quarterly audit review."
                : "Work complies with standard operational parameters. Cleared for standard administrative archiving."}
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-medium">
            Explainable AI Multi-Factor Scoring Architecture • MoSPI e-SAKSHI
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gov-navy text-white text-xs font-bold hover:bg-slate-800 transition-colors shadow-xs"
          >
            Close Dossier
          </button>
        </div>

      </div>
    </div>
  );
}
