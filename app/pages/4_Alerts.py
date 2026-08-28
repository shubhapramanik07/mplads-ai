"""
Proactive Anomaly Alerts & Audit Management Center
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
import io

from utils import api_get, format_inr, get_risk_badge, style_risk_dataframe

st.set_page_config(page_title="Alerts & Audits | MPLADS AI Intelligence", page_icon="🚨", layout="wide")

st.title("🚨 High-Risk Audit & Anomaly Alert Center")
st.markdown("Proactive intelligence workbench for internal vigilance, CAG auditors, and district administrative officers.")

# Top Controls Row
c_thresh, c_state, c_type, c_search = st.columns([1.5, 1.5, 1.5, 2])

with c_thresh:
    threshold = st.slider("🎯 Risk Score Alert Threshold:", min_value=0, max_value=100, value=70, step=5)

with c_state:
    state_summaries = api_get("/summary/state")
    state_list = ["All States"] + ([s["state"] for s in state_summaries] if state_summaries else [])
    selected_state = st.selectbox("State Filter:", state_list)

with c_type:
    wt_data = api_get("/summary/work_types")
    type_list = ["All Work Types"] + ([w["work_type"] for w in wt_data] if wt_data else [])
    selected_wtype = st.selectbox("Work Category:", type_list)

with c_search:
    search_term = st.text_input("🔍 Search Work ID, MP or Keyword:")

# Query alerts endpoint
params = {
    "min_risk_score": float(threshold),
    "limit": 100
}
if selected_state != "All States":
    params["state"] = selected_state
if selected_wtype != "All Work Types":
    params["work_type"] = selected_wtype
if search_term:
    params["search"] = search_term

alerts_resp = api_get("/alerts", params=params)
if not alerts_resp or "alerts" not in alerts_resp:
    st.warning("No records returned from intelligence engine.")
    st.stop()

alerts_list = alerts_resp["alerts"]
total_matching = alerts_resp.get("total_alerts", len(alerts_list))
df_alerts = pd.DataFrame(alerts_list)

st.markdown("---")

if df_alerts.empty:
    st.success(f"✅ No anomalies found with Risk Score >= {threshold} matching the current filters.")
    st.stop()

col_m1, col_m2, col_m3, col_m4 = st.columns(4)
with col_m1:
    st.metric("Total Priority Alerts", f"{total_matching:,}", help="Total works in database meeting risk criteria")
with col_m2:
    total_flagged_amt = df_alerts["final_amount"].sum()
    st.metric("Displayed Outlay", f"₹{total_flagged_amt / 1e7:.2f} Cr")
with col_m3:
    dup_alerts = int(df_alerts["is_duplicate"].sum())
    st.metric("Duplicate Works Involved", f"{dup_alerts}")
with col_m4:
    no_img_alerts = int((~df_alerts["has_images"].astype(bool)).sum())
    st.metric("Missing Images Involved", f"{no_img_alerts}")

# Export button
csv_buf = io.StringIO()
df_alerts.to_csv(csv_buf, index=False)
st.download_button(
    label="📥 Export Flagged Audit Queue (CSV)",
    data=csv_buf.getvalue(),
    file_name=f"mplads_high_risk_audit_queue_{threshold}plus.csv",
    mime="text/csv"
)

st.markdown(f"### 📋 Prioritized Anomaly Audit Feed (Showing Top {len(df_alerts)} of {total_matching})")

for idx, row in df_alerts.iterrows():
    w_id = row["work_id"]
    score = float(row["risk_score"])
    cat = str(row["risk_category"])
    wtype = str(row["work_type"])
    cost = format_inr(row["final_amount"])
    mp = str(row["mp_name"])
    const = str(row["constituency"])
    state = str(row["state"])
    ida = str(row["ida"])
    desc = str(row["work_description"])
    reasons = row.get("risk_reasons", [])

    card_title = f"🔴 [{score:.0f}/100 - {cat}] {w_id} | {wtype.upper()} | {cost} | {mp} ({const})"
    if score < 70:
        card_title = f"🟡 [{score:.0f}/100 - {cat}] {w_id} | {wtype.upper()} | {cost} | {mp} ({const})"

    with st.expander(card_title, expanded=(idx < 3)):
        c_left, c_right = st.columns([3, 2])
        
        with c_left:
            st.markdown(f"**Work Description:**")
            st.markdown(f"> *\"{desc}\"*")
            st.markdown("##### 🚨 AI Anomaly & Fraud Indicators:")
            for r in reasons:
                st.markdown(f"- ⚠️ **{r}**")

        with c_right:
            st.markdown("**Key Project Metadata:**")
            st.write(f"- **State & Constituency:** {state} — {const}")
            st.write(f"- **MP:** {mp} ({row.get('house', 'Lok Sabha')})")
            st.write(f"- **Implementing Agency:** {ida}")
            st.write(f"- **Sanctioned Cost:** {cost}")
            st.write(f"- **Completion Date:** {row.get('completed_date', 'N/A')}")
            st.write(f"- **Inspection Photos:** {'✅ Uploaded' if row.get('has_images') else '❌ Missing (Flagged)'}")
            if row.get("matched_work_ids"):
                st.write(f"- **Matched Duplicate IDs:** `{row.get('matched_work_ids')}`")

            st.markdown("**Recommended Audit Action:**")
            reasons_str = " ".join(reasons).lower()
            if "duplicate" in reasons_str or "similarity" in reasons_str:
                st.error("Conduct on-site physical GIS verification to confirm work was not executed twice.")
            elif "peer median" in reasons_str:
                st.warning("Audit detailed bill of quantities (BoQ) and Schedule of Rates (SoR) for price inflation.")
            elif "missing" in reasons_str or "no supporting" in reasons_str:
                st.warning("Issue formal notice to IDA to upload geo-tagged milestone completion photos.")
            else:
                st.info("Routine multi-factor review by district vigilance committee.")
