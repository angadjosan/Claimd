/**
 * Private Routes Index
 * All routes here require authentication and caseworker role
 */
const express = require('express');
const router = express.Router();

const { authenticate, requireRole } = require('../../middleware/auth');

// Apply authentication and role check middleware to all private routes
router.use(authenticate);
router.use(requireRole(['caseworker', 'administrator'])); // Allow both caseworkers and admins

// Dashboard routes
const dashboardRoutes = require('./dashboard');

router.use('/dashboard', dashboardRoutes);

module.exports = router;

