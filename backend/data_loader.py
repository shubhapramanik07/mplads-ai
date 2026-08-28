"""
Data loading and peer-group statistical processing for MPLADS works.
"""
import os
import pandas as pd
import numpy as np
from typing import Dict, Tuple, Optional

_CACHED_DF: Optional[pd.DataFrame] = None
_WORK_TYPE_STATS: Optional[pd.DataFrame] = None
_STATE_STATS: Optional[pd.DataFrame] = None

DEFAULT_DATA_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "processed", "completed_clean.csv")

def load_clean_data(csv_path: str = DEFAULT_DATA_PATH, force_reload: bool = False) -> pd.DataFrame:
    """
    Loads and caches the cleaned MPLADS completed works dataset.
    Ensures correct data types and formats.
    """
    global _CACHED_DF
    if _CACHED_DF is not None and not force_reload:
        return _CACHED_DF.copy()

    if not os.path.exists(csv_path):
        # Fallback to local relative path if needed
        rel_path = os.path.join("data", "processed", "completed_clean.csv")
        if os.path.exists(rel_path):
            csv_path = rel_path
        else:
            raise FileNotFoundError(f"Cleaned MPLADS data file not found at: {csv_path}")

    df = pd.read_csv(csv_path, low_memory=False)

    # Validate and standardize schema
    required_cols = [
        "work_id", "work_description", "category", "mp_name",
        "constituency", "state", "house", "final_amount",
        "completed_date", "has_images", "average_rating", "ida", "work_type"
    ]
    for col in required_cols:
        if col not in df.columns:
            raise ValueError(f"Missing required column '{col}' in input dataset.")

    df["final_amount"] = pd.to_numeric(df["final_amount"], errors="coerce").fillna(0.0)
    df["has_images"] = df["has_images"].astype(bool)
    df["average_rating"] = pd.to_numeric(df["average_rating"], errors="coerce").fillna(3.5)
    df["completed_date"] = pd.to_datetime(df["completed_date"], errors="coerce").dt.strftime("%Y-%m-%d")
    df["work_type"] = df["work_type"].astype(str).str.lower().str.strip()

    _CACHED_DF = df
    return _CACHED_DF.copy()

def compute_peer_group_stats(df: Optional[pd.DataFrame] = None) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """
    Computes peer-group statistics (median, mean, std, 25th, 75th percentiles) of final_amount:
    1. Grouped by work_type
    2. Grouped by state
    """
    global _WORK_TYPE_STATS, _STATE_STATS

    if df is None:
        df = load_clean_data()

    # Work type peer statistics
    work_type_stats = df.groupby("work_type")["final_amount"].agg(
        median="median",
        mean="mean",
        std=lambda x: x.std(ddof=0) if len(x) > 1 else 0.0,
        count="count",
        q25=lambda x: x.quantile(0.25),
        q75=lambda x: x.quantile(0.75)
    ).reset_index()

    # State peer statistics
    state_stats = df.groupby("state")["final_amount"].agg(
        median="median",
        mean="mean",
        std=lambda x: x.std(ddof=0) if len(x) > 1 else 0.0,
        count="count",
        q25=lambda x: x.quantile(0.25),
        q75=lambda x: x.quantile(0.75)
    ).reset_index()

    _WORK_TYPE_STATS = work_type_stats
    _STATE_STATS = state_stats

    return work_type_stats, state_stats

def get_enriched_peer_features(df: Optional[pd.DataFrame] = None) -> pd.DataFrame:
    """
    Merges peer-group statistics back onto the works dataframe and computes deviations.
    """
    if df is None:
        df = load_clean_data()

    wt_stats, st_stats = compute_peer_group_stats(df)

    # Merge work_type peer stats
    df_merged = df.merge(
        wt_stats.rename(columns={
            "median": "wt_median_cost",
            "mean": "wt_mean_cost",
            "std": "wt_std_cost"
        })[["work_type", "wt_median_cost", "wt_mean_cost", "wt_std_cost"]],
        on="work_type",
        how="left"
    )

    # Merge state peer stats
    df_merged = df_merged.merge(
        st_stats.rename(columns={
            "median": "state_median_cost",
            "mean": "state_mean_cost",
            "std": "state_std_cost"
        })[["state", "state_median_cost", "state_mean_cost", "state_std_cost"]],
        on="state",
        how="left"
    )

    # Compute percentage deviations from medians
    # Prevent division by zero
    wt_med = df_merged["wt_median_cost"].replace(0, 1.0)
    st_med = df_merged["state_median_cost"].replace(0, 1.0)

    df_merged["dev_work_type_median_pct"] = ((df_merged["final_amount"] - df_merged["wt_median_cost"]) / wt_med) * 100.0
    df_merged["dev_state_median_pct"] = ((df_merged["final_amount"] - df_merged["state_median_cost"]) / st_med) * 100.0

    return df_merged
