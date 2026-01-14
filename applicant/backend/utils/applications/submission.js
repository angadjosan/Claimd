/**
 * Shared application submission processing logic
 * Used by both regular and demo routes
 */
const { sendAITaskToSQS } = require('../../utils/sqs');
const { processAllFiles } = require('./fileUpload');
const { transformFormDataToSchema } = require('./formTransform');

/**
 * Process application submission asynchronously
 * This function handles file uploads, data transformation, and final submission
 * 
 * @param {object} options - Processing options
 * @param {object} options.supabase - Supabase client
 * @param {string} options.applicationId - Application UUID
 * @param {string} options.userId - User UUID
 * @param {object} options.formData - Form data from frontend
 * @param {object} options.files - Multer files object
 * @param {string} options.sessionId - Optional demo session ID
 * @param {string} options.logPrefix - Log prefix for debugging (e.g., '[DEMO]' or '[SUBMISSION]')
 */
async function processApplicationSubmission({
  supabase,
  applicationId,
  userId,
  formData,
  files,
  sessionId = null,
  logPrefix = '[SUBMISSION]',
}) {
  const startTime = Date.now();
  console.log(`${logPrefix} Starting async processing for application ${applicationId}`, {
    userId,
    sessionId,
    timestamp: new Date().toISOString(),
  });

  try {
    await supabase
      .from('applications')
      .update({
        status_notes: 'Processing submission...',
        updated_at: new Date().toISOString(),
      })
      .eq('id', applicationId);

    let fileIds;
    try {
      fileIds = await processAllFiles(supabase, files, applicationId, userId);
    } catch (fileError) {
      await supabase
        .from('applications')
        .update({
          status: 'draft',
          status_notes: `Submission failed: ${fileError.message}`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', applicationId);
      throw fileError;
    }

    const applicationData = transformFormDataToSchema(formData, fileIds, userId);
    applicationData.id = applicationId;
    
    // Add demo_session_id if provided
    if (sessionId) {
      applicationData.demo_session_id = sessionId;
    }

    if (formData.ssn) {
      const { data: ssnHash, error: ssnError } = await supabase.rpc('hash_ssn', { ssn: formData.ssn });
      if (!ssnError) {
        applicationData.ssn_hash = ssnHash;
      }
    }

    applicationData.status = 'submitted';
    applicationData.submitted_at = new Date().toISOString();
    applicationData.status_changed_at = new Date().toISOString();
    applicationData.status_notes = null;

    const { data: application, error: updateError } = await supabase
      .from('applications')
      .update(applicationData)
      .eq('id', applicationId)
      .select()
      .single();

    if (updateError) {
      await supabase
        .from('applications')
        .update({
          status: 'draft',
          status_notes: `Submission failed: ${updateError.message}`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', applicationId);
      throw updateError;
    }

    await supabase
      .from('application_status_history')
      .insert({
        application_id: applicationId,
        previous_status: 'draft',
        new_status: 'submitted',
        changed_by: userId,
        notes: sessionId ? 'Application submitted (demo mode)' : 'Application submitted',
      });

    await supabase
      .from('processing_queue')
      .insert({
        application_id: applicationId,
        task_type: 'ai',
        payload: { application_id: applicationId },
        status: 'pending',
      });

    await sendAITaskToSQS(applicationId);

    console.log(`${logPrefix} Successfully completed processing for application ${applicationId}`, {
      duration: `${Date.now() - startTime}ms`,
      sessionId,
    });
  } catch (error) {
    console.error(`${logPrefix} Failed to process application ${applicationId}`, {
      error: error.message,
      sessionId,
    });
    await supabase
      .from('applications')
      .update({
        status: 'draft',
        status_notes: `Submission failed: ${error.message}`,
        updated_at: new Date().toISOString(),
      })
      .eq('id', applicationId);
  }
}

module.exports = {
  processApplicationSubmission,
};
