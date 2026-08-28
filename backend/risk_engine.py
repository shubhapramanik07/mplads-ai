"""
Accurate & Calibrated ML Risk Engine for MPLADS Anomaly, Fraud and Inefficiency Detection.
Computes 0-100 explainable risk scores combining Isolation Forest, TF-IDF NLP, Compliance, and IDA Concentration.
"""
import os
import json
import pandas as pd
import numpy as np
from typing import Dict, List, Tuple, Optional
from sklearn.ensemble import IsolationForest
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from backend.data_loader import load_clean_data, get_enriched_peer_features

DEFAULT_OUTPUT_PATH = os.path.join(
    os.path.dirname(os.path.dirname(__file__)), "data", "processed", "risk_scored_works.csv"
)

class MPLADSRiskEngine:
    def __init__(self, sim_threshold: float = 0.70, contamination: float = 0.08):
        self.sim_threshold = sim_threshold
        self.contamination = contamination
        self.iso_forest = IsolationForest(
            n_estimators=120,
            contamination=self.contamination,
            random_state=42,
            bootstrap=False,
            n_jobs=-1
        )
        self.tfidf = TfidfVectorizer(
            stop_words="english",
            ngram_range=(1, 2),
            min_df=1,
            sublinear_tf=True
        )

    def detect_cost_outliers(self, df: pd.DataFrame) -> Tuple[pd.Series, pd.Series, List[List[str]]]:
        """
        Calculates granular cost risk score (0-100) using Isolation Forest & peer deviations.
        """
        features = df[["final_amount", "dev_work_type_median_pct", "dev_state_median_pct"]].copy()
        features = features.replace([np.inf, -np.inf], np.nan).fillna(0.0)

        # Fit Isolation Forest on multidimensional expenditure features
        self.iso_forest.fit(features)
        raw_scores = self.iso_forest.decision_function(features)
        
        min_s, max_s = raw_scores.min(), raw_scores.max()
        if max_s > min_s:
            norm_anomaly = (max_s - raw_scores) / (max_s - min_s)
        else:
            norm_anomaly = np.zeros_like(raw_scores)

        cost_reasons = []
        cost_risk_scores = []
        is_cost_outlier = []

        wt_devs = df["dev_work_type_median_pct"].to_numpy()
        st_devs = df["dev_state_median_pct"].to_numpy()
        amts = df["final_amount"].to_numpy()
        wtypes = df["work_type"].to_numpy()
        states = df["state"].to_numpy()

        for idx in range(len(df)):
            reasons = []
            wt_dev = float(wt_devs[idx])
            st_dev = float(st_devs[idx])
            amt = float(amts[idx])
            wtype = str(wtypes[idx])
            state = str(states[idx])
            
            # 1. Base ML Isolation Forest component (0 - 35 pts)
            if_contrib = float(norm_anomaly[idx]) * 35.0

            # 2. Work type peer group deviation contribution (0 - 45 pts)
            wt_contrib = 0.0
            if wt_dev > 150.0:
                wt_contrib = 45.0
                reasons.append(f"Severe price inflation: Cost is {wt_dev:+.1f}% above national peer median for '{wtype}' works")
            elif wt_dev > 75.0:
                wt_contrib = 30.0 + (wt_dev - 75.0) * 0.20
                reasons.append(f"Elevated expenditure: Cost is {wt_dev:+.1f}% above peer median for '{wtype}' works")
            elif wt_dev > 35.0:
                wt_contrib = (wt_dev - 35.0) * 0.35
                reasons.append(f"Moderate cost variance: +{wt_dev:.1f}% above peer median for '{wtype}'")

            # 3. State peer baseline deviation (0 - 20 pts)
            st_contrib = 0.0
            if st_dev > 100.0:
                st_contrib = min(20.0, (st_dev - 100.0) * 0.15 + 10.0)
                reasons.append(f"Cost is {st_dev:+.1f}% above overall state median expenditure in {state}")

            # 4. Scheme ceiling check (near ₹50L single-work limit)
            if amt >= 4500000.0:
                wt_contrib = min(45.0, wt_contrib + 10.0)
                reasons.append(f"Near-maximum ceiling allocation of ₹{amt:,.0f}")

            c_score = min(100.0, if_contrib + wt_contrib + st_contrib)
            cost_risk_scores.append(round(c_score, 1))

            is_extreme = wt_dev > 100.0 or c_score >= 55.0
            is_cost_outlier.append(bool(is_extreme))
            cost_reasons.append(reasons)

        return pd.Series(is_cost_outlier, index=df.index), pd.Series(cost_risk_scores, index=df.index), cost_reasons

    def detect_duplicate_works(self, df: pd.DataFrame) -> Tuple[pd.Series, pd.Series, List[List[str]], pd.Series]:
        """
        Calculates duplicate work NLP risk score (0-100) using TF-IDF + Cosine Similarity grouped by MP.
        """
        is_dup_list = [False] * len(df)
        dup_scores = [0.0] * len(df)
        dup_matches_dict = {i: [] for i in range(len(df))}
        matched_ids = [""] * len(df)

        grouped = df.groupby(["mp_name", "constituency"])

        for (mp_name, constituency), group in grouped:
            if len(group) < 2:
                continue

            indices = group.index.to_numpy()
            descriptions = group["work_description"].fillna("").astype(str).tolist()

            try:
                tfidf_mat = self.tfidf.fit_transform(descriptions)
                sim_matrix = cosine_similarity(tfidf_mat)
            except Exception:
                continue

            rows, cols = np.where(np.triu(sim_matrix, k=1) >= self.sim_threshold)

            for r, c in zip(rows, cols):
                idx_i = indices[r]
                idx_j = indices[c]
                sim = float(sim_matrix[r, c])
                pct_sim = round(sim * 100, 1)

                is_dup_list[idx_i] = True
                is_dup_list[idx_j] = True

                # Accurate continuous score scaling
                if sim >= 0.90:
                    score_val = 90.0 + (sim - 0.90) * 100.0
                elif sim >= 0.80:
                    score_val = 75.0 + (sim - 0.80) * 150.0
                else:
                    score_val = 50.0 + (sim - 0.70) * 250.0

                score_val = min(100.0, max(0.0, score_val))
                dup_scores[idx_i] = max(dup_scores[idx_i], score_val)
                dup_scores[idx_j] = max(dup_scores[idx_j], score_val)

                w_id_j = str(df.at[idx_j, "work_id"])
                w_id_i = str(df.at[idx_i, "work_id"])

                dup_matches_dict[idx_i].append((w_id_j, pct_sim))
                dup_matches_dict[idx_j].append((w_id_i, pct_sim))

        dup_reasons = []
        for idx in range(len(df)):
            matches = dup_matches_dict[idx]
            reasons = []
            if matches:
                total_dups = len(matches)
                first_match_id, first_pct = matches[0]
                if total_dups == 1:
                    reasons.append(f"{first_pct}% textual duplication match to work #{first_match_id} by same MP")
                    matched_ids[idx] = first_match_id
                else:
                    sample_ids = ", ".join([m[0] for m in matches[:3]])
                    reasons.append(f"{first_pct}% textual similarity to {total_dups} duplicate works by same MP (#{sample_ids}...)")
                    matched_ids[idx] = ", ".join([m[0] for m in matches[:5]])
            dup_reasons.append(reasons)

        return (
            pd.Series(is_dup_list, index=df.index),
            pd.Series(dup_scores, index=df.index),
            dup_reasons,
            pd.Series(matched_ids, index=df.index)
        )

    def analyze_agency_concentration(self, df: pd.DataFrame) -> Tuple[pd.Series, pd.Series, List[List[str]], pd.DataFrame]:
        """
        Calculates Implementing District Agency (IDA) monopoly risk score (0-100).
        """
        state_totals = df.groupby("state").agg(
            total_state_works=("work_id", "count"),
            total_state_amount=("final_amount", "sum")
        ).reset_index()

        ida_state = df.groupby(["state", "ida"]).agg(
            ida_works_count=("work_id", "count"),
            ida_amount_sum=("final_amount", "sum")
        ).reset_index()

        ida_metrics = ida_state.merge(state_totals, on="state", how="left")
        ida_metrics["ida_works_share_pct"] = (ida_metrics["ida_works_count"] / ida_metrics["total_state_works"]) * 100.0
        ida_metrics["ida_amount_share_pct"] = (ida_metrics["ida_amount_sum"] / ida_metrics["total_state_amount"]) * 100.0

        df_ida = df.merge(
            ida_metrics[["state", "ida", "ida_works_share_pct", "ida_amount_share_pct"]],
            on=["state", "ida"],
            how="left"
        )

        is_high_conc = []
        ida_scores = []
        ida_reasons = []

        w_shares = df_ida["ida_works_share_pct"].fillna(0.0).to_numpy()
        a_shares = df_ida["ida_amount_share_pct"].fillna(0.0).to_numpy()
        state_names = df_ida["state"].astype(str).to_numpy()

        for idx in range(len(df_ida)):
            w_share = float(w_shares[idx])
            a_share = float(a_shares[idx])
            state_name = str(state_names[idx])

            reasons = []
            score = 0.0
            flag = False

            max_share = max(w_share, a_share)

            if max_share >= 50.0:
                flag = True
                score = min(100.0, 75.0 + (max_share - 50.0) * 0.80)
                reasons.append(
                    f"Acute agency monopoly: IDA controls {w_share:.1f}% of works ({a_share:.1f}% of funds) in {state_name}"
                )
            elif max_share >= 35.0:
                flag = True
                score = 50.0 + (max_share - 35.0) * 1.5
                reasons.append(
                    f"Monopoly concentration risk: IDA controls {w_share:.1f}% of works ({a_share:.1f}% of funds) in {state_name}"
                )
            elif max_share >= 25.0:
                score = 25.0 + (max_share - 25.0) * 1.5
                reasons.append(
                    f"Elevated single-agency concentration: {w_share:.1f}% of state works"
                )

            is_high_conc.append(flag)
            ida_scores.append(round(score, 1))
            ida_reasons.append(reasons)

        return (
            pd.Series(is_high_conc, index=df.index),
            pd.Series(ida_scores, index=df.index),
            ida_reasons,
            ida_metrics
        )

    def compute_compliance_risk(self, df: pd.DataFrame) -> Tuple[pd.Series, pd.Series, List[List[str]]]:
        """
        Calculates documentation & photo proof compliance risk score (0-100).
        """
        is_non_compliant = ~df["has_images"].astype(bool)
        comp_scores = []
        comp_reasons = []

        has_imgs = df["has_images"].to_numpy()
        amts = df["final_amount"].to_numpy()

        for idx in range(len(df)):
            reasons = []
            score = 0.0
            if not bool(has_imgs[idx]):
                amt = float(amts[idx])
                if amt >= 2500000:
                    score = 80.0
                    reasons.append(f"High-value project (₹{amt:,.0f}) lacking mandatory geo-tagged inspection photos")
                elif amt >= 1000000:
                    score = 60.0
                    reasons.append(f"Mid-value work (₹{amt:,.0f}) missing visual physical completion proof")
                else:
                    score = 35.0
                    reasons.append("Missing mandatory geo-tagged completion photos (documentation gap)")
            comp_scores.append(score)
            comp_reasons.append(reasons)

        return is_non_compliant, pd.Series(comp_scores, index=df.index), comp_reasons

    def evaluate_all_risks(self, df: Optional[pd.DataFrame] = None, output_path: Optional[str] = DEFAULT_OUTPUT_PATH) -> pd.DataFrame:
        """
        Calibrated multi-factor risk inference pipeline with dominant driver escalation and compound fraud multipliers.
        """
        if df is None:
            df_raw = load_clean_data()
        else:
            df_raw = df.copy()

        df_enriched = get_enriched_peer_features(df_raw)

        is_cost_out, cost_scores, cost_reasons = self.detect_cost_outliers(df_enriched)
        is_dup, dup_scores, dup_reasons, matched_ids = self.detect_duplicate_works(df_enriched)
        is_high_ida, ida_scores, ida_reasons, _ = self.analyze_agency_concentration(df_enriched)
        is_non_comp, comp_scores, comp_reasons = self.compute_compliance_risk(df_enriched)

        final_risk_scores = []
        risk_categories = []
        combined_reasons_json = []

        c_arr = cost_scores.to_numpy()
        d_arr = dup_scores.to_numpy()
        m_arr = comp_scores.to_numpy()
        i_arr = ida_scores.to_numpy()

        for idx in range(len(df_enriched)):
            c_score = float(c_arr[idx])
            d_score = float(d_arr[idx])
            m_score = float(m_arr[idx])
            i_score = float(i_arr[idx])

            # 1. Base Weighted Score (Cost: 35%, Duplicate: 35%, Compliance: 15%, Monopoly: 15%)
            weighted_score = (
                (c_score * 0.35) +
                (d_score * 0.35) +
                (m_score * 0.15) +
                (i_score * 0.15)
            )

            # 2. Dominant Driver Escalation: severe single violation prevents score dilution
            max_driver = max(c_score, d_score)
            if max_driver >= 80.0:
                weighted_score = max(weighted_score, max_driver * 0.88)
            elif max_driver >= 65.0:
                weighted_score = max(weighted_score, max_driver * 0.75)

            # 3. Compound Anomaly Surge: when multiple red flags coincide
            active_flags = sum([
                1 if c_score >= 45.0 else 0,
                1 if d_score >= 45.0 else 0,
                1 if m_score >= 45.0 else 0,
                1 if i_score >= 45.0 else 0
            ])
            if active_flags >= 3:
                weighted_score = min(100.0, weighted_score * 1.30 + 10.0)
            elif active_flags >= 2:
                weighted_score = min(100.0, weighted_score * 1.18 + 5.0)

            final_score = round(min(100.0, max(0.0, weighted_score)), 1)
            final_risk_scores.append(final_score)

            # 4. Strict Risk Classification
            if final_score >= 70.0:
                risk_categories.append("HIGH")
            elif final_score >= 40.0:
                risk_categories.append("MEDIUM")
            else:
                risk_categories.append("LOW")

            # 5. Compile Plain-English Reasons
            all_reasons = []
            all_reasons.extend(cost_reasons[idx])
            all_reasons.extend(dup_reasons[idx])
            all_reasons.extend(comp_reasons[idx])
            all_reasons.extend(ida_reasons[idx])

            if not all_reasons:
                all_reasons.append("All project parameters within normal peer-group bounds")

            combined_reasons_json.append(json.dumps(all_reasons))

        df_output = df_enriched.copy()
        df_output["risk_score"] = final_risk_scores
        df_output["risk_category"] = risk_categories
        df_output["cost_risk_score"] = cost_scores
        df_output["duplicate_risk_score"] = dup_scores
        df_output["compliance_risk_score"] = comp_scores
        df_output["ida_risk_score"] = ida_scores
        df_output["is_cost_outlier"] = is_cost_out
        df_output["is_duplicate"] = is_dup
        df_output["is_non_compliant"] = is_non_comp
        df_output["is_high_ida_concentration"] = is_high_ida
        df_output["matched_work_ids"] = matched_ids
        df_output["risk_reasons"] = combined_reasons_json

        df_output = df_output.sort_values(by="risk_score", ascending=False).reset_index(drop=True)

        if output_path:
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            df_output.to_csv(output_path, index=False)
            print(f"Calibrated risk scoring complete. {len(df_output)} works scored and saved to {output_path}")

        return df_output

def get_risk_scored_data(force_recompute: bool = False) -> pd.DataFrame:
    if os.path.exists(DEFAULT_OUTPUT_PATH) and not force_recompute:
        df = pd.read_csv(DEFAULT_OUTPUT_PATH, low_memory=False)
        return df

    engine = MPLADSRiskEngine()
    return engine.evaluate_all_risks()

if __name__ == "__main__":
    engine = MPLADSRiskEngine()
    df_res = engine.evaluate_all_risks()
    print("Risk score summary:")
    print(df_res["risk_category"].value_counts())
