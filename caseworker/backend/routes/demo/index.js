/**
 * Demo Routes Index
 * All routes here use demo middleware (no normal auth required)
 */
const express = require('express');
const router = express.Router();

const dashboardRoutes = require('./dashboard');

// Dashboard routes (demo mode)
router.use('/dashboard', dashboardRoutes);

module.exports = router;
