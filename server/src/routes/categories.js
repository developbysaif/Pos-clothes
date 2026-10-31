const express = require('express');
const router = express.Router();

let categories = [
  { id: 'cat-1', name: 'Kurtis & Tunics', description: 'Casual and semi-formal tunics' },
  { id: 'cat-2', name: 'Party Wear Gowns', description: 'Heavy embroidered gowns & lehengas' },
  { id: 'cat-3', name: 'Dupattas & Shawls', description: 'Chiffon, Banarasi, & Pashmina shawls' },
  { id: 'cat-4', name: 'Stitched Suits', description: '2-piece & 3-piece ready to wear suits' },
];

router.get('/', (req, res) => {
  res.json({ categories });
});

router.post('/', (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Category name is required' });
  const newCat = { id: `cat-${Date.now()}`, name, description };
  categories.push(newCat);
  res.status(201).json({ category: newCat });
});

module.exports = router;
