const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, adminOnly } = require('../middleware/auth');

// Seed admin user
router.post('/seed', async (req, res) => {
  try {
    const exists = await User.findOne({ role: 'admin' });
    if (exists) return res.json({ message: 'Admin already exists' });
    await User.create({
      fullName: 'Municipal Engineer',
      address: 'Municipal Hall, Balagtas, Bulacan',
      contactNumber: '09000000000',
      email: 'admin@balagtas.gov.ph',
      password: 'admin123456',
      role: 'admin'
    });
    res.json({ message: 'Admin created: admin@balagtas.gov.ph / admin123456' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all users
router.get('/users', protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find({ role: 'user' }).select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
