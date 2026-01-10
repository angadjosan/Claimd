/**
 * SQS Utility Functions
 * Handles sending messages to SQS queue for AI processing tasks
 */
const AWS = require('aws-sdk');

// Initialize SQS client
// In Lambda, AWS SDK is available; in local dev, use credentials from env
const sqs = new AWS.SQS({
  region: process.env.AWS_REGION || 'us-east-1',
  // In Lambda, credentials are automatically provided via IAM role
  // For local development, use AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY from env
});

const SQS_QUEUE_URL = process.env.SQS_QUEUE_URL;

/**
 * Send an AI processing task to SQS queue
 * @param {string} applicationId - Application UUID
 * @returns {Promise<object>} - SQS send message response or null if failed
 */
async function sendAITaskToSQS(applicationId) {
  if (!SQS_QUEUE_URL) {
    console.warn('[SQS] SQS_QUEUE_URL not configured. Skipping SQS message send.');
    return null;
  }

  try {
    const messageBody = {
      task_type: 'ai',
      application_id: applicationId,
      payload: {
        application_id: applicationId
      }
    };

    const params = {
      QueueUrl: SQS_QUEUE_URL,
      MessageBody: JSON.stringify(messageBody)
    };

    const result = await sqs.sendMessage(params).promise();
    console.log(`[SQS] Successfully sent AI task to SQS for application ${applicationId}`, {
      messageId: result.MessageId,
      queueUrl: SQS_QUEUE_URL
    });

    return result;
  } catch (error) {
    console.error(`[SQS] Failed to send AI task to SQS for application ${applicationId}:`, {
      error: error.message,
      code: error.code,
      queueUrl: SQS_QUEUE_URL
    });
    // Don't throw - this is non-fatal, processing_queue insert will still work
    return null;
  }
}

module.exports = {
  sendAITaskToSQS
};

