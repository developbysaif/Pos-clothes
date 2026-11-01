const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../db/prisma');
const { authenticateToken } = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_boutique_pos_jwt_key_2026';

/**
 * POST /api/auth/login
 */
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
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
      return res.status(401).json({ error: 'Invalid email or inactive user account.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid password.' });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role.slug,
        branchId: user.branchId,
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        module: 'AUTH',
        details: `User ${user.email} logged in successfully`,
        ipAddress: req.ip,
      },
    });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.slug,
        roleName: user.role.name,
        branch: user.branch,
        permissions: user.role.permissions.map((p) => p.permission.slug),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/auth/me
 */
router.get('/me', authenticateToken, async (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role.slug,
      roleName: req.user.role.name,
      branch: req.user.branch,
      permissions: req.user.role.permissions.map((p) => p.permission.slug),
    },
  });
});

module.exports = router;
