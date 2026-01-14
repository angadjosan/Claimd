/**
 * Demo Routes Index
 * All routes here use demo middleware (no normal auth required)
 */
const express = require('express');
const router = express.Router();

const applicationsRoutes = require('./applications');

// Application routes (demo mode)
router.use('/applications', applicationsRoutes);

module.exports = router;
