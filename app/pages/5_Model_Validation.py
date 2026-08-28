"""
AI Model Validation & Synthetic Benchmark Evaluation Dashboard
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

st.set_page_config(page_title="Model Validation | MPLADS AI Intelligence", page_icon="🔬", layout="wide")

st.title("🔬 AI Model Validation & Benchmark Testing")
st.markdown("""
To verify that the AI risk engine reliably detects real-world fraud patterns rather than acting as a black box, 
we execute a **controlled synthetic anomaly injection experiment**. 
A baseline dataset is injected with ground-truth fraud cases (extreme cost inflation, duplicate descriptions, missing documentation, and IDA monopolies) and evaluated for detection rate, Precision@K, and ranking accuracy.
""")

# Fetch validation report
val_report = api_get("/validation/report")
if not val_report:
    st.error("Failed to load validation report from API.")
    st.stop()

# Action button to re-run test
col_head1, col_head2 = st.columns([3, 1])
with col_head2:
    if st.button("🔄 Re-run Live Validation Test", type="primary"):
        with st.spinner("Injecting anomalies and executing risk engine..."):
            from backend.validate_model import run_synthetic_validation
            val_report = run_synthetic_validation()
            st.success("Validation test re-executed successfully!")

# Validation Metrics Cards
m1, m2, m3, m4, m5 = st.columns(5)
with m1:
    st.metric("Total Test Samples", f"{val_report.get('total_test_samples', 0)}")
with m2:
    st.metric("Planted Anomalies", f"{val_report.get('total_planted_anomalies', 0)}")
with m3:
    st.metric("Overall Detection Rate", f"{val_report.get('overall_detection_rate_pct', 0)}%", help="Percentage of planted anomalies classified as HIGH RISK")
with m4:
    st.metric("Precision @ Top 15", f"{val_report.get('precision_at_top_15_pct', 0)}%", help="Proportion of planted anomalies found in the highest 15 risk scores")
with m5:
    st.metric("Recall @ Top 25", f"{val_report.get('recall_at_top_25_pct', 0)}%", help="Proportion of all planted anomalies recovered in the Top 25 ranks")

st.info(f"💡 **Validation Summary:** {val_report.get('summary', '')}")

st.markdown("---")

# Visualizations Row
col_v1, col_v2 = st.columns([1, 1])

details = val_report.get("planted_anomaly_details", [])
df_details = pd.DataFrame(details)

with col_v1:
    st.subheader("🎯 Detection Distribution by Planted Fraud Category")
    if not df_details.empty:
        fig_cat = px.bar(
            df_details,
            x="planted_type",
            y="predicted_score",
            color="predicted_category",
            color_discrete_map={"HIGH": "#dc3545", "MEDIUM": "#ffc107", "LOW": "#28a745"},
            title="Predicted Risk Score across Planted Anomaly Types",
            labels={"planted_type": "Planted Anomaly Type", "predicted_score": "Predicted Score (0-100)"}
        )
        fig_cat.add_hline(y=70, line_dash="dot", line_color="red", annotation_text="High Risk Threshold (70)")
        fig_cat.update_layout(xaxis=dict(tickangle=-25), template="plotly_white", height=360, margin=dict(l=20, r=20, t=40, b=20))
        st.plotly_chart(fig_cat, use_container_width=True)

with col_v2:
    st.subheader("🏆 Anomaly Ranking Distribution")
    if not df_details.empty:
        fig_rank = px.scatter(
            df_details,
            x="rank",
            y="predicted_score",
            color="planted_type",
            size=[14] * len(df_details),
            hover_data=["work_id", "description"],
            title="Rank vs Predicted Risk Score of Injected Anomalies",
            labels={"rank": "Assigned Rank in Test Set (1 = Highest Risk)", "predicted_score": "Risk Score"}
        )
        fig_rank.update_layout(template="plotly_white", height=360, margin=dict(l=20, r=20, t=40, b=20))
        st.plotly_chart(fig_rank, use_container_width=True)

st.markdown("---")

# Ground Truth vs Prediction Audit Matrix
st.subheader("📋 Ground Truth vs AI Detection Detailed Audit Matrix")
if not df_details.empty:
    for idx, item in df_details.iterrows():
        is_detected = item["is_detected_high_risk"]
        status_icon = "✅ DETECTED" if is_detected else "⚠️ MISSED"
        
        with st.expander(f"[{item['work_id']}] {item['planted_type']} — Rank #{item['rank']} | Score: {item['predicted_score']}/100 ({status_icon})"):
            c_a, c_b = st.columns([3, 2])
            with c_a:
                st.markdown(f"**Injected Anomaly Profile:** {item['description']}")
                st.markdown(f"**Expected Outcome:** `{item['expected']}`")
                st.markdown(f"**Predicted Category:** `{item['predicted_category']}`")
                st.markdown("**AI Reason Explanations Generated:**")
                for r in item["reasons"]:
                    st.markdown(f"- ⚠️ {r}")
            with c_b:
                st.write(f"- **Rank in Test Population:** #{item['rank']}")
                st.write(f"- **AI Composite Risk Score:** {item['predicted_score']} / 100")
                st.write(f"- **Classification:** {item['predicted_category']}")
                if is_detected:
                    st.success("Successfully isolated as HIGH RISK priority audit item.")
                else:
                    st.warning("Flagged in lower risk tier.")
