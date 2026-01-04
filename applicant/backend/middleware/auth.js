/**
 * Authentication Middleware
 * Handles JWT verification via Supabase
 */

/**
 * Extracts the Bearer token from the Authorization header
 */
const extractBearerToken = (authHeader) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
};

/**
 * Main authentication middleware
 * Verifies the JWT token and attaches user info to the request
 */
const authenticate = async (req, res, next) => {
  try {
    const token = extractBearerToken(req.headers.authorization);

    if (!token) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No authentication token provided'
      });
    }

    const supabase = req.app.get('supabase');
    
    // Verify the JWT token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired token'
      });
    }

    // Attach user and token to request object
    req.user = user;
    req.token = token;

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Authentication failed'
    });
  }
};

/**
 * Optional authentication middleware
 * Attempts to authenticate but doesn't fail if no token is provided
 */
const optionalAuth = async (req, res, next) => {
  try {
    const token = extractBearerToken(req.headers.authorization);

    if (!token) {
      req.user = null;
      return next();
    }

    const supabase = req.app.get('supabase');
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (!error && user) {
      req.user = user;
      req.token = token;
    } else {
      req.user = null;
    }

    next();
  } catch (error) {
    req.user = null;
    next();
  }
};

/**
 * Role-based authorization middleware factory
 * @param {string[]} allowedRoles - Array of roles that are allowed access
 */
const requireRole = (allowedRoles) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    try {
      const supabase = req.app.get('supabase');
      
      // Fetch user role from your users table using auth_id
      const { data: userData, error } = await supabase
        .from('users')
        .select('role, id')
        .eq('auth_id', req.user.id)
        .single();

      if (error || !userData) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'User role not found'
        });
      }

      if (!allowedRoles.includes(userData.role)) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Insufficient permissions'
        });
      }

      req.userRole = userData.role;
      req.userDbId = userData.id; // Store database user ID for queries
      next();
    } catch (error) {
      console.error('Role check error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to verify permissions'
      });
    }
  };
};

module.exports = {
  authenticate,
  optionalAuth,
  requireRole,
  extractBearerToken
};
