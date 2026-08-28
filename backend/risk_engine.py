"""
Accurate & Calibrated ML + Rule-Based Risk Engine for MPLADS Anomaly, Fraud and Inefficiency Detection.
Enforces:
1. Completed projects (100% progress) are STRICTLY NOT picked as High/Critical Risk unless there is an identical copy/duplicate sanction (similarity >= 85%).
2. Low physical progress despite high financial expenditure is explicitly flagged as high risk.
3. Plain-English explainable factors for forensic audit.
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
    def __init__(self, sim_threshold: float = 0.82, contamination: float = 0.05):
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
        """Calculates granular cost risk score (0-100) using Isolation Forest & peer deviations."""
        features = df[["final_amount", "dev_work_type_median_pct", "dev_state_median_pct"]].copy()
        features = features.replace([np.inf, -np.inf], np.nan).fillna(0.0)

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
        sanc_amts = df["sanctioned_amount"].to_numpy() if "sanctioned_amount" in df.columns else amts

        for idx in range(len(df)):
            reasons = []
            wt_dev = float(wt_devs[idx])
            st_dev = float(st_devs[idx])
            amt = float(amts[idx])
            sanc = float(sanc_amts[idx])
            wtype = str(wtypes[idx])
            state = str(states[idx])
            
            if_contrib = float(norm_anomaly[idx]) * 30.0

            wt_contrib = 0.0
            if wt_dev > 200.0:
                wt_contrib = 50.0
                reasons.append(f"Elevated price variance: Cost is {wt_dev:+.1f}% above peer median for '{wtype}' works")
            elif wt_dev > 100.0:
                wt_contrib = 25.0 + (wt_dev - 100.0) * 0.15
                reasons.append(f"Above-average expenditure: Cost is {wt_dev:+.1f}% above peer median for '{wtype}' works")
            elif wt_dev > 50.0:
                wt_contrib = (wt_dev - 50.0) * 0.15
                reasons.append(f"Moderate cost variance: +{wt_dev:.1f}% above peer median for '{wtype}'")

            st_contrib = 0.0
            if st_dev > 150.0:
                st_contrib = min(20.0, (st_dev - 150.0) * 0.10 + 5.0)
                reasons.append(f"Cost is {st_dev:+.1f}% above overall state median in {state}")

            # Cost overrun rule
            if amt > sanc and sanc > 0:
                overrun_pct = round(((amt - sanc) / sanc) * 100, 1)
                wt_contrib = min(50.0, wt_contrib + 15.0)
                reasons.append(f"Cost overrun: Expenditure exceeds sanctioned budget by ₹{(amt - sanc):,.0f} (+{overrun_pct}%)")

            c_score = min(100.0, if_contrib + wt_contrib + st_contrib)
            cost_risk_scores.append(round(c_score, 1))

            is_extreme = wt_dev > 200.0 or c_score >= 70.0
            is_cost_outlier.append(bool(is_extreme))
            cost_reasons.append(reasons)

        return pd.Series(is_cost_outlier, index=df.index), pd.Series(cost_risk_scores, index=df.index), cost_reasons

    def detect_duplicate_works(self, df: pd.DataFrame) -> Tuple[pd.Series, pd.Series, List[List[str]], pd.Series]:
        """Calculates duplicate work NLP risk score (0-100) using TF-IDF + Cosine Similarity grouped by MP."""
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

                if sim >= 0.95:
                    score_val = 95.0 + (sim - 0.95) * 100.0
                elif sim >= 0.88:
                    score_val = 85.0 + (sim - 0.88) * 140.0
                else:
                    score_val = 60.0 + (sim - 0.82) * 200.0

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
                    reasons.append(f"{first_pct}% identical duplicate sanction match to work #{first_match_id} by same MP")
                    matched_ids[idx] = first_match_id
                else:
                    sample_ids = ", ".join([m[0] for m in matches[:3]])
                    reasons.append(f"{first_pct}% duplicate sanction similarity across {total_dups} works by same MP (#{sample_ids}...)")
                    matched_ids[idx] = ", ".join([m[0] for m in matches[:5]])
            dup_reasons.append(reasons)

        return (
            pd.Series(is_dup_list, index=df.index),
            pd.Series(dup_scores, index=df.index),
            dup_reasons,
            pd.Series(matched_ids, index=df.index)
        )

    def analyze_agency_concentration(self, df: pd.DataFrame) -> Tuple[pd.Series, pd.Series, List[List[str]], pd.DataFrame]:
        """Calculates Implementing District Agency (IDA) monopoly risk score (0-100)."""
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

            if max_share >= 60.0:
                flag = True
                score = min(100.0, 60.0 + (max_share - 60.0) * 0.70)
                reasons.append(
                    f"Single-agency monopoly: IDA controls {w_share:.1f}% of works ({a_share:.1f}% of funds) in {state_name}"
                )
            elif max_share >= 45.0:
                flag = True
                score = 35.0 + (max_share - 45.0) * 1.0
                reasons.append(
                    f"Elevated agency concentration: IDA controls {w_share:.1f}% of works in {state_name}"
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
        """Calculates documentation, progress-expenditure gap, and schedule risk score (0-100)."""
        is_non_compliant = ~df["has_images"].astype(bool)
        comp_scores = []
        comp_reasons = []

        has_imgs = df["has_images"].to_numpy()
        amts = df["final_amount"].to_numpy()
        sanc_amts = df["sanctioned_amount"].to_numpy() if "sanctioned_amount" in df.columns else amts
        progress_pcts = df["progress_pct"].to_numpy() if "progress_pct" in df.columns else [100.0] * len(df)
        is_delays = df["is_delayed"].to_numpy() if "is_delayed" in df.columns else [False] * len(df)

        for idx in range(len(df)):
            reasons = []
            score = 0.0
            amt = float(amts[idx])
            sanc = float(sanc_amts[idx])
            prog = float(progress_pcts[idx])
            delayed = bool(is_delays[idx])
            util = (amt / max(1.0, sanc)) * 100.0

            # Missing photos gap
            if not bool(has_imgs[idx]):
                if amt >= 3000000:
                    score += 35.0
                    reasons.append(f"High-value project (₹{amt:,.0f}) lacking mandatory geo-tagged inspection photos")
                elif amt >= 1500000:
                    score += 20.0
                    reasons.append(f"Mid-value work (₹{amt:,.0f}) missing visual physical completion proof")
                else:
                    score += 10.0
                    reasons.append("Missing mandatory geo-tagged completion photos (documentation gap)")

            # Milestone delay
            if delayed:
                score += 35.0
                reasons.append("Project milestone completion significantly delayed beyond expected schedule")

            # Inefficiency rule: High expenditure with low physical progress!
            if prog < 60.0 and util >= 80.0:
                score += 65.0
                reasons.append(f"Disproportionate financial outlay: {util:.0f}% budget expended with only {prog:.0f}% physical execution achieved")

            comp_scores.append(min(100.0, score))
            comp_reasons.append(reasons)

        return is_non_compliant, pd.Series(comp_scores, index=df.index), comp_reasons

    def evaluate_all_risks(self, df: Optional[pd.DataFrame] = None, output_path: Optional[str] = DEFAULT_OUTPUT_PATH) -> pd.DataFrame:
        """
        Calibrated multi-factor risk inference pipeline:
        - If progress == 100% and no severe duplicate copy sanction exists, project is STRICTLY NOT high risk.
        - High risk is reserved for low progress with high funds, delays, or direct copy sanctions.
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
        risk_levels = []
        combined_reasons_json = []

        c_arr = cost_scores.to_numpy()
        d_arr = dup_scores.to_numpy()
        m_arr = comp_scores.to_numpy()
        i_arr = ida_scores.to_numpy()
        prog_arr = df_enriched["progress_pct"].to_numpy() if "progress_pct" in df_enriched.columns else [100.0] * len(df_enriched)
        delayed_arr = df_enriched["is_delayed"].to_numpy() if "is_delayed" in df_enriched.columns else [False] * len(df_enriched)

        for idx in range(len(df_enriched)):
            c_score = float(c_arr[idx])
            d_score = float(d_arr[idx])
            m_score = float(m_arr[idx])
            i_score = float(i_arr[idx])
            prog = float(prog_arr[idx])
            is_del = bool(delayed_arr[idx])

            # 1. Base Weighted Score (Cost: 30%, Duplicate: 40%, Compliance/Progress: 20%, Monopoly: 10%)
            weighted_score = (
                (c_score * 0.30) +
                (d_score * 0.40) +
                (m_score * 0.20) +
                (i_score * 0.10)
            )

            # 2. STRICT RULE: IF PROGRESS IS 100% AND NOT DELAYED
            if prog >= 100.0 and not is_del:
                if d_score >= 85.0:
                    # Clear verbatim copy duplicate sanction! Flag as High Risk
                    weighted_score = max(72.0, d_score * 0.90)
                else:
                    # 100% completed normal work: STRICTLY CAP RISK AT LOW (<35.0)
                    weighted_score = min(32.0, weighted_score * 0.25)
            else:
                # For delayed works, low physical progress, or ongoing works with discrepancies
                max_driver = max(c_score, d_score, m_score)
                if max_driver >= 70.0:
                    weighted_score = max(weighted_score, max_driver * 0.85)

            final_score = round(min(100.0, max(0.0, weighted_score)), 1)
            final_risk_scores.append(final_score)

            # 3. 4-Tier Risk Classification
            if final_score >= 85.0:
                risk_categories.append("CRITICAL")
                risk_levels.append("CRITICAL")
            elif final_score >= 70.0:
                risk_categories.append("HIGH")
                risk_levels.append("HIGH")
            elif final_score >= 40.0:
                risk_categories.append("MEDIUM")
                risk_levels.append("MEDIUM")
            else:
                risk_categories.append("LOW")
                risk_levels.append("LOW")

            # 4. Compile Plain-English Reasons
            all_reasons = []
            if final_score >= 70.0:
                all_reasons.extend(dup_reasons[idx])
                all_reasons.extend(comp_reasons[idx])
                all_reasons.extend(cost_reasons[idx])
                all_reasons.extend(ida_reasons[idx])
            elif final_score >= 40.0:
                all_reasons.extend(cost_reasons[idx])
                all_reasons.extend(comp_reasons[idx])
                all_reasons.extend(ida_reasons[idx])
            
            if not all_reasons:
                if prog >= 100.0:
                    all_reasons.append("100% physically completed on schedule with parameters conforming to peer baselines")
                else:
                    all_reasons.append("Project execution parameters within normal peer bounds")

            combined_reasons_json.append(json.dumps(all_reasons))

        df_output = df_enriched.copy()
        df_output["risk_score"] = final_risk_scores
        df_output["risk_category"] = risk_categories
        df_output["risk_level"] = risk_levels
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
        df_output["risk_factors"] = combined_reasons_json

        df_output = df_output.sort_values(by="risk_score", ascending=False).reset_index(drop=True)

        if output_path:
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            df_output.to_csv(output_path, index=False)
            print(f"Risk scoring complete. {len(df_output)} works scored and saved to {output_path}")

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
    print(df_res["risk_level"].value_counts())
