const { db } = require('../database');

/**
 * Double-entry accounting engine for automated journal postings
 */
class AccountingEngine {
  // Helper to fetch account by code
  static getAccount(code) {
    return db.prepare('SELECT * FROM chart_of_accounts WHERE code = ?').get(code);
  }

  // Create a balanced journal entry
  static createJournalEntry({ entryDate, branchId, referenceType, referenceId, narration, lines }) {
    let totalDebit = 0;
    let totalCredit = 0;

    for (const line of lines) {
      totalDebit += Number(line.debit || 0);
      totalCredit += Number(line.credit || 0);
    }

    // Rounding check
    totalDebit = Math.round(totalDebit * 100) / 100;
    totalCredit = Math.round(totalCredit * 100) / 100;

    if (Math.abs(totalDebit - totalCredit) > 0.05) {
      throw new Error(`Unbalanced Journal Entry: Debits (${totalDebit}) != Credits (${totalCredit})`);
    }

    const nextIdRow = db.prepare('SELECT COUNT(*) as count FROM journal_entries').get();
    const entryNo = `JV-${new Date().getFullYear()}-${String((nextIdRow?.count || 0) + 1).padStart(5, '0')}`;

    const insertEntry = db.prepare(`
      INSERT INTO journal_entries (entry_no, entry_date, branch_id, reference_type, reference_id, narration, total_debit, total_credit)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insertEntry.run(entryNo, entryDate, branchId, referenceType, referenceId, narration, totalDebit, totalCredit);
    const journalEntryId = result.lastInsertRowid;

    const insertLine = db.prepare(`
      INSERT INTO journal_entry_lines (journal_entry_id, account_id, debit, credit, notes)
      VALUES (?, ?, ?, ?, ?)
    `);

    const updateAccountBalance = db.prepare(`
      UPDATE chart_of_accounts
      SET balance = balance + ?
      WHERE id = ?
    `);

    for (const line of lines) {
      insertLine.run(journalEntryId, line.accountId, line.debit || 0, line.credit || 0, line.notes || narration);

      // In accounting:
      // Asset & Expense normal balance is Debit (+)
      // Liability, Equity, Revenue normal balance is Credit (+)
      const acc = db.prepare('SELECT type FROM chart_of_accounts WHERE id = ?').get(line.accountId);
      if (acc) {
        let netChange = 0;
        if (['Asset', 'Expense'].includes(acc.type)) {
          netChange = (line.debit || 0) - (line.credit || 0);
        } else {
          netChange = (line.credit || 0) - (line.debit || 0);
        }
        updateAccountBalance.run(netChange, line.accountId);
      }
    }

    return { journalEntryId, entryNo };
  }

  // Automatic posting on Sales Invoice
  static postSalesInvoice(invoice, items, bankAccountId = null) {
    const cashAccount = bankAccountId 
      ? db.prepare('SELECT gl_account_id FROM bank_accounts WHERE id = ?').get(bankAccountId)?.gl_account_id
      : null;
    const defaultCash = this.getAccount('1010'); // Cash on Hand
    const defaultAr = this.getAccount('1100');   // Accounts Receivable
    const salesRev = this.getAccount('4010');     // Retail Wine Sales
    const taxPayable = this.getAccount('2030');   // Sales/Liquor Tax Payable
    const cogsAcc = this.getAccount('5010');      // Wine COGS
    const inventoryAcc = this.getAccount('1200'); // Wine Inventory

    const lines = [];

    // 1. Debit Cash/Bank or AR
    if (invoice.paid_amount > 0) {
      lines.push({
        accountId: cashAccount || defaultCash.id,
        debit: invoice.paid_amount,
        credit: 0,
        notes: `Receipt for invoice ${invoice.invoice_no}`
      });
    }
    if (invoice.balance_amount > 0) {
      lines.push({
        accountId: defaultAr.id,
        debit: invoice.balance_amount,
        credit: 0,
        notes: `Customer balance receivable on ${invoice.invoice_no}`
      });
    }

    // 2. Credit Sales Revenue (Net of tax)
    const netRevenue = (invoice.subtotal - (invoice.discount_amount || 0));
    lines.push({
      accountId: salesRev.id,
      debit: 0,
      credit: netRevenue,
      notes: `Sales revenue for ${invoice.invoice_no}`
    });

    // 3. Credit Tax
    if (invoice.tax_amount > 0) {
      lines.push({
        accountId: taxPayable.id,
        debit: 0,
        credit: invoice.tax_amount,
        notes: `Liquor excise / sales tax on ${invoice.invoice_no}`
      });
    }

    // 4. COGS & Inventory Relief
    let totalCogs = 0;
    for (const it of items) {
      totalCogs += (it.cost_price || 0) * it.quantity;
    }
    totalCogs = Math.round(totalCogs * 100) / 100;

    if (totalCogs > 0 && cogsAcc && inventoryAcc) {
      lines.push({
        accountId: cogsAcc.id,
        debit: totalCogs,
        credit: 0,
        notes: `Cost of wine sold for ${invoice.invoice_no}`
      });
      lines.push({
        accountId: inventoryAcc.id,
        debit: 0,
        credit: totalCogs,
        notes: `Inventory reduction for ${invoice.invoice_no}`
      });
    }

    return this.createJournalEntry({
      entryDate: invoice.invoice_date,
      branchId: invoice.branch_id,
      referenceType: 'SALES_INVOICE',
      referenceId: invoice.id,
      narration: `Sale to ${invoice.customer_name} (Inv #${invoice.invoice_no})`,
      lines
    });
  }

  // Automatic posting on Purchase Bill
  static postPurchaseBill(purchase) {
    const inventoryAcc = this.getAccount('1200'); // Wine Inventory
    const apAcc = this.getAccount('2010');        // Accounts Payable
    const taxInputAcc = this.getAccount('2030');   // Tax

    const lines = [];

    // Debit Inventory
    lines.push({
      accountId: inventoryAcc.id,
      debit: purchase.subtotal,
      credit: 0,
      notes: `Inventory intake bill ${purchase.purchase_no}`
    });

    // Debit Tax if any
    if (purchase.tax_amount > 0) {
      lines.push({
        accountId: taxInputAcc.id,
        debit: purchase.tax_amount,
        credit: 0,
        notes: `Tax paid on purchase ${purchase.purchase_no}`
      });
    }

    // Credit Accounts Payable
    lines.push({
      accountId: apAcc.id,
      debit: 0,
      credit: purchase.total_amount,
      notes: `Payable to winery/vendor for bill ${purchase.purchase_no}`
    });

    return this.createJournalEntry({
      entryDate: purchase.purchase_date,
      branchId: purchase.branch_id,
      referenceType: 'PURCHASE_BILL',
      referenceId: purchase.id,
      narration: `Purchase order ${purchase.purchase_no} received from vendor`,
      lines
    });
  }

  // Customer Receipt Posting
  static postCustomerReceipt(receipt, bankAccountId) {
    const bank = db.prepare('SELECT gl_account_id FROM bank_accounts WHERE id = ?').get(bankAccountId);
    const defaultCash = this.getAccount('1010');
    const arAcc = this.getAccount('1100');

    const lines = [
      {
        accountId: bank?.gl_account_id || defaultCash.id,
        debit: receipt.amount,
        credit: 0,
        notes: `Receipt ${receipt.receipt_no} from customer`
      },
      {
        accountId: arAcc.id,
        debit: 0,
        credit: receipt.amount,
        notes: `Accounts receivable cleared via receipt ${receipt.receipt_no}`
      }
    ];

    return this.createJournalEntry({
      entryDate: receipt.receipt_date,
      branchId: receipt.branch_id,
      referenceType: 'CUSTOMER_RECEIPT',
      referenceId: receipt.id,
      narration: `Customer payment received (${receipt.receipt_no})`,
      lines
    });
  }

  // Vendor Payment Posting
  static postVendorPayment(payment, bankAccountId) {
    const bank = db.prepare('SELECT gl_account_id FROM bank_accounts WHERE id = ?').get(bankAccountId);
    const defaultCash = this.getAccount('1010');
    const apAcc = this.getAccount('2010');

    const lines = [
      {
        accountId: apAcc.id,
        debit: payment.amount,
        credit: 0,
        notes: `Accounts payable cleared via payment ${payment.payment_no}`
      },
      {
        accountId: bank?.gl_account_id || defaultCash.id,
        debit: 0,
        credit: payment.amount,
        notes: `Bank disbursement for payment ${payment.payment_no}`
      }
    ];

    return this.createJournalEntry({
      entryDate: payment.payment_date,
      branchId: payment.branch_id,
      referenceType: 'VENDOR_PAYMENT',
      referenceId: payment.id,
      narration: `Payment made to vendor (${payment.payment_no})`,
      lines
    });
  }

  // Operating Expense Posting
  static postExpense(expense, bankAccountId, expenseAccountId) {
    const bank = db.prepare('SELECT gl_account_id FROM bank_accounts WHERE id = ?').get(bankAccountId);
    const defaultCash = this.getAccount('1010');

    const lines = [
      {
        accountId: expenseAccountId,
        debit: expense.amount,
        credit: 0,
        notes: `Expense: ${expense.payee_name || 'Operating expense'}`
      },
      {
        accountId: bank?.gl_account_id || defaultCash.id,
        debit: 0,
        credit: expense.amount,
        notes: `Paid out of bank/cash for ${expense.payment_no}`
      }
    ];

    return this.createJournalEntry({
      entryDate: expense.payment_date,
      branchId: expense.branch_id,
      referenceType: 'EXPENSE',
      referenceId: expense.id,
      narration: `Operating expense: ${expense.payee_name || expense.notes || ''} (${expense.payment_no})`,
      lines
    });
  }

  // Stock Adjustment Posting (Breakage / Spoilage)
  static postStockAdjustment(adjustment) {
    const inventoryAcc = this.getAccount('1200');
    const spoilageAcc = this.getAccount('5030'); // Wine Breakage & Spoilage Loss

    const lines = [];
    if (adjustment.adjustment_type === 'OUT') {
      // Bottle broken or corked
      lines.push({
        accountId: spoilageAcc.id,
        debit: adjustment.total_cost,
        credit: 0,
        notes: `Stock loss: ${adjustment.reason}`
      });
      lines.push({
        accountId: inventoryAcc.id,
        debit: 0,
        credit: adjustment.total_cost,
        notes: `Inventory written off (${adjustment.adjustment_no})`
      });
    } else {
      // Stock found / corrected upwards
      lines.push({
        accountId: inventoryAcc.id,
        debit: adjustment.total_cost,
        credit: 0,
        notes: `Inventory intake adjustment (${adjustment.adjustment_no})`
      });
      lines.push({
        accountId: spoilageAcc.id,
        debit: 0,
        credit: adjustment.total_cost,
        notes: `Adjustment gain on inventory count`
      });
    }

    return this.createJournalEntry({
      entryDate: new Date().toISOString().split('T')[0],
      branchId: adjustment.branch_id,
      referenceType: 'STOCK_ADJUSTMENT',
      referenceId: adjustment.id,
      narration: `Stock Adjustment: ${adjustment.reason} (${adjustment.adjustment_no})`,
      lines
    });
  }
}

module.exports = AccountingEngine;
