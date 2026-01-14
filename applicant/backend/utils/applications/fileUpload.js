/**
 * Shared file upload utilities for application routes
 * Used by both regular and demo routes
 */
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');

/**
 * Configure multer for memory storage
 */
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit per file
    files: 50, // Max 50 files per request
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
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
 * Multer fields configuration for all possible file uploads
 */
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
 * Upload a single file to Supabase Storage
 */
async function uploadFileToStorage(supabase, file, applicationId, userId, category, metadata = {}) {
  const fileId = uuidv4();
  const fileExtension = file.originalname.split('.').pop() || 'pdf';
  const storagePath = `${userId}/${applicationId}/${category}/${fileId}.${fileExtension}`;
  const bucketName = 'application-files';

  const { error: uploadError } = await supabase.storage
    .from(bucketName)
    .upload(storagePath, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Failed to upload file: ${uploadError.message}`);
  }

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

  const { error: insertError } = await supabase
    .from('application_files')
    .insert(fileRecord);

  if (insertError) {
    await supabase.storage.from(bucketName).remove([storagePath]);
    throw new Error(`Failed to save file record: ${insertError.message}`);
  }

  return fileRecord;
}

/**
 * Process and upload all files from the form submission
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

  const singleFileFields = [
    { field: 'permanent_resident_card', category: 'identification', idField: 'permanent_resident_card_file_id' },
    { field: 'social_security_statement', category: 'social_security', idField: 'social_security_statement_file_id' },
    { field: 'birth_certificate', category: 'birth_certificate', idField: 'birth_certificate_file_id' },
    { field: 'citizenship_proof', category: 'citizenship', idField: 'citizenship_proof_file_id' },
    { field: 'military_discharge_papers', category: 'military', idField: 'military_discharge_papers_file_id' },
  ];

  for (const { field, category, idField } of singleFileFields) {
    if (files[field] && files[field][0]) {
      const uploaded = await uploadFileToStorage(supabase, files[field][0], applicationId, userId, category);
      fileIds[idField] = uploaded.id;
    }
  }

  if (files['evidence_documents']) {
    for (let i = 0; i < files['evidence_documents'].length; i++) {
      const file = files['evidence_documents'][i];
      const uploaded = await uploadFileToStorage(supabase, file, applicationId, userId, 'medical_evidence', { description: file.originalname });
      fileIds.evidence_documents.push({
        file_id: uploaded.id,
        document_type: 'other',
      });
    }
  }

  if (files['w2_forms']) {
    for (let i = 0; i < files['w2_forms'].length; i++) {
      const file = files['w2_forms'][i];
      const yearMatch = file.fieldname.match(/w2_forms\[(\d+)\]/) || file.originalname.match(/(\d{4})/);
      const year = yearMatch ? parseInt(yearMatch[1]) : null;
      const uploaded = await uploadFileToStorage(supabase, file, applicationId, userId, 'w2_forms', { document_year: year });
      fileIds.w2_forms.push({
        file_id: uploaded.id,
        year,
      });
    }
  }

  if (files['self_employment_tax_returns']) {
    for (let i = 0; i < files['self_employment_tax_returns'].length; i++) {
      const file = files['self_employment_tax_returns'][i];
      const yearMatch = file.fieldname.match(/self_employment_tax_returns\[(\d+)\]/) || file.originalname.match(/(\d{4})/);
      const year = yearMatch ? parseInt(yearMatch[1]) : null;
      const uploaded = await uploadFileToStorage(supabase, file, applicationId, userId, 'self_employment_tax_returns', { document_year: year });
      fileIds.self_employment_tax_returns.push({
        file_id: uploaded.id,
        year,
      });
    }
  }

  if (files['workers_comp_proof']) {
    for (let i = 0; i < files['workers_comp_proof'].length; i++) {
      const file = files['workers_comp_proof'][i];
      const uploaded = await uploadFileToStorage(supabase, file, applicationId, userId, 'workers_comp_proof');
      fileIds.workers_comp_proof.push({
        file_id: uploaded.id,
        type: 'other',
      });
    }
  }

  return fileIds;
}

/**
 * Middleware to handle multer errors
 */
function handleMulterError(err, req, res, next) {
  if (err) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File Too Large',
        message: 'File size exceeds the 10MB limit.',
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        error: 'Too Many Files',
        message: 'Number of files exceeds the allowed limit.',
      });
    }
    if (err.name === 'MulterError') {
      return res.status(400).json({
        error: 'Upload Error',
        message: err.message || 'File upload failed.',
      });
    }
    if (err.message && err.message.includes('Invalid file type')) {
      return res.status(400).json({
        error: 'Invalid File Type',
        message: err.message,
      });
    }
  }
  next(err);
}

/**
 * Middleware to validate total request size
 */
function validateTotalRequestSize(req, res, next) {
  const MAX_TOTAL_SIZE = 100 * 1024 * 1024; // 100MB total
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB per file
  
  if (!req.files || Object.keys(req.files).length === 0) {
    return next();
  }

  let totalSize = 0;
  const oversizedFiles = [];

  for (const fieldName in req.files) {
    const files = Array.isArray(req.files[fieldName]) ? req.files[fieldName] : [req.files[fieldName]];
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        oversizedFiles.push({ name: file.originalname, size: file.size, maxSize: MAX_FILE_SIZE });
      }
      totalSize += file.size;
    }
  }

  if (oversizedFiles.length > 0) {
    return res.status(400).json({
      error: 'File Too Large',
      message: `The following file(s) exceed the 10MB limit: ${oversizedFiles.map(f => f.name).join(', ')}`,
    });
  }

  if (totalSize > MAX_TOTAL_SIZE) {
    return res.status(400).json({
      error: 'Request Too Large',
      message: `Total upload size (${(totalSize / 1024 / 1024).toFixed(2)}MB) exceeds the ${(MAX_TOTAL_SIZE / 1024 / 1024)}MB limit.`,
    });
  }

  next();
}

module.exports = {
  uploadFields,
  processAllFiles,
  handleMulterError,
  validateTotalRequestSize,
};
