"""
State Nodal Officer Dashboard - State-Level MPLADS Monitoring & IDA Monopoly Auditing
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

st.set_page_config(page_title="State Nodal View | MPLADS AI Intelligence", page_icon="🏢", layout="wide")

st.title("🏢 State Nodal Officer View")
st.markdown("State-level oversight, district performance monitoring, and Implementing District Agency (IDA) concentration auditing.")

# Fetch state summary list
state_summaries = api_get("/summary/state")
if not state_summaries:
    st.error("Unable to load state statistics.")
    st.stop()

states_list = [s["state"] for s in state_summaries]

# State selector
selected_state = st.selectbox("🎯 Select State / UT for Detailed Inspection:", states_list, index=0)

# State meta
state_meta = next((s for s in state_summaries if s["state"].strip().lower() == selected_state.strip().lower()), None)
works_resp = api_get("/works", params={"state": selected_state, "limit": 1000})
ida_resp = api_get("/summary/ida", params={"state": selected_state})

if not works_resp or "data" not in works_resp or not works_resp["data"]:
    st.warning(f"No records found for '{selected_state}'.")
    st.stop()

df_state_works = pd.DataFrame(works_resp["data"])

# State KPI Cards
if state_meta:
    c1, c2, c3, c4, c5 = st.columns(5)
    with c1:
        st.metric("Total Works in State", f"{state_meta['total_works']:,}")
    with c2:
        st.metric("State Outlay", f"₹{state_meta['total_amount_crores']} Cr")
    with c3:
        st.metric("State Avg Risk Score", f"{state_meta['avg_risk_score']} / 100")
    with c4:
        st.metric("High-Risk Projects", f"{state_meta['high_risk_count']:,}", delta=f"{state_meta['high_risk_rate_pct']}% of state", delta_color="inverse")
    with c5:
        st.metric("Dominant IDA", f"{str(state_meta['top_ida'])[:22]}...", help=f"Handles {state_meta['top_ida_share_pct']}% of state works")

st.markdown("---")

# Row 1: IDA Concentration Analysis & Category Distribution
col_ida, col_cat = st.columns([3, 2])

with col_ida:
    st.subheader("🏛️ Implementing Agency (IDA) Concentration & Monopoly Risk")
    if ida_resp:
        df_ida = pd.DataFrame(ida_resp)
        # Take top 10 IDAs
        df_ida_top = df_ida.head(10).copy()
        df_ida_top["ida_short"] = df_ida_top["ida"].apply(lambda x: str(x)[:30] + "..." if len(str(x)) > 30 else str(x))
        
        fig_ida = go.Figure()
        fig_ida.add_trace(go.Bar(
            x=df_ida_top["ida_short"],
            y=df_ida_top["works_share_pct"],
            name="Share of Works (%)",
            marker_color="#3B82F6"
        ))
        fig_ida.add_trace(go.Bar(
            x=df_ida_top["ida_short"],
            y=df_ida_top["amount_share_pct"],
            name="Share of Funds (%)",
            marker_color="#F59E0B"
        ))
        fig_ida.add_hline(
            y=35,
            line_dash="dot",
            line_color="red",
            annotation_text="35% Monopoly Risk Threshold",
            annotation_position="top left"
        )
        fig_ida.update_layout(
            title=f"Top Agency Share of Projects vs Funds in {selected_state}",
            barmode="group",
            xaxis=dict(tickangle=-30),
            yaxis=dict(title="Percentage (%)", range=[0, max(60, float(df_ida_top["works_share_pct"].max()) + 10)]),
            template="plotly_white",
            legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
            margin=dict(l=20, r=20, t=40, b=20),
            height=360
        )
        st.plotly_chart(fig_ida, use_container_width=True)

with col_cat:
    st.subheader(f"📊 Works by Category: {selected_state}")
    cat_counts = df_state_works["work_type"].value_counts().reset_index()
    cat_counts.columns = ["work_type", "count"]
    fig_cat = px.bar(
        cat_counts,
        x="work_type",
        y="count",
        color="work_type",
        title="Works Volume by Category",
        labels={"work_type": "Category", "count": "Works"}
    )
    fig_cat.update_layout(template="plotly_white", showlegend=False, height=360, margin=dict(l=20, r=20, t=40, b=20))
    st.plotly_chart(fig_cat, use_container_width=True)

st.markdown("---")

# Row 2: Interactive Filterable Table of All Works in State
st.subheader(f"📋 Comprehensive Works Directory: {selected_state}")

f1, f2, f3 = st.columns(3)
with f1:
    risk_filter = st.selectbox("Filter by Risk Level:", ["All Risk Levels", "HIGH (>=70)", "MEDIUM (40-69)", "LOW (<40)"])
with f2:
    all_wtypes = ["All Categories"] + sorted(df_state_works["work_type"].unique().tolist())
    type_filter = st.selectbox("Filter by Work Category:", all_wtypes)
with f3:
    search_q = st.text_input("🔍 Search Description, MP, ID or Agency:")

# Filter dataframe
filtered_df = df_state_works.copy()
if risk_filter == "HIGH (>=70)":
    filtered_df = filtered_df[filtered_df["risk_category"] == "HIGH"]
elif risk_filter == "MEDIUM (40-69)":
    filtered_df = filtered_df[filtered_df["risk_category"] == "MEDIUM"]
elif risk_filter == "LOW (<40)":
    filtered_df = filtered_df[filtered_df["risk_category"] == "LOW"]

if type_filter != "All Categories":
    filtered_df = filtered_df[filtered_df["work_type"] == type_filter]

if search_q:
    sq = search_q.lower()
    filtered_df = filtered_df[
        filtered_df["work_description"].astype(str).str.lower().str.contains(sq, na=False) |
        filtered_df["work_id"].astype(str).str.lower().str.contains(sq, na=False) |
        filtered_df["mp_name"].astype(str).str.lower().str.contains(sq, na=False) |
        filtered_df["constituency"].astype(str).str.lower().str.contains(sq, na=False) |
        filtered_df["ida"].astype(str).str.lower().str.contains(sq, na=False)
    ]

# Display table
display_cols = [
    "work_id", "risk_score", "risk_category", "work_type", "final_amount",
    "mp_name", "constituency", "ida", "has_images", "work_description"
]
table_df = filtered_df[display_cols].copy()
table_df["final_amount"] = table_df["final_amount"].apply(format_inr)
table_df["has_images"] = table_df["has_images"].apply(lambda x: "✅ Yes" if x else "❌ No")

st.markdown(f"**Displaying {len(table_df)} matching works (of {len(df_state_works)} loaded):**")
st.dataframe(
    style_risk_dataframe(table_df),
    use_container_width=True,
    height=400
)

# Detailed Work Inspection
st.markdown("##### 🔎 Detailed Work Inspector")
col_sel1, col_sel2 = st.columns([3, 1])
with col_sel1:
    work_id_options = ["-- Select Work ID to Inspect --"] + filtered_df["work_id"].tolist()[:100]
    selected_work_id = st.selectbox("Select from list:", work_id_options)
with col_sel2:
    manual_wid = st.text_input("Or type exact Work ID:")

target_id = manual_wid.strip() if manual_wid else (selected_work_id if selected_work_id != "-- Select Work ID to Inspect --" else None)

if target_id:
    work_detail = api_get(f"/works/{target_id}")
    if work_detail and "work_description" in work_detail:
        st.info(f"**Description:** {work_detail['work_description']}")
        i1, i2, i3 = st.columns(3)
        with i1:
            st.write(f"**AI Risk Score:** {work_detail['risk_score']} / 100 ({work_detail['risk_category']})")
            st.write(f"**Cost Risk Subscore:** {work_detail.get('cost_risk_score', 'N/A')}")
        with i2:
            st.write(f"**Duplicate Subscore:** {work_detail.get('duplicate_risk_score', 'N/A')}")
            st.write(f"**Compliance Subscore:** {work_detail.get('compliance_risk_score', 'N/A')}")
        with i3:
            st.write(f"**IDA Concentration Subscore:** {work_detail.get('ida_risk_score', 'N/A')}")
            st.write(f"**Dev from Peer Median:** {work_detail.get('dev_work_type_median_pct', 0):+.1f}%")

        st.markdown("**AI Detected Risk Explanations:**")
        for reason in work_detail.get("risk_reasons", []):
            st.markdown(f"- ⚠️ **{reason}**")
    else:
        st.warning(f"Could not load details for Work ID '{target_id}'.")
