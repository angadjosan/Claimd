/**
 * Private Routes Index
 * All routes here require authentication and applicant role
 */
const express = require('express');
const router = express.Router();

const { authenticate, requireRole } = require('../../middleware/auth');
const applicationsRoutes = require('./applications');

// Apply authentication and role check middleware to all private routes
router.use(authenticate);
router.use(requireRole(['applicant'])); // Only applicants can access

// Application routes
router.use('/applications', applicationsRoutes);

module.exports = router;
