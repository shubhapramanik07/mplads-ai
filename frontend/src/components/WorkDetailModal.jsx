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
  Calculator
} from 'lucide-react';
import RiskBadge from './RiskBadge';
import { formatINR } from '../services/api';

export default function WorkDetailModal({ work, onClose }) {
  if (!work) return null;

  const reasons = Array.isArray(work.risk_reasons) ? work.risk_reasons : [];
  const score = Number(work.risk_score) || 0;
  const costScore = Number(work.cost_risk_score) || 0;
  const dupScore = Number(work.duplicate_risk_score) || 0;
  const compScore = Number(work.compliance_risk_score) || 0;
  const idaScore = Number(work.ida_risk_score) || 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-slate-200 flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gov-navy text-white">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded">
                  WORK ID: {work.work_id}
                </span>
                <RiskBadge score={score} category={work.risk_category} />
              </div>
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 mt-0.5">
                Detailed Anomaly Audit Dossier & Risk Decomposition
              </h2>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Work Description Box */}
          <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4">
            <div className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-blue-600" /> Official Work Description
            </div>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed">
              "{work.work_description}"
            </p>
          </div>

          {/* 4-Pillar Quantitative Risk Decomposition */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-gov-blue" />
                <span>Multi-Factor AI Risk Decomposition</span>
              </span>
              <span className="text-xs font-black text-slate-900">
                Composite Score: <span className={score >= 70 ? 'text-red-600 text-sm' : score >= 40 ? 'text-amber-600 text-sm' : 'text-emerald-700 text-sm'}>{score.toFixed(1)} / 100</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              
              {/* Cost Subscore */}
              <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-700">Cost Outlier Risk (35% wt)</span>
                  <span className={costScore >= 50 ? 'text-red-600' : 'text-slate-700'}>{costScore.toFixed(0)} / 100</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full" style={{ width: `${costScore}%` }}></div>
                </div>
                <div className="text-[10px] text-slate-400">Deviation: {(work.dev_work_type_median_pct || 0) > 0 ? `+${(work.dev_work_type_median_pct || 0).toFixed(1)}%` : `${(work.dev_work_type_median_pct || 0).toFixed(1)}%`} vs peer median</div>
              </div>

              {/* Duplicate Subscore */}
              <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-700">Duplicate NLP Risk (35% wt)</span>
                  <span className={dupScore >= 50 ? 'text-red-600' : 'text-slate-700'}>{dupScore.toFixed(0)} / 100</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div className="h-full bg-purple-600 rounded-full" style={{ width: `${dupScore}%` }}></div>
                </div>
                <div className="text-[10px] text-slate-400">Status: {work.is_duplicate ? '⚠️ High textual duplication' : '✔️ Distinct Work'}</div>
              </div>

              {/* Compliance Subscore */}
              <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-700">Visual Compliance (15% wt)</span>
                  <span className={compScore >= 50 ? 'text-red-600' : 'text-slate-700'}>{compScore.toFixed(0)} / 100</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: `${compScore}%` }}></div>
                </div>
                <div className="text-[10px] text-slate-400">Inspection Proof: {work.has_images ? '✅ Photos attached' : '❌ Missing photos'}</div>
              </div>

              {/* IDA Concentration Subscore */}
              <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-700">Agency Monopoly (15% wt)</span>
                  <span className={idaScore >= 50 ? 'text-red-600' : 'text-slate-700'}>{idaScore.toFixed(0)} / 100</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${idaScore}%` }}></div>
                </div>
                <div className="text-[10px] text-slate-400">Agency: {work.ida?.substring(0, 25)}...</div>
              </div>

            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
              <div className="text-[11px] font-bold text-slate-400 uppercase">Sanctioned Amount</div>
              <div className="text-base font-extrabold text-slate-900 mt-1">{formatINR(work.final_amount)}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Category: {work.work_type}</div>
            </div>

            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
              <div className="text-[11px] font-bold text-slate-400 uppercase">Peer Group Median</div>
              <div className="text-sm font-extrabold text-slate-900 mt-1.5">{formatINR(work.peer_median_work_type || 0)}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Category Benchmark</div>
            </div>

            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
              <div className="text-[11px] font-bold text-slate-400 uppercase">Photo Verification</div>
              <div className="text-sm font-extrabold mt-1.5 flex items-center gap-1">
                {work.has_images ? (
                  <span className="text-emerald-700 flex items-center gap-1 text-xs"><CheckCircle2 className="w-4 h-4 text-emerald-600"/> Verified</span>
                ) : (
                  <span className="text-rose-700 flex items-center gap-1 text-xs"><Camera className="w-4 h-4 text-rose-600"/> Missing</span>
                )}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Geo-tagged Photos</div>
            </div>

            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
              <div className="text-[11px] font-bold text-slate-400 uppercase">Completion Date</div>
              <div className="text-xs font-extrabold text-slate-900 mt-1.5">{work.completed_date || 'N/A'}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Physical Completion</div>
            </div>
          </div>

          {/* Stakeholder Details */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Stakeholder & Jurisdiction</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-start gap-2.5">
                <User className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <span className="text-slate-400">Recommending MP:</span>
                  <div className="font-bold text-slate-800">{work.mp_name} ({work.house || 'Lok Sabha'})</div>
                  <div className="text-slate-500">{work.constituency}, {work.state}</div>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Building className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <span className="text-slate-400">Implementing Agency (IDA):</span>
                  <div className="font-bold text-slate-800">{work.ida}</div>
                </div>
              </div>
            </div>
          </div>

          {/* AI Risk Breakdown & Explanations */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span>AI-Detected Risk Drivers & Anomaly Flags</span>
            </div>

            <div className="bg-rose-50/60 border border-rose-200 rounded-xl p-4 space-y-2">
              {reasons.length > 0 ? (
                reasons.map((r, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs font-semibold text-rose-900">
                    <span className="text-rose-600 font-bold mt-0.5">•</span>
                    <span>{r}</span>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-600">Parameters conform to baseline peer-group thresholds.</div>
              )}
            </div>
          </div>

          {/* Recommended Audit Action */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-amber-600" /> Vigilance & Audit Recommendation
            </div>
            <p className="text-xs font-medium text-amber-950 leading-relaxed">
              {score >= 70 
                ? "Immediate field audit recommended. Audit Bill of Quantities (BoQ) against Schedule of Rates (SoR), verify physical site coordinates to rule out ghost assets or duplicate billing, and issue notice for missing completion documentation."
                : score >= 40
                ? "Flagged for standard district committee quarterly audit review. Cross-check tender single-bidder rate disparities."
                : "Work complies with standard operational parameters. Cleared for standard administrative archiving."}
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Explainable AI Multi-Factor Scoring Architecture (MoSPI SIH26102)
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-gov-navy text-white text-xs font-bold hover:bg-slate-800 transition-colors shadow-xs"
          >
            Close Dossier
          </button>
        </div>

      </div>
    </div>
  );
}
