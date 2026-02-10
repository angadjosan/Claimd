/**
 * Demo Routes Index
 * Simplified demo mode - no session management needed
 */
const express = require('express');
const router = express.Router();

/**
 * POST /api/demo/email
 * Capture email when user accesses demo (no real persistence)
 */
router.post('/email', async (req, res) => {
  try {
    const { email } = req.body;

    // Validate email
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({
        error: 'Invalid email',
        message: 'Please provide a valid email address'
      });
    }

    // Normalize email (lowercase, trim)
    const normalizedEmail = email.toLowerCase().trim();

    // For demo, DO NOT persist to the database.
    // Just log that we "captured" the email so analytics
    // can still be inferred from logs without real writes.
    console.log('[DEMO] Email captured (not persisted to DB)', {
      email: normalizedEmail,
      timestamp: new Date().toISOString(),
      demoClientIP: req.demoClientIP || null,
    });

    res.json({
      success: true,
      message: 'Email captured successfully (demo only, not stored)',
      data: {
        email: normalizedEmail
      }
    });
  } catch (error) {
    console.error('[DEMO] Email tracking error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

// Application routes (demo mode)
router.use('/applications', require('./applications'));

module.exports = router;
