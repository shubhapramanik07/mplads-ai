"""
Validation module for MPLADS AI Risk Detection Engine.
Synthetically injects known planted anomalies (cost inflation, duplicate works,
missing visual compliance, IDA monopolies) and evaluates detection performance.
"""
import os
import json
import pandas as pd
import numpy as np
from datetime import datetime

from backend.data_loader import load_clean_data
from backend.risk_engine import MPLADSRiskEngine

REPORT_OUTPUT_PATH = os.path.join(
    os.path.dirname(os.path.dirname(__file__)), "data", "processed", "model_validation_report.json"
)

def run_synthetic_validation(num_base_sample: int = 200) -> dict:
    """
    Takes a sample of baseline data, injects 11 known anomalies with diverse fraud types,
    evaluates model precision, recall, ranking, and generates a validation report.
    """
    df_clean = load_clean_data()
    sample_base = df_clean.sample(n=min(num_base_sample, len(df_clean)), random_state=101).copy()
    sample_base = sample_base.reset_index(drop=True)

    planted_records = []
    planted_metadata = []

    # 1. Planted Extreme Cost Outlier #1 (Street light at ₹48.5 Lakhs)
    p1_id = "PLANTED-COST-01"
    planted_records.append({
        "work_id": p1_id,
        "work_description": "Installation of 10 units of 30W LED solar street lights in Sector 4",
        "category": "Rural Electrification & Power",
        "mp_name": "Shri Rajnath Singh",
        "constituency": "Lucknow",
        "state": "Uttar Pradesh",
        "house": "Lok Sabha",
        "final_amount": 4850000.0,
        "completed_date": "2023-08-15",
        "has_images": True,
        "average_rating": 4.1,
        "ida": "UP Projects Corporation Ltd (UPPCL)",
        "work_type": "street_light"
    })
    planted_metadata.append({
        "work_id": p1_id,
        "planted_type": "Extreme Cost Outlier",
        "description": "₹48.5L billed for 10 LED street lights (8x peer median)",
        "expected_detection": "Cost Outlier / High Risk"
    })

    # 2. Planted Extreme Cost Outlier #2 (Water cooler at ₹42 Lakhs)
    p2_id = "PLANTED-COST-02"
    planted_records.append({
        "work_id": p2_id,
        "work_description": "Installation of 2 public drinking water booths with cooler at Gandhi Chowk",
        "category": "Drinking Water Facility",
        "mp_name": "Shri Nitin Gadkari",
        "constituency": "Nagpur",
        "state": "Maharashtra",
        "house": "Lok Sabha",
        "final_amount": 4200000.0,
        "completed_date": "2023-06-20",
        "has_images": True,
        "average_rating": 4.5,
        "ida": "Public Works Department (PWD) Pune",
        "work_type": "water_supply"
    })
    planted_metadata.append({
        "work_id": p2_id,
        "planted_type": "Extreme Cost Outlier",
        "description": "₹42L billed for 2 water booths (5x peer median)",
        "expected_detection": "Cost Outlier / High Risk"
    })

    # 3 & 4. Planted Duplicate Pair (Exact duplicate CC road work by same MP)
    p3_id = "PLANTED-DUP-01A"
    p4_id = "PLANTED-DUP-01B"
    planted_records.append({
        "work_id": p3_id,
        "work_description": "Construction of CC road from Subhash Ward to Shiv Mandir Complex in Varanasi",
        "category": "Roads, Pathways and Bridges",
        "mp_name": "Shri Narendra Modi",
        "constituency": "Varanasi",
        "state": "Uttar Pradesh",
        "house": "Lok Sabha",
        "final_amount": 1850000.0,
        "completed_date": "2023-01-10",
        "has_images": True,
        "average_rating": 4.8,
        "ida": "DRDA Varanasi",
        "work_type": "road"
    })
    planted_records.append({
        "work_id": p4_id,
        "work_description": "Construction of CC road from Subhash Ward to Shiv Mandir Complex in Varanasi",
        "category": "Roads, Pathways and Bridges",
        "mp_name": "Shri Narendra Modi",
        "constituency": "Varanasi",
        "state": "Uttar Pradesh",
        "house": "Lok Sabha",
        "final_amount": 1900000.0,
        "completed_date": "2023-04-18",
        "has_images": True,
        "average_rating": 4.7,
        "ida": "DRDA Varanasi",
        "work_type": "road"
    })
    planted_metadata.append({
        "work_id": p3_id,
        "planted_type": "Duplicate Work (Pair A)",
        "description": "Identical CC Road description & location billed twice within 3 months",
        "expected_detection": "Near-Duplicate Work / High Risk"
    })
    planted_metadata.append({
        "work_id": p4_id,
        "planted_type": "Duplicate Work (Pair B)",
        "description": "Identical CC Road description & location billed twice within 3 months",
        "expected_detection": "Near-Duplicate Work / High Risk"
    })

    # 5 & 6. Planted Near-Duplicate Pair (Solar High Mast light re-billed)
    p5_id = "PLANTED-DUP-02A"
    p6_id = "PLANTED-DUP-02B"
    planted_records.append({
        "work_id": p5_id,
        "work_description": "High mast solar lighting tower installation at Krishi Mandi junction in Bengaluru South",
        "category": "Rural Electrification & Power",
        "mp_name": "Shri Tejasvi Surya",
        "constituency": "Bengaluru South",
        "state": "Karnataka",
        "house": "Lok Sabha",
        "final_amount": 950000.0,
        "completed_date": "2022-11-05",
        "has_images": True,
        "average_rating": 4.3,
        "ida": "Karnataka PWD Division Bengaluru",
        "work_type": "street_light"
    })
    planted_records.append({
        "work_id": p6_id,
        "work_description": "Supply and high mast solar lighting tower installation at Krishi Mandi junction in Bengaluru South",
        "category": "Rural Electrification & Power",
        "mp_name": "Shri Tejasvi Surya",
        "constituency": "Bengaluru South",
        "state": "Karnataka",
        "house": "Lok Sabha",
        "final_amount": 980000.0,
        "completed_date": "2023-02-14",
        "has_images": True,
        "average_rating": 4.2,
        "ida": "Karnataka PWD Division Bengaluru",
        "work_type": "street_light"
    })
    planted_metadata.append({
        "work_id": p5_id,
        "planted_type": "Near-Duplicate Work",
        "description": "95%+ identical solar tower work description in same constituency",
        "expected_detection": "Near-Duplicate Work / High Risk"
    })
    planted_metadata.append({
        "work_id": p6_id,
        "planted_type": "Near-Duplicate Work",
        "description": "95%+ identical solar tower work description in same constituency",
        "expected_detection": "Near-Duplicate Work / High Risk"
    })

    # 7. Planted High-Value Ghost Project / Missing Images (₹49 Lakhs Community Hall)
    p7_id = "PLANTED-DOC-01"
    planted_records.append({
        "work_id": p7_id,
        "work_description": "Construction of multi-purpose community recreation hall at Model Town",
        "category": "Community Infrastructure",
        "mp_name": "Shri Ravi Shankar Prasad",
        "constituency": "Patna Sahib",
        "state": "Bihar",
        "house": "Lok Sabha",
        "final_amount": 4900000.0,
        "completed_date": "2023-09-01",
        "has_images": False,
        "average_rating": 3.1,
        "ida": "Road Construction Department (RCD) Patna",
        "work_type": "community_hall"
    })
    planted_metadata.append({
        "work_id": p7_id,
        "planted_type": "High-Value Missing Documentation",
        "description": "Maximum ceiling community hall ₹49L with zero geo-tagged proof",
        "expected_detection": "Compliance & Cost Anomaly / High Risk"
    })

    # 8. Planted Multi-Factor Severe Fraud
    p8_id = "PLANTED-MULTI-01"
    planted_records.append({
        "work_id": p8_id,
        "work_description": "Construction of modern sanitation block with running water at Civil Lines bus terminal",
        "category": "Public Health & Sanitation",
        "mp_name": "Shri Om Birla",
        "constituency": "Kota",
        "state": "Rajasthan",
        "house": "Lok Sabha",
        "final_amount": 4500000.0,
        "completed_date": "2023-07-22",
        "has_images": False,
        "average_rating": 3.0,
        "ida": "PWD Circle Jaipur",
        "work_type": "sanitation"
    })
    p8_id_b = "PLANTED-MULTI-01B"
    planted_records.append({
        "work_id": p8_id_b,
        "work_description": "Construction of modern sanitation block with running water at Civil Lines bus terminal",
        "category": "Public Health & Sanitation",
        "mp_name": "Shri Om Birla",
        "constituency": "Kota",
        "state": "Rajasthan",
        "house": "Lok Sabha",
        "final_amount": 4400000.0,
        "completed_date": "2023-10-10",
        "has_images": False,
        "average_rating": 3.1,
        "ida": "PWD Circle Jaipur",
        "work_type": "sanitation"
    })
    planted_metadata.append({
        "work_id": p8_id,
        "planted_type": "Multi-Factor Severe Fraud",
        "description": "Cost 350% above peer median + Duplicate Work + Zero Images + Monopolized IDA",
        "expected_detection": "Critical Multi-Factor Anomaly (Score 90-100)"
    })
    planted_metadata.append({
        "work_id": p8_id_b,
        "planted_type": "Multi-Factor Severe Fraud",
        "description": "Cost 350% above peer median + Duplicate Work + Zero Images + Monopolized IDA",
        "expected_detection": "Critical Multi-Factor Anomaly (Score 90-100)"
    })

    # 9. Planted Extreme Cost Outlier #3 (Drainage at ₹46.5 Lakhs)
    p9_id = "PLANTED-COST-03"
    planted_records.append({
        "work_id": p9_id,
        "work_description": "Construction of covered RCC stormwater drainage line along Kalyanpur road",
        "category": "Public Health & Sanitation",
        "mp_name": "Shri Shankar Lalwani",
        "constituency": "Indore",
        "state": "Madhya Pradesh",
        "house": "Lok Sabha",
        "final_amount": 4650000.0,
        "completed_date": "2023-05-12",
        "has_images": True,
        "average_rating": 3.8,
        "ida": "MP PWD Division Bhopal",
        "work_type": "drainage"
    })
    planted_metadata.append({
        "work_id": p9_id,
        "planted_type": "Extreme Cost Outlier",
        "description": "Drainage work cost inflated to ₹46.5L (3.5x normal)",
        "expected_detection": "Cost Outlier / High Risk"
    })

    # 10. Planted High Value Missing Compliance (Ambulance ₹47 Lakhs)
    p10_id = "PLANTED-DOC-02"
    planted_records.append({
        "work_id": p10_id,
        "work_description": "Procurement of advanced Life Support Ambulance for District Hospital Civil Lines",
        "category": "Public Health & Healthcare",
        "mp_name": "Shri Amit Shah",
        "constituency": "Gandhinagar",
        "state": "Gujarat",
        "house": "Lok Sabha",
        "final_amount": 4700000.0,
        "completed_date": "2023-03-30",
        "has_images": False,
        "average_rating": 3.4,
        "ida": "Roads & Buildings (R&B) Department Gandhinagar",
        "work_type": "healthcare"
    })
    planted_metadata.append({
        "work_id": p10_id,
        "planted_type": "High-Value Missing Documentation",
        "description": "Hospital ambulance procurement of ₹47L with no asset verification",
        "expected_detection": "Compliance & Cost Anomaly / High Risk"
    })

    df_planted = pd.DataFrame(planted_records)
    df_eval = pd.concat([sample_base, df_planted], ignore_index=True)

    # Pass output_path=None to avoid overwriting main database CSV
    engine = MPLADSRiskEngine()
    df_enriched = engine.evaluate_all_risks(df_eval, output_path=None)
    df_scored = df_enriched.sort_values(by="risk_score", ascending=False).reset_index(drop=True)

    planted_ids = [p["work_id"] for p in planted_metadata]
    total_planted = len(planted_ids)

    df_scored["rank"] = df_scored.index + 1

    evaluation_details = []
    caught_in_top_15 = 0
    caught_in_top_25 = 0
    caught_in_high_risk = 0

    for meta in planted_metadata:
        w_id = meta["work_id"]
        row = df_scored[df_scored["work_id"] == w_id]
        if not row.empty:
            r = row.iloc[0]
            rank = int(r["rank"])
            score = float(r["risk_score"])
            cat = str(r["risk_category"])
            reasons = json.loads(r["risk_reasons"]) if isinstance(r["risk_reasons"], str) else r["risk_reasons"]

            if rank <= 15:
                caught_in_top_15 += 1
            if rank <= 25:
                caught_in_top_25 += 1
            if cat == "HIGH" or score >= 70.0:
                caught_in_high_risk += 1

            evaluation_details.append({
                "work_id": w_id,
                "planted_type": meta["planted_type"],
                "description": meta["description"],
                "expected": meta["expected_detection"],
                "predicted_score": score,
                "predicted_category": cat,
                "rank": rank,
                "reasons": reasons,
                "is_detected_high_risk": bool(cat == "HIGH" or score >= 70.0)
            })

    precision_at_15 = round((caught_in_top_15 / 15) * 100.0, 1)
    recall_at_25 = round((caught_in_top_25 / total_planted) * 100.0, 1)
    overall_detection_rate = round((caught_in_high_risk / total_planted) * 100.0, 1)

    validation_report = {
        "timestamp": datetime.now().isoformat(),
        "total_test_samples": len(df_eval),
        "total_planted_anomalies": total_planted,
        "caught_in_top_15": caught_in_top_15,
        "caught_in_top_25": caught_in_top_25,
        "caught_in_high_risk_category": caught_in_high_risk,
        "precision_at_top_15_pct": precision_at_15,
        "recall_at_top_25_pct": recall_at_25,
        "overall_detection_rate_pct": overall_detection_rate,
        "planted_anomaly_details": evaluation_details,
        "summary": (
            f"The MPLADS Risk Engine successfully detected {caught_in_high_risk}/{total_planted} "
            f"({overall_detection_rate}%) planted anomalies as HIGH RISK, with a Precision@15 of {precision_at_15}% "
            f"and Recall@25 of {recall_at_25}%."
        )
    }

    os.makedirs(os.path.dirname(REPORT_OUTPUT_PATH), exist_ok=True)
    with open(REPORT_OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(validation_report, f, indent=2)

    print(f"Validation complete! Report saved to {REPORT_OUTPUT_PATH}")
    print(f"Detection Rate: {overall_detection_rate}% | Precision@15: {precision_at_15}% | Recall@25: {recall_at_25}%")
    return validation_report

def get_validation_report() -> dict:
    if os.path.exists(REPORT_OUTPUT_PATH):
        try:
            with open(REPORT_OUTPUT_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return run_synthetic_validation()

if __name__ == "__main__":
    run_synthetic_validation()
