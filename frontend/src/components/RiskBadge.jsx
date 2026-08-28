import React from 'react';

export default function RiskBadge({ score, category, showScore = true }) {
  const s = Number(score) || 0;
  const cat = (category || (s >= 70 ? 'HIGH' : s >= 40 ? 'MEDIUM' : 'LOW')).toUpperCase();

  if (cat === 'HIGH' || s >= 70) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-extrabold bg-red-100 text-red-800 border border-red-200">
        <span className="h-2 w-2 rounded-full bg-red-600 animate-pulse"></span>
        HIGH RISK {showScore && `(${s.toFixed(0)})`}
      </span>
    );
  } else if (cat === 'MEDIUM' || s >= 40) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
        <span className="h-2 w-2 rounded-full bg-amber-500"></span>
        MEDIUM {showScore && `(${s.toFixed(0)})`}
      </span>
    );
  } else {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
        <span className="h-2 w-2 rounded-full bg-emerald-600"></span>
        NORMAL {showScore && `(${s.toFixed(0)})`}
      </span>
    );
  }
}
