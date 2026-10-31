const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'boutique_pos_super_secret_jwt_key_2026';

/**
 * Middleware to verify JWT authentication token
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required. Please sign in.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired session token.' });
    }
    req.user = user;
    next();
  });
}

/**
 * Role-based authorization middleware
 */
function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access forbidden: requires ${allowedRoles.join(' or ')} privilege.`,
      });
    }
    next();
  };
}

module.exports = { authenticateToken, authorizeRoles, JWT_SECRET };
