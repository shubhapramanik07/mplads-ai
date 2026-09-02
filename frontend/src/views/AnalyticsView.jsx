import React, { useEffect, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  BarChart3,
  CheckCircle2,
  Clock3,
  IndianRupee,
  ShieldAlert,
  WalletCards
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { fetchAnalytics, fetchDashboardSummary, fetchStates } from '../services/api';

const formatNumber = (value) => Number(value || 0).toLocaleString('en-IN');
const formatCrores = (value) => `Rs ${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })} Cr`;

function Metric({ icon: Icon, label, value, detail, color = 'blue' }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    red: 'bg-red-50 text-red-700 border-red-200'
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</div>
          <div className="mt-2 text-2xl font-black text-slate-900">{value}</div>
          <div className="mt-1 text-xs font-medium text-slate-500">{detail}</div>
        </div>
        <div className={`rounded-lg border p-2 ${colors[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function Section({ title, description, children, className = '' }) {
  return (
    <section className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
      <h3 className="text-base font-black text-slate-900">{title}</h3>
      <p className="mt-1 text-xs font-medium text-slate-500">{description}</p>
      {children}
    </section>
  );
}

export default function AnalyticsView({ currentRole, selectedScope }) {
  const [analytics, setAnalytics] = useState(null);
  const [summary, setSummary] = useState(null);
  const [states, setStates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [analyticsResult, summaryResult, statesResult] = await Promise.all([
        fetchAnalytics(currentRole, selectedScope.state, selectedScope.district, selectedScope.mpName),
        fetchDashboardSummary(currentRole, selectedScope.state, selectedScope.district, selectedScope.mpName),
        fetchStates()
      ]);
      setAnalytics(analyticsResult);
      setSummary(summaryResult);
      setStates(statesResult || []);
      setLoading(false);
    }
    loadData();
  }, [currentRole, selectedScope]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gov-navy" />
      </div>
    );
  }

  const monthlyTrend = analytics?.monthly_trend || [];
  const riskDistribution = analytics?.risk_distribution || [];
  const workTypes = analytics?.work_type_distribution || [];
  const rankedStates = [...states]
    .filter((state) => Number.isFinite(Number(state.fund_utilization_pct)))
    .sort((a, b) => Number(b.fund_utilization_pct) - Number(a.fund_utilization_pct));
  const bestStates = rankedStates.slice(0, 5);
  const attentionStates = [...rankedStates].reverse().slice(0, 5);
  const highRiskShare = summary?.total_projects
    ? Math.round((summary.high_risk_projects / summary.total_projects) * 100)
    : 0;

  return (
    <div className="animate-fadeIn space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-gov-navy">
              <BarChart3 className="h-4 w-4 text-blue-600" />
              Ministry decision dashboard
            </div>
            <h2 className="mt-1 text-2xl font-black text-slate-900">What needs attention?</h2>
            <p className="mt-1 max-w-2xl text-sm font-medium text-slate-600">
              A simple view of money used, works delivered, and projects that may need review.
            </p>
          </div>
          <div className="rounded-lg bg-slate-50 px-3 py-2 text-right text-xs font-bold text-slate-600">
            <div className="uppercase tracking-wide text-slate-400">Current view</div>
            <div className="mt-1 text-slate-900">{selectedScope.state || 'National'} | {selectedScope.district || 'All districts'}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric icon={IndianRupee} label="Money spent" value={formatCrores(summary?.total_expenditure_crores)} detail={`${summary?.fund_utilization_pct || 0}% of sanctioned funds used`} color="green" />
        <Metric icon={CheckCircle2} label="Works completed" value={formatNumber(summary?.completed_projects)} detail={`${formatNumber(summary?.ongoing_projects)} works still ongoing`} color="blue" />
        <Metric icon={ShieldAlert} label="Needs review" value={formatNumber(summary?.high_risk_projects)} detail={`${highRiskShare}% of all works are high or critical risk`} color="red" />
        <Metric icon={Clock3} label="Delayed works" value={formatNumber(summary?.delayed_projects)} detail={`${formatNumber(summary?.cost_overrun_projects)} have cost above sanction`} color="amber" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Section title="Money used over the last 12 months" description="Monthly expenditure from completed works, in Rs crore." className="lg:col-span-2">
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrend} margin={{ top: 10, right: 12, left: 0, bottom: 4 }}>
                <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip formatter={(value) => [formatCrores(value), 'Expenditure']} contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12 }} />
                <Line type="monotone" dataKey="expenditure_crores" name="Expenditure" stroke="#1D4ED8" strokeWidth={3} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Section>

        <Section title="Risk at a glance" description="How many works fall into each review category.">
          <div className="mt-3 h-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={riskDistribution} dataKey="count" nameKey="name" innerRadius={48} outerRadius={72} paddingAngle={3}>
                  {riskDistribution.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(value) => [formatNumber(value), 'Works']} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 border-t border-slate-100 pt-3">
            {riskDistribution.map((item) => (
              <div className="flex items-center justify-between text-xs" key={item.name}>
                <span className="flex items-center gap-2 font-semibold text-slate-700"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />{item.name.replace(/ \(.*/, '')}</span>
                <span className="font-black text-slate-900">{formatNumber(item.count)}</span>
              </div>
            ))}
          </div>
        </Section>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Section title="Works completed each month" description="Use this to see whether delivery is speeding up or slowing down.">
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyTrend} margin={{ top: 10, right: 12, left: 0, bottom: 4 }}>
                <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip formatter={(value) => [formatNumber(value), 'Completed works']} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="completed_projects" name="Completed works" fill="#059669" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Section>

        <Section title="Where is the money going?" description="Work categories ranked by total expenditure. Hover for the number of works.">
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={workTypes} layout="vertical" margin={{ top: 4, right: 14, left: 8, bottom: 4 }}>
                <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis type="category" dataKey="work_type" width={105} tick={{ fontSize: 10, fill: '#475569' }} />
                <Tooltip formatter={(value) => [formatCrores(value), 'Expenditure']} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="expenditure_crores" name="Expenditure" fill="#1E3A8A" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Section>
      </div>

      <Section title="State performance" description="The first list shows the strongest fund utilization. The second flags states with the most room to improve.">
        <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <StateList title="Strongest utilization" icon={ArrowUp} states={bestStates} tone="green" />
          <StateList title="Needs attention" icon={ArrowDown} states={attentionStates} tone="red" />
        </div>
      </Section>

      <div className="flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-xs font-semibold text-blue-900">
        <WalletCards className="h-4 w-4 shrink-0" />
        Use the Projects and AI Alerts tabs to open the individual works behind any number shown here.
      </div>
    </div>
  );
}

function StateList({ title, icon: Icon, states, tone }) {
  return (
    <div>
      <div className={`mb-3 flex items-center gap-2 text-sm font-black ${tone === 'green' ? 'text-emerald-700' : 'text-red-700'}`}>
        <Icon className="h-4 w-4" />
        {title}
      </div>
      <div className="space-y-2">
        {states.map((state) => (
          <div className="flex items-center gap-3" key={state.state}>
            <div className="w-28 truncate text-xs font-bold text-slate-700" title={state.state}>{state.state}</div>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
              <div className={`h-full rounded-full ${tone === 'green' ? 'bg-emerald-500' : 'bg-red-500'}`} style={{ width: `${Math.min(100, Math.max(0, Number(state.fund_utilization_pct)))}%` }} />
            </div>
            <div className="w-12 text-right text-xs font-black text-slate-900">{Number(state.fund_utilization_pct).toFixed(1)}%</div>
          </div>
        ))}
        {states.length === 0 && <div className="text-xs text-slate-500">No state data available for this view.</div>}
      </div>
    </div>
  );
}
