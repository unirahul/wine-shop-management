const express = require('express');
const router = express.Router();
const { db } = require('../database');

// GET all branches with inventory and sales summary
router.get('/', (req, res) => {
  try {
    const branches = db.prepare(`
      SELECT b.*,
        COALESCE((SELECT SUM(quantity) FROM branch_inventory WHERE branch_id = b.id), 0) as total_stock_bottles,
        COALESCE((SELECT COUNT(DISTINCT product_id) FROM branch_inventory WHERE branch_id = b.id AND quantity > 0), 0) as active_sku_count,
        COALESCE((SELECT SUM(total_amount) FROM sales_invoices WHERE branch_id = b.id), 0) as total_sales_revenue
      FROM branches b
      ORDER BY b.id ASC
    `).all();

    res.json({ success: true, branches });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST new branch
router.post('/', (req, res) => {
  try {
    const {
      code, name, type, address, city, state, zip_code,
      phone, email, license_number, manager_name, is_warehouse
    } = req.body;

    if (!code || !name) {
      return res.status(400).json({ success: false, error: 'Branch code and name are required' });
    }

    const checkCode = db.prepare('SELECT id FROM branches WHERE code = ?').get(code);
    if (checkCode) {
      return res.status(400).json({ success: false, error: `Branch code '${code}' already exists.` });
    }

    const result = db.prepare(`
      INSERT INTO branches (
        code, name, type, address, city, state, zip_code,
        phone, email, license_number, manager_name, is_warehouse, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `).run(
      code, name, type || 'Retail Store', address || '', city || '', state || '', zip_code || '',
      phone || '', email || '', license_number || '', manager_name || '', is_warehouse ? 1 : 0
    );

    const newBranchId = result.lastInsertRowid;

    // Automatically initialize inventory records for all existing products for this branch with 0 quantity
    const products = db.prepare('SELECT id FROM products').all();
    const insertInv = db.prepare(`
      INSERT OR IGNORE INTO branch_inventory (branch_id, product_id, quantity, rack_location)
      VALUES (?, ?, 0, 'Cellar Main')
    `);
    const initMany = db.transaction(() => {
      for (const p of products) {
        insertInv.run(newBranchId, p.id);
      }
    });
    initMany();

    const created = db.prepare('SELECT * FROM branches WHERE id = ?').get(newBranchId);
    res.status(201).json({ success: true, branch: created, message: 'Branch created and inventory initialized successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT update branch
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, type, address, city, state, zip_code,
      phone, email, license_number, manager_name, is_warehouse, is_active
    } = req.body;

    const existing = db.prepare('SELECT id FROM branches WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Branch not found' });
    }

    db.prepare(`
      UPDATE branches
      SET name = COALESCE(?, name),
          type = COALESCE(?, type),
          address = COALESCE(?, address),
          city = COALESCE(?, city),
          state = COALESCE(?, state),
          zip_code = COALESCE(?, zip_code),
          phone = COALESCE(?, phone),
          email = COALESCE(?, email),
          license_number = COALESCE(?, license_number),
          manager_name = COALESCE(?, manager_name),
          is_warehouse = COALESCE(?, is_warehouse),
          is_active = COALESCE(?, is_active)
      WHERE id = ?
    `).run(name, type, address, city, state, zip_code, phone, email, license_number, manager_name, is_warehouse !== undefined ? (is_warehouse ? 1 : 0) : null, is_active !== undefined ? (is_active ? 1 : 0) : null, id);

    const updated = db.prepare('SELECT * FROM branches WHERE id = ?').get(id);
    res.json({ success: true, branch: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE branch
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { force } = req.query;

    const branch = db.prepare('SELECT * FROM branches WHERE id = ?').get(id);
    if (!branch) {
      return res.status(404).json({ success: false, error: 'Branch not found' });
    }

    // Check if other branches exist (cannot delete the only branch)
    const branchCount = db.prepare('SELECT COUNT(*) as count FROM branches').get().count;
    if (branchCount <= 1) {
      return res.status(400).json({ success: false, error: 'Cannot delete the only remaining branch. At least one branch must exist.' });
    }

    // Check transactions
    const salesCount = db.prepare('SELECT COUNT(*) as count FROM sales_invoices WHERE branch_id = ?').get(id).count;
    const purchaseCount = db.prepare('SELECT COUNT(*) as count FROM purchases WHERE branch_id = ?').get(id).count;
    const totalTransactions = salesCount + purchaseCount;

    if (totalTransactions > 0 && force !== 'true') {
      // Soft-deactivate to preserve accounting integrity
      db.prepare('UPDATE branches SET is_active = 0 WHERE id = ?').run(id);
      return res.json({
        success: true,
        deactivated: true,
        message: `Branch "${branch.name}" has ${totalTransactions} historical transaction(s) (sales/purchases). It has been deactivated to preserve accounting ledger integrity.`
      });
    }

    // Hard delete
    const deleteBranchTx = db.transaction(() => {
      db.prepare('DELETE FROM branch_inventory WHERE branch_id = ?').run(id);
      db.prepare('DELETE FROM bank_accounts WHERE branch_id = ?').run(id);
      if (force === 'true') {
        db.prepare('DELETE FROM sales_invoices WHERE branch_id = ?').run(id);
        db.prepare('DELETE FROM purchases WHERE branch_id = ?').run(id);
        db.prepare('DELETE FROM stock_transfers WHERE from_branch_id = ? OR to_branch_id = ?').run(id, id);
        db.prepare('DELETE FROM stock_adjustments WHERE branch_id = ?').run(id);
      }
      db.prepare('DELETE FROM branches WHERE id = ?').run(id);
    });

    deleteBranchTx();
    res.json({ success: true, message: `Branch "${branch.name}" (${branch.code}) deleted successfully.` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

