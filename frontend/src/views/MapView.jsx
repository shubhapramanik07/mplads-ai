import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, 
  Search, 
  Filter, 
  Layers, 
  Building2, 
  Eye, 
  AlertTriangle,
  Info,
  UserCheck,
  Compass,
  Navigation,
  Globe,
  Maximize2
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import RiskBadge from '../components/RiskBadge';
import { fetchMapProjects, fetchStates, fetchDistricts, formatINR } from '../services/api';

// Map Auto-Center Helper Component
function ChangeMapView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.flyTo(center, zoom, { duration: 1.2 });
    }
  }, [center, zoom, map]);
  return null;
}

export default function MapView({ currentRole = 'ministry', selectedScope, onSelectProject }) {
  const [markers, setMarkers] = useState([]);
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [stateFilter, setStateFilter] = useState(selectedScope?.state || 'ALL');
  const [districtFilter, setDistrictFilter] = useState(selectedScope?.district || 'ALL');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [mapTileStyle, setMapTileStyle] = useState('streets'); // 'streets' or 'satellite'
  const [loading, setLoading] = useState(true);
  const [mapCenter, setMapCenter] = useState([22.5937, 78.9629]); // Default India Center
  const [mapZoom, setMapZoom] = useState(5);

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
        limit: 400
      });
      const dataMarkers = res?.markers || [];
      setMarkers(dataMarkers);

      if (dataMarkers.length > 0) {
        setSelectedMarker(dataMarkers[0]);
        // Compute center from first few markers
        const avgLat = dataMarkers.slice(0, 10).reduce((acc, m) => acc + (m.latitude || 20.59), 0) / Math.min(10, dataMarkers.length);
        const avgLon = dataMarkers.slice(0, 10).reduce((acc, m) => acc + (m.longitude || 78.96), 0) / Math.min(10, dataMarkers.length);
        
        const zoomLvl = currentRole === 'mp' ? 10 : (districtFilter !== 'ALL' ? 10 : stateFilter !== 'ALL' ? 7 : 5);
        setMapCenter([avgLat, avgLon]);
        setMapZoom(zoomLvl);
      }
      setLoading(false);
    }
    loadMapData();
  }, [stateFilter, districtFilter, riskFilter, currentRole, selectedScope]);

  const filteredMarkers = markers.filter(m => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.project_name?.toLowerCase().includes(q) ||
      m.project_id?.toLowerCase().includes(q) ||
      m.district?.toLowerCase().includes(q) ||
      m.work_type?.toLowerCase().includes(q) ||
      m.mp_name?.toLowerCase().includes(q)
    );
  });

  const getMarkerColor = (riskLevel) => {
    switch (riskLevel) {
      case 'CRITICAL': return '#DC2626';
      case 'HIGH': return '#EA580C';
      case 'MEDIUM': return '#F59E0B';
      default: return '#16A34A';
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Header Bar */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-gov-navy uppercase tracking-wider">
            {currentRole === 'mp' ? <UserCheck className="w-4 h-4 text-purple-600" /> : <Navigation className="w-4 h-4 text-blue-600" />}
            <span>
              {currentRole === 'mp' 
                ? `Constituency GIS Map • ${selectedScope?.mpName || 'MP Works'}`
                : 'National GIS Spatial Intelligence Module'}
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-900 mt-1">
            {currentRole === 'mp' ? `${selectedScope?.mpName || 'MP'} Work Site Coordinates` : 'Live Satellite & Street GIS Map'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real interactive street and road navigation map with precise project site locations, physical progress, and risk indicators
          </p>
        </div>

        {/* Filter Controls & Map Tile Switcher */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Map Layer Switcher */}
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setMapTileStyle('streets')}
              className={`px-3 py-1 text-xs font-extrabold rounded-lg transition-all ${
                mapTileStyle === 'streets' ? 'bg-gov-navy text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🗺️ Street Map
            </button>
            <button
              onClick={() => setMapTileStyle('satellite')}
              className={`px-3 py-1 text-xs font-extrabold rounded-lg transition-all ${
                mapTileStyle === 'satellite' ? 'bg-gov-navy text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🛰️ Satellite
            </button>
          </div>

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

      {/* Main Map + Inspector Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Real Interactive Map Canvas */}
        <div className="lg:col-span-8 bg-slate-900 rounded-2xl shadow-lg border border-slate-200 overflow-hidden flex flex-col min-h-[560px] relative">
          
          {/* Top Map HUD Controls */}
          <div className="absolute top-4 left-4 z-[500] flex flex-wrap items-center gap-2 text-xs">
            <div className="bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-xl shadow-md border border-slate-200 font-bold text-slate-800 flex items-center gap-2">
              <Compass className="w-4 h-4 text-blue-600 animate-spin-slow" />
              <span>{filteredMarkers.length} Works Positioned on Map</span>
            </div>

            {/* Quick Search on Map */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search road, portion, project..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-7 pr-3 py-1.5 text-xs bg-white/95 backdrop-blur-md rounded-xl shadow-md border border-slate-200 font-medium text-slate-800 w-52 focus:w-64 transition-all focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Map Legend Floating Box */}
          <div className="absolute bottom-4 left-4 z-[500] bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl shadow-md border border-slate-200 text-[11px] font-bold text-slate-700 flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-600 border border-white shadow-xs"></span>
              <span>100% Completed (🟢 Low)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-500 border border-white shadow-xs"></span>
              <span>Medium</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-orange-600 border border-white shadow-xs"></span>
              <span>High</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-600 border border-white shadow-xs"></span>
              <span>Critical</span>
            </div>
          </div>

          {/* Leaflet Map */}
          <div className="w-full h-full flex-1 min-h-[560px]">
            <MapContainer
              center={mapCenter}
              zoom={mapZoom}
              scrollWheelZoom={true}
              style={{ width: '100%', height: '100%', minHeight: '560px' }}
            >
              <ChangeMapView center={mapCenter} zoom={mapZoom} />

              {/* Tile Provider Layer */}
              {mapTileStyle === 'streets' ? (
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
              ) : (
                <TileLayer
                  attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                />
              )}

              {/* Project Circle Markers with Interactive Popups */}
              {filteredMarkers.map((m, idx) => {
                const color = getMarkerColor(m.risk_level);
                const isSelected = selectedMarker?.project_id === m.project_id;

                return (
                  <CircleMarker
                    key={idx}
                    center={[m.latitude || 20.59, m.longitude || 78.96]}
                    radius={isSelected ? 10 : 7}
                    pathOptions={{
                      fillColor: color,
                      fillOpacity: 0.88,
                      color: isSelected ? '#FFFFFF' : '#0F172A',
                      weight: isSelected ? 3 : 1.5
                    }}
                    eventHandlers={{
                      click: () => {
                        setSelectedMarker(m);
                      }
                    }}
                  >
                    <Popup className="custom-map-popup">
                      <div className="p-1 space-y-2 max-w-xs font-['Plus_Jakarta_Sans',sans-serif]">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                          <span className="font-mono text-[10px] font-black text-slate-500">#{m.project_id}</span>
                          <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                            m.risk_level === 'LOW' ? 'bg-emerald-100 text-emerald-800' :
                            m.risk_level === 'MEDIUM' ? 'bg-amber-100 text-amber-800' :
                            m.risk_level === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {m.risk_level}
                          </span>
                        </div>

                        <h4 className="text-xs font-black text-slate-900 leading-tight">
                          {m.project_name}
                        </h4>

                        <div className="text-[11px] text-slate-600 space-y-0.5">
                          <div>📍 <strong>{m.district}, {m.state}</strong></div>
                          <div>👤 MP: <strong>{m.mp_name}</strong></div>
                          <div>💰 Expenditure: <strong>{formatINR(m.expenditure)}</strong></div>
                          <div>⚡ Progress: <strong className="text-emerald-700">{m.progress_pct}%</strong></div>
                        </div>

                        <button
                          onClick={() => onSelectProject(m)}
                          className="w-full mt-1.5 py-1.5 bg-gov-navy text-white text-[11px] font-bold rounded-lg hover:bg-slate-800 transition-colors flex items-center justify-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5 text-amber-400" />
                          <span>Inspect Project</span>
                        </button>
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}
            </MapContainer>
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
                <h3 className="text-sm font-black text-slate-900 leading-snug">
                  {selectedMarker.project_name}
                </h3>
                <div className="text-xs text-slate-500 mt-1 capitalize font-semibold">
                  Category: <strong className="text-slate-800">{selectedMarker.work_type}</strong>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-3.5 space-y-2.5 text-xs border border-slate-100">
                <div className="flex justify-between">
                  <span className="text-slate-500">Location / Portion:</span>
                  <strong className="text-slate-800 text-right">{selectedMarker.district}, {selectedMarker.state}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Member of Parliament:</span>
                  <strong className="text-slate-800">{selectedMarker.mp_name}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Expenditure:</span>
                  <strong className="text-slate-900 font-extrabold">{formatINR(selectedMarker.expenditure)}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Physical Execution:</span>
                  <span className="px-2 py-0.5 rounded font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    {selectedMarker.progress_pct}% Completed
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">GIS Coordinates:</span>
                  <strong className="text-blue-700 font-mono">{selectedMarker.latitude?.toFixed(4)}° N, {selectedMarker.longitude?.toFixed(4)}° E</strong>
                </div>
              </div>

              <button
                onClick={() => onSelectProject(selectedMarker)}
                className="w-full py-3 bg-gov-navy hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
              >
                <Eye className="w-4 h-4 text-amber-400" />
                <span>Open 5-Step Vigilance Audit</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center py-12 text-slate-400">
              <Info className="w-8 h-8 mb-2 stroke-1" />
              <p className="text-xs">Click on any project marker on the map to inspect its real-time street and forensic data.</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
