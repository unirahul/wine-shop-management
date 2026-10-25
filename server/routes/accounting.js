const express = require('express');
const router = express.Router();
const { db } = require('../database');
const AccountingEngine = require('../services/accountingEngine');

// GET Chart of Accounts
router.get('/chart-of-accounts', (req, res) => {
  try {
    const accounts = db.prepare(`
      SELECT coa.*,
        COALESCE((
          SELECT SUM(CASE 
            WHEN coa.type IN ('Asset', 'Expense') THEN (jel.debit - jel.credit)
            ELSE (jel.credit - jel.debit)
          END)
          FROM journal_entry_lines jel
          WHERE jel.account_id = coa.id
        ), 0) as calculated_balance
      FROM chart_of_accounts coa
      ORDER BY coa.code ASC
    `).all();

    res.json({ success: true, accounts });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST Add custom Account
router.post('/chart-of-accounts', (req, res) => {
  try {
    const { code, name, type, sub_type, description } = req.body;
    if (!code || !name || !type) {
      return res.status(400).json({ success: false, error: 'Account code, name, and type are required' });
    }

    const check = db.prepare('SELECT id FROM chart_of_accounts WHERE code = ?').get(code);
    if (check) {
      return res.status(400).json({ success: false, error: `Account code '${code}' already exists` });
    }

    const result = db.prepare(`
      INSERT INTO chart_of_accounts (code, name, type, sub_type, description, balance, is_system)
      VALUES (?, ?, ?, ?, ?, 0, 0)
    `).run(code, name, type, sub_type || type, description || '');

    const account = db.prepare('SELECT * FROM chart_of_accounts WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, account });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET Journal Entries
router.get('/journals', (req, res) => {
  try {
    const { branch_id, reference_type } = req.query;

    let sql = `
      SELECT je.*, b.name as branch_name, b.code as branch_code
      FROM journal_entries je
      LEFT JOIN branches b ON je.branch_id = b.id
    `;
    const params = [];
    const conditions = [];

    if (branch_id && branch_id !== 'all') {
      conditions.push('je.branch_id = ?');
      params.push(Number(branch_id));
    }
    if (reference_type) {
      conditions.push('je.reference_type = ?');
      params.push(reference_type);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY je.id DESC';

    const entries = db.prepare(sql).all(...params);

    const getLines = db.prepare(`
      SELECT jel.*, coa.code as account_code, coa.name as account_name, coa.type as account_type
      FROM journal_entry_lines jel
      JOIN chart_of_accounts coa ON jel.account_id = coa.id
      WHERE jel.journal_entry_id = ?
    `);

    const fullEntries = entries.map(e => ({
      ...e,
      lines: getLines.all(e.id)
    }));

    res.json({ success: true, journals: fullEntries });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST Manual Journal Entry
router.post('/manual-journal', (req, res) => {
  try {
    const { entry_date, branch_id, narration, lines } = req.body;

    if (!lines || lines.length < 2) {
      return res.status(400).json({ success: false, error: 'A journal entry requires at least 2 lines (Debit and Credit)' });
    }

    const { journalEntryId, entryNo } = AccountingEngine.createJournalEntry({
      entryDate: entry_date || new Date().toISOString().split('T')[0],
      branchId: branch_id || 1,
      referenceType: 'MANUAL_JOURNAL',
      referenceId: null,
      narration: narration || 'Manual adjusting journal voucher',
      lines
    });

    res.status(201).json({ success: true, message: 'Journal entry created and posted', journalEntryId, entryNo });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET Trial Balance
router.get('/trial-balance', (req, res) => {
  try {
    const { branch_id } = req.query;

    let filterSql = '';
    const params = [];
    if (branch_id && branch_id !== 'all') {
      filterSql = 'JOIN journal_entries je ON jel.journal_entry_id = je.id WHERE je.branch_id = ?';
      params.push(Number(branch_id));
    }

    // Get debits and credits grouped by account
    const accounts = db.prepare(`
      SELECT coa.id, coa.code, coa.name, coa.type, coa.sub_type,
        COALESCE(SUM(jel.debit), 0) as total_debit,
        COALESCE(SUM(jel.credit), 0) as total_credit
      FROM chart_of_accounts coa
      LEFT JOIN journal_entry_lines jel ON jel.account_id = coa.id
      ${filterSql}
      GROUP BY coa.id
      ORDER BY coa.code ASC
    `).all(...params);

    let grandDebit = 0;
    let grandCredit = 0;

    const rows = accounts.map(a => {
      let debitBal = 0;
      let creditBal = 0;

      if (['Asset', 'Expense'].includes(a.type)) {
        const net = a.total_debit - a.total_credit;
        if (net >= 0) debitBal = net;
        else creditBal = Math.abs(net);
      } else {
        const net = a.total_credit - a.total_debit;
        if (net >= 0) creditBal = net;
        else debitBal = Math.abs(net);
      }

      grandDebit += debitBal;
      grandCredit += creditBal;

      return {
        ...a,
        debit: Math.round(debitBal * 100) / 100,
        credit: Math.round(creditBal * 100) / 100
      };
    }).filter(r => r.debit > 0 || r.credit > 0);

    res.json({
      success: true,
      rows,
      totals: {
        totalDebit: Math.round(grandDebit * 100) / 100,
        totalCredit: Math.round(grandCredit * 100) / 100,
        isBalanced: Math.abs(grandDebit - grandCredit) < 0.05
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET Profit and Loss Statement (Income Statement)
router.get('/profit-and-loss', (req, res) => {
  try {
    const { branch_id, start_date, end_date } = req.query;

    let whereClause = "WHERE coa.type IN ('Revenue', 'Expense')";
    const params = [];

    if (branch_id && branch_id !== 'all') {
      whereClause += ' AND je.branch_id = ?';
      params.push(Number(branch_id));
    }
    if (start_date) {
      whereClause += ' AND je.entry_date >= ?';
      params.push(start_date);
    }
    if (end_date) {
      whereClause += ' AND je.entry_date <= ?';
      params.push(end_date);
    }

    const rows = db.prepare(`
      SELECT coa.id, coa.code, coa.name, coa.type, coa.sub_type,
             COALESCE(SUM(jel.debit), 0) as total_debit,
             COALESCE(SUM(jel.credit), 0) as total_credit
      FROM chart_of_accounts coa
      JOIN journal_entry_lines jel ON jel.account_id = coa.id
      JOIN journal_entries je ON jel.journal_entry_id = je.id
      ${whereClause}
      GROUP BY coa.id
      ORDER BY coa.code ASC
    `).all(...params);

    const revenueItems = [];
    const cogsItems = [];
    const opexItems = [];

    let totalRevenue = 0;
    let totalCogs = 0;
    let totalOpex = 0;

    for (const r of rows) {
      if (r.type === 'Revenue') {
        const net = r.total_credit - r.total_debit;
        if (net !== 0) {
          totalRevenue += net;
          revenueItems.push({ ...r, amount: Math.round(net * 100) / 100 });
        }
      } else if (r.type === 'Expense') {
        const net = r.total_debit - r.total_credit;
        if (net !== 0) {
          if (r.sub_type === 'Cost of Goods Sold') {
            totalCogs += net;
            cogsItems.push({ ...r, amount: Math.round(net * 100) / 100 });
          } else {
            totalOpex += net;
            opexItems.push({ ...r, amount: Math.round(net * 100) / 100 });
          }
        }
      }
    }

    const grossProfit = totalRevenue - totalCogs;
    const netProfit = grossProfit - totalOpex;
    const grossMarginPct = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
    const netMarginPct = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    res.json({
      success: true,
      revenueItems,
      cogsItems,
      opexItems,
      summary: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalCogs: Math.round(totalCogs * 100) / 100,
        grossProfit: Math.round(grossProfit * 100) / 100,
        totalOpex: Math.round(totalOpex * 100) / 100,
        netProfit: Math.round(netProfit * 100) / 100,
        grossMarginPct: Math.round(grossMarginPct * 10) / 10,
        netMarginPct: Math.round(netMarginPct * 10) / 10
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET Balance Sheet
router.get('/balance-sheet', (req, res) => {
  try {
    const { branch_id } = req.query;

    let filterSql = '';
    const params = [];
    if (branch_id && branch_id !== 'all') {
      filterSql = 'JOIN journal_entries je ON jel.journal_entry_id = je.id WHERE je.branch_id = ?';
      params.push(Number(branch_id));
    }

    const accounts = db.prepare(`
      SELECT coa.id, coa.code, coa.name, coa.type, coa.sub_type,
             COALESCE(SUM(jel.debit), 0) as total_debit,
             COALESCE(SUM(jel.credit), 0) as total_credit
      FROM chart_of_accounts coa
      LEFT JOIN journal_entry_lines jel ON jel.account_id = coa.id
      ${filterSql}
      GROUP BY coa.id
      ORDER BY coa.code ASC
    `).all(...params);

    const assetItems = [];
    const liabilityItems = [];
    const equityItems = [];

    let totalAssets = 0;
    let totalLiabilities = 0;
    let totalEquity = 0;

    // Calculate current net income to add to retained earnings
    let pnlNet = 0;

    for (const a of accounts) {
      if (a.type === 'Asset') {
        const net = a.total_debit - a.total_credit;
        if (net !== 0) {
          totalAssets += net;
          assetItems.push({ ...a, balance: Math.round(net * 100) / 100 });
        }
      } else if (a.type === 'Liability') {
        const net = a.total_credit - a.total_debit;
        if (net !== 0) {
          totalLiabilities += net;
          liabilityItems.push({ ...a, balance: Math.round(net * 100) / 100 });
        }
      } else if (a.type === 'Equity') {
        const net = a.total_credit - a.total_debit;
        if (net !== 0) {
          totalEquity += net;
          equityItems.push({ ...a, balance: Math.round(net * 100) / 100 });
        }
      } else if (a.type === 'Revenue') {
        pnlNet += (a.total_credit - a.total_debit);
      } else if (a.type === 'Expense') {
        pnlNet -= (a.total_debit - a.total_credit);
      }
    }

    // Add current period net income to equity
    if (pnlNet !== 0) {
      totalEquity += pnlNet;
      equityItems.push({
        id: 9999,
        code: '3030',
        name: 'Current Period Net Income / (Loss)',
        type: 'Equity',
        sub_type: 'Retained Earnings',
        balance: Math.round(pnlNet * 100) / 100
      });
    }

    res.json({
      success: true,
      assets: assetItems,
      liabilities: liabilityItems,
      equity: equityItems,
      summary: {
        totalAssets: Math.round(totalAssets * 100) / 100,
        totalLiabilities: Math.round(totalLiabilities * 100) / 100,
        totalEquity: Math.round(totalEquity * 100) / 100,
        totalLiabilitiesAndEquity: Math.round((totalLiabilities + totalEquity) * 100) / 100,
        isBalanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.05
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET General Ledger for a specific Account
router.get('/general-ledger/:accountId', (req, res) => {
  try {
    const { accountId } = req.params;
    const account = db.prepare('SELECT * FROM chart_of_accounts WHERE id = ?').get(accountId);
    if (!account) {
      return res.status(404).json({ success: false, error: 'Account not found' });
    }

    const lines = db.prepare(`
      SELECT jel.*, je.entry_no, je.entry_date, je.reference_type, je.narration, b.name as branch_name
      FROM journal_entry_lines jel
      JOIN journal_entries je ON jel.journal_entry_id = je.id
      LEFT JOIN branches b ON je.branch_id = b.id
      WHERE jel.account_id = ?
      ORDER BY je.entry_date ASC, je.id ASC
    `).all(accountId);

    let runningBalance = 0;
    const ledger = lines.map(l => {
      if (['Asset', 'Expense'].includes(account.type)) {
        runningBalance += (l.debit - l.credit);
      } else {
        runningBalance += (l.credit - l.debit);
      }
      return {
        ...l,
        runningBalance: Math.round(runningBalance * 100) / 100
      };
    });

    res.json({ success: true, account, ledger, currentBalance: Math.round(runningBalance * 100) / 100 });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
