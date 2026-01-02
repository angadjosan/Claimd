/**
 * Public Health Check Routes
 */
const express = require('express');
const router = express.Router();

/**
 * GET /api/public/health
 * Basic health check
 */
router.get('/', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /api/public/health/detailed
 * Detailed health check with service statuses
 */
router.get('/detailed', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      database: 'unknown'
    }
  };

  try {
    const supabase = req.app.get('supabase');

    // Check database connection
    const { error: dbError } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    health.services.database = dbError ? 'unhealthy' : 'healthy';
    health.status = health.services.database === 'healthy' ? 'healthy' : 'degraded';

    res.status(health.status === 'healthy' ? 200 : 503).json(health);
  } catch (error) {
    console.error('Health check error:', error);
    health.status = 'unhealthy';
    res.status(503).json(health);
  }
});

/**
 * GET /api/public/health/ready
 * Readiness probe
 */
router.get('/ready', async (req, res) => {
  try {
    const supabase = req.app.get('supabase');
    
    const { error } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    if (error) {
      return res.status(503).json({
        ready: false,
        message: 'Database connection failed'
      });
    }

    res.status(200).json({
      ready: true,
      message: 'Service is ready'
    });
  } catch (error) {
    res.status(503).json({
      ready: false,
      message: 'Service is not ready'
    });
  }
});

/**
 * GET /api/public/health/live
 * Liveness probe
 */
router.get('/live', (req, res) => {
  res.status(200).json({
    alive: true,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
