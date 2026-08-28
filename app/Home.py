"""
MPLADS AI Anomaly & Fraud Detection System - Main Landing Page
SIH Problem Statement SIH26102
"""
import sys
import os

# Ensure app and project roots are in python path
_APP_DIR = os.path.dirname(os.path.abspath(__file__))
_PROJ_DIR = os.path.dirname(_APP_DIR)
if _APP_DIR not in sys.path:
    sys.path.insert(0, _APP_DIR)
if _PROJ_DIR not in sys.path:
    sys.path.insert(0, _PROJ_DIR)

import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go

from utils import api_get, format_inr, get_risk_badge, check_backend_health

st.set_page_config(
    page_title="MPLADS AI Anomaly & Fraud Intelligence",
    page_icon="🛡️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS styling
st.markdown("""
    <style>
    .main-header {
        font-size: 2.2rem;
        font-weight: 800;
        color: #1E3A8A;
        margin-bottom: 0.2rem;
    }
    .sub-header {
        font-size: 1.05rem;
        color: #4B5563;
        margin-bottom: 1.5rem;
    }
    .kpi-card {
        background: #F8FAFC;
        border: 1px solid #E2E8F0;
        border-radius: 10px;
        padding: 1.2rem;
        text-align: center;
        box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .kpi-val {
        font-size: 2rem;
        font-weight: 700;
        color: #1E293B;
    }
    .kpi-label {
        font-size: 0.88rem;
        font-weight: 600;
        color: #64748B;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    .role-card {
        background: #FFFFFF;
        border: 1px solid #E5E7EB;
        border-radius: 8px;
        padding: 1rem;
        margin-bottom: 0.8rem;
        transition: transform 0.2s;
    }
    .role-card:hover {
        border-color: #3B82F6;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    </style>
""", unsafe_allow_html=True)

# Sidebar
with st.sidebar:
    st.image("https://img.icons8.com/fluency/96/shield-check.png", width=64)
    st.markdown("### **MPLADS AI Risk Engine**")
    st.markdown("🎯 **SIH26102 Prototype**")
    
    backend_ok = check_backend_health()
    if backend_ok:
        st.success("🟢 FastAPI Backend: Online")
    else:
        st.info("🟡 Local Data Mode Active")
        
    st.markdown("---")
    st.markdown("**Role-Based Portals:**")
    st.markdown("🏛️ **1. Ministry View** (MoSPI National)")
    st.markdown("🏢 **2. State Nodal View** (State Officer)")
    st.markdown("👤 **3. District & MP View** (Constituency)")
    st.markdown("🚨 **4. Alerts & Action Center** (Audits)")
    st.markdown("🔬 **5. AI Model Validation** (Benchmarks)")
    st.markdown("---")
    st.caption("Powered by Isolation Forest, TF-IDF NLP Similarity, & Multi-Factor Anomaly Compounders.")

# Header
st.markdown('<div class="main-header">🛡️ MPLADS AI Anomaly & Fraud Detection System</div>', unsafe_allow_html=True)
st.markdown(
    '<div class="sub-header">AI-Powered Monitoring, Duplicate Work Prevention, Cost Outlier Flagging & Agency Monopoly Detection for the Member of Parliament Local Area Development Scheme.</div>',
    unsafe_allow_html=True
)

# Fetch KPIs
kpis = api_get("/summary/kpis")
if not kpis:
    st.error("Unable to load data. Please ensure the backend is running.")
    st.stop()

# Top KPI Metric Cards
c1, c2, c3, c4, c5 = st.columns(5)

with c1:
    st.metric(
        label="Total Projects Tracked",
        value=f"{kpis['total_works']:,}",
        help="Total completed MPLADS works in the database"
    )

with c2:
    st.metric(
        label="Total Expenditure",
        value=f"₹{kpis['total_amount_crores']} Cr",
        help="Cumulative expenditure across all tracked works"
    )

with c3:
    st.metric(
        label="Flagged High Risk",
        value=f"{kpis['high_risk_count']}",
        delta=f"{kpis['high_risk_percentage']}% of total",
        delta_color="inverse",
        help="Works with AI Risk Score >= 70 requiring immediate audit"
    )

with c4:
    st.metric(
        label="Average Risk Score",
        value=f"{kpis['avg_risk_score']} / 100",
        help="National average risk index across all projects"
    )

with c5:
    st.metric(
        label="Potential Duplicate Works",
        value=f"{kpis['duplicate_works_count']}",
        delta=f"{kpis['missing_images_count']} Missing Images",
        delta_color="inverse",
        help="Works flagged for high description/location overlap or missing compliance photos"
    )

st.markdown("---")

# Main Visualizations Row
col_left, col_right = st.columns([1, 1])

# 1. Risk Score Distribution
with col_left:
    st.subheader("📊 National Risk Score Distribution")
    works_resp = api_get("/works", params={"limit": 1000})
    if works_resp and "data" in works_resp:
        df_works = pd.DataFrame(works_resp["data"])
        
        fig_dist = px.histogram(
            df_works,
            x="risk_score",
            nbins=25,
            color="risk_category",
            color_discrete_map={"LOW": "#28a745", "MEDIUM": "#ffc107", "HIGH": "#dc3545"},
            title="Distribution of AI Risk Scores (0-100)",
            labels={"risk_score": "AI Composite Risk Score", "count": "Number of Works", "risk_category": "Risk Band"}
        )
        fig_dist.update_layout(
            bargap=0.08,
            template="plotly_white",
            legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
            margin=dict(l=20, r=20, t=40, b=20),
            height=360
        )
        st.plotly_chart(fig_dist, use_container_width=True)

# 2. State-Wise Risk & Outlay Comparison
with col_right:
    st.subheader("🗺️ State-Wise Risk & High-Risk Count")
    state_summary = api_get("/summary/state")
    if state_summary:
        df_state = pd.DataFrame(state_summary)
        
        fig_state = go.Figure()
        fig_state.add_trace(go.Bar(
            x=df_state["state"],
            y=df_state["high_risk_count"],
            name="High Risk Works (Count)",
            marker_color="#dc3545"
        ))
        fig_state.add_trace(go.Scatter(
            x=df_state["state"],
            y=df_state["avg_risk_score"],
            name="Avg Risk Score (0-100)",
            yaxis="y2",
            mode="lines+markers",
            line=dict(color="#1E3A8A", width=3),
            marker=dict(size=8)
        ))
        fig_state.update_layout(
            title="State-wise High-Risk Volume vs Average Risk Score",
            xaxis=dict(tickangle=-30),
            yaxis=dict(title="High-Risk Works Count"),
            yaxis2=dict(
                title="Avg Risk Score",
                overlaying="y",
                side="right",
                range=[0, 60]
            ),
            template="plotly_white",
            legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
            margin=dict(l=20, r=20, t=40, b=20),
            height=360
        )
        st.plotly_chart(fig_state, use_container_width=True)

st.markdown("---")

# Work Type Category Breakdown
st.subheader("🏗️ Work Type Expenditure vs Risk Analysis")
wt_summary = api_get("/summary/work_types")
if wt_summary:
    df_wt = pd.DataFrame(wt_summary)
    
    col_w1, col_w2 = st.columns([3, 2])
    with col_w1:
        fig_wt = px.bar(
            df_wt,
            x="work_type",
            y="total_amount_crores",
            color="avg_risk_score",
            color_continuous_scale="Reds",
            title="Total Expenditure by Work Category (Color = Avg Risk Score)",
            labels={"work_type": "Work Category", "total_amount_crores": "Expenditure (₹ Cr)", "avg_risk_score": "Avg Risk"}
        )
        fig_wt.update_layout(template="plotly_white", height=340, margin=dict(l=20, r=20, t=40, b=20))
        st.plotly_chart(fig_wt, use_container_width=True)

    with col_w2:
        fig_pie = px.pie(
            df_wt,
            names="work_type",
            values="high_risk_count",
            title="Share of Flagged High-Risk Works by Category",
            hole=0.42,
            color_discrete_sequence=px.colors.qualitative.Safe
        )
        fig_pie.update_layout(height=340, margin=dict(l=20, r=20, t=40, b=20))
        st.plotly_chart(fig_pie, use_container_width=True)

st.markdown("---")

# Quick Navigation Guide
st.subheader("🧭 Guided Exploration Portals")
p1, p2, p3, p4 = st.columns(4)

with p1:
    st.info("""
    **🏛️ Ministry View**  
    National MoSPI overview, state rankings, top flagged projects, and macro expenditure trends over time.
    """)

with p2:
    st.info("""
    **🏢 State Nodal View**  
    Select any Indian State to inspect district-level works, filter projects, and audit IDA agency concentration monopolies.
    """)

with p3:
    st.info("""
    **👤 District & MP View**  
    Select any Member of Parliament to analyze constituency works, duplicate work alerts, and cost benchmark comparisons.
    """)

with p4:
    st.info("""
    **🚨 Alerts & Audits**  
    Interactive high-risk audit workbench with plain-English AI explanations, cost breakdown, and CSV export.
    """)
