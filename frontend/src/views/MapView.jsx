import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Search, 
  Filter, 
  Layers, 
  Building2, 
  Eye, 
  AlertTriangle,
  Info,
  UserCheck
} from 'lucide-react';
import RiskBadge from '../components/RiskBadge';
import { fetchMapProjects, fetchStates, fetchDistricts, formatINR } from '../services/api';

export default function MapView({ currentRole = 'ministry', selectedScope, onSelectProject }) {
  const [markers, setMarkers] = useState([]);
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [stateFilter, setStateFilter] = useState(selectedScope?.state || 'ALL');
  const [districtFilter, setDistrictFilter] = useState(selectedScope?.district || 'ALL');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMeta() {
      if (currentRole !== 'mp') {
        const [stList, distList] = await Promise.all([
          fetchStates(),
          fetchDistricts(stateFilter !== 'ALL' ? stateFilter : '')
        ]);
        setStates(stList || []);
        setDistricts(distList || []);
      }
    }
    loadMeta();
  }, [stateFilter, currentRole]);

  useEffect(() => {
    async function loadMapData() {
      setLoading(true);
      const res = await fetchMapProjects({
        role: currentRole,
        state: currentRole === 'mp' ? undefined : (stateFilter !== 'ALL' ? stateFilter : undefined),
        district: currentRole === 'mp' ? undefined : (districtFilter !== 'ALL' ? districtFilter : undefined),
        mp_name: currentRole === 'mp' ? selectedScope?.mpName : undefined,
        risk_level: riskFilter !== 'ALL' ? riskFilter : undefined,
        limit: 350
      });
      setMarkers(res?.markers || []);
      if (res?.markers && res.markers.length > 0) {
        setSelectedMarker(res.markers[0]);
      }
      setLoading(false);
    }
    loadMapData();
  }, [stateFilter, districtFilter, riskFilter, currentRole, selectedScope]);

  const getPinColor = (riskLevel) => {
    switch (riskLevel) {
      case 'CRITICAL': return 'bg-red-600 border-red-200 text-white';
      case 'HIGH': return 'bg-orange-500 border-orange-200 text-white';
      case 'MEDIUM': return 'bg-amber-400 border-amber-200 text-slate-900';
      default: return 'bg-emerald-500 border-emerald-200 text-white';
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-gov-navy uppercase tracking-wider">
            {currentRole === 'mp' ? <UserCheck className="w-4 h-4 text-purple-600" /> : <MapPin className="w-4 h-4 text-red-600" />}
            <span>
              {currentRole === 'mp' 
                ? `Constituency Geo-Map • ${selectedScope?.mpName || 'MP Works'}`
                : 'National GIS Geospatial Intelligence Module'}
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-900 mt-1">
            {currentRole === 'mp' ? `${selectedScope?.mpName || 'MP'} Work Site Coordinates` : 'Interactive Geo-Risk Location Map'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {currentRole === 'mp' 
              ? `Displaying all ${markers.length} sanctioned scheme works for ${selectedScope?.mpName || 'this MP'}`
              : `Spatial distribution of ${markers.length} active and completed MPLADS works with risk clustering`}
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {currentRole !== 'mp' && (
            <>
              <select
                value={stateFilter}
                onChange={(e) => {
                  setStateFilter(e.target.value);
                  setDistrictFilter('ALL');
                }}
                className="px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
              >
                <option value="ALL">All States</option>
                {states.map((s, idx) => (
                  <option key={idx} value={s.state}>{s.state}</option>
                ))}
              </select>

              {stateFilter !== 'ALL' && (
                <select
                  value={districtFilter}
                  onChange={(e) => setDistrictFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
                >
                  <option value="ALL">All Districts</option>
                  {districts.map((d, idx) => (
                    <option key={idx} value={d.district}>{d.district}</option>
                  ))}
                </select>
              )}
            </>
          )}

          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
          >
            <option value="ALL">All Risk Levels</option>
            <option value="CRITICAL">🔴 Critical Risk</option>
            <option value="HIGH">🟠 High Risk</option>
            <option value="MEDIUM">🟡 Medium Risk</option>
            <option value="LOW">🟢 Low Risk (100% Progress)</option>
          </select>
        </div>
      </div>

      {/* Map + Detail Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Interactive Map Visualizer */}
        <div className="lg:col-span-8 bg-slate-900 rounded-2xl p-4 shadow-md border border-slate-800 flex flex-col justify-between min-h-[500px] relative overflow-hidden">
          
          {/* Map Top Overlay */}
          <div className="absolute top-4 left-4 z-10 flex flex-wrap gap-2 text-xs">
            <span className="px-3 py-1 bg-slate-800/90 text-white rounded-lg border border-slate-700 font-semibold backdrop-blur-xs">
              📍 {markers.length} Pins Visualized
            </span>
            <div className="flex items-center gap-2 bg-slate-800/90 px-3 py-1 rounded-lg border border-slate-700 text-[11px] text-slate-300 backdrop-blur-xs">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Low</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span> Med</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span> High</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-600"></span> Critical</span>
            </div>
          </div>

          {/* Map SVG Grid Canvas */}
          <div className="w-full h-full flex-1 relative flex items-center justify-center p-8">
            <svg 
              viewBox="65 5 35 35" 
              className="w-full h-[400px] max-h-[450px] opacity-90 transition-all"
            >
              {/* Subtle Geo Grid Lines */}
              <defs>
                <pattern id="grid" width="2" height="2" patternUnits="userSpaceOnUse">
                  <path d="M 2 0 L 0 0 0 2" fill="none" stroke="#1E293B" strokeWidth="0.1"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />

              {/* Coordinate Markers */}
              {markers.map((m, idx) => {
                const isSelected = selectedMarker?.project_id === m.project_id;
                const pinColor = m.risk_level === 'CRITICAL' ? '#DC2626' :
                                 m.risk_level === 'HIGH' ? '#EA580C' :
                                 m.risk_level === 'MEDIUM' ? '#F59E0B' : '#16A34A';
                
                // SVG coordinates (Long = X: 68 to 97, Lat = Y: 37 down to 8)
                const cx = Math.max(68, Math.min(96, m.longitude));
                const cy = Math.max(8, Math.min(36, 42 - m.latitude));

                return (
                  <g 
                    key={idx} 
                    onClick={() => setSelectedMarker(m)} 
                    className="cursor-pointer group"
                  >
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isSelected ? 1.2 : 0.65}
                      fill={pinColor}
                      stroke={isSelected ? '#FFFFFF' : '#0F172A'}
                      strokeWidth={isSelected ? 0.3 : 0.15}
                      className="transition-all hover:scale-150"
                    />
                    {isSelected && (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={2.0}
                        fill="none"
                        stroke={pinColor}
                        strokeWidth="0.15"
                        strokeDasharray="0.3 0.3"
                        className="animate-ping origin-center"
                      />
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800 pt-3">
            <span>Spatial Projection: WGS84 Standard Indian Geodetic Datum</span>
            <span>Click any marker to inspect project forensic data</span>
          </div>

        </div>

        {/* Selected Project Inspector Card */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          {selectedMarker ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="font-mono text-xs font-bold text-slate-400">#{selectedMarker.project_id}</span>
                <RiskBadge score={selectedMarker.risk_score} category={selectedMarker.risk_level} />
              </div>

              <div>
                <h3 className="text-sm font-extrabold text-slate-900 leading-snug">
                  {selectedMarker.project_name}
                </h3>
                <div className="text-xs text-slate-500 mt-1 capitalize">
                  Type: <strong>{selectedMarker.work_type}</strong>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-3.5 space-y-2 text-xs border border-slate-100">
                <div className="flex justify-between">
                  <span className="text-slate-500">Location:</span>
                  <strong className="text-slate-800">{selectedMarker.district}, {selectedMarker.state}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Member of Parliament:</span>
                  <strong className="text-slate-800">{selectedMarker.mp_name}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Expenditure:</span>
                  <strong className="text-slate-900 font-extrabold">{formatINR(selectedMarker.expenditure)}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Physical Progress:</span>
                  <strong className="text-emerald-700 font-bold">{selectedMarker.progress_pct}% Completed</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Geo-Coordinates:</span>
                  <strong className="text-slate-700 font-mono">{selectedMarker.latitude?.toFixed(4)}° N, {selectedMarker.longitude?.toFixed(4)}° E</strong>
                </div>
              </div>

              <button
                onClick={() => onSelectProject(selectedMarker)}
                className="w-full py-2.5 bg-gov-navy hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-2xs flex items-center justify-center gap-2"
              >
                <Eye className="w-3.5 h-3.5 text-amber-400" />
                <span>Open 5-Step Vigilance Audit</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center py-12 text-slate-400">
              <Info className="w-8 h-8 mb-2 stroke-1" />
              <p className="text-xs">Click on any marker on the map to view detailed geo-tagged project analytics.</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
