/**
 * Demo Mode Middleware
 * Simplified - no session management needed
 * ONLY works on routes starting with /api/demo/*
 */
const rateLimit = require('express-rate-limit');

/**
 * Simple rate limiter for demo endpoints
 */
const demoRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    error: 'Too many requests',
    message: 'Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.ip || req.headers['x-forwarded-for'] || 'unknown';
  }
});

/**
 * Demo Mode Middleware
 * Validates demo mode header and attaches demo user info to request
 * NOTE: Demo IDs are hardcoded here for simplicity.
 */
const DEMO_CASEWORKER_USER_ID = '382d0573-1ba9-43f9-9697-9fc9291ba42a';

const demoModeMiddleware = async (req, res, next) => {
  // 1. For email endpoint, no header required (public demo entry point)
  // When mounted at /api/demo or /demo, the path here will be just "/email"
  if (req.path === '/email') {
    // Apply rate limiting
    return demoRateLimiter(req, res, () => {
      req.isDemoMode = true;
      req.demoCaseworkerId = DEMO_CASEWORKER_USER_ID;
      
      next();
    });
  }

  // 2. For other demo endpoints, validate X-Demo-Mode header
  const demoModeHeader = req.headers['x-demo-mode'];
  if (demoModeHeader !== 'true') {
    return res.status(400).json({
      error: 'Invalid Demo Mode',
      message: 'X-Demo-Mode header must be exactly "true"'
    });
  }

  // 3. Apply rate limiting
  return demoRateLimiter(req, res, () => {
    // 5. Get real client IP (handle X-Forwarded-For safely)
    const clientIP = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || 'unknown';

    // 6. Attach demo user info to req object
    req.isDemoMode = true;
    req.demoCaseworkerId = DEMO_CASEWORKER_USER_ID;
    req.demoClientIP = clientIP;

    // 7. Log demo mode access for audit
    console.log('[DEMO] Demo mode request', {
      path: req.path,
      method: req.method,
      clientIP,
      timestamp: new Date().toISOString()
    });

    // 8. Continue to route handler (skips normal auth middleware)
    next();
  });
};

module.exports = demoModeMiddleware;
