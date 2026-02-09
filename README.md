
# 🛣️ GPTR: Global Pothole & Traffic Risk Reporting System
### *Civic Intelligence • Artificial Intelligence • Public Safety*

![System Status](https://img.shields.io/badge/System-Operational-green?style=for-the-badge) 
![AI Model](https://img.shields.io/badge/Intelligence-Gemini%203%20Flash-blue?style=for-the-badge)
![Security](https://img.shields.io/badge/Security-Enterprise%20Standard-red?style=for-the-badge) 
![Platform](https://img.shields.io/badge/Platform-PWA%20%7C%20Mobile-orange?style=for-the-badge)
![Phase](https://img.shields.io/badge/Phase-Prototype%20Demo-yellow?style=for-the-badge)

---

## 📑 Table of Contents (Executive Index)

1.  [🌟 Vision & Mission Statement](#-vision--mission-statement)
2.  [⚙️ System Architecture Overview](#-system-architecture-overview)
3.  [🚦 Rules of Engagement: Reporting vs Verification](#-rules-of-engagement-reporting-vs-verification)
4.  [📸 Field Reporting Guidelines (SOP)](#-field-reporting-guidelines-sop)
5.  [📄 The Anatomy of a GPTR Report (Deep Dive)](#-the-anatomy-of-a-gptr-report-deep-dive)
6.  [🧠 The AI Engine: Logic & Calibration](#-the-ai-engine-logic--calibration)
7.  [🛡️ Security & Anti-Fraud Protocols](#-security--anti-fraud-protocols)
8.  [🤝 The Consensus Verification Model (3-Device Rule)](#-the-consensus-verification-model-3-device-rule)
9.  [📡 Open Data API Ecosystem](#-open-data-api-ecosystem)
10. [🌍 Social Engineering & Auto-Escalation](#-social-engineering--auto-escalation)
11. [🏆 Gamification & Citizen Rewards](#-gamification--citizen-rewards)
12. [🛠️ Tech Stack & Installation](#-tech-stack--installation)

---

## 🌟 Vision & Mission Statement

**The Problem:** 
Road infrastructure data is currently fragmented, manual, and reactive. Governments rely on slow complaint systems, while navigation apps rely on vague user inputs. This leads to accidents, especially for two-wheelers in developing nations.

**The GPTR Solution:** 
GPTR (Global Pothole & Traffic Risk) is a **Decision Support System**. It removes human subjectivity by using **Computer Vision** to generate structured, geotagged engineering data. It creates a "Digital Twin" of road hazards in real-time.

> *"We don't just report potholes. We calculate the probability of an accident."*

*Note: This project is currently a functional prototype designed to demonstrate the potential of AI in civic technology.*

---

## ⚙️ System Architecture Overview

The system operates on a decentralized **"Detect -> Verify -> Resolve"** loop:

*   **Input Layer:** Mobile PWA (Progressive Web App) with raw camera access.
*   **Processing Layer:** Google Gemini 3 Flash (Multimodal AI) for image forensics.
*   **Storage Layer:** Firebase Firestore (NoSQL) & Storage buckets.
*   **Distribution Layer:** Open APIs for Government Dashboard & Car Navigation Systems (ADAS).

---

## 🚦 Rules of Engagement: Reporting vs Verification

To balance ease of use with data integrity, we apply different logic to the "Red" and "Green" actions.

### 🔴 Red Button (Reporting New Hazards)
*   **Logic:** **Unlimited Reporting.**
*   **Behavior:** A single user can report 10, 20, or 100 potholes in a single day, as long as they are at different locations.
*   **Constraint:** **Spatial Lock.** You cannot report the *same* pothole twice. If you try to take a photo within 20 meters of an existing Red Marker, the system blocks the report ("Existing Report Nearby").

### 🟢 Green Button (Verifying Repairs)
*   **Logic:** **Strict 1-Device-1-Vote Policy.**
*   **Behavior:** To mark a hazard as "Fixed", the system requires a democratic consensus.
*   **Constraint:** **Single Vote Limit.** A user can verify a specific repair **only once**. If the same user tries to click verify again, the system rejects it: *"You already submitted this repair! Ask another person."*
*   **Goal:** We need **3 Unique Device IDs** to confirm a repair before the marker turns Green.

---

## 📸 Field Reporting Guidelines (SOP)

To ensure **99% AI Acceptance Rate**, users must follow these data collection protocols. The AI is trained to reject low-quality or ambiguous data.

### ✅ The "Perfect" Report (DOs)
1.  **Angle:** Hold camera at a **45° degree angle** pointing downward.
2.  **Distance:** Stand **2 to 3 meters** away from the hazard.
3.  **Context:** Ensure the frame includes **Reference Objects** (Curb, Lane markings, Footpath). This helps the AI calculate depth and scale.
4.  **Stability:** Hold the device steady. Motion blur is the #1 cause of rejection.

### 🚫 Automatic Rejection Criteria (DON'Ts)
1.  **Windshield Shots:** Do not take photos from inside a car through glass. Reflections confuse the computer vision model.
2.  **Extreme Close-ups:** A photo of just "black asphalt" without context will be rejected as "Unidentifiable Surface".
3.  **Digital Zoom:** Do not zoom. It destroys pixel density required for material analysis.
4.  **Screen Captures:** Taking a photo of another screen (Laptop/Phone) triggers the **Anti-Spoofing Forensics** lock.

> **⚠️ SAFETY WARNING:** Never stand in the middle of active traffic to take a photo. Use the zoom-free wide angle from the shoulder/footpath.

---

## 📄 The Anatomy of a GPTR Report (Deep Dive)

When a user clicks "Capture", the AI generates a comprehensive **JSON Intelligence Dossier**. This is NOT just a photo; it is a structured engineering audit.

### 1. 🚦 Risk & Safety Metrics
*   **`accident_probability_score` (0-100%):** A calculated metric predicting the likelihood of an accident.
    *   *< 40%:* Low Risk (Cosmetic damage).
    *   *40-70%:* Medium Risk (Vehicle damage likely).
    *   *70-90%:* High Risk (Loss of control).
    *   *> 90%:* Critical (Immediate threat to life).
*   **`vehicle_impact` Analysis:**
    *   **2-Wheelers:** "Critical - Front wheel entrapment risk." (High sensitivity for bikes/scooters).
    *   **4-Wheelers:** "Medium - Suspension damage / Rim bend risk."

### 2. 🛠️ Engineering Specs
*   **`hazard_type`:** Pothole, Manhole Open, Longitudinal Crack, Erosion.
*   **`surface_condition`:** "Bituminous Asphalt degradation with loose aggregate."
*   **`repair_info`:**
    *   **Material:** "Cold Mix Asphalt" (for small patches) or "Reinforced Concrete" (for deep structural failures).
    *   **Urgency:** "24 Hours" (School zone) vs "7 Days" (Residential).

### 3. 💰 Cost Estimation (Geo-Adaptive)
The AI detects the country via GPS context and estimates repair costs in local currency.
*   **India Context:** 
    *   Input: "2ft x 2ft Pothole".
    *   Output: `estimated_cost_inr`: "₹1,500 - ₹2,000".
    *   *Logic:* Local labor rates + Bitumen cost per kg.
*   **USA Context:** 
    *   Input: Same Pothole.
    *   Output: `estimated_cost_usd`: "$400".
    *   *Logic:* Union labor rates + Equipment mobilization.

---

## 🧠 The AI Engine: Logic & Calibration

We use **Gemini 3 Flash** with a custom "Civil Engineer Persona"
for real-time multimodal analysis of road hazards.

> Model Selection Note:
> Gemini 3 Flash was chosen for its low latency, cost efficiency,
> and suitability for large-scale civic and public safety systems.

### 🔎 Forensics & Truth Detection
Before analyzing the road, the AI runs a "Truth Check":
1.  **Screen Capture Detection:** Detects pixel grids (Moiré patterns) to prevent users from photographing a laptop screen.
2.  **GPS-Visual Consistency:** 
    *   *Scenario:* GPS says "Hyderabad (Tropical)". Image shows "Snow".
    *   *Action:* **REJECT REPORT** (Flag: `LOCATION_MISMATCH`).
3.  **Blur/Darkness Check:** If the image is too blurry to perform engineering analysis, it is rejected to maintain database quality.

### 🌗 The "Dual-Image" Repair Audit (Green Button Logic)
This is the core verification innovation.
*   **Input:** Image A (Old Pothole) + Image B (New Photo).
*   **Algorithm:**
    1.  **Feature Matching:** Do the background buildings/trees match? (Confidence threshold > 80%).
    2.  **Surface Analysis:** Is the crater replaced by a smooth plane?
    3.  **Material Check:** Does the new patch look like fresh asphalt (Black/Dark Grey) or just loose mud (Brown)?
*   **Result:** `GENUINE_REPAIR` or `FAKE_COVERUP`.

---

## 🛡️ Security & Anti-Fraud Protocols

We implement strict protocols to ensure data integrity during this prototype phase.

| Protocol | Description | Implementation |
| :--- | :--- | :--- |
| **Night Safety Rule 🌙** | **Restricted Reporting (6 PM - 6 AM).**<br>Night-time image submissions are temporarily restricted in the demo phase to ensure high-confidence AI analysis.<br>*Why?* Low-light conditions significantly reduce visual clarity and increase false hazard detection. Future versions will support night reporting using flash calibration. | Hardcoded JS check. Shows "Night Safety Alert".
Note: This restriction exists only in the prototype phase to preserve AI confidence thresholds.
Production versions will support night reporting using flash-calibrated models.
 |
| **Mock Location Block 🚫** | Detects "Fake GPS" apps. | Checks `altitude` variance, `speed` vs `accuracy` ratio. If perfectly static, it's fake. |
| **Device Fingerprinting 🆔** | Prevents voting spam. | Generates a persistent hash in `localStorage`. 1 Vote per Device per Report. |
| **Proximity Geofence 📍** | Ensures physical presence. | Verifications only allowed within **20m radius**. |
| **Rate Limiting ⏱️** | Prevents API abuse. | Max 5 reports per hour per IP address. |

---

## 🤝 The Consensus Verification Model (3-Device Rule)

GPTR uses a "Democratized Truth" model. No single user has the authority to close a ticket.

**The Lifecycle of a Pothole:**
1.  **Stage 0 (Reported):** User A uploads. Status: `ACTIVE`. Map: 🔴.
2.  **Stage 1 (Audit Start):** User B (Device 2) visits and scans. AI confirms repair.
    *   Status: `VERIFYING`. Map: 🟡 (Blinking).
    *   *Consensus:* 1/3.
3.  **Stage 2 (Corroboration):** User C (Device 3) visits and scans. AI confirms repair.
    *   Status: `VERIFYING`. Map: 🟡 (Blinking).
    *   *Consensus:* 2/3.
4.  **Stage 3 (Resolution):** User D (Device 4) visits and scans. AI confirms repair.
    *   **Status: `RESOLVED`.**
    *   **Action:** Marker removed from Active Map. Moved to "Success Archive".
    *   **Reward:** All participants get Bonus Points.

---

## 📡 Open Data API Ecosystem

We provide data pipelines for two distinct consumers.

### 1. 🚗 Public Navigation API (`/navigate`)
*   **Purpose:** For ADAS (Tesla/Tata), Google Maps, Waze.
*   **Latency:** Low (<100ms).
*   **Payload:** Minimal.
*   **Example Response:**
    ```json
    {
      "lat": 17.4532,
      "lng": 78.3421,
      "type": "pothole",
      "severity": "CRITICAL",
      "warning": "Deep crater, left lane."
    }
    ```

### 2. 🏛️ Government Civic API (`/civic`)
*   **Purpose:** For Municipal Dashboards, PWD Work Orders.
*   **Latency:** Standard.
*   **Payload:** Rich Evidence.
*   **Example Response:**
    ```json
    {
      "id": "rpt_9823",
      "image_url": "https://storage.../evidence.jpg",
      "repair_estimate": "₹4,500",
      "material_required": "Bitumen Cold Mix",
      "audit_trail": [
         {"user": "Citizen_A", "action": "Reported"},
         {"user": "Citizen_B", "action": "Verified"}
      ]
    }
    ```

---

## 🌍 Social Engineering & Auto-Escalation

GPTR uses Public Accountability as a transparent civic escalation mechanism.

**Auto-Tagging Logic:**
1.  **Reverse Geocode:** The App determines the location is "Vizianagaram, AndhraPradesh.
2.  **Database Query:** Looks up `officialHandles.ts`.
3.  **Target Selection:**
    *   CM: "cm": "@ncbn @AndhraPradeshCM",
            "deputy_cm": "@PawanKalyan",
            "road_dept": "@AP_Roads @aprtsofficial",
            "cities": 
                "Visakhapatnam": "@GVMC_VISAKHA",
                "Vijayawada": "@ourvmc",
                "Tirupati": "@MCT_Tirupati",
                "Vizianagaram": "@VZM_Collector @VizianagaramMun"
4.  **Tweet Generation:**
    Example Auto-Generated Alert:

🚨 CRITICAL ROAD HAZARD DETECTED  
Location: Vizianagaram  
Severity: High (82% Risk)  

cc: @ncbn @AndhraPradeshCM @AP_Roads @VZM_Collector  
#RoadSafety #GPTR


---

## 🏆 Gamification & Citizen Rewards

Encouraging sustained civic participation.

*   **Experience Points (XP):**
    *   New Valid Report: **+10 XP**.
    *   Verify Repair: **+25 XP** (Higher incentive to close loops).
*   **Leaderboard:**
    *   Ranks users by District. "Top Reporter in Vizianagaram".
*   **Certificates:**
    *   Users can download an **AI-Generated Certificate**.
    *   *Design:* Corporate/Govt style certificate signed by "GPTR Intelligence System".

---

## 🛠️ Tech Stack & Installation

### Core Technologies
*   **Frontend:** React 18, TypeScript, Vite.
*   **Styling:** Tailwind CSS (Mobile-first utility classes).
*   **AI/ML:** Google Gemini 3 Flash (via `@google/genai` SDK).
*   **Database:** Firebase Firestore (Real-time NoSQL).
*   **Storage:** Firebase Storage (Image Evidence).
*   **Maps:** Google Maps JavaScript API + MarkerClusterer.
*   **Compression:** `browser-image-compression` (Client-side optimization).

### Local Setup Guide

1.  **Clone Repository**
    ```bash
    git clone https://github.com/your-username/gptr-road-safety.git
    cd gptr-road-safety
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Environment Variables**
    Create a `.env` file:
    ```env
    API_KEY=your_gemini_api_key
    VITE_GOOGLE_MAPS_API_KEY=your_maps_key
    ```

4.  **Run Development Server**
    ```bash
    npm run dev
    ```

5.  **Build for Production**
    ```bash
    npm run build
    ```

---

### *GPTR: Transforming Passive Complaints into Active, Verifiable Intelligence.*

## 📸 Application Screenshots

### 🏠 Main Dashboard
![GPTR Main Dashboard](./assets/app%20mainpage.jpeg)

### 👤 User Dashboard
![User Dashboard](./assets/user%20dashboard.jpg.jpeg)

### 🧠 AI Hazard Analysis (Single Report)
![AI Analysis](./assets/detailed%20analysis.jpg.jpeg)

### 🧠 Advanced AI Analysis (Multi-factor)
![Advanced AI Analysis](./assets/multi%20detailed%20analysis.jpg.jpeg)

### 🗺️ Live Hazard Map
![Live Hazard Map](./assets/map%20static%20view%20.jpg.jpeg)

### 📊 Aggregated Hazard Reports (By Category)
![Aggregated Reports](./assets/all%20data%20report%20by%20category.jpg.jpeg)

### 🔗 Social Auto-Escalation
![Social Share](./assets/SOCIAL%20SHARE%20.jpg.jpeg)

### 🏆 Gamification & Leaderboard
![Leaderboard](./assets/Leader%20board.jpg.jpeg)

### 🔐 API & Data Access
![API Panel](./assets/API%20.jpg.jpeg)

### 🛡️ Safety Board
![Safety Board](./assets/safety%20board.jpg.jpeg)

---
## ⚙️ System Architecture Overview

![GPTR Project Mind Map](./assets/project%20Mind%20Map.png)




