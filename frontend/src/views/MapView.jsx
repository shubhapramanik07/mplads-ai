import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Search, 
  Filter, 
  Layers, 
  Building2, 
  Eye, 
  AlertTriangle,
  Info
} from 'lucide-react';
import RiskBadge from '../components/RiskBadge';
import { fetchMapProjects, fetchStates, fetchDistricts, formatINR } from '../services/api';

export default function MapView({ selectedScope, onSelectProject }) {
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
      const [stList, distList] = await Promise.all([
        fetchStates(),
        fetchDistricts(stateFilter !== 'ALL' ? stateFilter : '')
      ]);
      setStates(stList || []);
      setDistricts(distList || []);
    }
    loadMeta();
  }, [stateFilter]);

  useEffect(() => {
    async function loadMapData() {
      setLoading(true);
      const res = await fetchMapProjects({
        state: stateFilter !== 'ALL' ? stateFilter : undefined,
        district: districtFilter !== 'ALL' ? districtFilter : undefined,
        risk_level: riskFilter !== 'ALL' ? riskFilter : undefined,
        limit: 250
      });
      setMarkers(res?.markers || []);
      if (res?.markers && res.markers.length > 0) {
        setSelectedMarker(res.markers[0]);
      }
      setLoading(false);
    }
    loadMapData();
  }, [stateFilter, districtFilter, riskFilter]);

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
            <MapPin className="w-4 h-4 text-blue-600" />
            <span>Geospatial Intelligence & Asset Verification Map</span>
          </div>
          <h2 className="text-xl font-black text-slate-900 mt-1">MPLADS Project Location Map</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Geographic distribution of <strong className="text-slate-900 font-bold">{markers.length} mapped projects</strong> color-coded by AI risk level
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 text-xs flex-wrap">
          <span className="inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">🟢 Low (&lt;40)</span>
          <span className="inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">🟡 Medium (40-69)</span>
          <span className="inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded bg-orange-50 text-orange-800 border border-orange-200">🟠 High (70-84)</span>
          <span className="inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded bg-red-50 text-red-800 border border-red-200">🔴 Critical (&ge;85)</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="text-[11px] font-bold text-slate-500 uppercase">State / UT:</label>
          <select
            value={stateFilter}
            onChange={(e) => { setStateFilter(e.target.value); setDistrictFilter('ALL'); }}
            className="w-full mt-1 px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
          >
            <option value="ALL">All States / UTs</option>
            {states.map((s, idx) => (
              <option key={idx} value={s.state}>{s.state}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[11px] font-bold text-slate-500 uppercase">District:</label>
          <select
            value={districtFilter}
            onChange={(e) => setDistrictFilter(e.target.value)}
            className="w-full mt-1 px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
          >
            <option value="ALL">All Districts</option>
            {districts.map((d, idx) => (
              <option key={idx} value={d.district}>{d.district}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[11px] font-bold text-slate-500 uppercase">Risk Level:</label>
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="w-full mt-1 px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
          >
            <option value="ALL">All Risk Tiers</option>
            <option value="CRITICAL">🔴 Critical (&ge;85)</option>
            <option value="HIGH">🟠 High (70-84)</option>
            <option value="MEDIUM">🟡 Medium (40-69)</option>
            <option value="LOW">🟢 Low (&lt;40)</option>
          </select>
        </div>
      </div>

      {/* Map Layout Grid: Map Viewport + Active Marker Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Interactive Simulated Map Canvas */}
        <div className="lg:col-span-2 bg-slate-900 rounded-2xl p-4 border border-slate-800 shadow-lg min-h-[480px] relative overflow-hidden flex flex-col justify-between">
          
          {/* Top Overlay */}
          <div className="flex items-center justify-between z-10">
            <span className="text-xs font-bold text-slate-300 bg-slate-800/80 px-3 py-1 rounded-lg backdrop-blur-xs border border-slate-700">
              India Geospatial Coordinate Grid (Active Coordinates: {markers.length})
            </span>
            <span className="text-[11px] text-amber-400 font-semibold bg-slate-800/80 px-2.5 py-1 rounded-lg backdrop-blur-xs">
              Click pin to inspect project
            </span>
          </div>

          {/* Interactive Geographic Marker Grid Canvas */}
          <div className="relative w-full h-96 my-4 bg-slate-950/60 rounded-xl border border-slate-800/80 p-4 overflow-hidden">
            {/* India Background Grid Lines */}
            <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40"></div>
            
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400"></div>
              </div>
            ) : markers.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-500">
                No project coordinates found for selected filters.
              </div>
            ) : (
              <div className="relative w-full h-full">
                {markers.map((m, idx) => {
                  // Normalize lat/lon to percentage of canvas
                  // India approx: Lat 8N to 37N (span 29), Lon 68E to 97E (span 29)
                  const topPct = Math.max(5, Math.min(92, 100 - ((m.latitude - 8) / 29) * 100));
                  const leftPct = Math.max(5, Math.min(92, ((m.longitude - 68) / 29) * 100));
                  const isSelected = selectedMarker?.project_id === m.project_id;

                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedMarker(m)}
                      style={{ top: `${topPct}%`, left: `${leftPct}%` }}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full p-1 transition-all shadow-md ${
                        getPinColor(m.risk_level)
                      } ${isSelected ? 'scale-150 ring-4 ring-white z-30' : 'hover:scale-125 z-10 opacity-85'}`}
                      title={`#${m.project_id} - ${m.project_name} (${m.risk_level})`}
                    >
                      <MapPin className="w-3.5 h-3.5" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bottom Coordinates Footer */}
          <div className="text-[11px] text-slate-400 flex items-center justify-between z-10">
            <span>Projection: WGS84 GeoJSON Compatible</span>
            <span>Target Boundary: All Indian Parliamentary Constituencies</span>
          </div>

        </div>

        {/* Selected Project Card Popup */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
          {selectedMarker ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                    #{selectedMarker.project_id}
                  </span>
                  <div className="text-xs font-extrabold text-slate-900 mt-1 capitalize">
                    {selectedMarker.work_type.replace('_', ' ')}
                  </div>
                </div>
                <RiskBadge score={selectedMarker.risk_score} category={selectedMarker.risk_level} />
              </div>

              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-400 uppercase">Work Description</div>
                <p className="text-xs font-semibold text-slate-800 leading-relaxed line-clamp-3">
                  "{selectedMarker.project_name}"
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-1 text-xs">
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Expenditure</div>
                  <div className="text-sm font-black text-slate-900 mt-0.5">{formatINR(selectedMarker.expenditure)}</div>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Progress</div>
                  <div className="text-sm font-black text-emerald-700 mt-0.5">{selectedMarker.progress_pct}%</div>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Location</div>
                  <div className="text-xs font-bold text-slate-800 mt-0.5 truncate">{selectedMarker.district}, {selectedMarker.state}</div>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Coordinates</div>
                  <div className="text-xs font-mono font-semibold text-slate-600 mt-0.5">
                    {selectedMarker.latitude.toFixed(2)}°N, {selectedMarker.longitude.toFixed(2)}°E
                  </div>
                </div>
              </div>

              <div className="text-xs text-slate-500">
                <strong>Recommending MP:</strong> {selectedMarker.mp_name}
              </div>

              <button
                onClick={() => onSelectProject(selectedMarker)}
                className="w-full py-2.5 bg-gov-navy hover:bg-slate-800 text-white text-xs font-extrabold rounded-xl transition-all shadow-xs flex items-center justify-center gap-2"
              >
                <Eye className="w-4 h-4 text-amber-400" />
                <span>View Full Project Dossier</span>
              </button>
            </div>
          ) : (
            <div className="text-center py-16 text-slate-400 text-xs">
              Select any map pin to inspect project parameters.
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
