/**
 * AWS Lambda Handler for Applicant API
 * Wraps the Express app with @vendia/serverless-express
 */
const serverlessExpress = require('@vendia/serverless-express');
const app = require('./App');

exports.handler = serverlessExpress({ app });

