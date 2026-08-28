import React from 'react';

export default function RiskBadge({ score, category, showScore = true }) {
  const s = Number(score) || 0;
  
  let cat = (category || '').toUpperCase();
  if (!cat || cat === 'NORMAL') {
    if (s >= 85) cat = 'CRITICAL';
    else if (s >= 70) cat = 'HIGH';
    else if (s >= 40) cat = 'MEDIUM';
    else cat = 'LOW';
  }

  if (cat === 'CRITICAL' || s >= 85) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-black bg-red-100 text-red-900 border border-red-300 shadow-2xs">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
        </span>
        <span>🔴 CRITICAL</span> {showScore && <span className="font-mono">({s.toFixed(0)})</span>}
      </span>
    );
  } else if (cat === 'HIGH' || (s >= 70 && s < 85)) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-extrabold bg-orange-100 text-orange-900 border border-orange-300">
        <span>🟠 HIGH</span> {showScore && <span className="font-mono">({s.toFixed(0)})</span>}
      </span>
    );
  } else if (cat === 'MEDIUM' || (s >= 40 && s < 70)) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
        <span>🟡 MEDIUM</span> {showScore && <span className="font-mono">({s.toFixed(0)})</span>}
      </span>
    );
  } else {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
        <span>🟢 LOW</span> {showScore && <span className="font-mono">({s.toFixed(0)})</span>}
      </span>
    );
  }
}
