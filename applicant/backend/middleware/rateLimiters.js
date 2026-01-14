/**
 * Rate Limiters for Demo Mode
 * Uses in-memory store for local dev, can be extended to use DynamoDB for production
 */
const rateLimit = require('express-rate-limit');

// In-memory store for rate limiting (for local dev)
// For production, consider using DynamoDB or Redis
const memoryStore = new Map();

// Simple in-memory store implementation
class MemoryStore {
  constructor() {
    this.hits = new Map();
  }

  async increment(key) {
    const now = Date.now();
    const record = this.hits.get(key) || { count: 0, resetTime: now + 3600000 }; // 1 hour default
    
    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + 3600000;
    } else {
      record.count += 1;
    }
    
    this.hits.set(key, record);
    return {
      totalHits: record.count,
      resetTime: new Date(record.resetTime)
    };
  }

  async decrement(key) {
    const record = this.hits.get(key);
    if (record && record.count > 0) {
      record.count -= 1;
      this.hits.set(key, record);
    }
  }

  async resetKey(key) {
    this.hits.delete(key);
  }

  async resetAll() {
    this.hits.clear();
  }

  shutdown() {
    this.resetAll();
  }
}

// Session-based rate limiter (5 submissions per hour per sessionId)
const demoSubmissionRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 submissions per hour per sessionId
  message: {
    error: 'Rate Limit Exceeded',
    message: 'Too many submissions for this demo session. Please wait 1 hour or start a new demo session.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use sessionId from validated header
    return `demo:session:${req.headers['x-demo-session-id']}`;
  },
  store: new MemoryStore()
});

// IP-based rate limiter (safety net - 10 submissions per hour per IP)
const demoIPRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 submissions per hour per IP (allows multiple sessions from same IP)
  message: {
    error: 'Rate Limit Exceeded',
    message: 'Too many submissions from this IP address. Please wait 1 hour.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Get real client IP (handle X-Forwarded-For safely)
    const forwardedFor = req.headers['x-forwarded-for'];
    const clientIP = forwardedFor ? forwardedFor.split(',')[0].trim() : req.ip;
    return `demo:ip:${clientIP}`;
  },
  store: new MemoryStore()
});

// General API rate limiter for demo mode (100 requests per 15 minutes)
const demoAPIRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes per sessionId
  message: {
    error: 'Rate Limit Exceeded',
    message: 'Too many requests for this demo session. Please wait 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return `demo:api:${req.headers['x-demo-session-id']}`;
  },
  store: new MemoryStore()
});

module.exports = {
  demoSubmissionRateLimiter,
  demoIPRateLimiter,
  demoAPIRateLimiter
};
