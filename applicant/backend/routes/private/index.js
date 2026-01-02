/**
 * Private Routes Index
 * All routes here require authentication
 */
const express = require('express');
const router = express.Router();

const { authenticate } = require('../../middleware/auth');
const applicationsRoutes = require('./applications');

// Apply authentication middleware to all private routes
router.use(authenticate);

// Application routes
router.use('/applications', applicationsRoutes);

module.exports = router;
