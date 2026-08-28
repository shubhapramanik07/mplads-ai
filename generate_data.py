"""
Generates realistic baseline MPLADS dataset matching the required schema:
work_id, work_description, category, mp_name, constituency, state, house,
final_amount, completed_date, has_images, average_rating, ida, work_type
"""
import os
import random
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

def generate_base_data(num_records=750, output_path="data/processed/completed_clean.csv"):
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    random.seed(42)
    np.random.seed(42)

    states_and_constituencies = [
        {"state": "Uttar Pradesh", "house": "Lok Sabha", "constituencies": ["Varanasi", "Lucknow", "Gorakhpur", "Kanpur", "Ayodhya", "Prayagraj"], "mps": ["Shri Narendra Modi", "Shri Rajnath Singh", "Shri Ravi Kishan", "Shri Satyadev Pachauri", "Shri Lallu Singh", "Smt. Rita Bahuguna Joshi"]},
        {"state": "Maharashtra", "house": "Lok Sabha", "constituencies": ["Nagpur", "Pune", "Nashik", "Mumbai South", "Thane", "Kolhapur"], "mps": ["Shri Nitin Gadkari", "Shri Girish Bapat", "Shri Hemant Godse", "Shri Arvind Sawant", "Shri Rajan Vichare", "Shri Sanjay Mandlik"]},
        {"state": "Karnataka", "house": "Lok Sabha", "constituencies": ["Bengaluru South", "Bengaluru Central", "Mysuru", "Dharwad", "Shivamogga", "Dakshina Kannada"], "mps": ["Shri Tejasvi Surya", "Shri P. C. Mohan", "Shri Pratap Simha", "Shri Pralhad Joshi", "Shri B. Y. Raghavendra", "Shri Nalin Kumar Kateel"]},
        {"state": "Rajasthan", "house": "Lok Sabha", "constituencies": ["Jaipur", "Jodhpur", "Kota", "Bikaner", "Udaipur", "Ajmer"], "mps": ["Shri Ramcharan Bohra", "Shri Gajendra Singh Shekhawat", "Shri Om Birla", "Shri Arjun Ram Meghwal", "Shri Arjun Lal Meena", "Shri Bhagirath Choudhary"]},
        {"state": "Bihar", "house": "Lok Sabha", "constituencies": ["Patna Sahib", "Muzaffarpur", "Gaya", "Bhagalpur", "Darbhanga", "Purnia"], "mps": ["Shri Ravi Shankar Prasad", "Shri Ajay Nishad", "Shri Vijay Kumar", "Shri Ajay Kumar Mandal", "Shri Gopal Jee Thakur", "Shri Santosh Kumar"]},
        {"state": "Tamil Nadu", "house": "Lok Sabha", "constituencies": ["Chennai South", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Thoothukkudi"], "mps": ["Smt. Thamizhachi Thangapandian", "Shri P. R. Natarajan", "Shri Su. Venkatesan", "Shri Su. Thirunavukkarasar", "Shri S. R. Parthiban", "Smt. Kanimozhi Karunanidhi"]},
        {"state": "Madhya Pradesh", "house": "Lok Sabha", "constituencies": ["Indore", "Bhopal", "Gwalior", "Jabalpur", "Ujjain", "Rewa"], "mps": ["Shri Shankar Lalwani", "Smt. Pragya Singh Thakur", "Shri Vivek Narayan Shejwalkar", "Shri Rakesh Singh", "Shri Anil Firojiya", "Shri Janardan Mishra"]},
        {"state": "Gujarat", "house": "Lok Sabha", "constituencies": ["Gandhinagar", "Ahmedabad East", "Surat", "Vadodara", "Rajkot", "Kachchh"], "mps": ["Shri Amit Shah", "Shri Hasmukh Patel", "Smt. Darshana Jardosh", "Smt. Ranjanben Bhatt", "Shri Mohan Kundariya", "Shri Vinod Chavda"]},
        {"state": "West Bengal", "house": "Lok Sabha", "constituencies": ["Kolkata North", "Asansol", "Darjeeling", "Howrah", "Bardhaman Durgapur", "Medinipur"], "mps": ["Shri Sudip Bandyopadhyay", "Shri Shatrughan Sinha", "Shri Raju Bista", "Shri Prasun Banerjee", "Shri S. S. Ahluwalia", "Shri Dilip Ghosh"]},
        {"state": "Andhra Pradesh", "house": "Lok Sabha", "constituencies": ["Visakhapatnam", "Vijayawada", "Guntur", "Tirupati", "Nellore", "Kurnool"], "mps": ["Shri M. V. V. Satyanarayana", "Shri Kesineni Srinivas", "Shri Jayadev Galla", "Shri Maddila Gurumoorthy", "Shri Adala Prabhakar Reddy", "Shri Sanjeev Kumar"]}
    ]

    work_type_templates = {
        "road": {
            "category": "Roads, Pathways and Bridges",
            "base_cost_range": (800000, 3500000),
            "descriptions": [
                "Construction of CC road from {loc1} to {loc2} in {constituency}",
                "Interlocking paver tile road construction near {loc1}, Ward {ward}",
                "Bituminous road repair and resurfacing connecting {loc1} and {loc2}",
                "Widening and paving of main approach road to {loc1} village",
                "Construction of concrete pathway and culvert near {loc1} market"
            ]
        },
        "water_supply": {
            "category": "Drinking Water Facility",
            "base_cost_range": (300000, 1800000),
            "descriptions": [
                "Installation of 5000 LPH community RO water purification plant at {loc1}",
                "Drilling of deep borewell and solar submersible pump installation near {loc1}",
                "Laying of drinking water pipeline network in {loc1} colony, Ward {ward}",
                "Installation of 10 HP water motor and overhead storage tank at {loc1}",
                "Construction of public drinking water booth with water cooler at {loc1}"
            ]
        },
        "street_light": {
            "category": "Rural Electrification & Power",
            "base_cost_range": (200000, 1200000),
            "descriptions": [
                "Installation of 40 units of 30W LED solar street lights in {loc1}",
                "High mast solar lighting tower installation at {loc1} junction",
                "Erection of street light poles with energy-efficient LED fittings at {loc1}",
                "Electrification and LED street light setup along main bypass of {loc1}",
                "Installation of semi-high mast LED lighting system at {loc1} bus stand"
            ]
        },
        "drainage": {
            "category": "Public Health & Sanitation",
            "base_cost_range": (500000, 2200000),
            "descriptions": [
                "Construction of covered RCC stormwater drainage line along {loc1} road",
                "Construction of pucca pakka nallah and desilting near {loc1}",
                "Underground drainage pipeline and soak pit construction in Ward {ward} of {loc1}",
                "Construction of box culvert and side drain connection at {loc1} chowk",
                "Laying of secondary drainage network to prevent waterlogging at {loc1}"
            ]
        },
        "education": {
            "category": "Education Facilities",
            "base_cost_range": (600000, 2800000),
            "descriptions": [
                "Construction of 2 additional smart classrooms at Government Higher Secondary School, {loc1}",
                "Supply of student furniture, digital smart boards and computer lab at {loc1} Inter College",
                "Renovation of school building and construction of boundary wall at {loc1} Girls High School",
                "Construction of modern science laboratory and library hall at {loc1} School",
                "Provision of solar rooftop power unit and RO water plant in {loc1} Primary School"
            ]
        },
        "community_hall": {
            "category": "Community Infrastructure",
            "base_cost_range": (1200000, 4500000),
            "descriptions": [
                "Construction of multi-purpose community recreation hall at {loc1}",
                "Development of community welfare center and public meeting hall in {loc1}",
                "Construction of Dr. B.R. Ambedkar community building with sanitation facilities at {loc1}",
                "Barat Ghar (Community Marriage Hall) construction at {loc1}, Ward {ward}",
                "Renovation and expansion of Panchayat Community Bhawan in {loc1}"
            ]
        },
        "sanitation": {
            "category": "Public Health & Sanitation",
            "base_cost_range": (400000, 1600000),
            "descriptions": [
                "Construction of community public toilet complex (separate for men & women) at {loc1}",
                "Installation of bio-toilets and solid waste collection shed at {loc1} vegetable market",
                "Construction of modern sanitation block with running water at {loc1} bus terminal",
                "Modern automated public conveniences and septic tank system at {loc1}",
                "Construction of open defecation free (ODF) community sanitary block in {loc1}"
            ]
        },
        "healthcare": {
            "category": "Public Health & Healthcare",
            "base_cost_range": (800000, 3200000),
            "descriptions": [
                "Procurement of advanced Life Support Ambulance for District Hospital {loc1}",
                "Construction of Ayushman Bharat Health & Wellness Sub-Centre building at {loc1}",
                "Supply of medical equipment, X-ray machine and patient monitors to {loc1} PHC",
                "Upgradation of maternity ward and neonatal care unit at {loc1} Community Health Centre",
                "Installation of 250 LPM medical oxygen generation plant at {loc1} Sub-District Hospital"
            ]
        },
        "sports": {
            "category": "Sports & Youth Welfare",
            "base_cost_range": (500000, 2500000),
            "descriptions": [
                "Construction of open gymnasium and synthetic walking track at {loc1} public park",
                "Development of rural sports complex and volleyball/kabaddi court at {loc1}",
                "Installation of outdoor fitness equipment and high mast lights at {loc1} stadium",
                "Construction of youth club sports pavilion and badminton court at {loc1}",
                "Laying of multi-sport turf ground and fencing at {loc1} playground"
            ]
        },
        "other": {
            "category": "Other Public Utility Works",
            "base_cost_range": (300000, 2000000),
            "descriptions": [
                "Construction of passenger waiting bus shelter with seating at {loc1} crossing",
                "Development of crematorium shed and boundary wall at {loc1} Shamshan Ghat",
                "Installation of CCTV surveillance security camera network across {loc1} market",
                "Construction of cattle pond and drinking trough at {loc1} Gram Panchayat",
                "Construction of library reading room and senior citizen recreation shelter at {loc1}"
            ]
        }
    }

    localities = [
        "Gandhi Chowk", "Nehru Nagar", "Shastri Colony", "Subhash Ward", "Shivaji Nagar",
        "Ambedkar Nagar", "Patel Marg", "Railway Station Road", "Bus Stand Area", "Civil Lines",
        "Bazaar Chowk", "Sector 4", "Rampur Village", "Shiv Mandir Complex", "Kalyanpur",
        "Rajendra Nagar", "Indira Colony", "Mahavir Marg", "Krishi Mandi", "Navrangpura",
        "Laxmi Bai Nagar", "Model Town", "Green Park", "Sardar Patel Circle", "Hanuman Mandir Chowk"
    ]

    idas_by_state = {
        "Uttar Pradesh": ["PWD Provincial Division", "Rural Engineering Services (RES) Lucknow", "UP Jal Nigam", "DRDA Varanasi", "UP Projects Corporation Ltd (UPPCL)"],
        "Maharashtra": ["Public Works Department (PWD) Pune", "Maharashtra Jeevan Pradhikaran (MJP)", "Zilla Parishad Works Division Nagpur", "DRDA Nashik", "MIDC Engineering Wing"],
        "Karnataka": ["Karnataka PWD Division Bengaluru", "KRIDL (Rural Infrastructure Development)", "Karnataka Urban Water Supply (KUWSDB)", "Zilla Panchayat Engineering Division Mysuru", "DRDA Dharwad"],
        "Rajasthan": ["PWD Circle Jaipur", "Rajasthan Public Health Engineering Dept (PHED)", "RSBCC Ltd", "Zila Parishad Engineering Wing Jodhpur", "DRDA Kota"],
        "Bihar": ["Road Construction Department (RCD) Patna", "Bihar Rajya Pul Nirman Nigam (BRPNNL)", "Public Health Engineering Dept (PHED) Bihar", "Local Area Engineering Organisation (LAEO)", "DRDA Muzaffarpur"],
        "Tamil Nadu": ["Highways Department Chennai", "Tamil Nadu Water Supply & Drainage Board (TWAD)", "DRDA Madurai", "PWD Buildings Division Coimbatore", "Salem District Zilla Wing"],
        "Madhya Pradesh": ["MP PWD Division Bhopal", "MP Rural Road Development Authority (MPRRDA)", "PHE Department Indore", "DRDA Jabalpur", "MP Housing & Infrastructure Board"],
        "Gujarat": ["Roads & Buildings (R&B) Department Gandhinagar", "Gujarat Water Supply & Sewerage Board (GWSSB)", "DRDA Ahmedabad", "Vadodara Municipal Engineering Wing", "R&B Division Surat"],
        "West Bengal": ["West Bengal PWD Kolkata", "Public Health Engineering Directorate (PHED) WB", "DRDA Howrah", "West Bengal State Rural Development Agency (WBSRDA)", "Asansol Durgapur Dev Authority"],
        "Andhra Pradesh": ["AP Roads & Buildings (R&B) Department", "AP Rural Water Supply and Sanitation (RWSS)", "AP State Housing Corporation", "DRDA Visakhapatnam", "AP Urban Greening & Infrastructure Corp"]
    }

    records = []
    current_year = 2023
    start_date = datetime(2021, 1, 1)

    work_type_keys = list(work_type_templates.keys())
    work_counter = 1001

    for i in range(num_records):
        state_info = random.choice(states_and_constituencies)
        state_name = state_info["state"]
        house = state_info["house"]
        idx = random.randint(0, len(state_info["constituencies"]) - 1)
        constituency = state_info["constituencies"][idx]
        mp_name = state_info["mps"][idx]

        wtype = random.choice(work_type_keys)
        template_info = work_type_templates[wtype]

        loc1 = random.choice(localities)
        loc2 = random.choice(localities)
        while loc2 == loc1:
            loc2 = random.choice(localities)
        ward = random.randint(1, 45)

        raw_desc_template = random.choice(template_info["descriptions"])
        work_desc = raw_desc_template.format(loc1=loc1, loc2=loc2, constituency=constituency, ward=ward)

        cost_min, cost_max = template_info["base_cost_range"]
        
        state_multipliers = {
            "Maharashtra": 1.15, "Karnataka": 1.12, "Tamil Nadu": 1.08, "Gujarat": 1.05,
            "Uttar Pradesh": 0.95, "Bihar": 0.90, "Rajasthan": 0.98, "Madhya Pradesh": 0.94,
            "West Bengal": 0.96, "Andhra Pradesh": 1.02
        }
        mult = state_multipliers.get(state_name, 1.0)
        base_cost = random.uniform(cost_min, cost_max) * mult
        final_amount = round(base_cost, -3)

        days_offset = random.randint(0, 1100)
        comp_date = (start_date + timedelta(days=days_offset)).strftime("%Y-%m-%d")
        has_images = random.random() < 0.86
        avg_rating = round(random.uniform(3.2, 4.9), 1)

        possible_idas = idas_by_state.get(state_name, ["District Rural Development Agency (DRDA)"])
        ida_weights = [0.45, 0.25, 0.15, 0.10, 0.05][:len(possible_idas)]
        ida = random.choices(possible_idas, weights=ida_weights, k=1)[0]

        work_id = f"MPLAD-{state_name[:2].upper()}-{current_year}-{work_counter}"
        work_counter += 1

        records.append({
            "work_id": work_id,
            "work_description": work_desc,
            "category": template_info["category"],
            "mp_name": mp_name,
            "constituency": constituency,
            "state": state_name,
            "house": house,
            "final_amount": float(final_amount),
            "completed_date": comp_date,
            "has_images": bool(has_images),
            "average_rating": float(avg_rating),
            "ida": ida,
            "work_type": wtype
        })

    # Natural near-duplicate entries
    for _ in range(12):
        src_idx = random.randint(0, len(records) - 1)
        src = records[src_idx].copy()
        work_counter += 1
        src["work_id"] = f"MPLAD-{src['state'][:2].upper()}-{current_year}-{work_counter}"
        src["work_description"] = src["work_description"].replace("Construction of", "Construction & laying of").replace("Installation of", "Supply and installation of")
        src["final_amount"] = round(src["final_amount"] * random.uniform(0.95, 1.05), -3)
        days_offset = random.randint(30, 180)
        try:
            old_dt = datetime.strptime(src["completed_date"], "%Y-%m-%d")
            src["completed_date"] = (old_dt + timedelta(days=days_offset)).strftime("%Y-%m-%d")
        except:
            pass
        records.append(src)

    # Rajya Sabha entries
    rs_mps = [
        {"state": "Maharashtra", "mp": "Smt. Priyanka Chaturvedi", "constituency": "Maharashtra (Rajya Sabha)"},
        {"state": "Karnataka", "mp": "Smt. Nirmala Sitharaman", "constituency": "Karnataka (Rajya Sabha)"},
        {"state": "Gujarat", "mp": "Shri S. Jaishankar", "constituency": "Gujarat (Rajya Sabha)"},
        {"state": "Rajasthan", "mp": "Dr. Manmohan Singh", "constituency": "Rajasthan (Rajya Sabha)"},
        {"state": "Tamil Nadu", "mp": "Shri P. Chidambaram", "constituency": "Tamil Nadu (Rajya Sabha)"}
    ]
    for rs in rs_mps:
        for _ in range(8):
            wtype = random.choice(work_type_keys)
            template_info = work_type_templates[wtype]
            loc1 = random.choice(localities)
            loc2 = random.choice(localities)
            while loc2 == loc1:
                loc2 = random.choice(localities)
            ward = random.randint(1, 30)
            raw_desc = random.choice(template_info["descriptions"])
            work_desc = raw_desc.format(loc1=loc1, loc2=loc2, constituency=rs["constituency"], ward=ward)
            cost_min, cost_max = template_info["base_cost_range"]
            final_amount = round(random.uniform(cost_min, cost_max), -3)
            comp_date = (start_date + timedelta(days=random.randint(50, 1000))).strftime("%Y-%m-%d")
            has_images = random.random() < 0.90
            avg_rating = round(random.uniform(3.5, 5.0), 1)
            idas = idas_by_state.get(rs["state"], ["DRDA"])
            ida = random.choice(idas)
            work_counter += 1
            records.append({
                "work_id": f"MPLAD-RS-{current_year}-{work_counter}",
                "work_description": work_desc,
                "category": template_info["category"],
                "mp_name": rs["mp"],
                "constituency": rs["constituency"],
                "state": rs["state"],
                "house": "Rajya Sabha",
                "final_amount": float(final_amount),
                "completed_date": comp_date,
                "has_images": bool(has_images),
                "average_rating": float(avg_rating),
                "ida": ida,
                "work_type": wtype
            })

    df = pd.DataFrame(records)
    df = df.sample(frac=1.0, random_state=42).reset_index(drop=True)
    df.to_csv(output_path, index=False)
    print(f"Generated {len(df)} records saved to {output_path}")
    return df

if __name__ == "__main__":
    generate_base_data()
