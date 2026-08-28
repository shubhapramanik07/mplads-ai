"""
Processes and cleans real MPLADS dataset from Downloads into data/processed/completed_clean.csv
and derives work_type classification.
"""
import os
import re
import pandas as pd
import numpy as np

def derive_work_type(desc: str, cat: str = "") -> str:
    """Classifies a work description into one of 10 standard MPLADS categories."""
    d = str(desc).lower()
    c = str(cat).lower()

    if any(k in d for k in ["road", "cc road", "bt road", "paver", "interlocking", "pathway", "culvert", "bridge", "tar road"]):
        return "road"
    elif any(k in d for k in ["drainage", "drain", "nallah", "sewer", "soak pit", "gutter", "waterlogging"]):
        return "drainage"
    elif any(k in d for k in ["drinking water", "water supply", "borewell", "pump", "ro plant", "pipeline", "water tank", "jal", "cooler", "motor"]):
        return "water_supply"
    elif any(k in d for k in ["light", "street light", "solar light", "high mast", "led", "electrification", "transformer", "pole"]):
        return "street_light"
    elif any(k in d for k in ["school", "college", "classroom", "education", "smart class", "library", "student", "lab", "building wall"]):
        return "education"
    elif any(k in d for k in ["community hall", "hall", "bhawan", "barat ghar", "auditorium", "shed", "kalyana mandapam", "samudayik"]):
        return "community_hall"
    elif any(k in d for k in ["toilet", "sanitation", "latrine", "urinal", "public convenience", "shauchalay", "swachh"]):
        return "sanitation"
    elif any(k in d for k in ["hospital", "ambulance", "phc", "chc", "health", "dispensary", "medical", "clinic", "oxygen", "ayushman"]):
        return "healthcare"
    elif any(k in d for k in ["sports", "gym", "stadium", "ground", "turf", "court", "playground", "fitness", "track", "youth"]):
        return "sports"
    else:
        return "other"

def process_user_csv(input_csv: str = r"C:\Users\shubh\Downloads\mplads_completed_works_2026-08-25.csv", output_path: str = "data/processed/completed_clean.csv"):
    if not os.path.exists(input_csv):
        print(f"File not found at {input_csv}")
        return

    print(f"Loading raw dataset from {input_csv}...")
    df_raw = pd.read_csv(input_csv, low_memory=False)
    print(f"Loaded {len(df_raw)} raw rows.")

    # Column mapping
    col_map = {
        "Work ID": "work_id",
        "Work Description": "work_description",
        "Category": "category",
        "MP Name": "mp_name",
        "Constituency": "constituency",
        "State": "state",
        "House": "house",
        "Final Amount (₹)": "final_amount",
        "Completed Date": "completed_date",
        "Has Images": "has_images",
        "Average Rating": "average_rating",
        "IDA": "ida"
    }

    df = df_raw.rename(columns=col_map).copy()
    
    # Filter rows with missing critical fields
    df = df.dropna(subset=["work_id", "work_description", "mp_name", "final_amount"]).copy()

    # Clean datatypes
    df["work_id"] = df["work_id"].astype(str).str.strip()
    df["work_description"] = df["work_description"].astype(str).str.strip()
    df["category"] = df["category"].fillna("General").astype(str).str.strip()
    df["mp_name"] = df["mp_name"].fillna("Unknown MP").astype(str).str.strip().str.title()
    df["constituency"] = df["constituency"].fillna("General").astype(str).str.strip().str.title()
    df["state"] = df["state"].fillna("National").astype(str).str.strip().str.title()
    df["house"] = df["house"].fillna("Lok Sabha").astype(str).str.strip()
    
    # Clean amount
    df["final_amount"] = pd.to_numeric(
        df["final_amount"].astype(str).str.replace(",", "").str.replace("₹", "").str.strip(),
        errors="coerce"
    ).fillna(0.0)
    
    # Filter valid positive amounts
    df = df[df["final_amount"] > 0].copy()

    # Clean dates
    df["completed_date"] = pd.to_datetime(df["completed_date"], errors="coerce").dt.strftime("%Y-%m-%d")
    df["completed_date"] = df["completed_date"].fillna("2023-01-01")

    # Clean boolean & numeric
    df["has_images"] = df["has_images"].astype(str).str.lower().isin(["true", "1", "yes"])
    df["average_rating"] = pd.to_numeric(df["average_rating"], errors="coerce").fillna(4.0)
    df["ida"] = df["ida"].fillna("District Rural Development Agency").astype(str).str.strip()

    # Derive work_type
    print("Deriving standard work_type categories...")
    df["work_type"] = [
        derive_work_type(row["work_description"], row["category"])
        for _, row in df.iterrows()
    ]

    print(f"Work Type breakdown:\n{df['work_type'].value_counts()}")

    # Save cleaned CSV
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    df.to_csv(output_path, index=False)
    print(f"Successfully processed {len(df)} records saved to {output_path}")

if __name__ == "__main__":
    process_user_csv()
