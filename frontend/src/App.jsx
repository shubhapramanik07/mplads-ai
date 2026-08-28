import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import WorkDetailModal from './components/WorkDetailModal';
import RoleDashboardView from './views/RoleDashboardView';
import WorkExplorerView from './views/WorkExplorerView';
import AlertsView from './views/AlertsView';
import AnalyticsView from './views/AnalyticsView';
import MapView from './views/MapView';
import ReportsView from './views/ReportsView';
import ValidationLabView from './views/ValidationLabView';
import { fetchStates, fetchDistricts, fetchMPSummaries, fetchApiAlerts } from './services/api';
import { ExternalLink } from 'lucide-react';

export default function App() {
  const [currentRole, setCurrentRole] = useState('ministry'); // ministry, state, district, mp
  const [selectedScope, setSelectedScope] = useState({
    state: 'Uttar Pradesh',
    district: 'All',
    mpName: ''
  });

  const [activeNav, setActiveNav] = useState('dashboard'); // dashboard, projects, alerts, analytics, map, reports, validation
  const [inspectedProject, setInspectedProject] = useState(null);
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [mps, setMps] = useState([]);
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    async function loadInitialMetadata() {
      const [stList, mpList, alertsRes] = await Promise.all([
        fetchStates(),
        fetchMPSummaries(),
        fetchApiAlerts({ limit: 1 })
      ]);
      setStates(stList || []);
      setMps(mpList || []);
      if (mpList && mpList.length > 0) {
        setSelectedScope(prev => ({ ...prev, mpName: mpList[0].mp_name }));
      }
      setAlertCount(alertsRes?.total_alerts || 0);
    }
    loadInitialMetadata();
  }, []);

  useEffect(() => {
    async function loadDistricts() {
      const distList = await fetchDistricts(selectedScope.state);
      setDistricts(distList || []);
    }
    loadDistricts();
  }, [selectedScope.state]);

  const handleGlobalSearch = (query) => {
    if (query) {
      setActiveNav('projects');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      
      {/* Role-Aware Navigation Bar */}
      <Navbar 
        currentRole={currentRole}
        setCurrentRole={setCurrentRole}
        selectedScope={selectedScope}
        setSelectedScope={setSelectedScope}
        states={states}
        districts={districts}
        mps={mps}
        activeNav={activeNav}
        setActiveNav={setActiveNav}
        alertCount={alertCount}
        onGlobalSearch={handleGlobalSearch}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeNav === 'dashboard' && (
          <RoleDashboardView
            currentRole={currentRole}
            selectedScope={selectedScope}
            setSelectedScope={setSelectedScope}
            onSelectProject={(p) => setInspectedProject(p)}
            onNavigate={(nav) => setActiveNav(nav)}
          />
        )}

        {activeNav === 'projects' && (
          <WorkExplorerView 
            currentRole={currentRole}
            selectedScope={selectedScope}
            onSelectProject={(p) => setInspectedProject(p)}
          />
        )}

        {activeNav === 'alerts' && (
          <AlertsView 
            currentRole={currentRole}
            selectedScope={selectedScope}
            onSelectProject={(p) => setInspectedProject(p)}
          />
        )}

        {activeNav === 'analytics' && (
          <AnalyticsView 
            currentRole={currentRole}
            selectedScope={selectedScope}
          />
        )}

        {activeNav === 'map' && (
          <MapView 
            selectedScope={selectedScope}
            onSelectProject={(p) => setInspectedProject(p)}
          />
        )}

        {activeNav === 'reports' && (
          <ReportsView 
            currentRole={currentRole}
            selectedScope={selectedScope}
          />
        )}

        {activeNav === 'validation' && (
          <ValidationLabView />
        )}
      </main>

      {/* Detailed Project Inspection Modal */}
      <WorkDetailModal 
        work={inspectedProject} 
        onClose={() => setInspectedProject(null)} 
      />

      {/* Official Government Scheme Footer */}
      <footer className="bg-gov-navy text-white border-t border-slate-800 mt-12 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-400 text-slate-900 flex items-center justify-center font-black">
              GOI
            </div>
            <div>
              <div className="font-extrabold text-sm text-slate-100">
                MPLADS AI Monitoring & Decision Support Platform
              </div>
              <div className="text-slate-400">
                Smart India Hackathon (SIH) Problem Statement SIH26102
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6 text-slate-400 font-semibold">
            <a 
              href="https://esakshi.mospi.gov.in/" 
              target="_blank" 
              rel="noreferrer"
              className="hover:text-amber-400 transition-colors flex items-center gap-1"
            >
              <span>e-SAKSHI Portal</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <a 
              href="https://mplads.gov.in/" 
              target="_blank" 
              rel="noreferrer"
              className="hover:text-amber-400 transition-colors flex items-center gap-1"
            >
              <span>MPLADS MoSPI</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <a 
              href="http://127.0.0.1:8001/docs" 
              target="_blank" 
              rel="noreferrer"
              className="hover:text-amber-400 transition-colors flex items-center gap-1 text-emerald-400 font-bold"
            >
              <span>REST API Swagger Docs</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>

    </div>
  );
}
