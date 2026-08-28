"""
District & Member of Parliament (MP) Performance & Benchmark View
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

st.set_page_config(page_title="District & MP View | MPLADS AI Intelligence", page_icon="👤", layout="wide")

st.title("👤 District & MP Constituency View")
st.markdown("Individual Member of Parliament profile, constituency work portfolio, peer cost benchmarks, and duplicate work detection.")

# Fetch MP summaries
mp_summaries = api_get("/summary/mp")
if not mp_summaries:
    st.error("Failed to load MP directory.")
    st.stop()

# State filter for quick narrowing down
all_states = ["All States"] + sorted(list(set([m["state"] for m in mp_summaries])))
col_f1, col_f2 = st.columns([1, 3])
with col_f1:
    filter_state = st.selectbox("Filter State:", all_states)

filtered_mps = mp_summaries
if filter_state != "All States":
    filtered_mps = [m for m in mp_summaries if m["state"].strip().lower() == filter_state.strip().lower()]

if not filtered_mps:
    filtered_mps = mp_summaries

mp_options = [f"{m['mp_name']} — {m['constituency']} ({m['state']})" for m in filtered_mps]
with col_f2:
    selected_mp_str = st.selectbox("🎯 Select Member of Parliament / Constituency:", mp_options, index=0)

selected_idx = mp_options.index(selected_mp_str)
mp_data = filtered_mps[selected_idx]
selected_mp_name = mp_data["mp_name"]

# Fetch works for this MP
mp_works_resp = api_get("/works", params={"mp_name": selected_mp_name, "limit": 500})
benchmarks_resp = api_get("/summary/benchmarks", params={"mp_name": selected_mp_name, "state": mp_data["state"]})

if not mp_works_resp or "data" not in mp_works_resp or not mp_works_resp["data"]:
    st.warning(f"No works recorded for {selected_mp_name}.")
    st.stop()

df_mp_works = pd.DataFrame(mp_works_resp["data"])

# MP Profile Cards
c1, c2, c3, c4, c5 = st.columns(5)
with c1:
    st.metric("MP Name", mp_data["mp_name"])
with c2:
    st.metric("Constituency", f"{mp_data['constituency']} ({mp_data.get('house', 'Lok Sabha')})")
with c3:
    st.metric("Total Works", f"{mp_data['total_works']:,}")
with c4:
    st.metric("Total Sanctioned", f"₹{mp_data['total_amount_crores']} Cr")
with c5:
    st.metric("Average Risk Score", f"{mp_data['avg_risk_score']} / 100", delta=f"{mp_data['high_risk_count']} High Risk", delta_color="inverse")

st.markdown("---")

# Row 1: Cost Benchmark Comparison Chart
st.subheader("📊 Average Project Cost Benchmark (₹ Lakhs)")
st.caption("Compares this MP's average cost per project against the State Peer Average and National Peer Average across all work categories.")

if benchmarks_resp and "benchmarks" in benchmarks_resp:
    b_df = pd.DataFrame(benchmarks_resp["benchmarks"])
    # Filter work types where at least one average > 0
    b_df = b_df[(b_df["national_avg_cost_lakhs"] > 0) | (b_df["mp_avg_cost_lakhs"] > 0)]

    fig_bench = go.Figure()
    fig_bench.add_trace(go.Bar(
        x=b_df["work_type"],
        y=b_df["mp_avg_cost_lakhs"],
        name=f"MP Avg ({selected_mp_name})",
        marker_color="#1E3A8A"
    ))
    fig_bench.add_trace(go.Bar(
        x=b_df["work_type"],
        y=b_df["state_avg_cost_lakhs"],
        name=f"State Avg ({mp_data['state']})",
        marker_color="#3B82F6"
    ))
    fig_bench.add_trace(go.Bar(
        x=b_df["work_type"],
        y=b_df["national_avg_cost_lakhs"],
        name="National Peer Avg",
        marker_color="#9CA3AF"
    ))

    fig_bench.update_layout(
        barmode="group",
        title=f"Category Cost Comparison (in ₹ Lakhs) — {selected_mp_name}",
        xaxis=dict(title="Work Category"),
        yaxis=dict(title="Average Cost (₹ Lakhs)"),
        template="plotly_white",
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
        margin=dict(l=20, r=20, t=40, b=20),
        height=380
    )
    st.plotly_chart(fig_bench, use_container_width=True)

st.markdown("---")

# Row 2: Portfolio Works List & Duplicate Detection
st.subheader(f"📋 Constituency Works Portfolio: {mp_data['constituency']} ({len(df_mp_works)} Works)")

display_cols = [
    "work_id", "risk_score", "risk_category", "work_type", "final_amount",
    "completed_date", "has_images", "ida", "work_description", "is_duplicate"
]
df_mp_display = df_mp_works[display_cols].copy()
df_mp_display["final_amount"] = df_mp_display["final_amount"].apply(format_inr)
df_mp_display["has_images"] = df_mp_display["has_images"].apply(lambda x: "✅" if x else "❌ Missing")
df_mp_display["is_duplicate"] = df_mp_display["is_duplicate"].apply(lambda x: "⚠️ Duplicate Flag" if x else "✔️ Unique")

st.dataframe(
    style_risk_dataframe(df_mp_display),
    use_container_width=True,
    height=360
)

# Highlight potential duplicates
dup_works = df_mp_works[df_mp_works["is_duplicate"] == True]
if not dup_works.empty:
    st.warning(f"⚠️ {len(dup_works)} works recommended by this MP have high textual or location similarity to other recommended works.")
    with st.expander("🔍 Click to inspect potential duplicate pairs in this constituency"):
        for _, row in dup_works.iterrows():
            st.markdown(f"**[{row['work_id']}]** `{row['work_type']}` — Cost: {format_inr(row['final_amount'])}")
            st.markdown(f"> *\"{row['work_description']}\"*")
            st.markdown(f"**AI Risk Reasons:**")
            for r in row.get("risk_reasons", []):
                st.markdown(f"- ⚠️ {r}")
            st.markdown("---")
