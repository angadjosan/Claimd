/**
 * Private Routes Index
 * All routes here require authentication
 */
const express = require('express');
const router = express.Router();

const { authenticate } = require('../../middleware/auth');

// Apply authentication middleware to all private routes
router.use(authenticate);

// Add caseworker-specific routes here

module.exports = router;

