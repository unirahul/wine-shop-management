const express = require('express');
const router = express.Router();
const { db } = require('../database');
const AccountingEngine = require('../services/accountingEngine');

// GET Inventory per branch with valuation and status
router.get('/', (req, res) => {
  try {
    const { branch_id, search, low_stock } = req.query;

    let sql = `
      SELECT bi.id as inventory_id, bi.branch_id, bi.product_id, bi.quantity, bi.rack_location, bi.batch_lot, bi.last_updated,
             b.name as branch_name, b.code as branch_code,
             p.name as product_name, p.sku, p.barcode, p.varietal, p.vintage_year, p.region, p.country,
             p.cost_price, p.selling_price, p.min_stock_level, p.wine_type,
             (bi.quantity * p.cost_price) as total_valuation,
             (bi.quantity * p.selling_price) as retail_valuation,
             CASE
               WHEN bi.quantity = 0 THEN 'OUT_OF_STOCK'
               WHEN bi.quantity <= p.min_stock_level THEN 'LOW_STOCK'
               ELSE 'IN_STOCK'
             END as stock_status
      FROM branch_inventory bi
      JOIN branches b ON bi.branch_id = b.id
      JOIN products p ON bi.product_id = p.id
      WHERE p.is_active = 1
    `;

    const params = [];
    if (branch_id && branch_id !== 'all') {
      sql += ' AND bi.branch_id = ?';
      params.push(Number(branch_id));
    }
    if (low_stock === 'true') {
      sql += ' AND bi.quantity <= p.min_stock_level';
    }
    if (search) {
      sql += ' AND (p.name LIKE ? OR p.sku LIKE ? OR p.varietal LIKE ? OR bi.rack_location LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }

    sql += ' ORDER BY bi.branch_id ASC, p.name ASC';

    const items = db.prepare(sql).all(...params);

    // Summary metrics
    let totalBottles = 0;
    let totalCostValuation = 0;
    let totalRetailValuation = 0;
    let lowStockCount = 0;

    for (const it of items) {
      totalBottles += it.quantity;
      totalCostValuation += it.total_valuation;
      totalRetailValuation += it.retail_valuation;
      if (it.stock_status !== 'IN_STOCK') lowStockCount++;
    }

    res.json({
      success: true,
      items,
      summary: {
        totalBottles,
        totalCostValuation: Math.round(totalCostValuation * 100) / 100,
        totalRetailValuation: Math.round(totalRetailValuation * 100) / 100,
        lowStockCount
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT update rack location
router.put('/:branchId/:productId/location', (req, res) => {
  try {
    const { branchId, productId } = req.params;
    const { rack_location, batch_lot } = req.body;

    db.prepare(`
      UPDATE branch_inventory
      SET rack_location = COALESCE(?, rack_location),
          batch_lot = COALESCE(?, batch_lot),
          last_updated = CURRENT_TIMESTAMP
      WHERE branch_id = ? AND product_id = ?
    `).run(rack_location, batch_lot, branchId, productId);

    res.json({ success: true, message: 'Inventory location updated' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET Stock Transfers
router.get('/transfers', (req, res) => {
  try {
    const { branch_id } = req.query;
    let sql = `
      SELECT t.*,
             fb.name as from_branch_name, fb.code as from_branch_code,
             tb.name as to_branch_name, tb.code as to_branch_code,
             COALESCE((SELECT SUM(quantity) FROM stock_transfer_items WHERE transfer_id = t.id), 0) as total_quantity
      FROM stock_transfers t
      JOIN branches fb ON t.from_branch_id = fb.id
      JOIN branches tb ON t.to_branch_id = tb.id
    `;
    const params = [];
    if (branch_id && branch_id !== 'all') {
      sql += ' WHERE (t.from_branch_id = ? OR t.to_branch_id = ?)';
      params.push(Number(branch_id), Number(branch_id));
    }
    sql += ' ORDER BY t.id DESC';

    const transfers = db.prepare(sql).all(...params);

    const getItems = db.prepare(`
      SELECT ti.*, p.name as product_name, p.sku, p.bottle_size, p.vintage_year
      FROM stock_transfer_items ti
      JOIN products p ON ti.product_id = p.id
      WHERE ti.transfer_id = ?
    `);

    const fullTransfers = transfers.map(t => ({
      ...t,
      items: getItems.all(t.id)
    }));

    res.json({ success: true, transfers: fullTransfers });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST Create Stock Transfer
router.post('/transfers', (req, res) => {
  try {
    const { from_branch_id, to_branch_id, transfer_date, notes, items } = req.body;

    if (!from_branch_id || !to_branch_id || !items || items.length === 0) {
      return res.status(400).json({ success: false, error: 'Source branch, destination branch, and at least one wine item are required' });
    }
    if (Number(from_branch_id) === Number(to_branch_id)) {
      return res.status(400).json({ success: false, error: 'Source and destination branches cannot be the same' });
    }

    // Check stock availability in source branch
    for (const it of items) {
      const currentStock = db.prepare('SELECT quantity FROM branch_inventory WHERE branch_id = ? AND product_id = ?').get(from_branch_id, it.product_id);
      if (!currentStock || currentStock.quantity < it.quantity) {
        const prod = db.prepare('SELECT name FROM products WHERE id = ?').get(it.product_id);
        return res.status(400).json({
          success: false,
          error: `Insufficient stock for ${prod?.name || 'product'}. Available: ${currentStock?.quantity || 0}, Requested: ${it.quantity}`
        });
      }
    }

    const nextCount = db.prepare('SELECT COUNT(*) as c FROM stock_transfers').get().c + 1;
    const transferNo = `TRF-${new Date().getFullYear()}-${String(nextCount).padStart(4, '0')}`;

    const executeTransfer = db.transaction(() => {
      const resTrf = db.prepare(`
        INSERT INTO stock_transfers (transfer_no, from_branch_id, to_branch_id, status, transfer_date, notes)
        VALUES (?, ?, ?, 'In Transit', ?, ?)
      `).run(transferNo, from_branch_id, to_branch_id, transfer_date || new Date().toISOString().split('T')[0], notes || '');

      const transferId = resTrf.lastInsertRowid;

      const insertItem = db.prepare(`
        INSERT INTO stock_transfer_items (transfer_id, product_id, quantity, unit_cost)
        VALUES (?, ?, ?, ?)
      `);

      const decrStock = db.prepare(`
        UPDATE branch_inventory
        SET quantity = quantity - ?, last_updated = CURRENT_TIMESTAMP
        WHERE branch_id = ? AND product_id = ?
      `);

      for (const it of items) {
        const prod = db.prepare('SELECT cost_price FROM products WHERE id = ?').get(it.product_id);
        insertItem.run(transferId, it.product_id, it.quantity, prod?.cost_price || 0);

        // Immediate decrement from source branch when dispatched
        decrStock.run(it.quantity, from_branch_id, it.product_id);
      }

      return transferId;
    });

    const transferId = executeTransfer();
    res.status(201).json({ success: true, message: 'Stock transfer initiated and dispatched', transferId, transferNo });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT Update Transfer Status (e.g., Receive transfer at destination branch)
router.put('/transfers/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const { status, received_date } = req.body;

    const transfer = db.prepare('SELECT * FROM stock_transfers WHERE id = ?').get(id);
    if (!transfer) {
      return res.status(404).json({ success: false, error: 'Transfer not found' });
    }

    if (transfer.status === 'Received') {
      return res.status(400).json({ success: false, error: 'This transfer has already been received' });
    }

    if (status === 'Received') {
      const items = db.prepare('SELECT * FROM stock_transfer_items WHERE transfer_id = ?').all(id);

      const receiveTx = db.transaction(() => {
        db.prepare(`
          UPDATE stock_transfers
          SET status = 'Received', received_date = ?
          WHERE id = ?
        `).run(received_date || new Date().toISOString().split('T')[0], id);

        const incrStock = db.prepare(`
          INSERT INTO branch_inventory (branch_id, product_id, quantity, rack_location)
          VALUES (?, ?, ?, 'Receiving Dock')
          ON CONFLICT(branch_id, product_id)
          DO UPDATE SET quantity = quantity + excluded.quantity, last_updated = CURRENT_TIMESTAMP
        `);

        for (const it of items) {
          incrStock.run(transfer.to_branch_id, it.product_id, it.quantity);
        }
      });

      receiveTx();
    } else {
      db.prepare('UPDATE stock_transfers SET status = ? WHERE id = ?').run(status, id);
    }

    res.json({ success: true, message: `Transfer status updated to ${status}` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET Stock Adjustments
router.get('/adjustments', (req, res) => {
  try {
    const { branch_id } = req.query;
    let sql = `
      SELECT sa.*, b.name as branch_name, b.code as branch_code,
             p.name as product_name, p.sku, p.bottle_size
      FROM stock_adjustments sa
      JOIN branches b ON sa.branch_id = b.id
      JOIN products p ON sa.product_id = p.id
    `;
    const params = [];
    if (branch_id && branch_id !== 'all') {
      sql += ' WHERE sa.branch_id = ?';
      params.push(Number(branch_id));
    }
    sql += ' ORDER BY sa.id DESC';

    const adjustments = db.prepare(sql).all(...params);
    res.json({ success: true, adjustments });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST Record Stock Adjustment
router.post('/adjustments', (req, res) => {
  try {
    const { branch_id, product_id, adjustment_type, quantity, reason, notes } = req.body;

    if (!branch_id || !product_id || !adjustment_type || !quantity || !reason) {
      return res.status(400).json({ success: false, error: 'All fields are required' });
    }

    const prod = db.prepare('SELECT cost_price, name FROM products WHERE id = ?').get(product_id);
    if (!prod) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    const qty = Number(quantity);
    const unitCost = Number(prod.cost_price || 0);
    const totalCost = Math.round(qty * unitCost * 100) / 100;

    const nextCount = db.prepare('SELECT COUNT(*) as c FROM stock_adjustments').get().c + 1;
    const adjNo = `ADJ-${new Date().getFullYear()}-${String(nextCount).padStart(4, '0')}`;

    const executeAdj = db.transaction(() => {
      const resAdj = db.prepare(`
        INSERT INTO stock_adjustments (adjustment_no, branch_id, product_id, adjustment_type, quantity, reason, unit_cost, total_cost, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(adjNo, branch_id, product_id, adjustment_type, qty, reason, unitCost, totalCost, notes || '');

      const adjId = resAdj.lastInsertRowid;

      // Update branch inventory
      if (adjustment_type === 'OUT') {
        db.prepare(`
          UPDATE branch_inventory
          SET quantity = MAX(0, quantity - ?), last_updated = CURRENT_TIMESTAMP
          WHERE branch_id = ? AND product_id = ?
        `).run(qty, branch_id, product_id);
      } else {
        db.prepare(`
          INSERT INTO branch_inventory (branch_id, product_id, quantity, rack_location)
          VALUES (?, ?, ?, 'Adjustment Bay')
          ON CONFLICT(branch_id, product_id)
          DO UPDATE SET quantity = quantity + excluded.quantity, last_updated = CURRENT_TIMESTAMP
        `).run(branch_id, product_id, qty);
      }

      // Accounting engine journal posting
      AccountingEngine.postStockAdjustment({
        id: adjId,
        adjustment_no: adjNo,
        branch_id,
        adjustment_type,
        total_cost: totalCost,
        reason
      });

      return adjId;
    });

    const adjId = executeAdj();
    res.status(201).json({ success: true, message: 'Stock adjustment recorded & journal entry created', adjustmentNo: adjNo });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
