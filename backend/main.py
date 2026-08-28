"""
FastAPI Backend API for MPLADS AI Anomaly, Fraud & Inefficiency Detection.
"""
import json
import os
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import numpy as np

from backend.risk_engine import get_risk_scored_data, MPLADSRiskEngine
from backend.validate_model import get_validation_report, run_synthetic_validation
from backend.data_loader import compute_peer_group_stats

app = FastAPI(
    title="MPLADS AI Anomaly & Fraud Detection API",
    description="Backend ML & Analytics API for SIH26102 - MPLADS Fraud and Inefficiency Detection",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def _clean_record(row_dict: dict) -> dict:
    """Helper to parse JSON fields and format datatypes cleanly and safely."""
    cleaned = {}
    for k, v in row_dict.items():
        if k == "risk_reasons":
            if isinstance(v, str):
                try:
                    cleaned[k] = json.loads(v)
                except Exception:
                    cleaned[k] = [v]
            elif isinstance(v, list):
                cleaned[k] = v
            else:
                cleaned[k] = []
        elif isinstance(v, (list, tuple, np.ndarray)):
            cleaned[k] = list(v)
        elif isinstance(v, (np.bool_, bool)):
            cleaned[k] = bool(v)
        elif isinstance(v, (np.integer, int)):
            cleaned[k] = int(v)
        elif isinstance(v, (np.floating, float)):
            cleaned[k] = None if np.isnan(v) else float(v)
        elif pd.isna(v):
            cleaned[k] = None
        else:
            cleaned[k] = v
    return cleaned

@app.get("/")
def root():
    return {
        "status": "online",
        "system": "MPLADS AI Anomaly & Fraud Detection Prototype",
        "problem_statement": "SIH26102",
        "docs_url": "/docs"
    }

@app.get("/summary/kpis")
def get_national_kpis():
    """National overview summary KPIs."""
    df = get_risk_scored_data()
    total_works = len(df)
    total_amount = float(df["final_amount"].sum())
    high_risk_count = int((df["risk_category"] == "HIGH").sum())
    med_risk_count = int((df["risk_category"] == "MEDIUM").sum())
    low_risk_count = int((df["risk_category"] == "LOW").sum())
    avg_risk_score = round(float(df["risk_score"].mean()), 2)
    missing_images_count = int((~df["has_images"].astype(bool)).sum())
    duplicate_count = int(df["is_duplicate"].sum())
    cost_outlier_count = int(df["is_cost_outlier"].sum())

    return {
        "total_works": total_works,
        "total_amount_inr": total_amount,
        "total_amount_crores": round(total_amount / 1e7, 2),
        "high_risk_count": high_risk_count,
        "medium_risk_count": med_risk_count,
        "low_risk_count": low_risk_count,
        "high_risk_percentage": round((high_risk_count / total_works) * 100, 1) if total_works > 0 else 0,
        "avg_risk_score": avg_risk_score,
        "missing_images_count": missing_images_count,
        "duplicate_works_count": duplicate_count,
        "cost_outliers_count": cost_outlier_count,
        "total_mps": int(df["mp_name"].nunique()),
        "total_states": int(df["state"].nunique())
    }

@app.get("/works")
def get_works(
    state: Optional[str] = Query(None, description="Filter by State"),
    mp_name: Optional[str] = Query(None, description="Filter by MP Name"),
    work_type: Optional[str] = Query(None, description="Filter by Work Type"),
    risk_category: Optional[str] = Query(None, description="Filter by Risk Category: HIGH, MEDIUM, LOW"),
    min_risk_score: Optional[float] = Query(None, description="Filter by minimum risk score (0-100)"),
    search: Optional[str] = Query(None, description="Search in description, ID, MP, or agency"),
    limit: int = Query(500, ge=1, le=5000),
    offset: int = Query(0, ge=0)
):
    """Returns filtered risk-scored works list with robust search & pagination."""
    df = get_risk_scored_data()

    if state and state.strip().lower() != "all states":
        st_clean = state.strip().lower()
        df = df[df["state"].str.strip().str.lower() == st_clean]

    if mp_name:
        mp_clean = mp_name.strip().lower()
        df = df[df["mp_name"].str.strip().str.lower().str.contains(mp_clean, na=False) | (df["mp_name"].str.strip().str.lower() == mp_clean)]

    if work_type and work_type.strip().lower() != "all categories" and work_type.strip().lower() != "all work types":
        wt_clean = work_type.strip().lower()
        df = df[df["work_type"].str.strip().str.lower() == wt_clean]

    if risk_category and risk_category.strip().upper() != "ALL RISK LEVELS":
        rc_clean = risk_category.strip().upper().split()[0]
        df = df[df["risk_category"].str.upper() == rc_clean]

    if min_risk_score is not None:
        df = df[df["risk_score"] >= float(min_risk_score)]

    if search:
        s = search.strip().lower()
        df = df[
            df["work_description"].astype(str).str.lower().str.contains(s, na=False) |
            df["work_id"].astype(str).str.lower().str.contains(s, na=False) |
            df["mp_name"].astype(str).str.lower().str.contains(s, na=False) |
            df["constituency"].astype(str).str.lower().str.contains(s, na=False) |
            df["ida"].astype(str).str.lower().str.contains(s, na=False) |
            df["state"].astype(str).str.lower().str.contains(s, na=False)
        ]

    total_matched = len(df)
    paged_df = df.iloc[offset: offset + limit]

    records = [_clean_record(r) for r in paged_df.to_dict(orient="records")]
    return {
        "total": total_matched,
        "limit": limit,
        "offset": offset,
        "data": records
    }

@app.get("/works/{work_id}")
def get_work_by_id(work_id: str):
    """Returns comprehensive detail and risk breakdown for a specific work."""
    df = get_risk_scored_data()
    wid_clean = work_id.strip().upper()
    match = df[df["work_id"].astype(str).str.strip().str.upper() == wid_clean]
    if match.empty:
        raise HTTPException(status_code=404, detail=f"Work with ID '{work_id}' not found.")
    
    record = _clean_record(match.iloc[0].to_dict())
    
    matched_works_details = []
    if record.get("matched_work_ids"):
        ids = [i.strip().upper() for i in str(record["matched_work_ids"]).split(",") if i.strip()]
        for mid in ids[:5]:
            dup_row = df[df["work_id"].astype(str).str.strip().str.upper() == mid]
            if not dup_row.empty:
                matched_works_details.append(_clean_record(dup_row.iloc[0].to_dict()))

    record["matched_works_details"] = matched_works_details
    return record

@app.get("/summary/state")
def get_state_summary():
    """Aggregated stats per state: total works, expenditure, avg risk, high risk count, top IDA."""
    df = get_risk_scored_data()
    
    summary = []
    for state_name, group in df.groupby("state"):
        tot_works = len(group)
        tot_amt = float(group["final_amount"].sum())
        avg_risk = round(float(group["risk_score"].mean()), 2)
        high_risk_cnt = int((group["risk_category"] == "HIGH").sum())
        med_risk_cnt = int((group["risk_category"] == "MEDIUM").sum())
        low_risk_cnt = int((group["risk_category"] == "LOW").sum())
        
        top_ida = group["ida"].mode()[0] if not group["ida"].empty else "N/A"
        top_ida_share = round((group["ida"] == top_ida).sum() / tot_works * 100, 1)

        summary.append({
            "state": str(state_name).strip(),
            "total_works": tot_works,
            "total_amount_inr": tot_amt,
            "total_amount_crores": round(tot_amt / 1e7, 2),
            "avg_risk_score": avg_risk,
            "high_risk_count": high_risk_cnt,
            "medium_risk_count": med_risk_cnt,
            "low_risk_count": low_risk_cnt,
            "high_risk_rate_pct": round((high_risk_cnt / tot_works) * 100, 1),
            "top_ida": str(top_ida).strip(),
            "top_ida_share_pct": top_ida_share
        })

    summary.sort(key=lambda x: x["total_works"], reverse=True)
    return summary

@app.get("/summary/mp")
def get_mp_summary(state: Optional[str] = None):
    """Aggregated stats per MP."""
    df = get_risk_scored_data()
    if state and state.strip().lower() != "all states":
        st_clean = state.strip().lower()
        df = df[df["state"].str.strip().str.lower() == st_clean]

    summary = []
    for mp_name, group in df.groupby("mp_name"):
        tot_works = len(group)
        tot_amt = float(group["final_amount"].sum())
        avg_risk = round(float(group["risk_score"].mean()), 2)
        high_risk_cnt = int((group["risk_category"] == "HIGH").sum())
        constituency = group["constituency"].iloc[0]
        state_name = group["state"].iloc[0]
        house = group["house"].iloc[0]
        dup_count = int(group["is_duplicate"].sum())
        no_img_count = int((~group["has_images"].astype(bool)).sum())

        summary.append({
            "mp_name": str(mp_name).strip(),
            "constituency": str(constituency).strip(),
            "state": str(state_name).strip(),
            "house": str(house).strip(),
            "total_works": tot_works,
            "total_amount_inr": tot_amt,
            "total_amount_crores": round(tot_amt / 1e7, 2),
            "avg_risk_score": avg_risk,
            "high_risk_count": high_risk_cnt,
            "duplicate_works_count": dup_count,
            "missing_images_count": no_img_count
        })

    summary.sort(key=lambda x: x["total_works"], reverse=True)
    return summary

@app.get("/summary/benchmarks")
def get_benchmarks(mp_name: str, state: Optional[str] = None):
    """Returns MP average cost vs State average cost vs National average cost per work type."""
    df = get_risk_scored_data()
    mp_clean = mp_name.strip().lower()
    df_mp = df[df["mp_name"].str.strip().str.lower() == mp_clean]
    
    if df_mp.empty:
        # Fallback substring search
        df_mp = df[df["mp_name"].str.strip().str.lower().str.contains(mp_clean, na=False)]

    mp_state = state if state else (df_mp["state"].iloc[0] if not df_mp.empty else "National")
    df_state = df[df["state"].str.strip().str.lower() == str(mp_state).strip().lower()]

    all_wtypes = sorted(df["work_type"].unique().tolist())
    benchmarks = []

    for wt in all_wtypes:
        nat_works = df[df["work_type"] == wt]
        st_works = df_state[df_state["work_type"] == wt]
        mp_works = df_mp[df_mp["work_type"] == wt]

        nat_avg = float(nat_works["final_amount"].mean()) if not nat_works.empty else 0.0
        st_avg = float(st_works["final_amount"].mean()) if not st_works.empty else nat_avg
        mp_avg = float(mp_works["final_amount"].mean()) if not mp_works.empty else 0.0
        mp_cnt = len(mp_works)

        benchmarks.append({
            "work_type": wt,
            "mp_avg_cost_inr": round(mp_avg, 2),
            "mp_avg_cost_lakhs": round(mp_avg / 100000.0, 2),
            "mp_works_count": mp_cnt,
            "state_avg_cost_inr": round(st_avg, 2),
            "state_avg_cost_lakhs": round(st_avg / 100000.0, 2),
            "national_avg_cost_inr": round(nat_avg, 2),
            "national_avg_cost_lakhs": round(nat_avg / 100000.0, 2)
        })

    return {
        "mp_name": mp_name,
        "state": mp_state,
        "total_mp_works": len(df_mp),
        "benchmarks": benchmarks
    }

@app.get("/summary/work_types")
def get_work_type_summary():
    """Stats per work type category."""
    df = get_risk_scored_data()
    summary = []
    for wtype, group in df.groupby("work_type"):
        tot_works = len(group)
        tot_amt = float(group["final_amount"].sum())
        avg_cost = float(group["final_amount"].mean())
        median_cost = float(group["final_amount"].median())
        avg_risk = round(float(group["risk_score"].mean()), 2)
        high_risk_cnt = int((group["risk_category"] == "HIGH").sum())

        summary.append({
            "work_type": str(wtype).strip(),
            "total_works": tot_works,
            "total_amount_crores": round(tot_amt / 1e7, 2),
            "average_cost_inr": round(avg_cost, -2),
            "median_cost_inr": round(median_cost, -2),
            "avg_risk_score": avg_risk,
            "high_risk_count": high_risk_cnt
        })

    summary.sort(key=lambda x: x["total_works"], reverse=True)
    return summary

@app.get("/summary/ida")
def get_ida_summary(state: Optional[str] = None):
    """IDA concentration metrics."""
    df = get_risk_scored_data()
    if state and state.strip().lower() != "all states":
        st_clean = state.strip().lower()
        df = df[df["state"].str.strip().str.lower() == st_clean]

    summary = []
    for (state_name, ida_name), group in df.groupby(["state", "ida"]):
        tot_works = len(group)
        tot_amt = float(group["final_amount"].sum())
        avg_risk = round(float(group["risk_score"].mean()), 2)
        high_risk_cnt = int((group["risk_category"] == "HIGH").sum())
        
        st_total_works = len(df[df["state"] == state_name])
        st_total_amt = df[df["state"] == state_name]["final_amount"].sum()

        w_share = round((tot_works / st_total_works) * 100, 1) if st_total_works > 0 else 0
        a_share = round((tot_amt / st_total_amt) * 100, 1) if st_total_amt > 0 else 0

        summary.append({
            "state": str(state_name).strip(),
            "ida": str(ida_name).strip(),
            "works_count": tot_works,
            "amount_crores": round(tot_amt / 1e7, 2),
            "works_share_pct": w_share,
            "amount_share_pct": a_share,
            "avg_risk_score": avg_risk,
            "high_risk_count": high_risk_cnt,
            "is_monopoly_risk": bool(w_share >= 35.0 or a_share >= 35.0)
        })

    summary.sort(key=lambda x: x["works_share_pct"], reverse=True)
    return summary

@app.get("/alerts")
def get_alerts(
    min_risk_score: float = Query(70.0, ge=0, le=100),
    state: Optional[str] = Query(None),
    work_type: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=500)
):
    """Top highest-risk works across the dataset for proactive audit alerting."""
    df = get_risk_scored_data()
    df_filtered = df[df["risk_score"] >= min_risk_score]

    if state and state.strip().lower() != "all states":
        df_filtered = df_filtered[df_filtered["state"].str.strip().str.lower() == state.strip().lower()]

    if work_type and work_type.strip().lower() != "all work types" and work_type.strip().lower() != "all categories":
        df_filtered = df_filtered[df_filtered["work_type"].str.strip().str.lower() == work_type.strip().lower()]

    if search:
        s = search.strip().lower()
        df_filtered = df_filtered[
            df_filtered["work_description"].astype(str).str.lower().str.contains(s, na=False) |
            df_filtered["work_id"].astype(str).str.lower().str.contains(s, na=False) |
            df_filtered["mp_name"].astype(str).str.lower().str.contains(s, na=False) |
            df_filtered["constituency"].astype(str).str.lower().str.contains(s, na=False) |
            df_filtered["ida"].astype(str).str.lower().str.contains(s, na=False)
        ]

    alerts = df_filtered.head(limit)
    records = [_clean_record(r) for r in alerts.to_dict(orient="records")]
    return {
        "total_alerts": len(df_filtered),
        "threshold": min_risk_score,
        "returned": len(records),
        "alerts": records
    }

@app.get("/validation/report")
def get_validation():
    """Returns model validation metrics and synthetic anomaly experiment results."""
    return get_validation_report()

@app.post("/recalculate")
def recalculate_risk_scores():
    """Recomputes the risk engine on the latest dataset."""
    engine = MPLADSRiskEngine()
    df_res = engine.evaluate_all_risks()
    return {
        "status": "success",
        "message": f"Successfully re-evaluated risk models on {len(df_res)} records.",
        "high_risk_count": int((df_res["risk_category"] == "HIGH").sum()),
        "avg_risk_score": round(float(df_res["risk_score"].mean()), 2)
    }
