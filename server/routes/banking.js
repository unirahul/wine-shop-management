const express = require('express');
const router = express.Router();
const { db } = require('../database');
const AccountingEngine = require('../services/accountingEngine');

// GET all bank accounts & cash drawers
router.get('/accounts', (req, res) => {
  try {
    const { branch_id } = req.query;
    let sql = `
      SELECT ba.*, b.name as branch_name, b.code as branch_code, coa.name as gl_account_name, coa.code as gl_account_code
      FROM bank_accounts ba
      LEFT JOIN branches b ON ba.branch_id = b.id
      LEFT JOIN chart_of_accounts coa ON ba.gl_account_id = coa.id
    `;
    const params = [];
    if (branch_id && branch_id !== 'all') {
      sql += ' WHERE (ba.branch_id = ? OR ba.branch_id IS NULL)';
      params.push(Number(branch_id));
    }
    sql += ' ORDER BY ba.id ASC';

    const accounts = db.prepare(sql).all(...params);

    const totalLiquidAssets = accounts.reduce((acc, a) => acc + (a.current_balance || 0), 0);

    res.json({ success: true, accounts, totalLiquidAssets: Math.round(totalLiquidAssets * 100) / 100 });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST Create Bank Account or Cash Drawer
router.post('/accounts', (req, res) => {
  try {
    const {
      account_code, account_name, bank_name, account_number,
      account_type, branch_id, opening_balance, gl_account_id
    } = req.body;

    if (!account_name || !bank_name || !account_number) {
      return res.status(400).json({ success: false, error: 'Account name, bank name, and account number are required' });
    }

    const nextCount = db.prepare('SELECT COUNT(*) as c FROM bank_accounts').get().c + 1;
    const code = account_code || `BNK-${String(nextCount).padStart(3, '0')}`;
    const initialBal = Number(opening_balance || 0);

    // Default to Operating Bank Account (GL 1020) or Petty Cash (GL 1010)
    let glId = gl_account_id;
    if (!glId) {
      const glCode = (account_type && account_type.toLowerCase().includes('cash')) ? '1010' : '1020';
      const glRow = db.prepare('SELECT id FROM chart_of_accounts WHERE code = ?').get(glCode);
      glId = glRow ? glRow.id : 2;
    }

    const result = db.prepare(`
      INSERT INTO bank_accounts (
        account_code, account_name, bank_name, account_number, account_type,
        branch_id, opening_balance, current_balance, gl_account_id, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `).run(
      code, account_name, bank_name, account_number, account_type || 'Checking / Current',
      branch_id || null, initialBal, initialBal, glId
    );

    const created = db.prepare('SELECT * FROM bank_accounts WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, account: created });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET Transactions (Statement & Reconciliation)
router.get('/transactions', (req, res) => {
  try {
    const { bank_account_id, status } = req.query;

    let sql = `
      SELECT bt.*, ba.account_name, ba.account_code, ba.bank_name
      FROM bank_transactions bt
      JOIN bank_accounts ba ON bt.bank_account_id = ba.id
    `;
    const params = [];
    const conditions = [];

    if (bank_account_id && bank_account_id !== 'all') {
      conditions.push('bt.bank_account_id = ?');
      params.push(Number(bank_account_id));
    }
    if (status) {
      conditions.push('bt.reconciliation_status = ?');
      params.push(status);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY bt.id DESC';

    const transactions = db.prepare(sql).all(...params);
    res.json({ success: true, transactions });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST Inter-bank / Cash Drawer Fund Transfer
router.post('/transfer', (req, res) => {
  try {
    const { from_account_id, to_account_id, amount, transfer_date, reference_no, description } = req.body;

    if (!from_account_id || !to_account_id || !amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, error: 'Source, destination, and valid transfer amount are required' });
    }
    if (Number(from_account_id) === Number(to_account_id)) {
      return res.status(400).json({ success: false, error: 'Source and destination accounts must be different' });
    }

    const fromAcc = db.prepare('SELECT * FROM bank_accounts WHERE id = ?').get(from_account_id);
    const toAcc = db.prepare('SELECT * FROM bank_accounts WHERE id = ?').get(to_account_id);

    if (!fromAcc || !toAcc) {
      return res.status(404).json({ success: false, error: 'One or both bank accounts not found' });
    }

    const amt = Number(amount);
    if (fromAcc.current_balance < amt) {
      return res.status(400).json({
        success: false,
        error: `Insufficient balance in ${fromAcc.account_name}. Available: $${fromAcc.current_balance.toFixed(2)}, Transfer: $${amt.toFixed(2)}`
      });
    }

    const tDate = transfer_date || new Date().toISOString().split('T')[0];
    const refNo = reference_no || `TRF-BNK-${Date.now().toString().slice(-6)}`;

    const executeTransfer = db.transaction(() => {
      // Deduct from source
      const newFromBal = fromAcc.current_balance - amt;
      db.prepare('UPDATE bank_accounts SET current_balance = ? WHERE id = ?').run(newFromBal, from_account_id);

      db.prepare(`
        INSERT INTO bank_transactions (transaction_no, bank_account_id, transaction_date, type, amount, balance_after, reference_no, description, reconciliation_status)
        VALUES (?, ?, ?, 'Transfer Out', ?, ?, ?, ?, 'Cleared')
      `).run(`TXN-OUT-${Date.now()}`, from_account_id, tDate, amt, newFromBal, refNo, `Transfer to ${toAcc.account_name}: ${description || ''}`);

      // Add to destination
      const newToBal = toAcc.current_balance + amt;
      db.prepare('UPDATE bank_accounts SET current_balance = ? WHERE id = ?').run(newToBal, to_account_id);

      db.prepare(`
        INSERT INTO bank_transactions (transaction_no, bank_account_id, transaction_date, type, amount, balance_after, reference_no, description, reconciliation_status)
        VALUES (?, ?, ?, 'Transfer In', ?, ?, ?, ?, 'Cleared')
      `).run(`TXN-IN-${Date.now()}`, to_account_id, tDate, amt, newToBal, refNo, `Transfer received from ${fromAcc.account_name}: ${description || ''}`);

      // Journal entry for transfer
      if (fromAcc.gl_account_id && toAcc.gl_account_id && fromAcc.gl_account_id !== toAcc.gl_account_id) {
        AccountingEngine.createJournalEntry({
          entryDate: tDate,
          branchId: fromAcc.branch_id || toAcc.branch_id || 1,
          referenceType: 'BANK_TRANSFER',
          referenceId: null,
          narration: `Bank Transfer: ${fromAcc.account_name} to ${toAcc.account_name} (${refNo})`,
          lines: [
            { accountId: toAcc.gl_account_id, debit: amt, credit: 0, notes: `Transfer into ${toAcc.account_name}` },
            { accountId: fromAcc.gl_account_id, debit: 0, credit: amt, notes: `Transfer out of ${fromAcc.account_name}` }
          ]
        });
      }
    });

    executeTransfer();
    res.json({ success: true, message: `Successfully transferred $${amt.toFixed(2)} between accounts` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST Reconcile transaction
router.post('/reconcile', (req, res) => {
  try {
    const { transaction_id, status } = req.body;
    if (!transaction_id) {
      return res.status(400).json({ success: false, error: 'Transaction ID is required' });
    }

    const targetStatus = status || 'Reconciled';
    const recDate = targetStatus === 'Reconciled' ? new Date().toISOString().split('T')[0] : null;

    db.prepare(`
      UPDATE bank_transactions
      SET reconciliation_status = ?, reconciliation_date = ?
      WHERE id = ?
    `).run(targetStatus, recDate, transaction_id);

    res.json({ success: true, message: `Transaction marked as ${targetStatus}` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
