const express = require('express');
const router = express.Router();

let customers = [
  { id: 'cust-1', name: 'Walk-in Customer', phone: null, email: null, visits: 0 },
  { id: 'cust-2', name: 'Ayesha Khan', phone: '+92 300 1234567', email: 'ayesha.k@example.com', visits: 12 },
  { id: 'cust-3', name: 'Fatima Zahra', phone: '+92 321 9876543', email: 'fatima.z@example.com', visits: 8 },
];

router.get('/', (req, res) => {
  const { phone } = req.query;
  if (phone) {
    const cust = customers.find((c) => c.phone === phone);
    return cust ? res.json({ customer: cust }) : res.status(404).json({ error: 'Customer not found' });
  }
  res.json({ customers });
});

router.post('/', (req, res) => {
  const { name, phone, email } = req.body;
  if (!name) return res.status(400).json({ error: 'Customer name is required' });

  const newCust = {
    id: `cust-${Date.now()}`,
    name,
    phone: phone || null,
    email: email || null,
    visits: 1,
  };
  customers.push(newCust);
  res.status(201).json({ customer: newCust });
});

module.exports = router;
