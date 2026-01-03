# AI-Assisted SSDI Review Dashboard Design

## Overview
The dashboard is designed to present a "Human-in-the-Loop" workflow where the AI acts as a junior analyst, surfacing insights, flagging issues, and preparing a preliminary determination for the Senior Caseworker (Human).

There are example inputs in here, that's not what needs to be surfaced every time.

## Layout Structure

### 1. Header / Applicant Summary
*   **Applicant Name:** [Name]
*   **Application ID:** [UUID]
*   **Submission Date:** [Date]
*   **Overall AI Recommendation:** 
    *   🟢 **LIKELY APPROVE** (High Confidence)
    *   🔴 **LIKELY DENY** (High Confidence)
    *   🟡 **NEEDS REVIEW** (Low Confidence / Complex Case)
*   **AI Confidence Score:** [Percentage]

### 2. Progress Tracker (The 5-Step Sequential Evaluation)
A visual stepper showing the status of each phase.
*   **Phase 0: Eligibility** [Pass/Fail/Warn]
*   **Phase 1: SGA** [Pass/Fail/Warn]
*   **Phase 2: Severe Impairment** [Pass/Fail/Warn]
*   **Phase 3: Listings** [Met/Not Met/Equaled]
*   **Phase 4: RFC & Past Work** [Can Perform/Cannot Perform]
*   **Phase 5: Other Work** [Can Adjust/Cannot Adjust]

---

## Detailed Phase Views (Expandable Cards)

### Phase 0: Basic Eligibility & Insured Status
*   **Status:** ✅ PASS
*   **Key Data Points:**
    *   **Age:** 45 (DOB: 01/01/1980)
    *   **Alleged Onset Date (AOD):** 06/15/2023
    *   **Date Last Insured (DLI):** 12/31/2026
    *   **Quarters of Coverage:** 40 (Met 20/40 Rule)
*   **AI Insight:** "Claimant meets insured status. DLI is after AOD."
*   **Citations:** `42 U.S.C. § 423(c)`

### Phase 1: Substantial Gainful Activity (SGA)
*   **Status:** ✅ PASS
*   **Analysis:**
    *   **Current Work Status:** Not Working
    *   **Post-AOD Earnings:** $0/month
    *   **SGA Threshold (2024):** $1,550
*   **AI Insight:** "No evidence of SGA since Alleged Onset Date."
*   **Citations:** `20 CFR § 404.1574`

### Phase 2: Severe Impairment(s)
*   **Status:** ✅ PASS
*   **Identified Impairments:**
    1.  **Lumbar Degenerative Disc Disease** (ICD-10: M51.36) - *Severe*
    2.  **Major Depressive Disorder** (ICD-10: F32.9) - *Severe*
*   **Evidence Summary:**
    *   "MRI dated 07/20/2023 shows L4-L5 herniation."
    *   "Psychiatric evaluation dated 08/15/2023 notes anhedonia and fatigue."
*   **Duration Check:** >12 Months Expected (Prognosis: Chronic)

### Phase 3: Listed Impairments (The "Blue Book")
*   **Status:** 🟡 CLOSE MATCH / NOT MET
*   **Listings Considered:**
    *   **1.15 (Disorders of the skeletal spine):** ❌ Criteria B not fully met (Need evidence of nerve root compression).
    *   **12.04 (Depressive disorders):** ❌ Paragraph B criteria: Moderate limitation in 2 areas (Need "Marked" in 2 or "Extreme" in 1).
*   **AI Insight:** "Claimant has severe impairments but medical evidence does not strictly meet Listing criteria. Proceed to RFC."

### Phase 4: Residual Functional Capacity (RFC) & Past Work
*   **Calculated RFC:** **Sedentary Work**
    *   *Lifting:* <10 lbs
    *   *Standing/Walking:* <2 hours
    *   *Sitting:* 6 hours
*   **Past Relevant Work (PRW) Analysis:**
    *   **Job 1:** Construction Worker (Heavy) -> ❌ Cannot Perform
    *   **Job 2:** Retail Sales (Light) -> ❌ Cannot Perform
*   **Conclusion:** Claimant cannot perform Past Relevant Work.

### Phase 5: Adjustment to Other Work (The Grid)
*   **Vocational Profile:**
    *   **Age:** Younger Individual (45)
    *   **Education:** High School Graduate
    *   **Skills:** Unskilled / No Transferable Skills
*   **Grid Rule Application:**
    *   **Rule:** 201.28 (Younger individual, HS grad, unskilled, Sedentary RFC) -> **NOT DISABLED**
*   **AI Flag:** ⚠️ "Grid Rule 201.28 directs a finding of 'Not Disabled'. However, non-exertional limitations (depression) may erode the occupational base. Vocational Expert testimony recommended."

---

## Action Panel (Human Operator)
*   [ ] **Request Medical Evidence** (AI suggests missing records)
*   [ ] **Schedule Consultative Exam** (AI suggests specialty)
*   [ ] **Approve Claim**
*   [ ] **Deny Claim**
