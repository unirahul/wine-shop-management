const express = require('express');
const router = express.Router();
const { db } = require('../database');

// POST /api/auth/login - Branch-wise user login
router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Username and password are required' });
    }

    const trimmedUsername = username.trim().toLowerCase();

    // Query user with joined branch details
    const user = db.prepare(`
      SELECT 
        u.id,
        u.username,
        u.password,
        u.name,
        u.role,
        u.branch_id,
        u.phone,
        u.email,
        u.is_active,
        b.name as branch_name,
        b.code as branch_code,
        b.type as branch_type,
        b.is_warehouse
      FROM users u
      LEFT JOIN branches b ON u.branch_id = b.id
      WHERE LOWER(u.username) = ?
    `).get(trimmedUsername);

    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid username or password' });
    }

    if (!user.is_active) {
      return res.status(403).json({ success: false, error: 'This user account has been deactivated. Please contact administrator.' });
    }

    // Verify password (in production bcrypt can be used; simple plain/hashed compare here)
    if (user.password !== password.trim()) {
      return res.status(401).json({ success: false, error: 'Invalid username or password' });
    }

    // Return safe user object (without password)
    const safeUser = {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role, // 'admin', 'manager', 'cashier'
      branch_id: user.branch_id, // null for super admin (all branches), or number
      branch_name: user.branch_name || (user.role === 'admin' ? 'All Outlets (Super Admin)' : 'Central'),
      branch_code: user.branch_code || (user.role === 'admin' ? 'ALL' : 'MAIN'),
      branch_type: user.branch_type || 'Consolidated',
      is_warehouse: Boolean(user.is_warehouse),
      phone: user.phone,
      email: user.email,
      login_time: new Date().toISOString()
    };

    res.json({
      success: true,
      user: safeUser,
      message: `Welcome ${safeUser.name}! Logged in successfully.`
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/auth/users - List all users and assigned branches
router.get('/users', (req, res) => {
  try {
    const users = db.prepare(`
      SELECT 
        u.id,
        u.username,
        u.name,
        u.role,
        u.branch_id,
        u.phone,
        u.email,
        u.is_active,
        u.created_at,
        b.name as branch_name,
        b.code as branch_code
      FROM users u
      LEFT JOIN branches b ON u.branch_id = b.id
      ORDER BY u.id ASC
    `).all();

    res.json({ success: true, users });
  } catch (err) {
    console.error('Fetch users error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/auth/users - Create new branch user / staff member
router.post('/users', (req, res) => {
  try {
    const { username, password, name, role, branch_id, phone, email } = req.body;

    if (!username || !password || !name) {
      return res.status(400).json({ success: false, error: 'Username, password and full name are required' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE LOWER(username) = ?').get(username.trim().toLowerCase());
    if (existing) {
      return res.status(400).json({ success: false, error: 'A user with this username already exists' });
    }

    const assignedBranchId = role === 'admin' ? null : (branch_id ? Number(branch_id) : null);

    const stmt = db.prepare(`
      INSERT INTO users (username, password, name, role, branch_id, phone, email, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `);

    const result = stmt.run(
      username.trim().toLowerCase(),
      password.trim(),
      name.trim(),
      role || 'cashier',
      assignedBranchId,
      phone || null,
      email || null
    );

    res.json({
      success: true,
      userId: result.lastInsertRowid,
      message: `Staff member "${name}" registered successfully`
    });
  } catch (err) {
    console.error('Create user error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/auth/users/:id - Update user, password, role or branch assignment
router.put('/users/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, role, branch_id, phone, email, is_active, password } = req.body;

    const user = db.prepare('SELECT id, username FROM users WHERE id = ?').get(id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const assignedBranchId = role === 'admin' ? null : (branch_id ? Number(branch_id) : null);

    if (password && password.trim().length > 0) {
      db.prepare(`
        UPDATE users 
        SET name = ?, role = ?, branch_id = ?, phone = ?, email = ?, is_active = ?, password = ?
        WHERE id = ?
      `).run(
        name,
        role || 'cashier',
        assignedBranchId,
        phone || null,
        email || null,
        is_active !== undefined ? (is_active ? 1 : 0) : 1,
        password.trim(),
        id
      );
    } else {
      db.prepare(`
        UPDATE users 
        SET name = ?, role = ?, branch_id = ?, phone = ?, email = ?, is_active = ?
        WHERE id = ?
      `).run(
        name,
        role || 'cashier',
        assignedBranchId,
        phone || null,
        email || null,
        is_active !== undefined ? (is_active ? 1 : 0) : 1,
        id
      );
    }

    res.json({ success: true, message: 'User details updated successfully' });
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/auth/users/:id - Deactivate user
router.delete('/users/:id', (req, res) => {
  try {
    const { id } = req.params;
    const user = db.prepare('SELECT id, username, role FROM users WHERE id = ?').get(id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (user.username === 'admin') {
      return res.status(400).json({ success: false, error: 'Cannot delete primary admin account' });
    }

    // Soft delete / deactivate
    db.prepare('UPDATE users SET is_active = 0 WHERE id = ?').run(id);

    res.json({ success: true, message: `User "${user.username}" deactivated` });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
