const express = require('express');
const router = express.Router();
const prisma = require('../db/prisma');
const { authenticateToken } = require('../middleware/auth');

/**
 * GET /api/categories
 */
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const [categories, brands, sizes, colors] = await Promise.all([
      prisma.category.findMany({
        where: { status: 'ACTIVE' },
        include: { _count: { select: { products: true } } },
        orderBy: { name: 'asc' },
      }),
      prisma.brand.findMany({
        where: { status: 'ACTIVE' },
        orderBy: { name: 'asc' },
      }),
      prisma.size.findMany({
        orderBy: { sortOrder: 'asc' },
      }),
      prisma.color.findMany({
        orderBy: { name: 'asc' },
      }),
    ]);

    res.json({ categories, brands, sizes, colors });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/categories
 */
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const { name, description, image } = req.body;
    if (!name) return res.status(400).json({ error: 'Category name is required.' });

    const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString().slice(-4)}`;

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        slug,
        description: description || null,
        image: image || null,
      },
    });

    res.status(201).json({ message: 'Category created successfully.', category });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
