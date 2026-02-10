/**
 * Demo Routes Index
 * Simplified demo mode - no session management needed
 */
const express = require('express');
const router = express.Router();

/**
 * POST /api/demo/email
 * Save email when user accesses demo (no session required)
 */
router.post('/email', async (req, res) => {
  try {
    const supabase = req.app.get('supabase');
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

    // Insert email into demo_email_tracking table
    const { data, error } = await supabase
      .from('demo_email_tracking')
      .insert({
        email: normalizedEmail,
        demo_session_id: null // No session tracking needed
      })
      .select()
      .single();

    if (error) {
      console.error('[DEMO] Email tracking error:', error);
      return res.status(500).json({
        error: 'Failed to save email',
        message: error.message
      });
    }

    res.json({
      success: true,
      message: 'Email saved successfully',
      data: {
        id: data.id,
        email: data.email
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
