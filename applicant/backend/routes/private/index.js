/**
 * Private Routes Index
 * All routes here require authentication
 */
const express = require('express');
const router = express.Router();

const { authenticate } = require('../../middleware/auth');

// Apply authentication middleware to all private routes
router.use(authenticate);

// Add private route modules here as needed

module.exports = router;
