import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Building, 
  Layers, 
  UserCheck, 
  Lock, 
  User, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  KeyRound,
  Eye,
  EyeOff
} from 'lucide-react';

export default function LoginView({ onLogin, states = [], mps = [] }) {
  const [selectedRole, setSelectedRole] = useState('ministry'); // ministry, state, district, mp
  const [selectedState, setSelectedState] = useState('Uttar Pradesh');
  const [selectedDistrict, setSelectedDistrict] = useState('Varanasi');
  const [selectedMP, setSelectedMP] = useState('');
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const roles = [
    {
      id: 'ministry',
      title: 'Ministry / Central Govt',
      subtitle: 'National MoSPI Oversight & CAG Audit',
      icon: Building,
      badge: 'National Scope',
      color: 'border-blue-600 bg-blue-50/50 text-blue-900',
      iconBg: 'bg-blue-600 text-white'
    },
    {
      id: 'state',
      title: 'State Nodal Authority',
      subtitle: 'State Administration & District Monitoring',
      icon: Layers,
      badge: 'State Scope',
      color: 'border-emerald-600 bg-emerald-50/50 text-emerald-900',
      iconBg: 'bg-emerald-600 text-white'
    },
    {
      id: 'district',
      title: 'District Authority',
      subtitle: 'District Magistrate & Project Verification',
      icon: Building,
      badge: 'District Scope',
      color: 'border-amber-600 bg-amber-50/50 text-amber-900',
      iconBg: 'bg-amber-600 text-white'
    },
    {
      id: 'mp',
      title: 'Member of Parliament (MP)',
      subtitle: 'Constituency Development Portfolio',
      icon: UserCheck,
      badge: 'Constituency Scope',
      color: 'border-purple-600 bg-purple-50/50 text-purple-900',
      iconBg: 'bg-purple-600 text-white'
    }
  ];

  const handleQuickFill = (roleId) => {
    setSelectedRole(roleId);
    setUserId('12345');
    setPassword('sih');
    setErrorMsg('');

    if (roleId === 'state') {
      setSelectedState('Uttar Pradesh');
    } else if (roleId === 'district') {
      setSelectedState('Uttar Pradesh');
      setSelectedDistrict('Varanasi');
    } else if (roleId === 'mp') {
      setSelectedMP(mps[0]?.mp_name || 'Arun Bharti');
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanUser = userId.trim();
    const cleanPass = password.trim();

    // Verification check: accept 12345 / sih or admin credentials
    if (!cleanUser || !cleanPass) {
      setErrorMsg('Please enter both User ID and Password.');
      return;
    }

    if (cleanUser === '12345' && cleanPass.toLowerCase() === 'sih') {
      onLogin({
        role: selectedRole,
        scope: {
          state: selectedRole === 'ministry' ? 'National' : selectedState,
          district: selectedRole === 'district' ? selectedDistrict : 'All',
          mpName: selectedRole === 'mp' ? (selectedMP || mps[0]?.mp_name || 'Arun Bharti') : 'All'
        },
        user: {
          id: cleanUser,
          name: selectedRole === 'ministry' ? 'Joint Secretary (MoSPI)' :
                selectedRole === 'state' ? `Nodal Officer (${selectedState})` :
                selectedRole === 'district' ? `District Magistrate (${selectedDistrict})` :
                `Hon. MP (${selectedMP || 'Constituency'})`,
          roleTitle: roles.find(r => r.id === selectedRole)?.title
        }
      });
    } else {
      setErrorMsg('Invalid Credentials. Use User ID: 12345 and Password: sih');
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F4F8] flex flex-col justify-between font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Tricolor Bar */}
      <div className="tricolor-stripe w-full"></div>

      {/* Main Login Container */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 my-4">
        <div className="bg-white rounded-3xl max-w-4xl w-full border border-slate-200 shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 animate-fadeIn">
          
          {/* Left Hero Sidebar */}
          <div className="lg:col-span-5 bg-gradient-to-br from-gov-navy via-[#113264] to-[#1E3A8A] text-white p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden">
            <div className="relative z-10 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-bold backdrop-blur-xs border border-white/10">
                <ShieldCheck className="w-4 h-4" />
                <span>Government of India • MoSPI</span>
              </div>

              <div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-tight">
                  e-SAKSHI MPLADS AI Vigilance Portal
                </h2>
                <p className="text-xs text-blue-100/90 mt-2 leading-relaxed">
                  Centralized decision support system for anomaly detection, fund utilization monitoring, and fraud prevention across all 43,496 MPLADS scheme works.
                </p>
              </div>

              {/* Security Features List */}
              <div className="space-y-2 pt-3 text-xs border-t border-white/10">
                <div className="flex items-center gap-2 text-blue-100">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Role-Based Access Control (RBAC)</span>
                </div>
                <div className="flex items-center gap-2 text-blue-100">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Explainable AI Multi-Factor Risk Engine</span>
                </div>
                <div className="flex items-center gap-2 text-blue-100">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>National to Project-Level Audit Drill-Down</span>
                </div>
              </div>
            </div>

            {/* Quick Demo Credentials Info */}
            <div className="relative z-10 mt-6 bg-white/10 rounded-2xl p-4 border border-white/15 backdrop-blur-xs">
              <div className="text-[11px] font-extrabold text-amber-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5" /> Demo Login Credentials:
              </div>
              <div className="text-xs space-y-0.5 text-blue-100 font-mono">
                <div>User ID: <strong className="text-white">12345</strong></div>
                <div>Password: <strong className="text-white">sih</strong></div>
              </div>
            </div>
          </div>

          {/* Right Form Area */}
          <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between">
            <form onSubmit={handleFormSubmit} className="space-y-5">
              
              <div>
                <span className="text-[10px] font-extrabold text-gov-saffron uppercase tracking-wider">OFFICIAL ACCESS GATEWAY</span>
                <h3 className="text-lg font-black text-slate-900 mt-0.5">Select Authority Role to Proceed</h3>
                <p className="text-xs text-slate-500">Each role provides customized monitoring dashboards and restricted authority scope</p>
              </div>

              {/* Step 1: Role Selection Grid */}
              <div className="grid grid-cols-2 gap-2.5">
                {roles.map((r) => {
                  const Icon = r.icon;
                  const isSelected = selectedRole === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => handleQuickFill(r.id)}
                      className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between gap-2 ${
                        isSelected 
                          ? `${r.color} shadow-sm ring-2 ring-blue-500` 
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className={`p-1.5 rounded-lg ${isSelected ? r.iconBg : 'bg-slate-100 text-slate-600'}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${isSelected ? 'bg-white/80' : 'bg-slate-100 text-slate-500'}`}>
                          {r.badge}
                        </span>
                      </div>
                      <div>
                        <div className="text-xs font-bold leading-tight">{r.title}</div>
                        <div className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{r.subtitle}</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Step 2: Contextual Scope Inputs */}
              {selectedRole === 'state' && (
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1.5 animate-fadeIn">
                  <label className="text-[11px] font-bold text-slate-700 uppercase">Select State / UT Jurisdiction:</label>
                  <select
                    value={selectedState}
                    onChange={(e) => setSelectedState(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-bold bg-white border border-slate-300 rounded-xl text-slate-900"
                  >
                    {states.map((s, idx) => (
                      <option key={idx} value={s.state}>{s.state}</option>
                    ))}
                  </select>
                </div>
              )}

              {selectedRole === 'district' && (
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 grid grid-cols-2 gap-2 animate-fadeIn">
                  <div>
                    <label className="text-[10px] font-bold text-slate-700 uppercase">State:</label>
                    <select
                      value={selectedState}
                      onChange={(e) => setSelectedState(e.target.value)}
                      className="w-full mt-1 px-2.5 py-1.5 text-xs font-bold bg-white border border-slate-300 rounded-xl text-slate-900"
                    >
                      {states.map((s, idx) => (
                        <option key={idx} value={s.state}>{s.state}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-700 uppercase">District:</label>
                    <input
                      type="text"
                      placeholder="e.g. Varanasi, Patna, Madurai"
                      value={selectedDistrict}
                      onChange={(e) => setSelectedDistrict(e.target.value)}
                      className="w-full mt-1 px-2.5 py-1.5 text-xs font-bold bg-white border border-slate-300 rounded-xl text-slate-900"
                    />
                  </div>
                </div>
              )}

              {selectedRole === 'mp' && (
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1.5 animate-fadeIn">
                  <label className="text-[11px] font-bold text-slate-700 uppercase">Select Member of Parliament (MP):</label>
                  <select
                    value={selectedMP || (mps[0]?.mp_name || '')}
                    onChange={(e) => setSelectedMP(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-bold bg-white border border-slate-300 rounded-xl text-slate-900"
                  >
                    {mps.map((m, idx) => (
                      <option key={idx} value={m.mp_name}>
                        {m.mp_name} — {m.constituency} ({m.state})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Step 3: Credentials Input */}
              <div className="space-y-3 pt-1">
                <div>
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Officer User ID:</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter User ID (e.g. 12345)"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    className="w-full mt-1 px-3.5 py-2 text-xs font-medium border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Password:</span>
                  </label>
                  <div className="relative mt-1">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="Enter Password (e.g. sih)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs font-medium border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Error Banner */}
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3 bg-gov-navy hover:bg-slate-800 text-white text-xs font-black rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
              >
                <span>Authenticate & Access {roles.find(r => r.id === selectedRole)?.badge}</span>
                <ArrowRight className="w-4 h-4 text-amber-400" />
              </button>

            </form>
          </div>

        </div>
      </div>

      {/* Official Footer */}
      <footer className="text-center text-[11px] text-slate-500 pb-4">
        © 2026 Ministry of Statistics and Programme Implementation (MoSPI), Government of India • SIH Problem Statement SIH26102
      </footer>
    </div>
  );
}
