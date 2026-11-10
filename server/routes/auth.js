const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { generateToken, authenticateToken } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, restaurantName } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password and name are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    // Check if user exists
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const userId = uuidv4();

    db.prepare(`
      INSERT INTO users (id, email, password, name, restaurant_name)
      VALUES (?, ?, ?, ?, ?)
    `).run(userId, email.toLowerCase(), hashedPassword, name, restaurantName || null);

    const user = db.prepare('SELECT id, email, name, restaurant_name, created_at FROM users WHERE id = ?').get(userId);
    const token = generateToken({ id: user.id, email: user.email });

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        restaurantName: user.restaurant_name,
      },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken({ id: user.id, email: user.email });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        restaurantName: user.restaurant_name,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, (req, res) => {
  try {
    const user = db.prepare('SELECT id, email, name, restaurant_name, created_at FROM users WHERE id = ?').get(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      restaurantName: user.restaurant_name,
      createdAt: user.created_at,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// PUT /api/auth/profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name, restaurantName } = req.body;
    db.prepare(`
      UPDATE users SET name = ?, restaurant_name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(name || null, restaurantName || null, req.user.id);

    const user = db.prepare('SELECT id, email, name, restaurant_name FROM users WHERE id = ?').get(req.user.id);
    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      restaurantName: user.restaurant_name,
    });
  } catch (err) {
    res.status(500).json({ error: 'Profile update failed' });
  }
});

module.exports = router;
