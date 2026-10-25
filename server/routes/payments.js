const express = require('express');
const router = express.Router();
const { db } = require('../database');
const AccountingEngine = require('../services/accountingEngine');

// GET Customer Receipts
router.get('/receipts', (req, res) => {
  try {
    const { branch_id, customer_id } = req.query;

    let sql = `
      SELECT r.*,
             b.name as branch_name, b.code as branch_code,
             c.name as customer_name, c.phone as customer_phone,
             si.invoice_no,
             ba.account_name as bank_name, ba.account_type
      FROM receipts r
      JOIN branches b ON r.branch_id = b.id
      LEFT JOIN customers c ON r.customer_id = c.id
      LEFT JOIN sales_invoices si ON r.sales_invoice_id = si.id
      JOIN bank_accounts ba ON r.bank_account_id = ba.id
    `;
    const params = [];
    const conditions = [];

    if (branch_id && branch_id !== 'all') {
      conditions.push('r.branch_id = ?');
      params.push(Number(branch_id));
    }
    if (customer_id) {
      conditions.push('r.customer_id = ?');
      params.push(Number(customer_id));
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY r.id DESC';

    const receipts = db.prepare(sql).all(...params);
    res.json({ success: true, receipts });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST Customer Receipt
router.post('/receipts', (req, res) => {
  try {
    const { branch_id, customer_id, sales_invoice_id, bank_account_id, amount, payment_mode, reference_no, notes, receipt_date } = req.body;

    if (!branch_id || !bank_account_id || !amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, error: 'Branch, bank account, and a positive amount are required' });
    }

    const amt = Number(amount);
    const rDate = receipt_date || new Date().toISOString().split('T')[0];
    const nextCount = db.prepare('SELECT COUNT(*) as c FROM receipts').get().c + 1;
    const receiptNo = `REC-${new Date().getFullYear()}-${String(nextCount).padStart(4, '0')}`;

    const executeReceipt = db.transaction(() => {
      // 1. Insert receipt
      const resRec = db.prepare(`
        INSERT INTO receipts (receipt_no, branch_id, customer_id, sales_invoice_id, bank_account_id, receipt_date, amount, payment_mode, reference_no, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(receiptNo, branch_id, customer_id || null, sales_invoice_id || null, bank_account_id, rDate, amt, payment_mode || 'Cash', reference_no || '', notes || '');

      const receiptId = resRec.lastInsertRowid;

      // 2. Increment bank balance
      db.prepare('UPDATE bank_accounts SET current_balance = current_balance + ? WHERE id = ?').run(amt, bank_account_id);

      // Record bank transaction
      const bank = db.prepare('SELECT current_balance, account_name FROM bank_accounts WHERE id = ?').get(bank_account_id);
      db.prepare(`
        INSERT INTO bank_transactions (transaction_no, bank_account_id, transaction_date, type, amount, balance_after, reference_no, description, reconciliation_status)
        VALUES (?, ?, ?, 'Deposit', ?, ?, ?, ?, 'Cleared')
      `).run(`TXN-REC-${Date.now()}`, bank_account_id, rDate, amt, bank.current_balance, reference_no || receiptNo, `Customer Receipt ${receiptNo}`);

      // 3. Decrement sales invoice balance if linked
      if (sales_invoice_id) {
        const inv = db.prepare('SELECT paid_amount, balance_amount, total_amount FROM sales_invoices WHERE id = ?').get(sales_invoice_id);
        if (inv) {
          const newPaid = inv.paid_amount + amt;
          const newBalance = Math.max(0, inv.balance_amount - amt);
          const newStatus = newBalance <= 0 ? 'Paid' : 'Partially Paid';
          db.prepare('UPDATE sales_invoices SET paid_amount = ?, balance_amount = ?, status = ? WHERE id = ?').run(newPaid, newBalance, newStatus, sales_invoice_id);
        }
      }

      // 4. Decrement customer outstanding balance if linked
      if (customer_id) {
        db.prepare('UPDATE customers SET current_balance = MAX(0, current_balance - ?) WHERE id = ?').run(amt, customer_id);
      }

      // 5. Post accounting journal entry
      AccountingEngine.postCustomerReceipt({
        id: receiptId,
        receipt_no: receiptNo,
        branch_id,
        receipt_date: rDate,
        amount: amt
      }, bank_account_id);

      return receiptId;
    });

    const receiptId = executeReceipt();
    res.status(201).json({ success: true, message: 'Receipt recorded, bank updated and ledger posted', receiptId, receiptNo });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET Vendor Payments & Operating Expenses
router.get('/payments', (req, res) => {
  try {
    const { branch_id, payment_type } = req.query;

    let sql = `
      SELECT p.*,
             b.name as branch_name, b.code as branch_code,
             v.name as vendor_name,
             pur.purchase_no, pur.supplier_invoice_no,
             ba.account_name as bank_name,
             coa.name as expense_account_name, coa.code as expense_account_code
      FROM payments p
      JOIN branches b ON p.branch_id = b.id
      LEFT JOIN vendors v ON p.vendor_id = v.id
      LEFT JOIN purchases pur ON p.purchase_id = pur.id
      JOIN bank_accounts ba ON p.bank_account_id = ba.id
      LEFT JOIN chart_of_accounts coa ON p.expense_account_id = coa.id
    `;
    const params = [];
    const conditions = [];

    if (branch_id && branch_id !== 'all') {
      conditions.push('p.branch_id = ?');
      params.push(Number(branch_id));
    }
    if (payment_type) {
      conditions.push('p.payment_type = ?');
      params.push(payment_type);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY p.id DESC';

    const payments = db.prepare(sql).all(...params);
    res.json({ success: true, payments });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST Vendor Payment or Operating Expense
router.post('/payments', (req, res) => {
  try {
    const {
      branch_id, vendor_id, purchase_id, bank_account_id,
      expense_account_id, payment_date, amount, payment_mode,
      payment_type, payee_name, reference_no, notes
    } = req.body;

    if (!branch_id || !bank_account_id || !amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, error: 'Branch, bank account, and a positive amount are required' });
    }

    const amt = Number(amount);
    const bank = db.prepare('SELECT current_balance, account_name FROM bank_accounts WHERE id = ?').get(bank_account_id);
    if (!bank) {
      return res.status(404).json({ success: false, error: 'Bank account not found' });
    }
    if (bank.current_balance < amt) {
      return res.status(400).json({
        success: false,
        error: `Insufficient balance in ${bank.account_name}. Available: $${bank.current_balance.toFixed(2)}, Payment: $${amt.toFixed(2)}`
      });
    }

    const pDate = payment_date || new Date().toISOString().split('T')[0];
    const isVendorPay = payment_type === 'Vendor Bill Payment';

    const nextCount = db.prepare('SELECT COUNT(*) as c FROM payments').get().c + 1;
    const prefix = isVendorPay ? 'PAY' : 'EXP';
    const paymentNo = `${prefix}-${new Date().getFullYear()}-${String(nextCount).padStart(4, '0')}`;

    const executePayment = db.transaction(() => {
      // 1. Insert payment
      const resPay = db.prepare(`
        INSERT INTO payments (
          payment_no, branch_id, vendor_id, purchase_id, bank_account_id,
          expense_account_id, payment_date, amount, payment_mode, payment_type,
          payee_name, reference_no, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        paymentNo, branch_id, vendor_id || null, purchase_id || null, bank_account_id,
        expense_account_id || null, pDate, amt, payment_mode || 'Cash',
        payment_type || 'Vendor Bill Payment', payee_name || '', reference_no || '', notes || ''
      );

      const paymentId = resPay.lastInsertRowid;

      // 2. Deduct from bank account
      const newBankBal = bank.current_balance - amt;
      db.prepare('UPDATE bank_accounts SET current_balance = ? WHERE id = ?').run(newBankBal, bank_account_id);

      db.prepare(`
        INSERT INTO bank_transactions (transaction_no, bank_account_id, transaction_date, type, amount, balance_after, reference_no, description, reconciliation_status)
        VALUES (?, ?, ?, 'Withdrawal', ?, ?, ?, ?, 'Cleared')
      `).run(`TXN-PAY-${Date.now()}`, bank_account_id, pDate, amt, newBankBal, reference_no || paymentNo, `${payment_type}: ${payee_name || paymentNo}`);

      // 3. If Vendor payment linked to purchase bill
      if (isVendorPay) {
        if (purchase_id) {
          const pur = db.prepare('SELECT paid_amount, balance_amount FROM purchases WHERE id = ?').get(purchase_id);
          if (pur) {
            const newPaid = pur.paid_amount + amt;
            const newBal = Math.max(0, pur.balance_amount - amt);
            const newStatus = newBal <= 0 ? 'Paid' : 'Partially Paid';
            db.prepare('UPDATE purchases SET paid_amount = ?, balance_amount = ?, status = ? WHERE id = ?').run(newPaid, newBal, newStatus, purchase_id);
          }
        }
        if (vendor_id) {
          db.prepare('UPDATE vendors SET current_balance = MAX(0, current_balance - ?) WHERE id = ?').run(amt, vendor_id);
        }

        AccountingEngine.postVendorPayment({
          id: paymentId,
          payment_no: paymentNo,
          branch_id,
          payment_date: pDate,
          amount: amt
        }, bank_account_id);
      } else {
        // Operating Expense
        let expAccId = expense_account_id;
        if (!expAccId) {
          const fallbackExp = db.prepare("SELECT id FROM chart_of_accounts WHERE type = 'Expense' AND sub_type = 'Operating Expense' LIMIT 1").get();
          expAccId = fallbackExp ? fallbackExp.id : 19;
        }

        AccountingEngine.postExpense({
          id: paymentId,
          payment_no: paymentNo,
          branch_id,
          payment_date: pDate,
          amount: amt,
          payee_name: payee_name || 'Operating expense',
          notes: notes || ''
        }, bank_account_id, expAccId);
      }

      return paymentId;
    });

    const paymentId = executePayment();
    res.status(201).json({ success: true, message: 'Payment disbursed, bank updated and accounting journal posted', paymentId, paymentNo });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
