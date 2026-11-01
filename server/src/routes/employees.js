const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const prisma = require('../db/prisma');
const { authenticateToken, requireRole } = require('../middleware/auth');

/**
 * GET /api/employees
 */
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const [users, roles, branches] = await Promise.all([
      prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          status: true,
          roleId: true,
          branchId: true,
          createdAt: true,
          role: true,
          branch: true,
        },
      }),
      prisma.role.findMany({
        include: { permissions: { include: { permission: true } } },
      }),
      prisma.branch.findMany({ where: { status: 'ACTIVE' } }),
    ]);

    res.json({ users, roles, branches });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/employees
 */
router.post('/', authenticateToken, requireRole(['SUPER_ADMIN']), async (req, res, next) => {
  try {
    const { name, email, password, roleId, branchId, phone } = req.body;
    if (!name || !email || !password || !roleId) {
      return res.status(400).json({ error: 'Name, email, password, and role are required.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: hashedPassword,
        roleId,
        branchId: branchId || null,
        phone: phone ? phone.trim() : null,
        status: 'ACTIVE',
      },
      include: { role: true, branch: true },
    });

    res.status(201).json({
      message: 'Staff member created successfully.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.name,
        branch: user.branch?.name,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/employees/:id
 */
router.put('/:id', authenticateToken, requireRole(['SUPER_ADMIN']), async (req, res, next) => {
  try {
    const { name, phone, roleId, branchId, status, password } = req.body;

    const updateData = {
      ...(name && { name: name.trim() }),
      ...(phone !== undefined && { phone: phone ? phone.trim() : null }),
      ...(roleId && { roleId }),
      ...(branchId !== undefined && { branchId: branchId || null }),
      ...(status && { status }),
    };

    if (password && password.trim().length >= 6) {
      updateData.password = await bcrypt.hash(password.trim(), 10);
    }

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: updateData,
      include: { role: true, branch: true },
    });

    res.json({ message: 'User updated successfully.', user: updated });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
