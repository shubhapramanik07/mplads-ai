import React, { useEffect, useMemo, useState } from 'react';
import {
  Bot,
  CheckCircle2,
  CircleHelp,
  MessageCircle,
  Send,
  ShieldCheck,
  X
} from 'lucide-react';
import { fetchAnalytics, fetchDashboardSummary } from '../services/api';

const ROLE_CONTENT = {
  ministry: {
    label: 'Ministry Assistant',
    scope: 'national programme oversight',
    prompts: ['Which works need urgent review?', 'How is fund utilization nationally?', 'Explain the risk categories']
  },
  state: {
    label: 'State Authority Assistant',
    scope: 'state programme monitoring',
    prompts: ['How many works are delayed in my state?', 'Which work category uses the most money?', 'What should I review first?']
  },
  district: {
    label: 'District Authority Assistant',
    scope: 'district execution monitoring',
    prompts: ['How many works are still ongoing?', 'Are there cost overruns to check?', 'What does high risk mean?']
  },
  mp: {
    label: 'MP Constituency Assistant',
    scope: 'constituency work monitoring',
    prompts: ['How many works are completed?', 'Which works need my attention?', 'How is my fund utilization?']
  }
};

const number = (value) => Number(value || 0).toLocaleString('en-IN');
const crores = (value) => `Rs ${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })} crore`;

function getScopeName(role, selectedScope) {
  if (role === 'ministry') return 'the national programme';
  if (role === 'state') return selectedScope?.state || 'your state';
  if (role === 'district') return selectedScope?.district || 'your district';
  return selectedScope?.mpName || 'your constituency';
}

function answerQuestion(question, summary, analytics, role, selectedScope) {
  const text = question.toLowerCase();
  const scope = getScopeName(role, selectedScope);
  const total = summary?.total_projects || 0;
  const highRisk = summary?.high_risk_projects || 0;
  const workTypes = analytics?.work_type_distribution || [];
  const largestCategory = [...workTypes].sort((a, b) => Number(b.expenditure_crores) - Number(a.expenditure_crores))[0];

  if (/urgent|attention|review|risk|alert/.test(text)) {
    return `${scope} has ${number(highRisk)} high or critical-risk works out of ${number(total)} total works. Start with the AI Alerts tab, then open each flagged project to review delay, cost, and progress details.`;
  }
  if (/utili[sz]|fund|money|spent|expenditure|budget/.test(text)) {
    return `${scope} has used ${summary?.fund_utilization_pct || 0}% of sanctioned funds. Expenditure is ${crores(summary?.total_expenditure_crores)}. Compare this with the sanctioned amount before approving or escalating work.`;
  }
  if (/delay|ongoing|pending|completion|complete|deliver/.test(text)) {
    return `${scope} has completed ${number(summary?.completed_projects)} works, with ${number(summary?.ongoing_projects)} still ongoing and ${number(summary?.delayed_projects)} marked delayed. Open Projects to see the work-level status.`;
  }
  if (/overrun|cost|sanction/.test(text)) {
    return `${number(summary?.cost_overrun_projects)} works in ${scope} are above their sanctioned cost. Review the sanction amount, expenditure, implementing agency, and project progress before taking action.`;
  }
  if (/categor|type|sector|most money/.test(text) && largestCategory) {
    return `${largestCategory.work_type} uses the most money in ${scope}: ${crores(largestCategory.expenditure_crores)} across ${number(largestCategory.count)} works. Use the category chart to compare the remaining work types.`;
  }
  if (/explain|mean|definition|high risk|risk categor/.test(text)) {
    return 'Low risk means the work looks normal in the current data. Medium risk means it deserves a routine review. High risk means priority review is recommended. Critical risk means urgent investigation is recommended. These are indicators, not final findings.';
  }
  if (/hello|hi|help|what can you/.test(text)) {
    return `I can explain the live numbers for ${scope}: spending, utilization, completion, delays, cost overruns, risk, and work categories. Try one of the questions below.`;
  }
  return `I can answer questions about ${scope}'s works using the current dashboard data. Try asking about utilization, completed works, delays, cost overruns, risk, or the work category using the most money.`;
}

export default function AuthorityAssistant({ currentRole, selectedScope }) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]);
  const [summary, setSummary] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const content = ROLE_CONTENT[currentRole] || ROLE_CONTENT.ministry;

  useEffect(() => {
    setMessages([{
      from: 'assistant',
      text: `Namaste. I am your ${content.label}. I can help you understand ${getScopeName(currentRole, selectedScope)} and point you to the right action.`
    }]);
  }, [content.label, currentRole, selectedScope]);

  useEffect(() => {
    async function loadContext() {
      setLoading(true);
      const [summaryResult, analyticsResult] = await Promise.all([
        fetchDashboardSummary(currentRole, selectedScope?.state, selectedScope?.district, selectedScope?.mpName),
        fetchAnalytics(currentRole, selectedScope?.state, selectedScope?.district, selectedScope?.mpName)
      ]);
      setSummary(summaryResult);
      setAnalytics(analyticsResult);
      setLoading(false);
    }
    loadContext();
  }, [currentRole, selectedScope]);

  const prompts = useMemo(() => content.prompts, [content.prompts]);

  const submitQuestion = (value = question) => {
    const cleanQuestion = value.trim();
    if (!cleanQuestion || loading) return;
    setMessages((existing) => [
      ...existing,
      { from: 'user', text: cleanQuestion },
      { from: 'assistant', text: answerQuestion(cleanQuestion, summary, analytics, currentRole, selectedScope) }
    ]);
    setQuestion('');
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 sm:bottom-6 sm:right-6">
      {open && (
        <div className="mb-3 flex h-[min(620px,calc(100vh-110px))] w-[min(380px,calc(100vw-32px))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="bg-gov-navy px-4 py-3 text-white">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-white/10 p-2"><ShieldCheck className="h-5 w-5 text-amber-300" /></div>
                <div>
                  <div className="text-sm font-black">{content.label}</div>
                  <div className="mt-0.5 text-[11px] font-medium text-slate-300">For {content.scope} | {getScopeName(currentRole, selectedScope)}</div>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="rounded-lg p-1.5 text-slate-300 hover:bg-white/10 hover:text-white" aria-label="Close assistant">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-3">
            {messages.map((message, index) => (
              <div className={`flex ${message.from === 'user' ? 'justify-end' : 'justify-start'}`} key={`${message.from}-${index}`}>
                <div className={`max-w-[88%] rounded-2xl px-3 py-2.5 text-xs font-medium leading-relaxed ${message.from === 'user' ? 'rounded-br-sm bg-blue-700 text-white' : 'rounded-bl-sm border border-slate-200 bg-white text-slate-700'}`}>
                  {message.text}
                </div>
              </div>
            ))}
            {!summary && <div className="text-center text-[11px] font-semibold text-slate-400">Loading current programme data...</div>}
          </div>

          <div className="border-t border-slate-200 bg-white p-3">
            <div className="mb-2 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide text-slate-400"><CircleHelp className="h-3.5 w-3.5" /> Try a question</div>
            <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1">
              {prompts.map((prompt) => <button key={prompt} onClick={() => submitQuestion(prompt)} className="shrink-0 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-[10px] font-bold text-blue-800 hover:bg-blue-100">{prompt}</button>)}
            </div>
            <form onSubmit={(event) => { event.preventDefault(); submitQuestion(); }} className="flex items-center gap-2">
              <input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask about your works..." className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
              <button type="submit" disabled={!question.trim() || loading} className="rounded-lg bg-gov-navy p-2.5 text-white disabled:cursor-not-allowed disabled:opacity-40" aria-label="Send question">
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      <button onClick={() => setOpen((value) => !value)} className="ml-auto flex h-14 w-14 items-center justify-center rounded-full bg-gov-navy text-white shadow-xl ring-4 ring-white transition-transform hover:scale-105" aria-label={open ? 'Close authority assistant' : 'Open authority assistant'} title={open ? 'Close assistant' : 'Ask the authority assistant'}>
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        {!open && <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-[10px] font-black text-gov-navy">?</span>}
      </button>
    </div>
  );
}
