require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createClient } = require('@supabase/supabase-js');

const publicRoutes = require('./routes/public');
const privateRoutes = require('./routes/private');
const demoModeMiddleware = require('./middleware/demo');

const app = express();
const PORT = process.env.PORT || 3001;

// ============================================
// Supabase Client Configuration
// ============================================
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

let supabase = null;
if (supabaseUrl && supabaseServiceKey) {
  // Service client (bypasses RLS)
  supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
} else {
  console.warn('Missing Supabase configuration. Some features may not work.');
}

// Make Supabase client available to routes
app.set('supabase', supabase);

// ============================================
// Middleware
// ============================================
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================
// Rate Limiters
// ============================================

// Public routes rate limiter - more restrictive
const publicRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.ip || req.headers['x-forwarded-for'] || 'unknown';
  }
});

// Private routes rate limiter - less restrictive for authenticated users
const privateRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // 500 requests per window
  message: {
    error: 'Too many requests, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use user ID if available, otherwise fall back to IP
    return req.user?.id || req.ip || req.headers['x-forwarded-for'] || 'unknown';
  }
});

// Heavy rate limiter for application submissions (DB writes)
// More lenient in development, stricter in production
const submissionWindow = process.env.NODE_ENV === 'production' 
  ? 60 * 60 * 1000  // 1 hour in production
  : 5 * 60 * 1000;  // 5 minutes in development

const submissionMax = process.env.NODE_ENV === 'production' 
  ? 1   // 1 submission per hour in production
  : 100; // 10 submissions per 5 minutes in development

const applicationSubmissionRateLimiter = rateLimit({
  windowMs: submissionWindow,
  max: submissionMax,
  message: {
    error: 'Too many application submissions. Please wait before submitting again.',
    retryAfter: process.env.NODE_ENV === 'production' ? '1 hour' : '5 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use user ID for per-user rate limiting
    return req.user?.id || req.ip || req.headers['x-forwarded-for'] || 'unknown';
  }
});

// Auth routes rate limiter - very restrictive to prevent brute force
const authRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 requests per hour
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Export rate limiters for use in routes
app.set('publicRateLimiter', publicRateLimiter);
app.set('privateRateLimiter', privateRateLimiter);
app.set('authRateLimiter', authRateLimiter);
app.set('applicationSubmissionRateLimiter', applicationSubmissionRateLimiter);

// ============================================
// Routes
// ============================================

// Health check endpoint - support both /health and /api/health
// API Gateway may strip /api base path, so we support both
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Demo routes (with demo middleware - MUST be before private routes)
// Demo middleware only activates on /api/demo/* routes
const demoRoutes = require('./routes/demo');
app.use('/api/demo', demoModeMiddleware, demoRoutes);
app.use('/demo', demoModeMiddleware, demoRoutes);

// Public routes (with public rate limiter)
// Support both /api/public and /public (for when API Gateway strips /api)
app.use('/api/public', publicRateLimiter, publicRoutes);
app.use('/public', publicRateLimiter, publicRoutes);

// Private routes (with private rate limiter)
// Support both /api/private and /private (for when API Gateway strips /api)
app.use('/api/private', privateRateLimiter, privateRoutes);
app.use('/private', privateRateLimiter, privateRoutes);

// ============================================
// Error Handling
// ============================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);

  // Handle specific error types
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or expired token'
    });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      message: err.message
    });
  }

  // Default error response
  res.status(err.status || 500).json({
    error: err.name || 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred' 
      : err.message
  });
});

// ============================================
// Server Start
// ============================================
// Only start server if not running in Lambda
if (!process.env.AWS_LAMBDA_FUNCTION_NAME) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  });
}

module.exports = app;
