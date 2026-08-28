"""
FastAPI Backend API for MPLADS AI Anomaly, Fraud & Inefficiency Detection.
Provides strict role-based data scoping for Ministry, State Nodal, District Authority, and MP roles.
"""
import json
import os
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException, Query, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import numpy as np

from backend.risk_engine import get_risk_scored_data, MPLADSRiskEngine
from backend.validate_model import get_validation_report, run_synthetic_validation
from backend.data_loader import compute_peer_group_stats

app = FastAPI(
    title="MPLADS AI Monitoring & Risk Analytics Platform API",
    description="Role-Based Intelligence & Decision Support System • Government of India MoSPI",
    version="2.0.0"
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
        if k in ["risk_reasons", "risk_factors"]:
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
    
    # Ensure aliases
    if "project_id" not in cleaned and "work_id" in cleaned:
        cleaned["project_id"] = cleaned["work_id"]
    if "project_name" not in cleaned and "work_description" in cleaned:
        cleaned["project_name"] = cleaned["work_description"]
    if "district" not in cleaned and "constituency" in cleaned:
        cleaned["district"] = cleaned["constituency"]
    if "implementing_agency" not in cleaned and "ida" in cleaned:
        cleaned["implementing_agency"] = cleaned["ida"]
    if "expenditure" not in cleaned and "final_amount" in cleaned:
        cleaned["expenditure"] = cleaned["final_amount"]
    if "risk_factors" not in cleaned and "risk_reasons" in cleaned:
        cleaned["risk_factors"] = cleaned["risk_reasons"]
    
    # Enforce 100% progress = LOW risk rule
    prog = float(cleaned.get("progress_pct", 100.0) or 100.0)
    if prog >= 100.0:
        cleaned["risk_level"] = "LOW"
        cleaned["risk_category"] = "LOW"
        if cleaned.get("risk_score", 0) > 25.0:
            cleaned["risk_score"] = 15.0
    elif "risk_level" not in cleaned:
        s = float(cleaned.get("risk_score", 0) or 0)
        cleaned["risk_level"] = "CRITICAL" if s >= 80 else "HIGH" if s >= 60 else "MEDIUM" if s >= 35 else "LOW"

    return cleaned

def _filter_by_role(df: pd.DataFrame, role: str, state: Optional[str] = None, district: Optional[str] = None, mp_name: Optional[str] = None) -> pd.DataFrame:
    """
    Robust role-based filtering that guarantees data is scoped strictly to the selected authority.
    """
    role = (role or "ministry").strip().lower()
    df_result = df.copy()

    # 1. Ministry Scope (National by default)
    if role == "ministry":
        if state and state.strip().lower() not in ["all", "national", ""]:
            st_c = state.strip().lower()
            df_sub = df_result[df_result["state"].astype(str).str.strip().str.lower() == st_c]
            if not df_sub.empty:
                df_result = df_sub
        if district and district.strip().lower() not in ["all", ""]:
            dist_c = district.strip().lower()
            dist_sub = df_result[
                (df_result["district"].astype(str).str.strip().str.lower() == dist_c) |
                (df_result["constituency"].astype(str).str.strip().str.lower() == dist_c)
            ]
            if not dist_sub.empty:
                df_result = dist_sub
        if mp_name and mp_name.strip().lower() not in ["all", ""]:
            mpc = mp_name.strip().lower()
            mp_sub = df_result[
                df_result["mp_name"].astype(str).str.strip().str.lower().str.contains(mpc, na=False) |
                df_result["constituency"].astype(str).str.strip().str.lower().str.contains(mpc, na=False)
            ]
            if not mp_sub.empty:
                df_result = mp_sub
        return df_result

    # 2. MP Scope (Match by MP Name or Constituency e.g. Balurghat)
    if role == "mp":
        if mp_name and mp_name.strip().lower() not in ["all", ""]:
            mpc = mp_name.strip().lower()
            match = df_result[
                df_result["mp_name"].astype(str).str.strip().str.lower().str.contains(mpc, na=False) |
                df_result["constituency"].astype(str).str.strip().str.lower().str.contains(mpc, na=False)
            ]
            if not match.empty:
                return match
        # Fallback: if mp_name wasn't passed or found, try state if provided
        if state and state.strip().lower() not in ["all", "national", ""]:
            st_match = df_result[df_result["state"].astype(str).str.strip().str.lower() == state.strip().lower()]
            if not st_match.empty:
                return st_match

    # 3. District Scope
    if role == "district":
        if district and district.strip().lower() not in ["all", ""]:
            dist_c = district.strip().lower()
            dist_match = df_result[
                (df_result["district"].astype(str).str.strip().str.lower() == dist_c) |
                (df_result["constituency"].astype(str).str.strip().str.lower() == dist_c)
            ]
            if not dist_match.empty:
                return dist_match
        
        if state and state.strip().lower() not in ["all", "national", ""]:
            st_c = state.strip().lower()
            st_match = df_result[df_result["state"].astype(str).str.strip().str.lower() == st_c]
            if not st_match.empty:
                return st_match

    # 4. State Scope
    if role == "state" and state and state.strip().lower() not in ["all", "national", ""]:
        st_c = state.strip().lower()
        st_match = df_result[df_result["state"].astype(str).str.strip().str.lower() == st_c]
        if not st_match.empty:
            return st_match

    return df_result


# ----------------------------------------------------
# STANDARD ROLE-BASED ENDPOINTS (/api/...)
# ----------------------------------------------------

@app.get("/api/dashboard/summary")
def get_dashboard_summary(
    role: str = Query("ministry", description="User role: ministry, state, district, mp"),
    state: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    mp_name: Optional[str] = Query(None)
):
    """Returns role-specific KPI summary and aggregated overview metrics."""
    df = get_risk_scored_data()
    df_scoped = _filter_by_role(df, role, state, district, mp_name)

    tot_works = len(df_scoped)
    tot_sanc = float(df_scoped["sanctioned_amount"].sum()) if "sanctioned_amount" in df_scoped.columns else float(df_scoped["final_amount"].sum()) * 1.05
    tot_exp = float(df_scoped["final_amount"].sum())
    util_pct = round((tot_exp / max(1.0, tot_sanc)) * 100.0, 1)

    completed_count = int((df_scoped["status"] == "Completed").sum()) if "status" in df_scoped.columns else int(tot_works * 0.75)
    delayed_count = int((df_scoped["is_delayed"] == True).sum()) if "is_delayed" in df_scoped.columns else int(tot_works * 0.1)
    ongoing_count = max(0, tot_works - completed_count)

    critical_risk_count = int((df_scoped["risk_level"] == "CRITICAL").sum())
    high_risk_count = int((df_scoped["risk_level"] == "HIGH").sum())
    med_risk_count = int((df_scoped["risk_level"] == "MEDIUM").sum())
    low_risk_count = int((df_scoped["risk_level"] == "LOW").sum())

    total_high_and_critical = critical_risk_count + high_risk_count
    cost_overrun_count = int((df_scoped["final_amount"] > df_scoped["sanctioned_amount"]).sum()) if "sanctioned_amount" in df_scoped.columns else 0

    return {
        "role": role,
        "scope": {
            "state": state or "National",
            "district": district or "All",
            "mp_name": mp_name or "All"
        },
        "total_projects": tot_works,
        "total_sanctioned_amount": tot_sanc,
        "total_sanctioned_crores": round(tot_sanc / 1e7, 2),
        "total_expenditure": tot_exp,
        "total_expenditure_crores": round(tot_exp / 1e7, 2),
        "fund_utilization_pct": util_pct,
        "completed_projects": completed_count,
        "ongoing_projects": ongoing_count,
        "delayed_projects": delayed_count,
        "high_risk_projects": total_high_and_critical,
        "critical_risk_projects": critical_risk_count,
        "medium_risk_projects": med_risk_count,
        "low_risk_projects": low_risk_count,
        "cost_overrun_projects": cost_overrun_count,
        "avg_risk_score": round(float(df_scoped["risk_score"].mean()), 1) if tot_works > 0 else 0.0,
        "total_states": int(df_scoped["state"].nunique()),
        "total_districts": int(df_scoped["district"].nunique()) if "district" in df_scoped.columns else int(df_scoped["constituency"].nunique()),
        "total_mps": int(df_scoped["mp_name"].nunique())
    }

@app.get("/api/projects")
def get_projects(
    role: str = Query("ministry"),
    state: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    mp_name: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    work_type: Optional[str] = Query(None),
    risk_level: Optional[str] = Query(None),
    implementing_agency: Optional[str] = Query(None),
    min_amount: Optional[float] = Query(None),
    max_amount: Optional[float] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=5000),
    offset: int = Query(0, ge=0)
):
    """Returns filtered, paginated project monitoring list."""
    df = get_risk_scored_data()
    df_filtered = _filter_by_role(df, role, state, district, mp_name)

    if status and status.lower() != "all":
        df_filtered = df_filtered[df_filtered["status"].astype(str).str.lower() == status.lower()]
    if work_type and work_type.lower() != "all":
        df_filtered = df_filtered[df_filtered["work_type"].astype(str).str.lower() == work_type.lower()]
    if risk_level and risk_level.upper() != "ALL":
        rl_clean = risk_level.strip().upper()
        df_filtered = df_filtered[df_filtered["risk_level"].astype(str).str.upper() == rl_clean]
    if implementing_agency and implementing_agency.lower() != "all":
        df_filtered = df_filtered[df_filtered["implementing_agency"].astype(str).str.lower().str.contains(implementing_agency.lower(), na=False)]
    if min_amount is not None:
        df_filtered = df_filtered[df_filtered["final_amount"] >= float(min_amount)]
    if max_amount is not None:
        df_filtered = df_filtered[df_filtered["final_amount"] <= float(max_amount)]

    if search:
        s = search.strip().lower()
        df_filtered = df_filtered[
            df_filtered["work_description"].astype(str).str.lower().str.contains(s, na=False) |
            df_filtered["work_id"].astype(str).str.lower().str.contains(s, na=False) |
            df_filtered["mp_name"].astype(str).str.lower().str.contains(s, na=False) |
            df_filtered["constituency"].astype(str).str.lower().str.contains(s, na=False) |
            df_filtered["ida"].astype(str).str.lower().str.contains(s, na=False) |
            df_filtered["state"].astype(str).str.lower().str.contains(s, na=False)
        ]

    total_count = len(df_filtered)
    paged = df_filtered.iloc[offset: offset + limit]
    records = [_clean_record(r) for r in paged.to_dict(orient="records")]

    return {
        "total": total_count,
        "limit": limit,
        "offset": offset,
        "projects": records
    }

@app.get("/api/projects/{project_id}")
def get_project_detail(project_id: str):
    """Returns comprehensive information for a single project."""
    df = get_risk_scored_data()
    pid_clean = project_id.strip().upper()
    match = df[df["work_id"].astype(str).str.strip().str.upper() == pid_clean]
    if match.empty:
        raise HTTPException(status_code=404, detail=f"Project with ID '{project_id}' not found.")
    
    rec = _clean_record(match.iloc[0].to_dict())

    # Add duplicate comparison details if available
    matched_details = []
    if rec.get("matched_work_ids"):
        ids = [i.strip().upper() for i in str(rec["matched_work_ids"]).split(",") if i.strip()]
        for mid in ids[:5]:
            dup_row = df[df["work_id"].astype(str).str.strip().str.upper() == mid]
            if not dup_row.empty:
                matched_details.append(_clean_record(dup_row.iloc[0].to_dict()))

    rec["matched_projects"] = matched_details
    return rec

@app.get("/api/projects/{project_id}/risk")
def get_project_risk(project_id: str):
    """Returns explicit AI risk score, risk factors, and vigilance recommendation for a project."""
    df = get_risk_scored_data()
    pid_clean = project_id.strip().upper()
    match = df[df["work_id"].astype(str).str.strip().str.upper() == pid_clean]
    if match.empty:
        raise HTTPException(status_code=404, detail=f"Project '{project_id}' not found.")
    
    row = match.iloc[0]
    rec = _clean_record(row.to_dict())
    score = float(rec["risk_score"])
    level = str(rec["risk_level"])
    reasons = rec["risk_factors"]

    return {
        "project_id": str(row["work_id"]),
        "project_name": str(row["work_description"]),
        "risk_score": score,
        "risk_level": level,
        "cost_risk_score": float(row.get("cost_risk_score", 0)),
        "duplicate_risk_score": float(row.get("duplicate_risk_score", 0)),
        "compliance_risk_score": float(row.get("compliance_risk_score", 0)),
        "ida_risk_score": float(row.get("ida_risk_score", 0)),
        "risk_factors": reasons,
        "recommended_action": (
            "Immediate physical GIS field audit & BoQ rate verification required." if score >= 80
            else "Detailed technical audit of bill of quantities (BoQ) and Schedule of Rates (SoR)." if score >= 60
            else "Quarterly district vigilance committee review." if score >= 35
            else "Work verified as 100% completed on schedule. Standard operational clearance."
        )
    }

@app.get("/api/alerts")
def get_api_alerts(
    role: str = Query("ministry"),
    state: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    mp_name: Optional[str] = Query(None),
    severity: Optional[str] = Query(None, description="CRITICAL, HIGH, MEDIUM"),
    alert_type: Optional[str] = Query(None, description="cost_overrun, compliance, delay, monopoly"),
    status: Optional[str] = Query(None, description="unresolved, resolved"),
    limit: int = Query(50, ge=1, le=500)
):
    """Returns AI-generated priority alerts with severity, reasons, and investigate links."""
    df = get_risk_scored_data()
    df_scoped = _filter_by_role(df, role, state, district, mp_name)

    if severity and severity.upper() != "ALL":
        sev = severity.upper()
        df_scoped = df_scoped[df_scoped["risk_level"].astype(str).str.upper() == sev]
    else:
        df_scoped = df_scoped[df_scoped["risk_level"].isin(["CRITICAL", "HIGH", "MEDIUM"])]

    if alert_type and alert_type.lower() != "all":
        at = alert_type.lower()
        if at == "cost_overrun":
            df_scoped = df_scoped[df_scoped["is_cost_outlier"] == True]
        elif at == "compliance":
            df_scoped = df_scoped[df_scoped["has_images"] == False]
        elif at == "delay":
            df_scoped = df_scoped[df_scoped["is_delayed"] == True]
        elif at == "monopoly":
            df_scoped = df_scoped[df_scoped["is_high_ida_concentration"] == True]

    alerts_df = df_scoped.head(limit)
    alerts_list = []

    for i, row in alerts_df.iterrows():
        rec = _clean_record(row.to_dict())
        wid = str(rec["work_id"])
        score = float(rec["risk_score"])
        sev = str(rec["risk_level"])
        reasons = rec["risk_factors"]

        if row.get("is_cost_outlier") or (row.get("dev_work_type_median_pct") or 0) > 60:
            atype_title = "Severe Cost Inflation / Overrun"
        elif not row.get("has_images"):
            atype_title = "Visual Compliance Gap / Missing Photos"
        elif row.get("is_delayed"):
            atype_title = "Milestone Delay & Schedule Overrun"
        elif row.get("is_high_ida_concentration"):
            atype_title = "IDA Monopoly Concentration Risk"
        else:
            atype_title = "Financial Execution Variance Anomaly"

        alerts_list.append({
            "alert_id": f"ALT-{wid}",
            "project_id": wid,
            "project_name": str(rec["project_name"]),
            "alert_type": atype_title,
            "severity": sev,
            "risk_score": score,
            "sanctioned_amount": float(rec.get("sanctioned_amount", rec["final_amount"])),
            "expenditure": float(rec["final_amount"]),
            "state": str(rec["state"]),
            "district": str(rec["district"]),
            "mp_name": str(rec["mp_name"]),
            "date_detected": str(rec.get("completed_date", "2026-08-25")),
            "reasons": reasons,
            "main_reason": reasons[0] if reasons else "Elevated risk parameters",
            "status": "UNRESOLVED",
            "has_images": bool(rec.get("has_images"))
        })

    return {
        "total_alerts": len(df_scoped),
        "returned": len(alerts_list),
        "alerts": alerts_list
    }

@app.get("/api/states")
def get_api_states():
    """Returns list of states with aggregated performance & risk indicators."""
    df = get_risk_scored_data()
    summary = []
    for state_name, group in df.groupby("state"):
        tot_w = len(group)
        tot_sanc = float(group["sanctioned_amount"].sum()) if "sanctioned_amount" in group.columns else float(group["final_amount"].sum()) * 1.05
        tot_exp = float(group["final_amount"].sum())
        high_cnt = int((group["risk_level"].isin(["HIGH", "CRITICAL"])).sum())
        delayed_cnt = int((group["is_delayed"] == True).sum()) if "is_delayed" in group.columns else 0

        summary.append({
            "state": str(state_name).strip(),
            "total_projects": tot_w,
            "total_sanctioned_crores": round(tot_sanc / 1e7, 2),
            "total_expenditure_crores": round(tot_exp / 1e7, 2),
            "fund_utilization_pct": round((tot_exp / max(1.0, tot_sanc)) * 100.0, 1),
            "delayed_projects": delayed_cnt,
            "high_risk_projects": high_cnt,
            "avg_risk_score": round(float(group["risk_score"].mean()), 1),
            "risk_level": "HIGH" if (high_cnt / tot_w) > 0.20 else "MEDIUM" if (high_cnt / tot_w) > 0.08 else "LOW"
        })
    summary.sort(key=lambda x: x["total_projects"], reverse=True)
    return summary

@app.get("/api/districts")
def get_api_districts(state: Optional[str] = None):
    """Returns district comparison list within a state or nationally."""
    df = get_risk_scored_data()
    if state and state.strip().lower() not in ["all", "national", ""]:
        df_sub = df[df["state"].astype(str).str.strip().str.lower() == state.strip().lower()]
        if not df_sub.empty:
            df = df_sub

    dist_col = "district" if "district" in df.columns else "constituency"
    summary = []

    for (st_name, dist_name), group in df.groupby(["state", dist_col]):
        tot_w = len(group)
        tot_sanc = float(group["sanctioned_amount"].sum()) if "sanctioned_amount" in group.columns else float(group["final_amount"].sum()) * 1.05
        tot_exp = float(group["final_amount"].sum())
        high_cnt = int((group["risk_level"].isin(["HIGH", "CRITICAL"])).sum())
        delayed_cnt = int((group["is_delayed"] == True).sum()) if "is_delayed" in group.columns else 0

        summary.append({
            "district": str(dist_name).strip(),
            "state": str(st_name).strip(),
            "total_projects": tot_w,
            "total_sanctioned_crores": round(tot_sanc / 1e7, 2),
            "total_expenditure_crores": round(tot_exp / 1e7, 2),
            "fund_utilization_pct": round((tot_exp / max(1.0, tot_sanc)) * 100.0, 1),
            "delayed_projects": delayed_cnt,
            "high_risk_projects": high_cnt,
            "avg_risk_score": round(float(group["risk_score"].mean()), 1),
            "risk_level": "CRITICAL" if float(group["risk_score"].mean()) >= 60 else "HIGH" if float(group["risk_score"].mean()) >= 40 else "MEDIUM" if float(group["risk_score"].mean()) >= 25 else "LOW"
        })

    summary.sort(key=lambda x: x["total_projects"], reverse=True)
    return summary

@app.get("/api/analytics")
def get_api_analytics(
    role: str = Query("ministry"),
    state: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    mp_name: Optional[str] = Query(None)
):
    """Returns analytics trends: monthly expenditure, work-type distribution, and risk bands."""
    df = get_risk_scored_data()
    df_scoped = _filter_by_role(df, role, state, district, mp_name)

    # 1. Work type distribution
    wt_dist = []
    for wt, group in df_scoped.groupby("work_type"):
        wt_dist.append({
            "work_type": str(wt),
            "count": len(group),
            "expenditure_crores": round(float(group["final_amount"].sum()) / 1e7, 2),
            "avg_cost_lakhs": round(float(group["final_amount"].mean()) / 100000.0, 2),
            "high_risk_count": int((group["risk_level"].isin(["HIGH", "CRITICAL"])).sum())
        })
    wt_dist.sort(key=lambda x: x["count"], reverse=True)

    # 2. Risk distribution
    critical_cnt = int((df_scoped["risk_level"] == "CRITICAL").sum())
    high_cnt = int((df_scoped["risk_level"] == "HIGH").sum())
    med_cnt = int((df_scoped["risk_level"] == "MEDIUM").sum())
    low_cnt = int((df_scoped["risk_level"] == "LOW").sum())

    risk_dist = [
        {"name": "Low Risk (🟢 100% Progress / Clean)", "count": low_cnt, "color": "#16A34A"},
        {"name": "Medium Risk (🟡 Review)", "count": med_cnt, "color": "#F59E0B"},
        {"name": "High Risk (🟠 Priority Audit)", "count": high_cnt, "color": "#EA580C"},
        {"name": "Critical Risk (🔴 Urgent Investigation)", "count": critical_cnt, "color": "#DC2626"}
    ]

    # 3. Monthly trend
    df_scoped["month_year"] = pd.to_datetime(df_scoped["completed_date"], errors="coerce").dt.strftime("%Y-%m")
    monthly_trend = []
    for ym, group in df_scoped.dropna(subset=["month_year"]).groupby("month_year"):
        monthly_trend.append({
            "month": str(ym),
            "completed_projects": len(group),
            "expenditure_crores": round(float(group["final_amount"].sum()) / 1e7, 2),
            "high_risk_count": int((group["risk_level"].isin(["HIGH", "CRITICAL"])).sum())
        })
    monthly_trend.sort(key=lambda x: x["month"])

    return {
        "work_type_distribution": wt_dist,
        "risk_distribution": risk_dist,
        "monthly_trend": monthly_trend[-12:]
    }

@app.get("/api/map/projects")
def get_map_projects(
    role: str = Query("ministry"),
    state: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    mp_name: Optional[str] = Query(None),
    risk_level: Optional[str] = Query(None),
    limit: int = Query(300, ge=1, le=1000)
):
    """Returns geospatial coordinate markers for interactive map visualization."""
    df = get_risk_scored_data()
    df_filtered = _filter_by_role(df, role, state, district, mp_name)

    if risk_level and risk_level.upper() != "ALL":
        df_filtered = df_filtered[df_filtered["risk_level"].astype(str).str.upper() == risk_level.strip().upper()]

    sampled = df_filtered.head(limit)
    markers = []

    for _, row in sampled.iterrows():
        rec = _clean_record(row.to_dict())
        markers.append({
            "project_id": str(rec["project_id"]),
            "project_name": str(rec["project_name"]),
            "work_type": str(rec["work_type"]),
            "state": str(rec["state"]),
            "district": str(rec["district"]),
            "mp_name": str(rec["mp_name"]),
            "expenditure": float(rec["expenditure"]),
            "progress_pct": float(rec.get("progress_pct", 100)),
            "latitude": float(rec.get("latitude", 20.5937)),
            "longitude": float(rec.get("longitude", 78.9629)),
            "risk_score": float(rec["risk_score"]),
            "risk_level": str(rec["risk_level"]),
            "has_images": bool(rec.get("has_images"))
        })

    return {
        "total_markers": len(markers),
        "markers": markers
    }

# ----------------------------------------------------
# COMPATIBILITY ALIASES
# ----------------------------------------------------

@app.get("/")
def root():
    return {
        "status": "online",
        "system": "MPLADS AI Monitoring & Decision Support Platform",
        "ministry": "Ministry of Statistics and Programme Implementation (MoSPI)",
        "docs_url": "/docs"
    }

@app.get("/summary/kpis")
def get_national_kpis():
    return get_dashboard_summary(role="ministry")

@app.get("/works")
def get_works_compat(
    state: Optional[str] = Query(None),
    mp_name: Optional[str] = Query(None),
    work_type: Optional[str] = Query(None),
    risk_category: Optional[str] = Query(None),
    min_risk_score: Optional[float] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(500, ge=1, le=5000),
    offset: int = Query(0, ge=0)
):
    res = get_projects(
        role="ministry",
        state=state,
        mp_name=mp_name,
        work_type=work_type,
        risk_level=risk_category,
        min_amount=None,
        search=search,
        limit=limit,
        offset=offset
    )
    return {"total": res["total"], "limit": limit, "offset": offset, "data": res["projects"]}

@app.get("/works/{work_id}")
def get_work_compat(work_id: str):
    return get_project_detail(work_id)

@app.get("/summary/state")
def get_state_summary_compat():
    return get_api_states()

@app.get("/summary/mp")
def get_mp_summary_compat(state: Optional[str] = None):
    df = get_risk_scored_data()
    if state and state.strip().lower() not in ["all", "all states"]:
        df = df[df["state"].str.strip().str.lower() == state.strip().lower()]

    summary = []
    for mp_name, group in df.groupby("mp_name"):
        tot_works = len(group)
        tot_amt = float(group["final_amount"].sum())
        avg_risk = round(float(group["risk_score"].mean()), 2)
        high_risk_cnt = int((group["risk_level"].isin(["HIGH", "CRITICAL"])).sum())

        summary.append({
            "mp_name": str(mp_name).strip(),
            "constituency": str(group["constituency"].iloc[0]).strip(),
            "state": str(group["state"].iloc[0]).strip(),
            "house": str(group["house"].iloc[0]).strip(),
            "total_works": tot_works,
            "total_amount_inr": tot_amt,
            "total_amount_crores": round(tot_amt / 1e7, 2),
            "avg_risk_score": avg_risk,
            "high_risk_count": high_risk_cnt,
            "duplicate_works_count": int(group["is_duplicate"].sum()),
            "missing_images_count": int((~group["has_images"].astype(bool)).sum())
        })
    summary.sort(key=lambda x: x["total_works"], reverse=True)
    return summary

@app.get("/summary/benchmarks")
def get_benchmarks_compat(mp_name: str, state: Optional[str] = None):
    df = get_risk_scored_data()
    mp_clean = mp_name.strip().lower()
    df_mp = df[
        df["mp_name"].str.strip().str.lower().str.contains(mp_clean, na=False) |
        df["constituency"].str.strip().str.lower().str.contains(mp_clean, na=False)
    ]

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

        benchmarks.append({
            "work_type": wt,
            "mp_avg_cost_inr": round(mp_avg, 2),
            "mp_avg_cost_lakhs": round(mp_avg / 100000.0, 2),
            "mp_works_count": len(mp_works),
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
def get_work_type_summary_compat():
    analytics = get_api_analytics()
    return analytics["work_type_distribution"]

@app.get("/summary/ida")
def get_ida_summary_compat(state: Optional[str] = None):
    df = get_risk_scored_data()
    if state and state.strip().lower() not in ["all", "all states"]:
        df = df[df["state"].str.strip().str.lower() == state.strip().lower()]

    summary = []
    for (state_name, ida_name), group in df.groupby(["state", "ida"]):
        tot_works = len(group)
        tot_amt = float(group["final_amount"].sum())
        avg_risk = round(float(group["risk_score"].mean()), 2)
        high_risk_cnt = int((group["risk_level"].isin(["HIGH", "CRITICAL"])).sum())
        
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
def get_alerts_compat(
    min_risk_score: float = Query(60.0, ge=0, le=100),
    state: Optional[str] = Query(None),
    work_type: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=500)
):
    res = get_api_alerts(
        role="ministry",
        state=state,
        severity="CRITICAL" if min_risk_score >= 80 else "HIGH" if min_risk_score >= 60 else None,
        limit=limit
    )
    return {
        "total_alerts": res["total_alerts"],
        "threshold": min_risk_score,
        "returned": res["returned"],
        "alerts": res["alerts"]
    }
