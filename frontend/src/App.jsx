import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import WorkDetailModal from './components/WorkDetailModal';
import LoginView from './views/LoginView';
import RoleDashboardView from './views/RoleDashboardView';
import WorkExplorerView from './views/WorkExplorerView';
import AlertsView from './views/AlertsView';
import AnalyticsView from './views/AnalyticsView';
import MapView from './views/MapView';
import ReportsView from './views/ReportsView';
import { fetchStates, fetchDistricts, fetchMPSummaries, fetchApiAlerts } from './services/api';
import { ExternalLink } from 'lucide-react';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('mplads_auth') === 'true';
  });

  const [authUser, setAuthUser] = useState(() => {
    const saved = sessionStorage.getItem('mplads_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [currentRole, setCurrentRole] = useState(() => {
    return sessionStorage.getItem('mplads_role') || 'ministry';
  });

  const [selectedScope, setSelectedScope] = useState(() => {
    const saved = sessionStorage.getItem('mplads_scope');
    return saved ? JSON.parse(saved) : { state: 'Uttar Pradesh', district: 'All', mpName: 'Dr Sukanta Majumdar' };
  });

  const [activeNav, setActiveNav] = useState('dashboard');
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
      setAlertCount(alertsRes?.total_alerts || 0);

      if (mpList && mpList.length > 0 && !selectedScope.mpName) {
        setSelectedScope(prev => ({ ...prev, mpName: 'Dr Sukanta Majumdar' }));
      }
    }
    loadInitialMetadata();
  }, []);

  useEffect(() => {
    async function loadDistricts() {
      if (selectedScope.state && selectedScope.state !== 'National') {
        const distList = await fetchDistricts(selectedScope.state);
        setDistricts(distList || []);
      }
    }
    loadDistricts();
  }, [selectedScope.state]);

  const handleLogin = (authData) => {
    setIsAuthenticated(true);
    setAuthUser(authData.user);
    setCurrentRole(authData.role);
    setSelectedScope(authData.scope);
    setActiveNav('dashboard');

    sessionStorage.setItem('mplads_auth', 'true');
    sessionStorage.setItem('mplads_user', JSON.stringify(authData.user));
    sessionStorage.setItem('mplads_role', authData.role);
    sessionStorage.setItem('mplads_scope', JSON.stringify(authData.scope));
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setAuthUser(null);
    sessionStorage.removeItem('mplads_auth');
    sessionStorage.removeItem('mplads_user');
    sessionStorage.removeItem('mplads_role');
    sessionStorage.removeItem('mplads_scope');
  };

  const handleGlobalSearch = (query) => {
    if (query) {
      setActiveNav('projects');
    }
  };

  // If not authenticated, render Login Page
  if (!isAuthenticated) {
    return (
      <LoginView
        onLogin={handleLogin}
        states={states}
        mps={mps}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      
      {/* Role-Aware Navigation Bar with User Badge & Logout */}
      <Navbar 
        currentRole={currentRole}
        setCurrentRole={(newRole) => {
          setCurrentRole(newRole);
          sessionStorage.setItem('mplads_role', newRole);
        }}
        selectedScope={selectedScope}
        setSelectedScope={(newScope) => {
          setSelectedScope(newScope);
          sessionStorage.setItem('mplads_scope', JSON.stringify(newScope));
        }}
        states={states}
        districts={districts}
        mps={mps}
        activeNav={activeNav}
        setActiveNav={setActiveNav}
        alertCount={alertCount}
        authUser={authUser}
        onLogout={handleLogout}
        onGlobalSearch={handleGlobalSearch}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeNav === 'dashboard' && (
          <RoleDashboardView
            currentRole={currentRole}
            selectedScope={selectedScope}
            setSelectedScope={(newScope) => {
              setSelectedScope(newScope);
              sessionStorage.setItem('mplads_scope', JSON.stringify(newScope));
            }}
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
            currentRole={currentRole}
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
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg"
              alt="Ashoka Stambh, Government of India emblem"
              className="w-9 h-11 object-contain brightness-0 invert"
            />
            <div>
              <div className="font-extrabold text-sm text-slate-100">
                Government of India | Official MPLADS Portal
              </div>
              <div className="text-slate-400">
                Ministry of Statistics and Programme Implementation (MoSPI) | AI Monitoring & Decision Support Platform
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
