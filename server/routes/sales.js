const express = require('express');
const router = express.Router();
const { db } = require('../database');
const AccountingEngine = require('../services/accountingEngine');

// GET Customers
router.get('/customers', (req, res) => {
  try {
    const customers = db.prepare(`
      SELECT c.*,
        COALESCE((SELECT COUNT(*) FROM sales_invoices WHERE customer_id = c.id), 0) as total_purchases_count,
        COALESCE((SELECT SUM(total_amount) FROM sales_invoices WHERE customer_id = c.id), 0) as lifetime_spend,
        COALESCE((SELECT SUM(balance_amount) FROM sales_invoices WHERE customer_id = c.id), 0) as outstanding_balance
      FROM customers c
      ORDER BY c.name ASC
    `).all();

    res.json({ success: true, customers });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST Customer
router.post('/customers', (req, res) => {
  try {
    const { name, phone, email, tax_id, address, city, loyalty_tier, credit_limit, notes } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, error: 'Customer name is required' });
    }

    const nextCount = db.prepare('SELECT COUNT(*) as c FROM customers').get().c + 1;
    const code = `CUST-${String(nextCount).padStart(3, '0')}`;

    const result = db.prepare(`
      INSERT INTO customers (code, name, phone, email, tax_id, address, city, loyalty_tier, credit_limit, notes, age_verified)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `).run(code, name, phone || '', email || '', tax_id || '', address || '', city || '', loyalty_tier || 'Silver Cellar', Number(credit_limit) || 2000.0, notes || '');

    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, customer });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET Sales Invoices
router.get('/', (req, res) => {
  try {
    const { branch_id, status, search, invoice_type } = req.query;

    let sql = `
      SELECT si.*,
             b.name as branch_name, b.code as branch_code,
             c.loyalty_tier,
             COALESCE((SELECT SUM(quantity) FROM sales_invoice_items WHERE invoice_id = si.id), 0) as total_bottles
      FROM sales_invoices si
      JOIN branches b ON si.branch_id = b.id
      LEFT JOIN customers c ON si.customer_id = c.id
    `;
    const params = [];
    const conditions = [];

    if (branch_id && branch_id !== 'all') {
      conditions.push('si.branch_id = ?');
      params.push(Number(branch_id));
    }
    if (status) {
      conditions.push('si.status = ?');
      params.push(status);
    }
    if (invoice_type) {
      conditions.push('si.invoice_type = ?');
      params.push(invoice_type);
    }
    if (search) {
      conditions.push('(si.invoice_no LIKE ? OR si.customer_name LIKE ? OR si.customer_phone LIKE ?)');
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY si.id DESC';

    const invoices = db.prepare(sql).all(...params);
    res.json({ success: true, invoices });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET Single Invoice with items
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const invoice = db.prepare(`
      SELECT si.*,
             b.name as branch_name, b.code as branch_code, b.address as branch_address,
             b.phone as branch_phone, b.email as branch_email, b.license_number as branch_license,
             c.loyalty_tier, c.email as customer_email, c.address as customer_address
      FROM sales_invoices si
      JOIN branches b ON si.branch_id = b.id
      LEFT JOIN customers c ON si.customer_id = c.id
      WHERE si.id = ?
    `).get(id);

    if (!invoice) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }

    const items = db.prepare(`
      SELECT sii.*, p.sku, p.bottle_size, p.varietal, p.vintage_year, p.region, p.country, p.abv
      FROM sales_invoice_items sii
      JOIN products p ON sii.product_id = p.id
      WHERE sii.invoice_id = ?
    `).all(id);

    res.json({ success: true, invoice, items });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST Create Sales Invoice / POS Counter Billing
router.post('/', (req, res) => {
  try {
    const {
      branch_id, customer_id, customer_name, customer_phone,
      invoice_type, payment_method, bank_account_id,
      items, discount_amount, paid_amount, notes, change_returned
    } = req.body;

    if (!branch_id || !items || items.length === 0) {
      return res.status(400).json({ success: false, error: 'Branch and at least one item are required' });
    }

    // Verify stock availability
    for (const it of items) {
      const stockRow = db.prepare('SELECT quantity FROM branch_inventory WHERE branch_id = ? AND product_id = ?').get(branch_id, it.product_id);
      const available = stockRow?.quantity || 0;
      if (available < it.quantity) {
        const p = db.prepare('SELECT name FROM products WHERE id = ?').get(it.product_id);
        return res.status(400).json({
          success: false,
          error: `Insufficient stock for "${p?.name}". Available in this branch: ${available}, requested: ${it.quantity}`
        });
      }
    }

    let subtotal = 0;
    let taxAmount = 0;
    const processedItems = [];

    for (const it of items) {
      const prod = db.prepare('SELECT name, cost_price, tax_rate FROM products WHERE id = ?').get(it.product_id);
      const unitPrice = Number(it.unit_price);
      const qty = Number(it.quantity);
      const lineSubtotal = unitPrice * qty;
      const lineTaxRate = Number(it.tax_rate !== undefined ? it.tax_rate : prod.tax_rate || 0);
      const lineTax = Math.round(lineSubtotal * (lineTaxRate / 100) * 100) / 100;
      const lineTotal = lineSubtotal + lineTax;

      subtotal += lineSubtotal;
      taxAmount += lineTax;

      processedItems.push({
        product_id: it.product_id,
        product_name: prod.name,
        quantity: qty,
        unit_price: unitPrice,
        cost_price: Number(prod.cost_price || 0),
        discount_amount: 0,
        tax_rate: lineTaxRate,
        tax_amount: lineTax,
        line_total: lineTotal
      });
    }

    const discount = Number(discount_amount || 0);
    const totalAmount = Math.round((subtotal + taxAmount - discount) * 100) / 100;
    const paid = Number(paid_amount !== undefined ? paid_amount : totalAmount);
    const balance = Math.max(0, Math.round((totalAmount - paid) * 100) / 100);
    const status = balance <= 0 ? 'Paid' : (paid > 0 ? 'Partially Paid' : 'Unpaid');

    const nextCount = db.prepare('SELECT COUNT(*) as c FROM sales_invoices').get().c + 1;
    const invoiceNo = `INV-${new Date().getFullYear()}-${String(nextCount).padStart(5, '0')}`;
    const invoiceDate = new Date().toISOString().split('T')[0];

    const executeSale = db.transaction(() => {
      // 1. Insert Sales Invoice
      const resInv = db.prepare(`
        INSERT INTO sales_invoices (
          invoice_no, branch_id, customer_id, customer_name, customer_phone,
          invoice_date, due_date, invoice_type, payment_method, status,
          subtotal, discount_amount, tax_amount, total_amount, paid_amount, balance_amount,
          change_returned, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        invoiceNo, branch_id, customer_id || null, customer_name || 'Walk-in Guest', customer_phone || '',
        invoiceDate, invoiceDate, invoice_type || 'POS Counter', payment_method || 'Cash', status,
        subtotal, discount, taxAmount, totalAmount, paid, balance,
        Number(change_returned || 0), notes || ''
      );

      const invoiceId = resInv.lastInsertRowid;

      // 2. Insert Invoice Items and reduce stock
      const insertItem = db.prepare(`
        INSERT INTO sales_invoice_items (invoice_id, product_id, product_name, quantity, unit_price, cost_price, discount_amount, tax_rate, tax_amount, line_total)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const decrStock = db.prepare(`
        UPDATE branch_inventory
        SET quantity = MAX(0, quantity - ?), last_updated = CURRENT_TIMESTAMP
        WHERE branch_id = ? AND product_id = ?
      `);

      for (const it of processedItems) {
        insertItem.run(invoiceId, it.product_id, it.product_name, it.quantity, it.unit_price, it.cost_price, it.discount_amount, it.tax_rate, it.tax_amount, it.line_total);
        decrStock.run(it.quantity, branch_id, it.product_id);
      }

      // 3. Update customer loyalty points & balance if customer is attached
      if (customer_id) {
        const pointsEarned = Math.floor(totalAmount / 10);
        db.prepare(`
          UPDATE customers
          SET loyalty_points = loyalty_points + ?,
              current_balance = current_balance + ?
          WHERE id = ?
        `).run(pointsEarned, balance, customer_id);
      }

      // 4. If paid through a specific bank or cash drawer, update account balance
      let bankIdToUse = bank_account_id;
      if (!bankIdToUse && paid > 0) {
        // Find default cash drawer for this branch or central bank
        const defaultDrawer = db.prepare("SELECT id FROM bank_accounts WHERE branch_id = ? AND account_type LIKE '%Cash Drawer%'").get(branch_id);
        const fallbackBank = db.prepare('SELECT id FROM bank_accounts LIMIT 1').get();
        bankIdToUse = defaultDrawer ? defaultDrawer.id : fallbackBank?.id;
      }

      if (bankIdToUse && paid > 0) {
        db.prepare(`
          UPDATE bank_accounts
          SET current_balance = current_balance + ?
          WHERE id = ?
        `).run(paid, bankIdToUse);

        // Record customer receipt record automatically
        const nextRec = db.prepare('SELECT COUNT(*) as c FROM receipts').get().c + 1;
        const recNo = `REC-${new Date().getFullYear()}-${String(nextRec).padStart(4, '0')}`;
        db.prepare(`
          INSERT INTO receipts (receipt_no, branch_id, customer_id, sales_invoice_id, bank_account_id, receipt_date, amount, payment_mode, reference_no, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(recNo, branch_id, customer_id || null, invoiceId, bankIdToUse, invoiceDate, paid, payment_method || 'Cash', invoiceNo, `POS Payment for ${invoiceNo}`);
      }

      // 5. Post double-entry journal (Accounting engine)
      AccountingEngine.postSalesInvoice({
        id: invoiceId,
        invoice_no: invoiceNo,
        branch_id,
        customer_name: customer_name || 'Walk-in Guest',
        invoice_date: invoiceDate,
        subtotal,
        discount_amount: discount,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        paid_amount: paid,
        balance_amount: balance
      }, processedItems, bankIdToUse);

      return invoiceId;
    });

    const invoiceId = executeSale();
    res.status(201).json({
      success: true,
      message: 'Sale finalized, inventory deducted, receipt & journal posted',
      invoiceId,
      invoiceNo
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
