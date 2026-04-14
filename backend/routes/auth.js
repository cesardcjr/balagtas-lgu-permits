const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET || 'balagtas_secret_2024', { expiresIn: '7d' });

// Register
router.post('/register', async (req, res) => {
  try {
    const { fullName, address, contactNumber, email, password } = req.body;
    if (!fullName || !address || !contactNumber || !email || !password)
      return res.status(400).json({ message: 'All fields required' });
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already registered' });
    const user = await User.create({ fullName, address, contactNumber, email, password });
    const token = signToken(user._id);
    res.status(201).json({ token, user: { id: user._id, fullName: user.fullName, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ message: 'Invalid credentials' });
    const token = signToken(user._id);
    res.json({ token, user: { id: user._id, fullName: user.fullName, email: user.email, role: user.role, address: user.address, contactNumber: user.contactNumber } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Me
router.get('/me', protect, (req, res) => res.json(req.user));

module.exports = router;
