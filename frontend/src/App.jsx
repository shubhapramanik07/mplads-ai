import React, { useState } from 'react';
import Navbar from './components/Navbar';
import WorkDetailModal from './components/WorkDetailModal';
import OverviewView from './views/OverviewView';
import MinistryView from './views/MinistryView';
import StateNodalView from './views/StateNodalView';
import MPConstituencyView from './views/MPConstituencyView';
import AlertsView from './views/AlertsView';
import ValidationLabView from './views/ValidationLabView';
import WorkExplorerView from './views/WorkExplorerView';
import { ShieldCheck, ExternalLink } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [inspectedWork, setInspectedWork] = useState(null);

  const handleSelectWork = (work) => {
    setInspectedWork(work);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      {/* Top Navbar with DigiGov Branding */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'overview' && (
          <OverviewView 
            onSelectWork={handleSelectWork}
            onNavigate={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'ministry' && (
          <MinistryView onSelectWork={handleSelectWork} />
        )}

        {activeTab === 'state' && (
          <StateNodalView onSelectWork={handleSelectWork} />
        )}

        {activeTab === 'mp' && (
          <MPConstituencyView onSelectWork={handleSelectWork} />
        )}

        {activeTab === 'alerts' && (
          <AlertsView onSelectWork={handleSelectWork} />
        )}

        {activeTab === 'validation' && (
          <ValidationLabView />
        )}

        {activeTab === 'explorer' && (
          <WorkExplorerView onSelectWork={handleSelectWork} />
        )}
      </main>

      {/* Work Detail Dossier Modal */}
      <WorkDetailModal 
        work={inspectedWork} 
        onClose={() => setInspectedWork(null)} 
      />

      {/* Official Government Scheme Footer */}
      <footer className="bg-gov-navy text-white border-t border-slate-800 mt-12 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-amber-400 text-slate-900 flex items-center justify-center font-bold">
              GOI
            </div>
            <div>
              <div className="font-extrabold text-sm text-slate-100">
                MPLADS AI Vigilance & Risk Intelligence Portal
              </div>
              <div className="text-slate-400">
                Smart India Hackathon (SIH) Problem Statement SIH26102
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6 text-slate-400">
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
              <span>FastAPI Swagger Docs</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
