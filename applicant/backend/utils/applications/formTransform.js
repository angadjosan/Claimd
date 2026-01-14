/**
 * Shared form data transformation utilities
 * Used by both regular and demo routes
 */

/**
 * Transform frontend form data to database schema
 */
function transformFormDataToSchema(formData, fileIds, userId) {
  const data = typeof formData === 'string' ? JSON.parse(formData) : formData;

  const evidenceDocuments = (data.evidence_documents || []).map((doc, index) => ({
    document_type: doc.document_type || 'other',
    description: doc.description || '',
    file_id: fileIds.evidence_documents[index]?.file_id || null,
  }));

  const w2Forms = (data.w2_forms || []).map((w2, index) => ({
    year: parseInt(w2.year) || null,
    file_id: fileIds.w2_forms[index]?.file_id || null,
  }));

  const selfEmploymentTaxReturns = (data.self_employment_tax_returns || []).map((ret, index) => ({
    year: parseInt(ret.year) || null,
    file_id: fileIds.self_employment_tax_returns[index]?.file_id || null,
  }));

  const workersCompProof = (data.workers_comp_proof || []).map((proof, index) => ({
    type: proof.type || 'other',
    description: proof.description || '',
    file_id: fileIds.workers_comp_proof[index]?.file_id || null,
  }));

  return {
    applicant_id: userId,
    birthdate: data.birthdate || null,
    birthplace: data.birthplace || null,
    permanent_resident_card_file_id: fileIds.permanent_resident_card_file_id,
    spouses: JSON.stringify(data.spouses || []),
    children: JSON.stringify(data.children || []),
    direct_deposit_type: data.direct_deposit?.type || 'none',
    direct_deposit_domestic: data.direct_deposit?.type === 'domestic' ? JSON.stringify(data.direct_deposit.domestic) : null,
    direct_deposit_international: data.direct_deposit?.type === 'international' ? JSON.stringify(data.direct_deposit.international) : null,
    emergency_contact: JSON.stringify(data.contact_who_knows_your_condition || {}),
    date_condition_began_affecting_work: data.date_condition_began_affecting_work_ability || null,
    employment_history: JSON.stringify(data.non_self_employment || []),
    self_employment_history: JSON.stringify(data.self_employment || []),
    earnings_history: JSON.stringify(data.earnings_history || []),
    served_in_us_military: data.served_in_us_military || false,
    military_service_records: JSON.stringify(data.service_records || []),
    education: JSON.stringify(data.education || []),
    special_education: JSON.stringify(data.special_education || []),
    job_training: JSON.stringify(data.job_training || []),
    disability_benefits: JSON.stringify(data.disability_benefits || []),
    conditions: JSON.stringify(data.conditions || []),
    functional_limitations: JSON.stringify(data.functional_limitations || {}),
    healthcare_providers: JSON.stringify(data.healthcare_providers || []),
    medical_tests: JSON.stringify(data.tests || []),
    medications: JSON.stringify(data.medications || []),
    evidence_documents: JSON.stringify(evidenceDocuments),
    other_record_sources: JSON.stringify(data.other_record_sources || []),
    social_security_statement_file_id: fileIds.social_security_statement_file_id,
    birth_certificate_file_id: fileIds.birth_certificate_file_id,
    citizenship_proof_file_id: fileIds.citizenship_proof_file_id,
    military_discharge_papers_file_id: fileIds.military_discharge_papers_file_id,
    w2_forms: JSON.stringify(w2Forms),
    self_employment_tax_returns: JSON.stringify(selfEmploymentTaxReturns),
    workers_comp_proof: JSON.stringify(workersCompProof),
    current_step: 13,
    steps_completed: JSON.stringify([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]),
  };
}

module.exports = {
  transformFormDataToSchema,
};
