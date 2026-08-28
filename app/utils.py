"""
Streamlit Frontend Utilities and API Client for MPLADS AI Risk Dashboard.
Includes dynamic backend port discovery, robust fallback handling, and UI formatters.
"""
import os
import sys
import json
import requests
import pandas as pd
import streamlit as st
from typing import Dict, Any, Optional

_APP_DIR = os.path.dirname(os.path.abspath(__file__))
_PROJ_DIR = os.path.dirname(_APP_DIR)
if _APP_DIR not in sys.path:
    sys.path.insert(0, _APP_DIR)
if _PROJ_DIR not in sys.path:
    sys.path.insert(0, _PROJ_DIR)

_CACHED_BASE_URL: Optional[str] = None

def get_api_base_url() -> str:
    """Discovers active FastAPI backend on port 8001, 8000, or environment variable."""
    global _CACHED_BASE_URL
    if _CACHED_BASE_URL:
        return _CACHED_BASE_URL

    env_url = os.getenv("MPLADS_API_URL")
    if env_url:
        _CACHED_BASE_URL = env_url
        return _CACHED_BASE_URL

    for port in [8001, 8000, 8080]:
        try:
            r = requests.get(f"http://127.0.0.1:{port}/summary/kpis", timeout=0.6)
            if r.status_code == 200 and "total_works" in r.json():
                _CACHED_BASE_URL = f"http://127.0.0.1:{port}"
                return _CACHED_BASE_URL
        except Exception:
            pass

    _CACHED_BASE_URL = "http://127.0.0.1:8001"
    return _CACHED_BASE_URL

def check_backend_health() -> bool:
    """Checks if the FastAPI backend is running with valid schema."""
    try:
        url = get_api_base_url()
        r = requests.get(f"{url}/summary/kpis", timeout=1.0)
        return r.status_code == 200 and "total_works" in r.json()
    except Exception:
        return False

@st.cache_data(ttl=10)
def api_get(endpoint: str, params: Optional[dict] = None) -> Optional[Any]:
    """Generic cached GET request to FastAPI backend with seamless local fallback."""
    base_url = get_api_base_url()
    url = f"{base_url}{endpoint}"
    try:
        r = requests.get(url, params=params, timeout=10.0)
        if r.status_code == 200:
            return r.json()
    except Exception:
        pass
    
    return _local_fallback(endpoint, params)

def _local_fallback(endpoint: str, params: Optional[dict] = None) -> Optional[Any]:
    """Robust local fallback querying processed CSV if backend is unreachable."""
    try:
        from backend.risk_engine import get_risk_scored_data
        from backend.validate_model import get_validation_report

        df = get_risk_scored_data()
        
        if endpoint == "/summary/kpis":
            tot_amt = float(df["final_amount"].sum())
            high_cnt = int((df["risk_category"] == "HIGH").sum())
            med_cnt = int((df["risk_category"] == "MEDIUM").sum())
            low_cnt = int((df["risk_category"] == "LOW").sum())
            return {
                "total_works": len(df),
                "total_amount_inr": tot_amt,
                "total_amount_crores": round(tot_amt / 1e7, 2),
                "high_risk_count": high_cnt,
                "medium_risk_count": med_cnt,
                "low_risk_count": low_cnt,
                "high_risk_percentage": round((high_cnt / len(df)) * 100, 1) if len(df) > 0 else 0,
                "avg_risk_score": round(float(df["risk_score"].mean()), 2),
                "missing_images_count": int((~df["has_images"].astype(bool)).sum()),
                "duplicate_works_count": int(df["is_duplicate"].sum()),
                "cost_outliers_count": int(df["is_cost_outlier"].sum()),
                "total_mps": int(df["mp_name"].nunique()),
                "total_states": int(df["state"].nunique())
            }

        elif endpoint == "/summary/state":
            summary = []
            for state_name, group in df.groupby("state"):
                tot_works = len(group)
                tot_amt = float(group["final_amount"].sum())
                avg_risk = round(float(group["risk_score"].mean()), 2)
                high_cnt = int((group["risk_category"] == "HIGH").sum())
                top_ida = group["ida"].mode()[0] if not group["ida"].empty else "N/A"
                top_ida_share = round((group["ida"] == top_ida).sum() / tot_works * 100, 1)
                summary.append({
                    "state": str(state_name).strip(),
                    "total_works": tot_works,
                    "total_amount_crores": round(tot_amt / 1e7, 2),
                    "avg_risk_score": avg_risk,
                    "high_risk_count": high_cnt,
                    "high_risk_rate_pct": round((high_cnt / tot_works) * 100, 1),
                    "top_ida": str(top_ida).strip(),
                    "top_ida_share_pct": top_ida_share
                })
            summary.sort(key=lambda x: x["total_works"], reverse=True)
            return summary

        elif endpoint == "/summary/mp":
            summary = []
            state_filt = params.get("state") if params else None
            df_mp = df[df["state"].str.strip().str.lower() == state_filt.strip().lower()] if (state_filt and state_filt.lower() != "all states") else df
            for mp_name, group in df_mp.groupby("mp_name"):
                tot_works = len(group)
                tot_amt = float(group["final_amount"].sum())
                avg_risk = round(float(group["risk_score"].mean()), 2)
                high_cnt = int((group["risk_category"] == "HIGH").sum())
                summary.append({
                    "mp_name": str(mp_name).strip(),
                    "constituency": str(group["constituency"].iloc[0]).strip(),
                    "state": str(group["state"].iloc[0]).strip(),
                    "house": str(group["house"].iloc[0]).strip(),
                    "total_works": tot_works,
                    "total_amount_crores": round(tot_amt / 1e7, 2),
                    "avg_risk_score": avg_risk,
                    "high_risk_count": high_cnt
                })
            summary.sort(key=lambda x: x["total_works"], reverse=True)
            return summary

        elif endpoint == "/summary/benchmarks":
            mp_name = params.get("mp_name", "") if params else ""
            mp_clean = mp_name.strip().lower()
            df_mp = df[df["mp_name"].str.strip().str.lower() == mp_clean]
            if df_mp.empty:
                df_mp = df[df["mp_name"].str.strip().str.lower().str.contains(mp_clean, na=False)]
            mp_state = params.get("state") if params and params.get("state") else (df_mp["state"].iloc[0] if not df_mp.empty else "National")
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
            return {"mp_name": mp_name, "state": mp_state, "total_mp_works": len(df_mp), "benchmarks": benchmarks}

        elif endpoint == "/summary/work_types":
            summary = []
            for wtype, group in df.groupby("work_type"):
                tot_works = len(group)
                tot_amt = float(group["final_amount"].sum())
                avg_cost = float(group["final_amount"].mean())
                avg_risk = round(float(group["risk_score"].mean()), 2)
                high_cnt = int((group["risk_category"] == "HIGH").sum())
                summary.append({
                    "work_type": str(wtype).strip(),
                    "total_works": tot_works,
                    "total_amount_crores": round(tot_amt / 1e7, 2),
                    "average_cost_inr": round(avg_cost, -2),
                    "avg_risk_score": avg_risk,
                    "high_risk_count": high_cnt
                })
            summary.sort(key=lambda x: x["total_works"], reverse=True)
            return summary

        elif endpoint == "/summary/ida":
            state_filt = params.get("state") if params else None
            df_ida = df[df["state"].str.strip().str.lower() == state_filt.strip().lower()] if (state_filt and state_filt.lower() != "all states") else df
            summary = []
            for (st_name, ida_name), group in df_ida.groupby(["state", "ida"]):
                tot_works = len(group)
                tot_amt = float(group["final_amount"].sum())
                st_tot_works = len(df[df["state"] == st_name])
                st_tot_amt = df[df["state"] == st_name]["final_amount"].sum()
                w_share = round((tot_works / st_tot_works) * 100, 1) if st_tot_works > 0 else 0
                a_share = round((tot_amt / st_tot_amt) * 100, 1) if st_tot_amt > 0 else 0
                summary.append({
                    "state": str(st_name).strip(),
                    "ida": str(ida_name).strip(),
                    "works_count": tot_works,
                    "amount_crores": round(tot_amt / 1e7, 2),
                    "works_share_pct": w_share,
                    "amount_share_pct": a_share,
                    "avg_risk_score": round(float(group["risk_score"].mean()), 2),
                    "high_risk_count": int((group["risk_category"] == "HIGH").sum()),
                    "is_monopoly_risk": bool(w_share >= 35.0 or a_share >= 35.0)
                })
            summary.sort(key=lambda x: x["works_share_pct"], reverse=True)
            return summary

        elif endpoint == "/alerts":
            min_score = float(params.get("min_risk_score", 70.0)) if params else 70.0
            limit = int(params.get("limit", 50)) if params else 50
            df_filt = df[df["risk_score"] >= min_score]
            if params:
                if params.get("state") and params["state"].lower() != "all states":
                    df_filt = df_filt[df_filt["state"].str.strip().str.lower() == params["state"].strip().lower()]
                if params.get("work_type") and params["work_type"].lower() not in ["all work types", "all categories"]:
                    df_filt = df_filt[df_filt["work_type"].str.strip().str.lower() == params["work_type"].strip().lower()]
                if params.get("search"):
                    s = str(params["search"]).strip().lower()
                    df_filt = df_filt[
                        df_filt["work_description"].astype(str).str.lower().str.contains(s, na=False) |
                        df_filt["work_id"].astype(str).str.lower().str.contains(s, na=False) |
                        df_filt["mp_name"].astype(str).str.lower().str.contains(s, na=False) |
                        df_filt["constituency"].astype(str).str.lower().str.contains(s, na=False)
                    ]
            df_filt = df_filt.head(limit)
            records = []
            for r in df_filt.to_dict(orient="records"):
                if isinstance(r.get("risk_reasons"), str):
                    try:
                        r["risk_reasons"] = json.loads(r["risk_reasons"])
                    except:
                        r["risk_reasons"] = [r["risk_reasons"]]
                records.append(r)
            return {"total_alerts": len(df_filt), "alerts": records}

        elif endpoint == "/works":
            df_filt = df.copy()
            if params:
                if params.get("state") and params["state"].lower() != "all states":
                    df_filt = df_filt[df_filt["state"].str.strip().str.lower() == params["state"].strip().lower()]
                if params.get("mp_name"):
                    mpc = params["mp_name"].strip().lower()
                    df_filt = df_filt[df_filt["mp_name"].str.strip().str.lower().str.contains(mpc, na=False)]
                if params.get("work_type") and params["work_type"].lower() not in ["all categories", "all work types"]:
                    df_filt = df_filt[df_filt["work_type"].str.strip().str.lower() == params["work_type"].strip().lower()]
                if params.get("risk_category") and params["risk_category"].upper() != "ALL RISK LEVELS":
                    rc = params["risk_category"].strip().upper().split()[0]
                    df_filt = df_filt[df_filt["risk_category"].str.upper() == rc]
                if params.get("min_risk_score") is not None:
                    df_filt = df_filt[df_filt["risk_score"] >= float(params["min_risk_score"])]
                if params.get("search"):
                    s = str(params["search"]).strip().lower()
                    df_filt = df_filt[
                        df_filt["work_description"].astype(str).str.lower().str.contains(s, na=False) |
                        df_filt["work_id"].astype(str).str.lower().str.contains(s, na=False) |
                        df_filt["mp_name"].astype(str).str.lower().str.contains(s, na=False) |
                        df_filt["constituency"].astype(str).str.lower().str.contains(s, na=False)
                    ]
                limit = int(params.get("limit", 500))
                df_filt = df_filt.head(limit)

            records = []
            for r in df_filt.to_dict(orient="records"):
                if isinstance(r.get("risk_reasons"), str):
                    try:
                        r["risk_reasons"] = json.loads(r["risk_reasons"])
                    except:
                        r["risk_reasons"] = [r["risk_reasons"]]
                records.append(r)
            return {"total": len(df_filt), "data": records}

        elif endpoint.startswith("/works/"):
            wid = endpoint.split("/works/")[-1].strip().upper()
            match = df[df["work_id"].astype(str).str.strip().str.upper() == wid]
            if not match.empty:
                r = match.iloc[0].to_dict()
                if isinstance(r.get("risk_reasons"), str):
                    try:
                        r["risk_reasons"] = json.loads(r["risk_reasons"])
                    except:
                        r["risk_reasons"] = [r["risk_reasons"]]
                return r

        elif endpoint == "/validation/report":
            return get_validation_report()

    except Exception as e:
        print(f"Local fallback error: {e}")
    return None

def format_inr(amount: float) -> str:
    """Formats amount in Lakhs / Crores cleanly."""
    if amount >= 10000000:
        return f"₹{amount / 10000000:.2f} Cr"
    elif amount >= 100000:
        return f"₹{amount / 100000:.2f} L"
    else:
        return f"₹{amount:,.0f}"

def get_risk_color(score: float) -> str:
    """Returns color hex based on risk score."""
    if score >= 70:
        return "#dc3545"
    elif score >= 40:
        return "#ffc107"
    else:
        return "#28a745"

def get_risk_badge(category: str, score: float) -> str:
    """Returns formatted HTML risk badge."""
    color = get_risk_color(score)
    text_color = "#ffffff" if score >= 70 or score < 40 else "#000000"
    return f'<span style="background-color: {color}; color: {text_color}; padding: 3px 8px; border-radius: 4px; font-weight: bold; font-size: 0.85rem;">{category} ({score:.0f})</span>'

def style_risk_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """Applies conditional formatting to risk scores in pandas dataframe."""
    def color_risk(val):
        try:
            val_f = float(val)
            if val_f >= 70:
                return "background-color: #ffcccc; color: #900000; font-weight: bold;"
            elif val_f >= 40:
                return "background-color: #fff3cd; color: #856404; font-weight: bold;"
            else:
                return "background-color: #d4edda; color: #155724;"
        except:
            return ""

    if "risk_score" in df.columns:
        return df.style.map(color_risk, subset=["risk_score"])
    return df.style
