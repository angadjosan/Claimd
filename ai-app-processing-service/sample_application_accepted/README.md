# Sample SSDI Application - Ready for Testing

This directory contains a complete sample SSDI application that is designed to **pass all evaluation phases** and be accepted.

## Application Summary

**Applicant:** Sarah Marie Johnson  
**DOB:** March 15, 1985 (Age: 39)  
**Condition Onset:** January 10, 2023  
**Last Work Date:** January 15, 2023  
**Quarters of Coverage:** 60 (exceeds 20/40 rule requirement)

### Why This Application Should Be Accepted

1. **Phase 0 - Basic Eligibility:** ✅
   - Age 39 (under retirement age of 67)
   - 60 quarters of coverage (meets 20/40 rule)
   - Date Last Insured: December 31, 2028 (well after onset date)

2. **Phase 1 - SGA:** ✅
   - No earnings since January 2023
   - Last earnings in 2022 were $12,400 (below SGA threshold)

3. **Phase 2 - Severe Impairment:** ✅
   - Medically determinable impairment (Lumbar Disc Herniation)
   - Significantly limits basic work activities
   - Duration > 12 months (condition began January 2023)

4. **Phase 3 - Listed Impairments:** ⚠️
   - May meet or equal Listing 1.04 (Spine Disorders)
   - Proceeds to Phase 4 for RFC analysis

5. **Phase 4 - RFC & Past Work:** ✅
   - RFC: Sedentary with significant limitations
   - Past work: Warehouse Worker (Heavy/Medium exertion)
   - Cannot perform past work with current RFC

6. **Phase 5 - Adjustment to Other Work:** ✅
   - Age: 39 (Younger Person)
   - Education: High School
   - RFC: Sedentary with additional limitations
   - Grid Rules favor approval

## Files Generated

### JSON Data
- `application.json` - Complete application data in backend schema format

### PDF Documents
All PDFs are in the `pdfs/` directory:
- `birth_certificate.pdf` - Birth certificate
- `social_security_statement.pdf` - SSA earnings record
- `w2_2020.pdf`, `w2_2021.pdf`, `w2_2022.pdf` - W-2 forms
- `medical_records.pdf` - Complete medical records including MRI and physical exam
- `doctors_report.pdf` - Medical Source Statement with functional capacity opinion

## How to Use in Frontend

### Option 1: Load Form Data via Browser Console (Recommended)

1. **Start the applicant frontend:**
   ```bash
   cd applicant/frontend
   npm run dev
   ```

2. **Navigate to the form page** in your browser

3. **Open browser console** (F12 or Cmd+Option+I on Mac)

4. **Copy and paste the contents of `load_into_form.js`** into the console and press Enter

5. **Refresh the page** - the form will be pre-populated with all data

6. **Upload PDF files manually:**
   - Navigate to Step 12 (Document Uploads)
   - Upload each PDF from the `pdfs/` directory:
     - Birth Certificate → `pdfs/birth_certificate.pdf`
     - Social Security Statement → `pdfs/social_security_statement.pdf`
     - W-2 Forms → `pdfs/w2_2020.pdf`, `pdfs/w2_2021.pdf`, `pdfs/w2_2022.pdf`
   - Navigate to Step 11 (Medical Evidence)
   - Upload medical documents:
     - Medical Records → `pdfs/medical_records.pdf`
     - Doctor's Report → `pdfs/doctors_report.pdf`

### Option 2: Manual Entry

You can manually enter the data from `application.json` into the form. The structure matches the frontend form fields.

## Application Data Structure

The application includes:

- ✅ Personal information (name, DOB, SSN, birthplace)
- ✅ Marital status (current spouse)
- ✅ Children (one child under 18)
- ✅ Direct deposit information
- ✅ Emergency contact
- ✅ Employment history (warehouse worker, ended due to disability)
- ✅ Earnings history (2010-2024, showing decline in 2022)
- ✅ Education (High School Diploma)
- ✅ Medical conditions (Lumbar Disc Herniation with Radiculopathy)
- ✅ Functional limitations (detailed limitations for all activities)
- ✅ Healthcare providers (3 providers)
- ✅ Medical tests (MRI, Physical Therapy Evaluation)
- ✅ Medications (3 prescription medications)
- ✅ Evidence documents (descriptions ready for PDF upload)

## Testing the Application

After loading the data and uploading PDFs:

1. **Review each step** - All data should be pre-filled
2. **Navigate through all 12 steps** using the Next/Previous buttons
3. **Submit the application** - It should pass all validation
4. **Check the caseworker dashboard** - The application should appear for review
5. **Verify AI processing** - The application should be evaluated and recommended for approval

## Notes

- The SSN in the sample data is `123-45-6789` (test data)
- All dates are realistic and consistent
- Medical evidence supports severe functional limitations
- Earnings history shows clear decline leading to work stoppage
- All required documents are provided as PDFs

## Regenerating the Application

To regenerate the application with different data:

```bash
cd ai-app-processing-service
python3 generate_sample_application.py
```

This will overwrite the existing files in `sample_application/`.

