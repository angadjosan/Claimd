/**
 * AWS Lambda Handler for Applicant API
 * Wraps the Express app with @vendia/serverless-express
 */
const serverlessExpress = require('@vendia/serverless-express');
const app = require('./App');

// Configure for API Gateway HTTP API (v2) or REST API (v1)
exports.handler = serverlessExpress({ 
  app,
  binarySettings: {
    isBinary: (contentType) => {
      return /^image\//.test(contentType) || 
             /^application\/(pdf|zip|octet-stream)/.test(contentType);
    }
  }
});

