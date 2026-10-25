const express = require('express');
const router = express.Router();
const { db } = require('../database');
const AccountingEngine = require('../services/accountingEngine');

// GET Vendors
router.get('/vendors', (req, res) => {
  try {
    const vendors = db.prepare(`
      SELECT v.*,
        COALESCE((SELECT COUNT(*) FROM purchases WHERE vendor_id = v.id), 0) as total_orders,
        COALESCE((SELECT SUM(total_amount) FROM purchases WHERE vendor_id = v.id), 0) as lifetime_purchases,
        COALESCE((SELECT SUM(balance_amount) FROM purchases WHERE vendor_id = v.id), 0) as pending_payables
      FROM vendors v
      ORDER BY v.name ASC
    `).all();

    res.json({ success: true, vendors });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST Vendor
router.post('/vendors', (req, res) => {
  try {
    const { code, name, contact_person, phone, email, tax_id, address, city, country, payment_terms_days } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, error: 'Vendor name is required' });
    }

    const nextCount = db.prepare('SELECT COUNT(*) as c FROM vendors').get().c + 1;
    const vCode = code || `VND-${String(nextCount).padStart(3, '0')}`;

    const result = db.prepare(`
      INSERT INTO vendors (code, name, contact_person, phone, email, tax_id, address, city, country, payment_terms_days)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(vCode, name, contact_person || '', phone || '', email || '', tax_id || '', address || '', city || '', country || '', Number(payment_terms_days) || 30);

    const vendor = db.prepare('SELECT * FROM vendors WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, vendor });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET Purchases
router.get('/', (req, res) => {
  try {
    const { branch_id, status } = req.query;

    let sql = `
      SELECT p.*,
             v.name as vendor_name, v.code as vendor_code,
             b.name as branch_name, b.code as branch_code,
             COALESCE((SELECT SUM(quantity) FROM purchase_items WHERE purchase_id = p.id), 0) as total_items_count
      FROM purchases p
      JOIN vendors v ON p.vendor_id = v.id
      JOIN branches b ON p.branch_id = b.id
    `;
    const params = [];
    const conditions = [];

    if (branch_id && branch_id !== 'all') {
      conditions.push('p.branch_id = ?');
      params.push(Number(branch_id));
    }
    if (status) {
      conditions.push('p.status = ?');
      params.push(status);
    }
    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    sql += ' ORDER BY p.id DESC';

    const purchases = db.prepare(sql).all(...params);
    res.json({ success: true, purchases });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET single purchase with items
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const purchase = db.prepare(`
      SELECT p.*,
             v.name as vendor_name, v.phone as vendor_phone, v.email as vendor_email, v.address as vendor_address,
             b.name as branch_name, b.address as branch_address
      FROM purchases p
      JOIN vendors v ON p.vendor_id = v.id
      JOIN branches b ON p.branch_id = b.id
      WHERE p.id = ?
    `).get(id);

    if (!purchase) {
      return res.status(404).json({ success: false, error: 'Purchase not found' });
    }

    const items = db.prepare(`
      SELECT pi.*, pr.name as product_name, pr.sku, pr.bottle_size, pr.varietal, pr.vintage_year
      FROM purchase_items pi
      JOIN products pr ON pi.product_id = pr.id
      WHERE pi.purchase_id = ?
    `).all(id);

    res.json({ success: true, purchase, items });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST Create Purchase Order / Inward Bill
router.post('/', (req, res) => {
  try {
    const {
      branch_id, vendor_id, supplier_invoice_no, purchase_date,
      due_date, items, notes, discount_amount, paid_amount
    } = req.body;

    if (!branch_id || !vendor_id || !items || items.length === 0) {
      return res.status(400).json({ success: false, error: 'Branch, vendor, and items are required' });
    }

    let subtotal = 0;
    let taxAmount = 0;

    for (const it of items) {
      const lineCost = Number(it.quantity) * Number(it.unit_cost);
      const lineTax = lineCost * ((Number(it.tax_rate) || 0) / 100);
      subtotal += lineCost;
      taxAmount += lineTax;
    }

    const discount = Number(discount_amount || 0);
    const totalAmount = Math.round((subtotal + taxAmount - discount) * 100) / 100;
    const paid = Number(paid_amount || 0);
    const balance = Math.round((totalAmount - paid) * 100) / 100;

    const nextCount = db.prepare('SELECT COUNT(*) as c FROM purchases').get().c + 1;
    const purchaseNo = `PO-${new Date().getFullYear()}-${String(nextCount).padStart(4, '0')}`;

    const executePurchase = db.transaction(() => {
      const resPur = db.prepare(`
        INSERT INTO purchases (
          purchase_no, branch_id, vendor_id, supplier_invoice_no, purchase_date,
          due_date, status, subtotal, tax_amount, discount_amount, total_amount, paid_amount, balance_amount, notes
        ) VALUES (?, ?, ?, ?, ?, ?, 'Received', ?, ?, ?, ?, ?, ?, ?)
      `).run(
        purchaseNo, branch_id, vendor_id, supplier_invoice_no || '',
        purchase_date || new Date().toISOString().split('T')[0],
        due_date || null, subtotal, taxAmount, discount, totalAmount, paid, balance, notes || ''
      );

      const purchaseId = resPur.lastInsertRowid;

      const insertItem = db.prepare(`
        INSERT INTO purchase_items (purchase_id, product_id, quantity, unit_cost, tax_rate, tax_amount, total_cost)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      // Inventory increment query
      const incrStock = db.prepare(`
        INSERT INTO branch_inventory (branch_id, product_id, quantity, rack_location)
        VALUES (?, ?, ?, 'Receiving Cellar')
        ON CONFLICT(branch_id, product_id)
        DO UPDATE SET quantity = quantity + excluded.quantity, last_updated = CURRENT_TIMESTAMP
      `);

      // Cost price update in product master
      const updateCost = db.prepare(`
        UPDATE products SET cost_price = ? WHERE id = ?
      `);

      for (const it of items) {
        const lineCost = Number(it.quantity) * Number(it.unit_cost);
        const lineTax = lineCost * ((Number(it.tax_rate) || 0) / 100);

        insertItem.run(purchaseId, it.product_id, it.quantity, it.unit_cost, it.tax_rate || 0, lineTax, lineCost);
        incrStock.run(branch_id, it.product_id, it.quantity);
        updateCost.run(it.unit_cost, it.product_id);
      }

      // Update vendor balance
      db.prepare(`
        UPDATE vendors
        SET current_balance = current_balance + ?
        WHERE id = ?
      `).run(balance, vendor_id);

      // Automated double-entry posting
      AccountingEngine.postPurchaseBill({
        id: purchaseId,
        purchase_no: purchaseNo,
        branch_id,
        purchase_date: purchase_date || new Date().toISOString().split('T')[0],
        subtotal,
        tax_amount: taxAmount,
        total_amount: totalAmount
      });

      return purchaseId;
    });

    const purchaseId = executePurchase();
    res.status(201).json({ success: true, message: 'Purchase bill recorded, stock updated & ledger posted', purchaseId, purchaseNo });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
