/**
 * Demo Auto-fill Utility
 * Loads sample application data and maps it to form structure
 */
import type { FormData } from '../types/form';

// Sample application data (will be loaded from JSON file)
const SAMPLE_APPLICATION_URL = '/sample_application_accepted/application.json';

// PDF files to load (relative to public directory)
const SAMPLE_PDFS = [
  { path: '/sample_application_accepted/pdfs/birth_certificate.pdf', field: 'birth_certificate' },
  { path: '/sample_application_accepted/pdfs/doctors_report.pdf', field: 'evidence_documents', index: 0 },
  { path: '/sample_application_accepted/pdfs/medical_records.pdf', field: 'evidence_documents', index: 1 },
  { path: '/sample_application_accepted/pdfs/social_security_statement.pdf', field: 'social_security_statement' },
  { path: '/sample_application_accepted/pdfs/test_results.pdf', field: 'evidence_documents', index: 2 },
  { path: '/sample_application_accepted/pdfs/w2_2020.pdf', field: 'w2_forms', year: 2020 },
  { path: '/sample_application_accepted/pdfs/w2_2021.pdf', field: 'w2_forms', year: 2021 },
  { path: '/sample_application_accepted/pdfs/w2_2022.pdf', field: 'w2_forms', year: 2022 },
];

/**
 * Load PDF file and convert to File object
 */
async function loadPDFFile(pdfPath: string, fileName: string): Promise<File> {
  try {
    const response = await fetch(pdfPath);
    if (!response.ok) {
      throw new Error(`Failed to load PDF: ${pdfPath}`);
    }
    const blob = await response.blob();
    return new File([blob], fileName, { type: 'application/pdf' });
  } catch (error) {
    console.error(`Error loading PDF ${pdfPath}:`, error);
    throw error;
  }
}

/**
 * Map sample application JSON to form data structure
 */
function mapSampleDataToFormStructure(sampleData: any): Partial<FormData> {
  const yourInfo = sampleData['your-info'] || {};
  const employment = sampleData.employment || {};
  const medical = sampleData.medical || {};
  const documents = sampleData.documents || {};
  const employmentHistory = employment.employment_history || {};
  const militaryService = employment.military_service || {};

  return {
    birthdate: yourInfo.birthdate || '',
    birthplace: yourInfo.birthplace || '',
    ssn: yourInfo.ssn || '',
    permanent_resident_card: null, // Will be set from file if available
    spouses: (yourInfo.spouses || []).map((spouse: any) => ({
      spouse_name: spouse.spouse_name || '',
      spouse_ssn: spouse.spouse_ssn || '',
      spouse_birthdate: spouse.spouse_birthdate || '',
      marriage_start_date: spouse.marriage_start_date || '',
      marriage_end_date: spouse.marriage_end_date || '',
      marriage_place_city: spouse.marriage_place_city || '',
      marriage_place_state_or_country: spouse.marriage_place_state_or_country || '',
    })),
    children: (yourInfo.children || []).map((child: any) => ({
      child_name: child.child_name || '',
      child_date_of_birth: child.child_date_of_birth || '',
      child_status: {
        disabled_before_22: child.child_status?.disabled_before_22 || false,
        under_18_unmarried: child.child_status?.under_18_unmarried || false,
        age_18_to_19_in_secondary_school_full_time: child.child_status?.age_18_to_19_in_secondary_school_full_time || false,
      },
    })),
    direct_deposit: yourInfo.direct_deposit ? {
      type: yourInfo.direct_deposit.type || 'none',
      domestic: yourInfo.direct_deposit.domestic || undefined,
      international: yourInfo.direct_deposit.international || undefined,
    } : { type: 'none' },
    contact_who_knows_your_condition: yourInfo.contact_who_knows_your_condition || {
      contact_name: '',
      address: { street: '', city: '', state: '', zip: '', country: '' },
      phone_number: ''
    },
    date_condition_began_affecting_work_ability: employment.date_condition_began_affecting_work_ability || '',
    non_self_employment: (employmentHistory.non_self_employment || []).map((job: any) => ({
      job_title: job.job_title || '',
      employer_name: job.employer_name || '',
      employment_start_date: job.employment_start_date || '',
      employment_end_date: job.employment_end_date || '',
      total_earnings: String(job.total_earnings || ''),
      job_duties_summary: job.job_duties_summary || '',
      employer_address: job.employer_address || '',
    })),
    self_employment: (employmentHistory.self_employment || []).map((se: any) => ({
      business_type: se.business_type || '',
      net_income_total: String(se.net_income_total || ''),
      tax_year: String(se.tax_year || ''),
    })),
    earnings_history: (employment.earnings_history || []).map((earnings: any) => ({
      year: String(earnings.year || ''),
      total_earnings: String(earnings.total_earnings || ''),
    })),
    served_in_us_military: militaryService.served_in_us_military || false,
    service_records: (militaryService.service_records || []).map((record: any) => ({
      branch: record.branch || '',
      type_of_duty: record.type_of_duty || '',
      service_start_date: record.service_start_date || '',
      service_end_date: record.service_end_date || '',
    })),
    education: (employment.education || []).map((edu: any) => ({
      level: edu.level || '',
      date_completed: edu.date_completed || '',
    })),
    special_education: (employment.special_education || []).map((se: any) => ({
      school_name: se.school_name || '',
      city: se.city || '',
      state: se.state || '',
    })),
    job_training: (employment.job_training || []).map((jt: any) => ({
      program_name: jt.program_name || '',
      date_completed: jt.date_completed || '',
    })),
    disability_benefits: (employment.disability_benefits_filed_or_received || []).map((db: any) => ({
      type: db.type || 'other',
      status: db.status || 'filed',
      payment_type: db.payment_type || 'temporary',
      payer: db.payer || 'other',
      details: db.details || '',
    })),
    conditions: (medical.conditions || []).map((condition: any) => ({
      condition_name: condition.condition_name || '',
      date_began: condition.date_began || '',
      how_it_limits_activities: condition.how_it_limits_activities || '',
      treatment_received: condition.treatment_received || '',
    })),
    functional_limitations: medical.functional_limitations || {},
    healthcare_providers: (medical.healthcare_providers || []).map((provider: any) => ({
      name: provider.name || '',
      address: provider.address || '',
      phone_number: provider.phone_number || '',
      patient_id_number: provider.patient_id_number || '',
      dates_of_exams_and_treatments: provider.dates_of_exams_and_treatments || '',
    })),
    tests: (medical.tests || []).map((test: any) => ({
      test_name: test.test_name || '',
      test_date: test.test_date || '',
      ordered_by: test.ordered_by || '',
      results_summary: test.results_summary || '',
    })),
    medications: (medical.medications || []).map((med: any) => ({
      medication_name: med.medication_name || '',
      type: med.type || 'prescription',
      reason: med.reason || '',
      prescribed_by: med.prescribed_by || '',
    })),
    evidence_documents: (medical.evidence_documents || []).map((doc: any) => ({
      document_type: doc.document_type || 'other',
      description: doc.description || '',
      file: null, // Will be set from file if available
    })),
    other_record_sources: (medical.other_record_sources || []).map((source: any) => ({
      type: source.type || 'other',
      name_or_description: source.name_or_description || '',
      contact_info: source.contact_info || '',
    })),
    social_security_statement: null, // Will be set from file if available
    birth_certificate: null, // Will be set from file if available
    citizenship_proof: null,
    military_discharge_papers: null,
    w2_forms: (documents.w2_forms || []).map((w2: any) => ({
      year: String(w2.year || ''),
      file: null, // Will be set from file if available
    })),
    self_employment_tax_returns: (documents.self_employment_tax_returns || []).map((ret: any) => ({
      year: String(ret.year || ''),
      file: null,
    })),
    workers_comp_proof: (documents.workers_comp_proof || []).map((proof: any) => ({
      type: proof.type || 'other',
      description: proof.description || '',
      file: null,
    })),
  };
}

/**
 * Load demo data (JSON + PDFs)
 * Note: Sample files must be copied to public/sample_application_accepted/ directory
 */
export async function loadDemoData(): Promise<{ formData: Partial<FormData> }> {
  // 1. Load JSON data
  const response = await fetch(SAMPLE_APPLICATION_URL);
  if (!response.ok) {
    throw new Error('Failed to load sample application data');
  }
  const sampleData = await response.json();
  
  // 2. Map to form structure
  const formData = mapSampleDataToFormStructure(sampleData);
  
  // 3. Load PDF files and attach to formData
  for (const pdfInfo of SAMPLE_PDFS) {
    try {
      const fileName = pdfInfo.path.split('/').pop() || 'document.pdf';
      const file = await loadPDFFile(pdfInfo.path, fileName);
      
      if (pdfInfo.field === 'birth_certificate') {
        formData.birth_certificate = file;
      } else if (pdfInfo.field === 'social_security_statement') {
        formData.social_security_statement = file;
      } else if (pdfInfo.field === 'evidence_documents' && typeof pdfInfo.index === 'number') {
        // Ensure evidence_documents array exists and has enough elements
        if (!formData.evidence_documents) {
          formData.evidence_documents = [];
        }
        // Extend array if needed
        while (formData.evidence_documents.length <= pdfInfo.index) {
          formData.evidence_documents.push({
            document_type: 'other',
            description: '',
            file: null,
          });
        }
        // Set the file at the correct index
        formData.evidence_documents[pdfInfo.index] = {
          ...formData.evidence_documents[pdfInfo.index],
          file: file,
          description: formData.evidence_documents[pdfInfo.index].description || fileName,
        };
      } else if (pdfInfo.field === 'w2_forms' && pdfInfo.year) {
        // Ensure w2_forms array exists
        if (!formData.w2_forms) {
          formData.w2_forms = [];
        }
        // Find or create entry for this year
        const w2Index = formData.w2_forms.findIndex((w2: any) => w2.year === String(pdfInfo.year));
        if (w2Index >= 0) {
          formData.w2_forms[w2Index].file = file;
        } else {
          formData.w2_forms.push({
            year: String(pdfInfo.year),
            file: file,
          });
        }
      }
    } catch (error) {
      console.warn(`Failed to load PDF ${pdfInfo.path}:`, error);
      // Continue loading other files
    }
  }
  
  return { formData };
}
