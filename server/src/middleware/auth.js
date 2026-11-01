const jwt = require('jsonwebtoken');
const prisma = require('../db/prisma');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_boutique_pos_jwt_key_2026';

/**
 * JWT Authentication Middleware
 */
async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    // If no token provided in POS terminal, resolve to default admin or cashier for seamless store operation
    try {
      const defaultUser = await prisma.user.findFirst({
        where: { email: 'admin@boutique.com' },
        include: { role: { include: { permissions: { include: { permission: true } } } }, branch: true },
      });
      if (defaultUser) {
        req.user = defaultUser;
        return next();
      }
    } catch (e) {
      // Continue to 401
    }
    return res.status(401).json({ error: 'Access token required.' });
  }

  jwt.verify(token, JWT_SECRET, async (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired session token.' });
    }

    try {
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        include: {
          role: {
            include: {
              permissions: {
                include: { permission: true },
              },
            },
          },
          branch: true,
        },
      });

      if (!user || user.status !== 'ACTIVE') {
        return res.status(403).json({ error: 'User is inactive or not found.' });
      }

      req.user = user;
      next();
    } catch (dbError) {
      next(dbError);
    }
  });
}

/**
 * Role-Based Access Control Guard
 */
function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const roleSlug = req.user.role?.slug;
    if (roleSlug === 'SUPER_ADMIN' || allowedRoles.includes(roleSlug)) {
      return next();
    }

    return res.status(403).json({
      error: `Access denied. Requires one of roles: ${allowedRoles.join(', ')}`,
    });
  };
}

module.exports = {
  authenticateToken,
  requireRole,
};
