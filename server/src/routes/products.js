const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// In-memory / Mock products store with same attributes as PostgreSQL
let products = [
  {
    id: 'prod-101',
    sku: '890123456001',
    name: 'Embroidered Silk Kurti (Rose Pink)',
    category: 'Kurtis & Tunics',
    cost_price: 18.0,
    price: 34.99,
    stock: 14,
    size: 'M',
    color: 'Rose Pink',
  },
  {
    id: 'prod-102',
    sku: '890123456002',
    name: 'Floral Print Cotton Kurta (Sky Blue)',
    category: 'Kurtis & Tunics',
    cost_price: 12.0,
    price: 24.5,
    stock: 22,
    size: 'L',
    color: 'Sky Blue',
  },
  {
    id: 'prod-103',
    sku: '890123456003',
    name: 'Velvet Bridal Lehenga (Burgundy Maroon)',
    category: 'Party Wear Gowns',
    cost_price: 95.0,
    price: 189.99,
    stock: 5,
    size: 'Free Size',
    color: 'Burgundy',
  },
];

// GET /api/products - Supports ?sku= or ?search=
router.get('/', (req, res) => {
  const { sku, search, category } = req.query;

  let results = [...products];

  if (sku) {
    const item = results.find((p) => p.sku === sku);
    return item
      ? res.json({ product: item })
      : res.status(404).json({ error: `Product with SKU ${sku} not found` });
  }

  if (category && category !== 'ALL') {
    results = results.filter((p) => p.category === category);
  }

  if (search) {
    const s = search.toLowerCase();
    results = results.filter(
      (p) => p.name.toLowerCase().includes(s) || p.sku.includes(s)
    );
  }

  res.json({ count: results.length, products: results });
});

// GET /api/products/:id
router.get('/:id', (req, res) => {
  const item = products.find((p) => p.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'Product not found' });
  res.json({ product: item });
});

// POST /api/products
router.post('/', authenticateToken, authorizeRoles('admin', 'manager'), (req, res) => {
  const { sku, name, price, stock, category, size, color } = req.body;

  if (!sku || !name || price === undefined) {
    return res.status(400).json({ error: 'SKU, name, and price are required fields.' });
  }

  const existing = products.find((p) => p.sku === sku);
  if (existing) {
    return res.status(409).json({ error: 'A product with this SKU already exists.' });
  }

  const newProduct = {
    id: `prod-${Date.now()}`,
    sku,
    name,
    price: Number(price),
    stock: Number(stock) || 0,
    category: category || 'General',
    size: size || 'Standard',
    color: color || 'Standard',
  };

  products.push(newProduct);

  // Broadcast stock update via Socket.IO
  const io = req.app.get('io');
  if (io) {
    io.emit('stock:updated', { product: newProduct });
  }

  res.status(201).json({ message: 'Product created', product: newProduct });
});

// PUT /api/products/:id
router.put('/:id', authenticateToken, authorizeRoles('admin', 'manager'), (req, res) => {
  const index = products.findIndex((p) => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Product not found' });

  products[index] = { ...products[index], ...req.body };
  res.json({ message: 'Product updated', product: products[index] });
});

// DELETE /api/products/:id
router.delete('/:id', authenticateToken, authorizeRoles('admin'), (req, res) => {
  const initialLength = products.length;
  products = products.filter((p) => p.id !== req.params.id);
  if (products.length === initialLength) {
    return res.status(404).json({ error: 'Product not found' });
  }
  res.json({ message: 'Product deleted' });
});

module.exports = router;
