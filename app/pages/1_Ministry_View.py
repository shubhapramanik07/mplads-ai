"""
Ministry of Statistics & Programme Implementation (MoSPI) - National Executive View
"""
import sys
import os

_APP_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_PROJ_DIR = os.path.dirname(_APP_DIR)
if _APP_DIR not in sys.path:
    sys.path.insert(0, _APP_DIR)
if _PROJ_DIR not in sys.path:
    sys.path.insert(0, _PROJ_DIR)

import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go

from utils import api_get, format_inr, get_risk_badge, style_risk_dataframe

st.set_page_config(page_title="Ministry View | MPLADS AI Intelligence", page_icon="🏛️", layout="wide")

st.title("🏛️ Ministry Executive View (National Level)")
st.markdown("Macro-level oversight of MPLADS fund utilization, interstate risk disparities, and national audit priorities.")

# Fetch state summary
state_data = api_get("/summary/state")
if not state_data:
    st.error("Failed to load national data from API.")
    st.stop()

df_state = pd.DataFrame(state_data)

# KPI summary
kpis = api_get("/summary/kpis")
if kpis:
    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.metric("Total States Tracked", f"{kpis['total_states']}")
    with col2:
        st.metric("Total Works Monitored", f"{kpis['total_works']:,}")
    with col3:
        st.metric("National Outlay", f"₹{kpis['total_amount_crores']} Cr")
    with col4:
        st.metric("High-Risk Projects", f"{kpis['high_risk_count']}", delta=f"{kpis['high_risk_percentage']}% of total", delta_color="inverse")

st.markdown("---")

# Row 1: State Risk Rankings & Work Type Treemap
c_left, c_right = st.columns([3, 2])

with c_left:
    st.subheader("📋 State-Wise Risk Ranking Table")
    df_state_display = df_state[[
        "state", "avg_risk_score", "high_risk_count", "high_risk_rate_pct",
        "total_works", "total_amount_crores", "top_ida"
    ]].rename(columns={
        "state": "State / UT",
        "avg_risk_score": "Avg Risk Score (0-100)",
        "high_risk_count": "High-Risk Works",
        "high_risk_rate_pct": "High-Risk %",
        "total_works": "Total Works",
        "total_amount_crores": "Outlay (₹ Cr)",
        "top_ida": "Dominant Implementing Agency"
    })
    
    st.dataframe(
        df_state_display.style.background_gradient(subset=["Avg Risk Score (0-100)"], cmap="Reds"),
        use_container_width=True,
        height=380
    )

with c_right:
    st.subheader("🌳 Work Type Budget Allocation")
    wt_data = api_get("/summary/work_types")
    if wt_data:
        df_wt = pd.DataFrame(wt_data)
        fig_tree = px.treemap(
            df_wt,
            path=["work_type"],
            values="total_amount_crores",
            color="avg_risk_score",
            color_continuous_scale="Reds",
            title="Work Categories Sized by Outlay (Color = Risk)",
            labels={"total_amount_crores": "Outlay (₹ Cr)", "avg_risk_score": "Avg Risk"}
        )
        fig_tree.update_layout(margin=dict(l=10, r=10, t=30, b=10), height=380)
        st.plotly_chart(fig_tree, use_container_width=True)

st.markdown("---")

# Row 2: Temporal Trend Analysis over completed_date
st.subheader("📈 Time-Series Trend of Completed Works & Risk Velocity")
works_data = api_get("/works", params={"limit": 1000})
if works_data and "data" in works_data:
    df_w = pd.DataFrame(works_data["data"])
    df_w["completed_date"] = pd.to_datetime(df_w["completed_date"], errors="coerce")
    df_w["year_month"] = df_w["completed_date"].dt.to_period("M").astype(str)
    
    # Monthly aggregation
    monthly = df_w.groupby("year_month").agg(
        total_works=("work_id", "count"),
        total_amount=("final_amount", "sum"),
        avg_risk=("risk_score", "mean"),
        high_risk_count=("risk_category", lambda x: (x == "HIGH").sum())
    ).reset_index()
    monthly = monthly.sort_values("year_month")
    monthly["amount_crores"] = monthly["total_amount"] / 1e7

    fig_time = go.Figure()
    fig_time.add_trace(go.Bar(
        x=monthly["year_month"],
        y=monthly["amount_crores"],
        name="Monthly Expenditure (₹ Cr)",
        marker_color="#93C5FD",
        opacity=0.8
    ))
    fig_time.add_trace(go.Scatter(
        x=monthly["year_month"],
        y=monthly["avg_risk"],
        name="Avg Risk Score",
        yaxis="y2",
        mode="lines+markers",
        line=dict(color="#DC2626", width=3),
        marker=dict(size=7)
    ))
    fig_time.update_layout(
        title="Monthly Sanction/Completion Volume vs Risk Score Velocity",
        xaxis=dict(title="Month-Year", tickangle=-45),
        yaxis=dict(title="Expenditure (₹ Crores)"),
        yaxis2=dict(
            title="Avg Risk Score (0-100)",
            overlaying="y",
            side="right",
            range=[0, 60]
        ),
        template="plotly_white",
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
        margin=dict(l=20, r=20, t=40, b=20),
        height=360
    )
    st.plotly_chart(fig_time, use_container_width=True)

st.markdown("---")

# Row 3: Top 10 Highest-Risk Works Nationally
st.subheader("🚨 Top 10 Highest-Risk Projects Nationally (Priority Audit Queue)")
alerts_data = api_get("/alerts", params={"limit": 10, "min_risk_score": 50})
if alerts_data and "alerts" in alerts_data:
    top10 = alerts_data["alerts"]
    for i, work in enumerate(top10, 1):
        with st.expander(f"#{i} [{work['work_id']}] {work['work_description'][:75]}... | Score: {work['risk_score']}/100 ({work['risk_category']})"):
            c_d1, c_d2, c_d3 = st.columns(3)
            with c_d1:
                st.markdown(f"**MP:** {work['mp_name']} ({work['house']})")
                st.markdown(f"**Constituency:** {work['constituency']}, {work['state']}")
            with c_d2:
                st.markdown(f"**Final Cost:** {format_inr(work['final_amount'])}")
                st.markdown(f"**Work Category:** `{work['work_type']}`")
            with c_d3:
                st.markdown(f"**Implementing Agency (IDA):** {work['ida']}")
                st.markdown(f"**Images Attached:** {'✅ Yes' if work['has_images'] else '❌ No (Missing)'}")
            
            st.markdown("##### 🔍 AI Detected Risk Drivers:")
            for reason in work.get("risk_reasons", []):
                st.markdown(f"- ⚠️ **{reason}**")
