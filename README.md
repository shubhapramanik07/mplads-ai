# 🏛️ MPLADS AI Vigilance & Monitoring Platform
### Intelligent Decision Support & Multi-Factor Anomaly Detection System
**Ministry of Statistics and Programme Implementation (MoSPI) • Government of India**

---

## 📌 Executive Overview

The **MPLADS AI Vigilance Platform** is an enterprise-grade, role-based web application designed for government authorities to monitor, audit, and analyze MPLADS (*Members of Parliament Local Area Development Scheme*) works across India.

The system ingests national project records (**43,496 official works across 33 States/UTs**) and applies an explainable AI and statistical inference pipeline to detect:
1. **Severe Cost Inflation & Outliers** via peer-group deviation benchmarks and statistical dispersion modeling across work types and states.
2. **Execution Delays & Financial Outlay Gaps** identifying projects with milestone overruns or high fund disbursements despite low physical progress.
3. **Visual Compliance Gaps** flagging high-value works lacking mandatory geo-tagged inspection photos.
4. **Implementing Agency (IDA) Monopolies** flagging disproportionate single-vendor allocation of state works or funds.

---

## 🚀 Quickstart Guide for Collaborators

Follow these step-by-step instructions to clone, set up, and run the project locally on your machine.

### 📋 Prerequisites
Before starting, ensure you have the following installed on your system:
- **Git** ([Download Git](https://git-scm.com/))
- **Python 3.10+** (Python 3.11 or 3.12 recommended) — Check with `python --version`
- **Node.js 18+ & npm** ([Download Node.js](https://nodejs.org/)) — Check with `node -v` and `npm -v`

---

### Step 1: Clone the Repository
Open your terminal (PowerShell, Command Prompt, or Bash) and run:
```bash
git clone https://github.com/shubhapramanik07/mplads-ai.git
cd mplads-ai
```

---

### Step 2: Backend Setup (FastAPI & AI Engine)

1. **Create and activate a Python Virtual Environment:**
   * **Windows (PowerShell):**
     ```powershell
     python -m venv venv
     .\venv\Scripts\Activate.ps1
     ```
   * **Windows (CMD):**
     ```cmd
     python -m venv venv
     venv\Scripts\activate.bat
     ```
   * **macOS / Linux:**
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```

2. **Install backend Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Start the FastAPI Backend Server:**
   ```bash
   python -m uvicorn backend.main:app --host 127.0.0.1 --port 8001 --reload
   ```
   * **Backend API Base URL:** [http://127.0.0.1:8001](http://127.0.0.1:8001)
   * **Interactive Swagger UI (API Docs):** [http://127.0.0.1:8001/docs](http://127.0.0.1:8001/docs)

---

### Step 3: Frontend Setup (React + Vite + Tailwind)

Open a **new, separate terminal window** (keep the backend server running in the first terminal):

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

3. **Start the Vite development server:**
   ```bash
   npm run dev -- --port 3000
   ```

4. **Access the Web Application:**
   Open your browser and navigate to: **[http://localhost:3000](http://localhost:3000)**

---

### Step 4: Login Credentials

The application includes a role-based login portal. Use the following default demo credentials:

| Login Field | Default Value | Notes |
| :--- | :--- | :--- |
| **User ID** | `12345` | Demo Officer ID |
| **Password** | `sih` | Default Authentication Key |
| **Selectable Roles** | 1. **Ministry / Central Govt**<br>2. **State Nodal Authority**<br>3. **District Authority**<br>4. **Member of Parliament (MP)** | You can also click the quick-fill cards on the login screen to auto-fill credentials. |

---

## 🛠️ Technology Stack — What We Use & For What

Here is a detailed breakdown of all technologies used in the project and their specific role in the platform:

| Technology | Category | Used For / Purpose in Project |
| :--- | :--- | :--- |
| **React 18** | Frontend Framework | Builds the dynamic, interactive single-page application (SPA), manages component state with hooks (`useState`, `useEffect`, `useRef`), and renders role-based views. |
| **Vite** | Build Tool & Bundler | Provides lightning-fast local development server, instant Hot Module Replacement (HMR), and optimized production bundling. |
| **Tailwind CSS** | UI Styling | Utility-first CSS framework used for responsive design, custom Government of India theme colors (*MoSPI Navy, Saffron, Emerald*), cards, tables, and animations. |
| **Leaflet & React-Leaflet** | GIS & Mapping | Powers the interactive GIS map module, rendering project coordinates, cluster markers, zoom controls, and custom popup dossiers. |
| **OpenStreetMap (OSM)** | Map Tile Provider | Provides live street and road navigation tile layer on the GIS map. |
| **Esri World Imagery** | Satellite Tile Provider | Provides high-resolution global satellite imagery tile layer for physical site inspection. |
| **Recharts** | Data Visualization | Renders interactive analytical charts: monthly fund expenditure bar charts, work-type cost distribution charts, and risk band breakdown donuts. |
| **Lucide React** | Iconography | Provides clean, scalable SVG icons for navigation bars, KPI cards, vigilance badges, and action buttons. |
| **Python 3.12** | Core Backend Language | Powers data processing pipelines, statistical computing, and RESTful API services. |
| **FastAPI** | REST API Framework | High-performance asynchronous backend framework that serves role-scoped summary KPIs, project query endpoints, AI alert queues, and map markers. |
| **Uvicorn** | ASGI Web Server | Production-grade ASGI server running FastAPI on `http://127.0.0.1:8001`. |
| **Pydantic** | Data Validation | Enforces strict schema validation, request/response models, and type safety across API endpoints. |
| **Scikit-Learn (`sklearn`)** | Machine Learning & NLP | Contains `IsolationForest` for unsupervised cost outlier detection, and `TfidfVectorizer` + `cosine_similarity` for text modeling. |
| **Pandas** | Data Ingestion & Analytics | In-memory data manipulation of the 43,496 project records, computing peer-group baselines ($Q_{25}, Q_{75}$, medians), and calculating state/district aggregates. |
| **NumPy** | Numerical Operations | Vectorized numerical calculations, statistical deviation metrics, and percentile estimations. |
| **CORS Middleware** | Security & Networking | Enables secure cross-origin API communication between React frontend (`localhost:3000`) and FastAPI backend (`127.0.0.1:8001`). |
| **SessionStorage** | Client State Persistence | Stores the active session, logged-in officer profile, and role-scope preferences across browser page reloads. |
| **Git & GitHub** | Version Control | Source code versioning, team collaboration, and continuous tracking on branch `main`. |

---

## 👥 4-Tier Role-Based Dashboards

The application implements four tailored workflows based on administrative hierarchy:

```
                      ┌────────────────────────────────────────┐
                      │    Ministry / Central Govt (MoSPI)     │
                      │  National Macro Oversight (33 States)  │
                      └──────────────────┬─────────────────────┘
                                         │
                      ┌──────────────────┴─────────────────────┐
                      │         State Nodal Authority          │
                      │  Inter-District Leaderboard & Monopolies│
                      └──────────────────┬─────────────────────┘
                                         │
                      ┌──────────────────┴─────────────────────┐
                      │           District Authority           │
                      │  District Magistrate Project Triage    │
                      └──────────────────┬─────────────────────┘
                                         │
                      ┌──────────────────┴─────────────────────┐
                      │       Member of Parliament (MP)        │
                      │  Constituency Portfolio (e.g. Balurghat)│
                      └────────────────────────────────────────┘
```

1. **🏛️ Ministry / Central Government (National Oversight)**
   - Macro oversight across **33 States/UTs** with aggregated national KPIs (**43,496 works**, ₹2,516+ Cr sanctioned, ₹2,374+ Cr expenditure, 94.4% fund utilization).
   - National State Ranking Leaderboard and high-risk state triage.
   - Comprehensive Analytics (work-type distributions, risk band breakdown, and monthly expenditure trends).

2. **🏢 State Nodal Authority**
   - Inter-district implementation oversight and state-level KPI tracking.
   - District Performance & Risk Comparison Leaderboard.
   - Agency monopoly analysis to prevent single-vendor capture.

3. **🏛️ District Authority (District Magistrate / Collector)**
   - District-wide project execution monitoring, financial ledgers, and milestone verification.
   - High-risk project inspection queue with direct dossier inspection.

4. **👤 Member of Parliament (MP)**
   - Constituency-scoped portfolio (e.g. *Dr Sukanta Majumdar - Balurghat*).
   - Real-time project progress, expenditure tracking, and AI risk warnings for constituency works.

---

## 🧠 Multi-Factor AI Risk Scoring Pipeline

Each project is evaluated across three core risk vectors to compute an explainable Composite Risk Score (0–100):

```
┌─────────────────────────┐     ┌─────────────────────────┐     ┌─────────────────────────┐
│    Cost Outlier Risk    │     │  Compliance & Milestones│     │  Agency Monopoly Risk   │
│   (Weight: 45% / 100)   │     │   (Weight: 40% / 100)   │     │   (Weight: 15% / 100)   │
│ Peer-Group Median & IQR │     │ Photo Proof, Delay, Gap │     │  IDA Share >= 35% State │
└────────────┬────────────┘     └────────────┬────────────┘     └────────────┬────────────┘
             │                               │                               │
             └───────────────────────┬───────┴───────────────────────────────┘
                                     │
                                     ▼
                   ┌──────────────────────────────────┐
                   │    Composite AI Risk Score       │
                   │            (0 - 100)             │
                   │  🟢 LOW | 🟡 MED | 🟠 HIGH | 🔴 CRIT│
                   └──────────────────────────────────┘
```

| Risk Dimension | Model / Detection Logic | Weight |
| :--- | :--- | :--- |
| **Cost Outlier Risk** | Deviation against work-type median cost and state baseline with Isolation Forest & IQR bounds. | **45%** |
| **Compliance & Milestone Delay** | Geo-tagged photo verification, schedule overrun tracking, and disproportionate expenditure vs. physical progress. | **40%** |
| **Agency Monopoly Risk** | Share of works ($\ge 35\%$) and funds awarded to a single Implementing District Agency (IDA). | **15%** |

> **🟢 100% Progress Low-Risk Rule:**  
> In strict compliance with operational vigilance norms, all projects with **100% physical completion** on schedule are strictly assigned **LOW Risk (≤ 24/100)**. Critical and High-Risk flags are reserved for active milestone overruns, low-progress high-expenditure gaps, and unverified large outlays.

---

## 📁 Project Directory Tree

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
│   │   ├── services/api.js      # Centralized API service layer (Fetch client)
│   │   ├── App.jsx              # Main application shell with authentication state
│   │   ├── main.jsx             # React DOM entry point
│   │   └── index.css            # Tailwind CSS directives & custom styles
│   ├── package.json             # Frontend dependencies & scripts
│   ├── tailwind.config.js       # Custom government color palette
│   └── vite.config.js           # Vite dev server configuration
├── data/
│   └── processed/
│       ├── completed_clean.csv       # Clean base MPLADS dataset
│       └── risk_scored_works.csv     # 43,496 AI risk-scored project records
├── README.md                    # Project documentation (this file)
└── requirements.txt             # Python backend dependencies
```

---

## 📡 REST API Endpoint Reference

All endpoints return JSON responses. Access interactive Swagger documentation at [http://127.0.0.1:8001/docs](http://127.0.0.1:8001/docs).

| HTTP Method | Endpoint | Query Parameters | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/dashboard/summary` | `role`, `state`, `district`, `mp_name` | Returns role-scoped summary KPIs (total works, sanctioned amount, expenditure, utilization %, risk band counts). |
| `GET` | `/api/projects` | `role`, `state`, `district`, `mp_name`, `status`, `work_type`, `risk_level`, `search`, `limit`, `offset` | Returns filtered, paginated project monitoring list. |
| `GET` | `/api/projects/{id}` | `id` (path) | Returns complete metadata for a specific project. |
| `GET` | `/api/projects/{id}/risk` | `id` (path) | Returns explainable AI risk subscores, drivers, and vigilance recommendations. |
| `GET` | `/api/alerts` | `role`, `state`, `district`, `mp_name`, `severity`, `alert_type`, `limit` | Returns prioritized AI vigilance alert queue. |
| `GET` | `/api/states` | None | Returns leaderboard of 33 States/UTs with aggregated indicators. |
| `GET` | `/api/districts` | `state` | Returns district-wise comparison list within a state. |
| `GET` | `/api/analytics` | `role`, `state`, `district`, `mp_name` | Returns monthly trends, work-type distribution, and risk proportions. |
| `GET` | `/api/map/projects` | `role`, `state`, `district`, `mp_name`, `risk_level`, `limit` | Returns geocoded marker coordinates for GIS map rendering. |

---

## 💡 Troubleshooting & Common Issues

1. **Port Already in Use (`Error: listen EADDRINUSE: address already in use :::3000` or `8001`):**
   * Change port or terminate the existing process:
     * *Windows (PowerShell):* `Get-Process -Id (Get-NetTCPConnection -LocalPort 8001).OwningProcess | Stop-Process`
2. **CORS Errors in Browser Console:**
   * Ensure backend is running on `http://127.0.0.1:8001`. The backend has `CORSMiddleware` configured to allow all origins.
3. **Module Not Found Errors (Python):**
   * Ensure your virtual environment is active and run `pip install -r requirements.txt`. Run uvicorn as a module: `python -m uvicorn backend.main:app --port 8001`.

---

## 🛡️ License & Compliance

Designed and implemented for the **Ministry of Statistics and Programme Implementation (MoSPI)** public transparency and MPLADS scheme governance.
