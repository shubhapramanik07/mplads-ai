# 🛡️ AI-Powered MPLADS Anomaly & Fraud Detection System

**Smart India Hackathon (SIH) Problem Statement:** SIH26102  
**Domain:** Ministry of Statistics and Programme Implementation (MoSPI) / Government Schemes  
**Tech Stack:** Python 3.12, FastAPI (REST API & Analytics Engine), Scikit-Learn (Isolation Forest & NLP), Streamlit (Interactive Multi-Role Dashboard), Plotly (Visualizations).

---

## 🎯 Executive Summary & Judge Pitch

> **Methodology for Hackathon Judges:**  
> The system implements a multi-tiered, explainable AI risk intelligence pipeline that ingests MPLADS project data and computes a unified 0–100 **Composite Risk Score** alongside human-readable audit justifications. It evaluates four core fraud and inefficiency vectors: **(1) Statistical Cost Outlier Modeling** via Isolation Forest combined with peer-group median deviation across work categories and state thresholds; **(2) Ghost & Duplicate Work Prevention** using TF-IDF vectorization and cosine similarity matching on work descriptions grouped per MP constituency; **(3) Visual Compliance Verification** penalizing unverified high-value works lacking mandatory geo-tagged inspection photos; and **(4) Implementing Agency (IDA) Monopoly Detection** flagging disproportionate single-vendor allocation of state works or funds. The model was empirically validated using controlled synthetic anomaly injection, demonstrating a **100% detection rate** on high-risk planted fraud patterns.

---

## 🚀 How to Run (Quickstart)

Open two separate terminal windows in the project directory (`mplads_anomaly_detector`):

### Terminal 1: Start FastAPI Backend
```bash
uvicorn backend.main:app --reload --port 8000
```
* **API Documentation & Interactive Swagger UI:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
* **Health Check & KPI Endpoint:** [http://127.0.0.1:8000/summary/kpis](http://127.0.0.1:8000/summary/kpis)

### Terminal 2: Start Streamlit Frontend Dashboard
```bash
streamlit run app/Home.py
```
* **Interactive Web App:** [http://localhost:8501](http://localhost:8501)

---

## 📂 Project Architecture

```
mplads_anomaly_detector/
├── data/
│   └── processed/
│       ├── completed_clean.csv          # Base dataset (800+ realistic MPLADS records)
│       ├── risk_scored_works.csv        # ML-scored output with plain-English reasons
│       └── model_validation_report.json # Empirical synthetic validation results
├── backend/
│   ├── __init__.py
│   ├── data_loader.py                   # Data ingestion & peer-group statistics calculation
│   ├── risk_engine.py                   # Isolation Forest, TF-IDF NLP, Agency Concentration
│   ├── validate_model.py                # Synthetic anomaly injection benchmark module
│   └── main.py                          # High-performance FastAPI backend with CORS
├── app/
│   ├── Home.py                          # National KPI overview & risk distribution charts
│   ├── utils.py                         # API client, risk badges, color formatting
│   └── pages/
│       ├── 1_Ministry_View.py           # National MoSPI ranking & macro trends
│       ├── 2_State_Nodal_View.py        # State-level drill-down & IDA monopoly audit
│       ├── 3_District_MP_View.py        # MP constituency portfolio & cost benchmarks
│       ├── 4_Alerts.py                  # Proactive audit queue with plain-English reasons
│       └── 5_Model_Validation.py        # Synthetic test results & detection benchmarks
├── generate_data.py                     # Realistic MPLADS baseline dataset generator
├── requirements.txt                     # Pinned project dependencies
└── README.md                            # Comprehensive documentation
```

---

## 🔬 Multi-Factor Risk Scoring Engine

| Dimension | AI / Statistical Model | Detection Logic & Anomaly Trigger | Weight |
| :--- | :--- | :--- | :--- |
| **Cost Outlier** | **Isolation Forest** + Peer Deviation | Flags works exceeding work-type median by >50% or state median by >75%. | **35%** |
| **Duplicate Work** | **TF-IDF + Cosine Similarity** | Flags pairs of works with $\ge 75\%$ textual similarity recommended by same MP. | **35%** |
| **Compliance Gap** | **Boolean Audit Flag** | Flags projects lacking mandatory geo-tagged images (`has_images == False`). | **15%** |
| **Agency Monopoly**| **Concentration Metric** | Flags IDAs executing $\ge 35\%$ of total state works or sanctioned amounts. | **15%** |

*Note: Compound Multiplier is applied if $\ge 2$ severe anomalies coincide on a single work ID.*

---

## 📡 REST API Endpoints

- `GET /summary/kpis`: National overview metrics (works count, outlay, high-risk count).
- `GET /works`: Filterable works list (`state`, `mp_name`, `work_type`, `risk_category`, `min_risk_score`).
- `GET /works/{work_id}`: Full work metadata, peer comparisons, and plain-English reasons.
- `GET /summary/state`: State-wise risk rankings, high-risk counts, and dominant IDAs.
- `GET /summary/mp`: Constituency-level summary per Member of Parliament.
- `GET /summary/work_types`: Cost and risk statistics by work category.
- `GET /summary/ida`: Implementing Agency market concentration breakdown.
- `GET /alerts`: Top prioritized high-risk audit items.
- `GET /validation/report`: Empirical validation metrics from synthetic anomaly injection.
- `POST /recalculate`: On-demand re-execution of the risk scoring pipeline.

---

## 💡 Assumptions and Simplifications

1. **Local Operation:** Runs entirely locally using in-memory pandas caches and CSVs without requiring external cloud databases or paid API keys.
2. **Peer Group Granularity:** Work types are grouped into 10 standardized categories (`road`, `water_supply`, `street_light`, `drainage`, `education`, `community_hall`, `sanitation`, `healthcare`, `sports`, `other`).
3. **NLP Deduplication Scope:** Cosine similarity comparison is scoped per MP and constituency to optimize computational efficiency and minimize cross-district false positives.
