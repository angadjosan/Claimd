/**
 * Demo Mode Middleware
 * MUST be placed BEFORE auth middleware in route chain
 * ONLY works on routes starting with /api/demo/*
 */
const { v4: uuidv4, validate: uuidValidate } = require('uuid');

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SESSION_EXPIRY_HOURS = 24;

/**
 * Demo Mode Middleware
 * Validates demo mode headers and attaches demo user info to request
 */
const demoModeMiddleware = async (req, res, next) => {
  // 1. Route-based check: ONLY works on /api/demo/* routes
  if (!req.path.startsWith('/api/demo/') && !req.path.startsWith('/demo/')) {
    // If not a demo route, ignore demo headers and continue to normal auth
    return next();
  }

  // 2. Validate X-Demo-Mode header (must be exactly "true", case-sensitive)
  const demoModeHeader = req.headers['x-demo-mode'];
  if (demoModeHeader !== 'true') {
    return res.status(400).json({
      error: 'Invalid Demo Mode',
      message: 'X-Demo-Mode header must be exactly "true"'
    });
  }

  // 3. Validate X-Demo-Session-Id (must be valid UUID v4 format)
  const sessionId = req.headers['x-demo-session-id'];
  if (!sessionId) {
    return res.status(400).json({
      error: 'Missing Session ID',
      message: 'X-Demo-Session-Id header is required'
    });
  }

  // Validate UUID v4 format
  if (!UUID_V4_REGEX.test(sessionId) || !uuidValidate(sessionId)) {
    return res.status(400).json({
      error: 'Invalid Session ID',
      message: 'X-Demo-Session-Id must be a valid UUID v4'
    });
  }

  // 4. Check rate limits per sessionId AND per IP (dual-layer)
  // Both must pass
  try {
    const { demoSubmissionRateLimiter, demoIPRateLimiter, demoAPIRateLimiter } = require('./rateLimiters');
    
    // Apply general API rate limiter first
    await new Promise((resolve, reject) => {
      demoAPIRateLimiter(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // For submission endpoints, also check submission and IP rate limiters
    if (req.method === 'POST' && req.path.includes('/applications')) {
      await Promise.all([
        new Promise((resolve, reject) => {
          demoSubmissionRateLimiter(req, res, (err) => {
            if (err) reject(err);
            else resolve();
          });
        }),
        new Promise((resolve, reject) => {
          demoIPRateLimiter(req, res, (err) => {
            if (err) reject(err);
            else resolve();
          });
        })
      ]);
    }
  } catch (rateLimitError) {
    // Rate limiter already sent response
    return;
  }

  // 5. Load demo user IDs from env vars (NEVER from headers)
  const demoApplicantId = process.env.DEMO_APPLICANT_USER_ID;
  const demoCaseworkerId = process.env.DEMO_CASEWORKER_USER_ID;

  if (!demoApplicantId || !demoCaseworkerId) {
    console.error('Demo user IDs not configured');
    return res.status(500).json({
      error: 'Demo Mode Unavailable',
      message: 'Demo mode is not properly configured'
    });
  }

  // 6. Get real client IP (handle X-Forwarded-For safely)
  const clientIP = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || 'unknown';

  // 7. Attach demo user info to req object
  req.isDemoMode = true;
  req.demoSessionId = sessionId;  // Validated UUID v4
  req.demoApplicantId = demoApplicantId;  // From env var
  req.demoCaseworkerId = demoCaseworkerId;  // From env var
  req.demoClientIP = clientIP;

  // 8. Log demo mode access for audit
  console.log('[DEMO] Demo mode request', {
    path: req.path,
    method: req.method,
    sessionId,
    clientIP,
    timestamp: new Date().toISOString()
  });

  // 9. Continue to route handler (skips normal auth middleware)
  next();
};

module.exports = demoModeMiddleware;
