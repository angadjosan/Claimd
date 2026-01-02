/**
 * Application Routes
 * Handles application submission, file uploads, and application management
 */
const express = require('express');
const router = express.Router();
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

// Configure multer for memory storage (files stored in memory before uploading to Supabase)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit per file
    files: 50, // Max 50 files per request
  },
  fileFilter: (req, file, cb) => {
    // Only allow PDF, images for document uploads
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/gif',
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}. Only PDF and images are allowed.`));
    }
  },
});

/**
 * Upload a single file to Supabase Storage
 * @param {object} supabase - Supabase client
 * @param {object} file - Multer file object
 * @param {string} applicationId - Application UUID
 * @param {string} userId - User UUID
 * @param {string} category - File category (e.g., 'medical_records', 'w2_forms')
 * @param {object} metadata - Additional metadata (document_year, description)
 * @returns {Promise<object>} - File record object
 */
async function uploadFileToStorage(supabase, file, applicationId, userId, category, metadata = {}) {
  const fileId = uuidv4();
  const fileExtension = file.originalname.split('.').pop() || 'pdf';
  const storagePath = `${userId}/${applicationId}/${category}/${fileId}.${fileExtension}`;
  const bucketName = 'application-files';

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from(bucketName)
    .upload(storagePath, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Failed to upload file: ${uploadError.message}`);
  }

  // Create file record in database
  const fileRecord = {
    id: fileId,
    application_id: applicationId,
    uploaded_by: userId,
    file_name: file.originalname,
    file_type: file.mimetype,
    file_size: file.size,
    storage_bucket: bucketName,
    storage_path: storagePath,
    category,
    description: metadata.description || null,
    document_year: metadata.document_year || null,
  };

  const { data: insertedFile, error: dbError } = await supabase
    .from('application_files')
    .insert(fileRecord)
    .select()
    .single();

  if (dbError) {
    // Try to clean up the uploaded file if DB insert fails
    await supabase.storage.from(bucketName).remove([storagePath]);
    throw new Error(`Failed to record file: ${dbError.message}`);
  }

  return insertedFile;
}

/**
 * Process and upload all files from the form submission
 * Returns file IDs mapped by category
 */
async function processAllFiles(supabase, files, applicationId, userId) {
  const fileIds = {
    permanent_resident_card_file_id: null,
    social_security_statement_file_id: null,
    birth_certificate_file_id: null,
    citizenship_proof_file_id: null,
    military_discharge_papers_file_id: null,
    evidence_documents: [],
    w2_forms: [],
    self_employment_tax_returns: [],
    workers_comp_proof: [],
  };

  if (!files || Object.keys(files).length === 0) {
    return fileIds;
  }

  // Process single file uploads
  const singleFileFields = [
    { field: 'permanent_resident_card', category: 'identification', idField: 'permanent_resident_card_file_id' },
    { field: 'social_security_statement', category: 'social_security', idField: 'social_security_statement_file_id' },
    { field: 'birth_certificate', category: 'birth_certificate', idField: 'birth_certificate_file_id' },
    { field: 'citizenship_proof', category: 'citizenship', idField: 'citizenship_proof_file_id' },
    { field: 'military_discharge_papers', category: 'military', idField: 'military_discharge_papers_file_id' },
  ];

  for (const { field, category, idField } of singleFileFields) {
    if (files[field] && files[field][0]) {
      const uploaded = await uploadFileToStorage(
        supabase,
        files[field][0],
        applicationId,
        userId,
        category
      );
      fileIds[idField] = uploaded.id;
    }
  }

  // Process evidence documents (array)
  if (files['evidence_documents']) {
    for (let i = 0; i < files['evidence_documents'].length; i++) {
      const file = files['evidence_documents'][i];
      const uploaded = await uploadFileToStorage(
        supabase,
        file,
        applicationId,
        userId,
        'medical_evidence',
        { description: file.originalname }
      );
      fileIds.evidence_documents.push({
        file_id: uploaded.id,
        document_type: 'other', // Will be overwritten from form data
      });
    }
  }

  // Process W2 forms (array with years)
  if (files['w2_forms']) {
    for (let i = 0; i < files['w2_forms'].length; i++) {
      const file = files['w2_forms'][i];
      // Try to extract year from filename or field name
      const yearMatch = file.fieldname.match(/w2_forms\[(\d+)\]/) || file.originalname.match(/(\d{4})/);
      const year = yearMatch ? parseInt(yearMatch[1]) : null;
      
      const uploaded = await uploadFileToStorage(
        supabase,
        file,
        applicationId,
        userId,
        'w2_forms',
        { document_year: year }
      );
      fileIds.w2_forms.push({
        file_id: uploaded.id,
        year: year,
      });
    }
  }

  // Process self-employment tax returns (array with years)
  if (files['self_employment_tax_returns']) {
    for (let i = 0; i < files['self_employment_tax_returns'].length; i++) {
      const file = files['self_employment_tax_returns'][i];
      const yearMatch = file.fieldname.match(/self_employment_tax_returns\[(\d+)\]/) || file.originalname.match(/(\d{4})/);
      const year = yearMatch ? parseInt(yearMatch[1]) : null;
      
      const uploaded = await uploadFileToStorage(
        supabase,
        file,
        applicationId,
        userId,
        'self_employment_tax_returns',
        { document_year: year }
      );
      fileIds.self_employment_tax_returns.push({
        file_id: uploaded.id,
        year: year,
      });
    }
  }

  // Process workers comp proof documents
  if (files['workers_comp_proof']) {
    for (let i = 0; i < files['workers_comp_proof'].length; i++) {
      const file = files['workers_comp_proof'][i];
      const uploaded = await uploadFileToStorage(
        supabase,
        file,
        applicationId,
        userId,
        'workers_comp_proof'
      );
      fileIds.workers_comp_proof.push({
        file_id: uploaded.id,
        type: 'other', // Will be overwritten from form data
      });
    }
  }

  return fileIds;
}

/**
 * Transform frontend form data to database schema
 * @param {object} formData - Form data from frontend
 * @param {object} fileIds - File IDs from uploaded files
 * @param {string} userId - User UUID
 * @returns {object} - Database-ready application object
 */
function transformFormDataToSchema(formData, fileIds, userId) {
  // Parse form data if it's a string (from multipart form)
  const data = typeof formData === 'string' ? JSON.parse(formData) : formData;

  // Build evidence documents array with file IDs
  const evidenceDocuments = (data.evidence_documents || []).map((doc, index) => ({
    document_type: doc.document_type || 'other',
    description: doc.description || '',
    file_id: fileIds.evidence_documents[index]?.file_id || null,
  }));

  // Build W2 forms array with file IDs
  const w2Forms = (data.w2_forms || []).map((w2, index) => ({
    year: parseInt(w2.year) || null,
    file_id: fileIds.w2_forms[index]?.file_id || null,
  }));

  // Build self-employment tax returns array with file IDs
  const selfEmploymentTaxReturns = (data.self_employment_tax_returns || []).map((ret, index) => ({
    year: parseInt(ret.year) || null,
    file_id: fileIds.self_employment_tax_returns[index]?.file_id || null,
  }));

  // Build workers comp proof array with file IDs
  const workersCompProof = (data.workers_comp_proof || []).map((proof, index) => ({
    type: proof.type || 'other',
    description: proof.description || '',
    file_id: fileIds.workers_comp_proof[index]?.file_id || null,
  }));

  // Build the application object matching database schema
  // Note: This function is used for submission, so status is set to 'submitted' by the route handler
  const applicationData = {
    applicant_id: userId,
    
    // Personal Info
    birthdate: data.birthdate || null,
    birthplace: data.birthplace || null,
    // SSN will be hashed using Supabase function - stored separately
    permanent_resident_card_file_id: fileIds.permanent_resident_card_file_id,
    
    // Spouses
    spouses: JSON.stringify(data.spouses || []),
    
    // Children
    children: JSON.stringify(data.children || []),
    
    // Direct Deposit
    direct_deposit_type: data.direct_deposit?.type || 'none',
    direct_deposit_domestic: data.direct_deposit?.type === 'domestic' 
      ? JSON.stringify(data.direct_deposit.domestic) 
      : null,
    direct_deposit_international: data.direct_deposit?.type === 'international'
      ? JSON.stringify(data.direct_deposit.international)
      : null,
    
    // Emergency Contact
    emergency_contact: JSON.stringify(data.contact_who_knows_your_condition || {}),
    
    // Employment
    date_condition_began_affecting_work: data.date_condition_began_affecting_work_ability || null,
    employment_history: JSON.stringify(data.non_self_employment || []),
    self_employment_history: JSON.stringify(data.self_employment || []),
    
    // Earnings
    earnings_history: JSON.stringify(data.earnings_history || []),
    
    // Military
    served_in_us_military: data.served_in_us_military || false,
    military_service_records: JSON.stringify(data.service_records || []),
    
    // Education
    education: JSON.stringify(data.education || []),
    special_education: JSON.stringify(data.special_education || []),
    job_training: JSON.stringify(data.job_training || []),
    
    // Disability Benefits
    disability_benefits: JSON.stringify(data.disability_benefits || []),
    
    // Medical
    conditions: JSON.stringify(data.conditions || []),
    functional_limitations: JSON.stringify(data.functional_limitations || {}),
    healthcare_providers: JSON.stringify(data.healthcare_providers || []),
    medical_tests: JSON.stringify(data.tests || []),
    medications: JSON.stringify(data.medications || []),
    
    // Evidence & Records
    evidence_documents: JSON.stringify(evidenceDocuments),
    other_record_sources: JSON.stringify(data.other_record_sources || []),
    
    // Document File IDs
    social_security_statement_file_id: fileIds.social_security_statement_file_id,
    birth_certificate_file_id: fileIds.birth_certificate_file_id,
    citizenship_proof_file_id: fileIds.citizenship_proof_file_id,
    military_discharge_papers_file_id: fileIds.military_discharge_papers_file_id,
    w2_forms: JSON.stringify(w2Forms),
    self_employment_tax_returns: JSON.stringify(selfEmploymentTaxReturns),
    workers_comp_proof: JSON.stringify(workersCompProof),
    
    // Progress tracking
    current_step: 13,
    steps_completed: JSON.stringify([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]),
  };

  return applicationData;
}

/**
 * Get user record from auth user
 * User record should already exist (created by database trigger on signup)
 */
async function getUser(supabase, authUser) {
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('auth_id', authUser.id)
    .single();

  if (error || !user) {
    throw new Error('User record not found. Please try logging out and back in.');
  }

  return user;
}

// Configure multer fields for all possible file uploads
const uploadFields = upload.fields([
  { name: 'permanent_resident_card', maxCount: 1 },
  { name: 'social_security_statement', maxCount: 1 },
  { name: 'birth_certificate', maxCount: 1 },
  { name: 'citizenship_proof', maxCount: 1 },
  { name: 'military_discharge_papers', maxCount: 1 },
  { name: 'evidence_documents', maxCount: 20 },
  { name: 'w2_forms', maxCount: 10 },
  { name: 'self_employment_tax_returns', maxCount: 10 },
  { name: 'workers_comp_proof', maxCount: 10 },
]);

/**
 * POST /api/private/applications
 * Submit a new application with all form data and files
 * Creates the application and immediately submits it
 */
router.post('/', uploadFields, async (req, res) => {
  try {
    const supabase = req.app.get('supabase');
    const authUser = req.user;

    // Get user record (created by database trigger on signup)
    const user = await getUser(supabase, authUser);
    const userId = user.id;

    // Generate application ID
    const applicationId = uuidv4();

    // Parse form data
    let formData;
    try {
      formData = JSON.parse(req.body.formData || '{}');
    } catch (e) {
      return res.status(400).json({
        error: 'Invalid form data',
        message: 'Form data must be valid JSON',
      });
    }

    // Upload all files and get their IDs
    const fileIds = await processAllFiles(supabase, req.files, applicationId, userId);

    // Transform form data to database schema
    const applicationData = transformFormDataToSchema(formData, fileIds, userId);
    applicationData.id = applicationId;

    // Hash SSN if provided
    if (formData.ssn) {
      const { data: ssnHash, error: ssnError } = await supabase.rpc('hash_ssn', {
        ssn: formData.ssn,
      });

      if (ssnError) {
        console.error('SSN hashing error:', ssnError);
        // Continue without SSN hash if it fails
      } else {
        applicationData.ssn_hash = ssnHash;
      }
    }

    // Set status to submitted directly
    applicationData.status = 'submitted';
    applicationData.submitted_at = new Date().toISOString();
    applicationData.status_changed_at = new Date().toISOString();

    // Insert application into database
    const { data: application, error: insertError } = await supabase
      .from('applications')
      .insert(applicationData)
      .select()
      .single();

    if (insertError) {
      console.error('Application insert error:', insertError);
      return res.status(500).json({
        error: 'Failed to create application',
        message: insertError.message,
      });
    }

    // Create history record for submission
    const { error: historyError } = await supabase
      .from('application_status_history')
      .insert({
        application_id: applicationId,
        previous_status: null,
        new_status: 'submitted',
        changed_by: userId,
        notes: 'Application submitted',
      });

    if (historyError) {
      console.error('History insert error:', historyError);
      // Non-fatal, continue
    }

    res.status(201).json({
      success: true,
      data: {
        application_id: applicationId,
        status: 'submitted',
        submitted_at: application.submitted_at,
        created_at: application.created_at,
      },
    });
  } catch (error) {
    console.error('Application submission error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

/**
 * GET /api/private/applications
 * Get all applications for the authenticated user
 */
router.get('/', async (req, res) => {
  try {
    const supabase = req.app.get('supabase');
    const authUser = req.user;

    // Get user record
    const user = await getUser(supabase, authUser);

    const { data: applications, error } = await supabase
      .from('applications')
      .select('id, status, status_changed_at, submitted_at, created_at, updated_at, current_step')
      .eq('applicant_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({
        error: 'Failed to fetch applications',
        message: error.message,
      });
    }

    res.json({
      success: true,
      data: applications,
    });
  } catch (error) {
    console.error('Fetch applications error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

/**
 * GET /api/private/applications/:id
 * Get a specific application
 */
router.get('/:id', async (req, res) => {
  try {
    const supabase = req.app.get('supabase');
    const authUser = req.user;
    const applicationId = req.params.id;

    // Get user record
    const user = await getUser(supabase, authUser);

    const { data: application, error } = await supabase
      .from('applications')
      .select('*')
      .eq('id', applicationId)
      .eq('applicant_id', user.id)
      .single();

    if (error || !application) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Application not found',
      });
    }

    res.json({
      success: true,
      data: application,
    });
  } catch (error) {
    console.error('Fetch application error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

module.exports = router;
