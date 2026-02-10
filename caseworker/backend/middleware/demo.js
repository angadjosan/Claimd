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
 */
const demoModeMiddleware = async (req, res, next) => {
  // 1. Route-based check: ONLY works on /api/demo/* routes
  if (!req.path.startsWith('/api/demo/') && !req.path.startsWith('/demo/')) {
    // If not a demo route, ignore demo headers and continue to normal auth
    return next();
  }

  // 2. For email endpoint, no header required (public demo entry point)
  if (req.path === '/api/demo/email' || req.path === '/demo/email') {
    // Apply rate limiting
    return demoRateLimiter(req, res, () => {
      // Load demo user IDs from env vars
      const demoCaseworkerId = process.env.DEMO_CASEWORKER_USER_ID;
      
      if (!demoCaseworkerId) {
        console.error('Demo caseworker ID not configured');
        return res.status(500).json({
          error: 'Demo Mode Unavailable',
          message: 'Demo mode is not properly configured'
        });
      }

      req.isDemoMode = true;
      req.demoCaseworkerId = demoCaseworkerId;
      
      next();
    });
  }

  // 3. For other demo endpoints, validate X-Demo-Mode header
  const demoModeHeader = req.headers['x-demo-mode'];
  if (demoModeHeader !== 'true') {
    return res.status(400).json({
      error: 'Invalid Demo Mode',
      message: 'X-Demo-Mode header must be exactly "true"'
    });
  }

  // 4. Apply rate limiting
  return demoRateLimiter(req, res, () => {
    // 5. Load demo user IDs from env vars
    const demoCaseworkerId = process.env.DEMO_CASEWORKER_USER_ID;

    if (!demoCaseworkerId) {
      console.error('Demo caseworker ID not configured');
      return res.status(500).json({
        error: 'Demo Mode Unavailable',
        message: 'Demo mode is not properly configured'
      });
    }

    // 6. Get real client IP (handle X-Forwarded-For safely)
    const clientIP = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || 'unknown';

    // 7. Attach demo user info to req object
    req.isDemoMode = true;
    req.demoCaseworkerId = demoCaseworkerId;
    req.demoClientIP = clientIP;

    // 8. Log demo mode access for audit
    console.log('[DEMO] Demo mode request', {
      path: req.path,
      method: req.method,
      clientIP,
      timestamp: new Date().toISOString()
    });

    // 9. Continue to route handler (skips normal auth middleware)
    next();
  });
};

module.exports = demoModeMiddleware;
