/**
 * Public Routes Index
 */
const express = require('express');
const router = express.Router();

const healthRoutes = require('./health');

// Health/status routes
router.use('/health', healthRoutes);

// Add more public route modules here as needed

module.exports = router;

