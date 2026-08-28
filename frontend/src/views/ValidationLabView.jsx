import React, { useState, useEffect } from 'react';
import { 
  FlaskConical, 
  CheckCircle2, 
  RotateCw, 
  AlertTriangle, 
  Target, 
  BarChart3, 
  Sparkles,
  ShieldCheck,
  Info
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceLine 
} from 'recharts';
import RiskBadge from '../components/RiskBadge';
import { fetchValidationReport } from '../services/api';

export default function ValidationLabView() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    async function loadReport() {
      setLoading(true);
      const data = await fetchValidationReport();
      setReport(data);
      setLoading(false);
    }
    loadReport();
  }, []);

  const handleRetest = async () => {
    setTesting(true);
    try {
      const res = await fetch('http://127.0.0.1:8001/recalculate', { method: 'POST' });
      const updated = await fetchValidationReport();
      setReport(updated);
    } catch (err) {
      console.error('Error re-running test:', err);
    }
    setTesting(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gov-navy"></div>
      </div>
    );
  }

  const details = report?.planted_anomaly_details || [];

  const chartData = details.map(d => ({
    type: d.planted_type.replace('Duplicate Work (Pair A)', 'Duplicate A').replace('Duplicate Work (Pair B)', 'Duplicate B'),
    score: d.predicted_score,
    rank: d.rank,
    id: d.work_id,
    isDetected: d.is_detected_high_risk
  }));

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 uppercase tracking-wider">
            <FlaskConical className="w-4 h-4" />
            <span>Empirical AI Benchmarking & Ground-Truth Verification</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 mt-1">AI Model Validation & Fraud Detection Lab</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Demonstrates controlled synthetic anomaly injection experiments on the 43k real dataset to prove precision and recall
          </p>
        </div>

        <button
          onClick={handleRetest}
          disabled={testing}
          className="px-4 py-2.5 bg-gov-navy hover:bg-slate-800 disabled:bg-slate-300 text-white text-xs font-bold rounded-lg transition-all shadow-xs flex items-center gap-2 shrink-0"
        >
          <RotateCw className={`w-4 h-4 text-amber-400 ${testing ? 'animate-spin' : ''}`} />
          <span>{testing ? 'Injecting & Re-Scoring...' : 'Run Live Synthetic Benchmark'}</span>
        </button>
      </div>

      {/* Benchmark KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs border-l-4 border-l-emerald-600">
          <div className="text-xs font-bold text-slate-500 uppercase">Overall Detection Rate</div>
          <div className="text-2xl font-black text-emerald-700 mt-1">{report?.overall_detection_rate_pct || 0}%</div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">{report?.caught_in_high_risk_category} of {report?.total_planted_anomalies} caught in HIGH RISK</div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs border-l-4 border-l-blue-600">
          <div className="text-xs font-bold text-slate-500 uppercase">Precision @ Top 15</div>
          <div className="text-2xl font-black text-blue-700 mt-1">{report?.precision_at_top_15_pct || 0}%</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Top-Ranked Audit Precision</div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs border-l-4 border-l-purple-600">
          <div className="text-xs font-bold text-slate-500 uppercase">Recall @ Top 25</div>
          <div className="text-2xl font-black text-purple-700 mt-1">{report?.recall_at_top_25_pct || 0}%</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Recovered in Top 25 Ranks</div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs border-l-4 border-l-amber-500">
          <div className="text-xs font-bold text-slate-500 uppercase">Test Population Size</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{report?.total_test_samples || 0}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Sampled Baseline Works</div>
        </div>
      </div>

      {/* Benchmark Chart */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">Predicted AI Risk Scores by Planted Anomaly Category</h3>
            <p className="text-xs text-slate-500">Target detection threshold is &ge;70 points</p>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="type" angle={-20} textAnchor="end" interval={0} tick={{ fontSize: 10, fill: '#64748B' }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748B' }} />
              <Tooltip 
                formatter={(val) => [`${val} / 100`, 'Predicted Score']}
                contentStyle={{ backgroundColor: '#0F172A', color: '#FFF', borderRadius: '8px', fontSize: '12px' }}
              />
              <ReferenceLine y={70} stroke="#DC2626" strokeDasharray="4 4" label={{ value: 'High Risk Cutoff (70)', fill: '#DC2626', fontSize: 10 }} />
              <Bar dataKey="score" fill="#1A56DB" name="AI Risk Score" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Ground Truth Audit Matrix */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-slate-900">
            Ground-Truth Injected Anomaly Matrix ({details.length} Planted Fraud Profiles)
          </h3>
          <span className="text-xs text-slate-500">Live test output verification</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3">Injected Work ID</th>
                <th className="px-4 py-3">Injected Fraud Profile</th>
                <th className="px-4 py-3">Expected Detection</th>
                <th className="px-4 py-3 text-center">Rank</th>
                <th className="px-4 py-3 text-right">Score</th>
                <th className="px-6 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
              {details.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-3.5 font-mono font-bold text-slate-900">{item.work_id}</td>
                  <td className="px-4 py-3.5 max-w-xs">
                    <div className="font-bold text-slate-900">{item.planted_type}</div>
                    <div className="text-[11px] text-slate-500 line-clamp-1">{item.description}</div>
                  </td>
                  <td className="px-4 py-3.5 text-slate-700 font-semibold">{item.expected}</td>
                  <td className="px-4 py-3.5 text-center font-extrabold text-slate-900">#{item.rank}</td>
                  <td className="px-4 py-3.5 text-right font-extrabold">
                    <span className={item.predicted_score >= 70 ? 'text-red-600 font-black' : 'text-slate-800'}>
                      {item.predicted_score.toFixed(1)}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-center">
                    {item.is_detected_high_risk ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-extrabold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-md border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> DETECTED
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                        MODERATE
                      </span>
                    )}
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
