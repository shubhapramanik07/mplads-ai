# 🏛️ MPLADS AI Vigilance & Monitoring Platform
### Intelligent Decision Support & Multi-Factor Anomaly Detection System
**Ministry of Statistics and Programme Implementation (MoSPI) • Government of India**

---

## 📌 Executive Overview

The **MPLADS AI Vigilance Platform** is an enterprise-grade, role-based monitoring and decision support web application designed for government authorities to audit and track MPLADS (Members of Parliament Local Area Development Scheme) works across India.

The platform ingests national project records (43,496 official works across 33 States/UTs) and applies an explainable AI and statistical inference pipeline to detect:
1. **Severe Cost Inflation & Outliers** via peer-group deviation benchmarks and statistical dispersion modeling across work types and states.
2. **Execution Delays & Financial Outlay Gaps** identifying projects with milestone overruns or high fund disbursements despite low physical progress.
3. **Visual Compliance Gaps** flagging high-value works lacking mandatory geo-tagged inspection photos.
4. **Implementing Agency (IDA) Monopolies** flagging disproportionate single-vendor allocation of state works or funds.

---

## 👥 4-Tier Role-Based Dashboards & Workflows

The platform provides isolated, tailored intelligence dashboards for four distinct government roles:

1. **🏛️ Ministry / Central Government (National Oversight)**
   - Macro oversight across **33 States/UTs** with aggregated national KPIs (₹2,516+ Cr sanctioned, ₹2,374+ Cr expenditure, 94.4% fund utilization).
   - National State Ranking Leaderboard and high-risk state triage.
   - Comprehensive Analytics (work-type distributions, risk band breakdown, and monthly expenditure trends).

2. **🏢 State Nodal Authority**
   - Inter-district implementation oversight and state-level KPI tracking.
   - District Performance & Risk Comparison Leaderboard.
   - Agency monopoly analysis to prevent vendor lock-in.

3. **🏛️ District Authority (District Magistrate / Collector)**
   - District-wide project execution monitoring, financial ledgers, and milestone verification.
   - High-risk project inspection queue with direct dossier inspection.

4. **👤 Member of Parliament (MP)**
   - Constituency-scoped portfolio (e.g. *Dr Sukanta Majumdar - Balurghat*).
   - Real-time project progress, expenditure tracking, and AI risk warnings for constituency works.

---

## 🔐 Login & Authentication

Access to the platform is role-secured with built-in quick-authentication:

| Field | Default Value |
| :--- | :--- |
| **User ID** | `12345` |
| **Password** | `sih` |
| **Available Roles** | Ministry / Central Govt, State Nodal Authority, District Authority, MP |

---

## 🧠 Explainable Multi-Factor AI Risk Architecture

Each project is evaluated across three core risk vectors to compute an explainable Composite Risk Score (0–100):

| Risk Dimension | Model / Detection Logic | Weight |
| :--- | :--- | :--- |
| **Cost Outlier Risk** | Deviation against work-type median cost and state baseline with Isolation Forest & IQR bounds. | **45%** |
| **Compliance & Milestone Delay** | Geo-tagged photo verification, schedule overrun tracking, and disproportionate expenditure vs. physical progress. | **40%** |
| **Agency Monopoly Risk** | Share of works ($\ge 35\%$) and funds awarded to a single Implementing District Agency (IDA). | **15%** |

> **🟢 100% Progress Low-Risk Rule:**  
> In strict compliance with operational vigilance norms, all projects with **100% physical completion** on schedule are assigned **LOW Risk (≤ 24/100)**. Critical and High-Risk flags are reserved for active milestone overruns, low-progress high-expenditure gaps, and unverified large outlays.

---

## 🗺️ Interactive GIS Map & Spatial Intelligence

- **Dual-Layer Mapping:** Toggle between **Street Map (OpenStreetMap)** and high-resolution **Satellite Imagery (Esri World Imagery)**.
- **Geocoded Risk Markers:** Pins color-coded by severity (🔴 Critical, 🟠 High, 🟡 Medium, 🟢 Low).
- **Interactive Inspection Popups:** Click any pin to view physical progress, expenditure, recommending MP, and open full project dossiers.
- **Auto-Zoom & Center:** Automatically focuses on the active State, District, or MP Constituency.

---

## 🚀 Getting Started

### Prerequisites
- **Python 3.10+**
- **Node.js 18+** & `npm`

### 1. Start the FastAPI Backend
```bash
# From the project root
uvicorn backend.main:app --host 127.0.0.1 --port 8001 --reload
```
- **Backend API:** [http://127.0.0.1:8001](http://127.0.0.1:8001)
- **Interactive Swagger Docs:** [http://127.0.0.1:8001/docs](http://127.0.0.1:8001/docs)

### 2. Start the React Frontend
```bash
cd frontend
npm install
npm run dev -- --port 3000
```
- **Web Application:** [http://localhost:3000](http://localhost:3000)

---

## 📂 Project Structure

```
mplads_anomaly_detector/
├── backend/
│   ├── main.py                  # FastAPI REST API with role-based scoping & compatibility endpoints
│   ├── risk_engine.py           # Multi-factor risk scoring engine & data enrichment pipeline
│   ├── data_loader.py           # Data ingestion & peer-group statistics calculation
│   └── validate_model.py        # Model validation & benchmark suite
├── frontend/
│   ├── src/
│   │   ├── components/          # Navbar, KPICard, RiskBadge, WorkDetailModal
│   │   ├── views/               # RoleDashboardView, WorkExplorerView, AlertsView, AnalyticsView, MapView, ReportsView, LoginView
│   │   ├── services/api.js      # Centralized API service layer
│   │   └── App.jsx              # Main application shell with authentication state
│   ├── package.json
│   └── vite.config.js
├── data/
│   └── processed/
│       ├── completed_clean.csv       # Clean base MPLADS dataset
│       └── risk_scored_works.csv     # 43,496 AI risk-scored project records
├── README.md
└── requirements.txt
```

---

## 📡 Key REST API Endpoints

| Endpoint | Description |
| :--- | :--- |
| `GET /api/dashboard/summary` | Role-scoped aggregated KPI metrics (sanctioned, expenditure, utilization, counts). |
| `GET /api/projects` | Filterable, paginated project list with multi-parameter search. |
| `GET /api/projects/{id}` | Detailed project metadata, timeline, and financial ledger. |
| `GET /api/projects/{id}/risk` | Explainable AI subscore decomposition and vigilance recommendations. |
| `GET /api/alerts` | Prioritized AI risk alerts with anomaly categorization and search. |
| `GET /api/states` | State-level aggregated performance and risk indicators. |
| `GET /api/districts` | District comparison metrics within a state or nationally. |
| `GET /api/analytics` | Work-type distribution, risk bands, and monthly financial trends. |
| `GET /api/map/projects` | Geospatial coordinates and markers for GIS map rendering. |

---

## 🛡️ License & Compliance

Designed and implemented for **Ministry of Statistics and Programme Implementation (MoSPI)** public transparency and MPLADS scheme governance.
